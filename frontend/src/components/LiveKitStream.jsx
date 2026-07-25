import React, { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Video, X, Mic, MicOff, VideoOff, RotateCw, UserPlus } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = window.location.origin;
const MAX_PUBLISHERS = 9;

/**
 * DJ Broadcaster — captures device camera+mic and publishes to LiveKit room.
 * Room name = locationSlug.
 */
export const LiveKitBroadcaster = ({ locationSlug, djId, djName, onStop }) => {
  const [conn, setConn] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch(`${API_URL}/api/livekit/stream/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location_slug: locationSlug, dj_id: djId, dj_name: djName }),
        });

        const res = await fetch(`${API_URL}/api/livekit/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location_slug: locationSlug,
            identity: `dj_${djId}`,
            role: 'dj',
            display_name: djName,
          }),
        });
        if (!res.ok) throw new Error(await res.text() || 'Could not get broadcast token');
        const data = await res.json();
        if (!cancelled) {
          setConn(data);
          setStarting(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Could not start broadcast');
          setStarting(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [locationSlug, djId, djName]);

  const handleStop = async () => {
    try {
      await fetch(`${API_URL}/api/livekit/stream/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_slug: locationSlug, dj_id: djId }),
      });
    } catch (e) { console.error(e); }
    onStop?.();
  };

  if (starting) {
    return (
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-center" data-testid="dj-broadcast-starting">
        <Video className="w-8 h-8 text-red-400 mx-auto mb-2 animate-pulse" />
        <p className="text-slate-300 text-sm">Preparing your camera…</p>
      </div>
    );
  }

  if (error || !conn) {
    return (
      <div className="rounded-lg bg-red-950/30 border border-red-800 p-4 text-center" data-testid="dj-broadcast-error">
        <p className="text-red-300 text-sm mb-3">{error || 'Could not start broadcast'}</p>
        <Button onClick={handleStop} size="sm" className="bg-slate-700 hover:bg-slate-600 text-white">Close</Button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={conn.token}
      serverUrl={conn.url}
      connect
      video
      audio
      onDisconnected={handleStop}
      data-lk-theme="default"
      className="!bg-transparent"
    >
      <PublisherControls onLeave={handleStop} label="Stop Broadcast" isHost />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};


/**
 * LiveKit Viewer — subscribes to the DJ's video/audio, with optional "Join with Camera".
 */
export const LiveKitViewer = ({ locationSlug, viewerName = 'Viewer' }) => {
  const [conn, setConn] = useState(null);
  const [error, setError] = useState('');
  const [isPublisher, setIsPublisher] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Fetch initial (subscriber) token
  useEffect(() => {
    if (isPublisher) return; // Publisher token fetched separately
    let cancelled = false;
    (async () => {
      try {
        const identity = `viewer_${Math.random().toString(36).slice(2, 10)}`;
        const res = await fetch(`${API_URL}/api/livekit/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location_slug: locationSlug,
            identity,
            role: 'viewer',
            display_name: viewerName,
          }),
        });
        if (!res.ok) {
          if (res.status === 409) throw new Error('Stream ended');
          throw new Error(await res.text() || 'Could not join stream');
        }
        const data = await res.json();
        if (!cancelled) setConn(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not join stream');
      }
    })();
    return () => { cancelled = true; };
  }, [locationSlug, viewerName, isPublisher]);

  const joinWithCamera = async () => {
    setJoinError('');
    setJoining(true);
    try {
      const identity = `guest_${Math.random().toString(36).slice(2, 10)}`;
      const res = await fetch(`${API_URL}/api/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: locationSlug,
          identity,
          role: 'guest',
          display_name: viewerName,
        }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))).detail;
        throw new Error(detail || 'Could not join stage');
      }
      const data = await res.json();
      setConn(data);
      setIsPublisher(true);
    } catch (e) {
      setJoinError(e.message || 'Could not join stage');
    } finally {
      setJoining(false);
    }
  };

  const leaveStage = () => {
    setIsPublisher(false);
    setConn(null); // triggers re-fetch of viewer token
  };

  if (error) {
    return (
      <div className="bg-slate-900 p-6 text-center rounded-lg" data-testid="livekit-viewer-error">
        <Video className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!conn) {
    return (
      <div className="bg-slate-900 p-6 text-center rounded-lg" data-testid="livekit-viewer-connecting">
        <Video className="w-10 h-10 text-slate-500 mx-auto mb-2 animate-pulse" />
        <p className="text-slate-400 text-sm">Connecting to stream...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={conn.token /* force reconnect when role changes */}
      token={conn.token}
      serverUrl={conn.url}
      connect
      audio={isPublisher}
      video={isPublisher}
      data-lk-theme="default"
      className="!bg-transparent"
    >
      <StageGrid
        isPublisher={isPublisher}
        onJoinCamera={joinWithCamera}
        onLeaveStage={leaveStage}
        joining={joining}
        joinError={joinError}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};


/**
 * Renders a Zoom-style grid of all publishing camera participants.
 * Also shows the "Join with Camera" call-to-action for viewers.
 */
const StageGrid = ({ isPublisher, onJoinCamera, onLeaveStage, joining, joinError }) => {
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const participants = useParticipants();

  // Deduplicate by participant SID and only include tracks with a publication
  const publishedTracks = cameraTracks.filter(t => t.publication);
  const publisherCount = publishedTracks.length;
  const seatsLeft = MAX_PUBLISHERS - publisherCount;

  // Grid layout — 1..9 tiles
  const gridClass = (() => {
    const n = publishedTracks.length;
    if (n <= 1) return 'grid-cols-1';
    if (n <= 4) return 'grid-cols-2';
    if (n <= 9) return 'grid-cols-3';
    return 'grid-cols-3';
  })();

  return (
    <div className="flex flex-col gap-3">
      {/* Video grid */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden" data-testid="livekit-viewer-stage">
        {publishedTracks.length === 0 ? (
          <div className="w-full aspect-video flex items-center justify-center">
            <div className="text-center">
              <Video className="w-10 h-10 text-slate-500 mx-auto mb-2 animate-pulse" />
              <p className="text-slate-400 text-sm">Waiting for DJ video…</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-1 ${gridClass}`} data-testid="livekit-stage-grid">
            {publishedTracks.map((track, i) => (
              <StageTile
                key={`${track.participant?.sid}-${track.publication?.trackSid || i}`}
                trackRef={track}
              />
            ))}
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-white text-[10px] font-bold uppercase">Live</span>
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px]">
          {publisherCount}/{MAX_PUBLISHERS} on stage · {participants.length} in room
        </div>
      </div>

      {/* Guest join / leave controls */}
      {!isPublisher ? (
        <div className="space-y-1">
          <Button
            onClick={onJoinCamera}
            disabled={joining || seatsLeft <= 0}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-sm h-10 font-semibold"
            data-testid="viewer-join-camera-btn"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {joining
              ? 'Joining stage…'
              : seatsLeft <= 0
                ? 'Stage is full'
                : `Join with Camera (${seatsLeft} seats open)`}
          </Button>
          {joinError && (
            <p className="text-red-400 text-xs text-center" data-testid="viewer-join-error">{joinError}</p>
          )}
        </div>
      ) : (
        <PublisherControls onLeave={onLeaveStage} label="Leave Stage" />
      )}
    </div>
  );
};

const StageTile = ({ trackRef }) => {
  const displayName = trackRef.participant?.name || trackRef.participant?.identity || '';
  const isLocal = trackRef.participant?.isLocal;
  return (
    <div className="relative bg-black aspect-video overflow-hidden rounded" data-testid="stage-tile">
      <VideoTrack
        trackRef={trackRef}
        className="w-full h-full object-cover"
      />
      {displayName && (
        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded max-w-[80%] truncate">
          {displayName}{isLocal ? ' (you)' : ''}
        </div>
      )}
    </div>
  );
};


/**
 * Local publisher mic/cam/flip/leave controls — used by both DJ broadcaster and guest joiners.
 */
const PublisherControls = ({ onLeave, label = 'Leave', isHost = false }) => {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const previewRef = useRef(null);

  // For DJ (host) — show a preview of their own camera at the top
  const localTracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
    .filter(t => t.participant?.isLocal);
  const myCam = localTracks[0];

  useEffect(() => {
    if (!isHost) return;
    if (myCam?.publication?.track && previewRef.current) {
      myCam.publication.track.attach(previewRef.current);
      return () => {
        try { myCam.publication.track.detach(previewRef.current); } catch (e) { console.error(e); }
      };
    }
  }, [isHost, myCam?.publication?.track]);

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  };

  const flipCamera = async () => {
    try {
      const current = localParticipant.getTrackPublication(Track.Source.Camera);
      const currentFacing = current?.track?.mediaStreamTrack?.getSettings?.().facingMode;
      const target = currentFacing === 'user' ? 'environment' : 'user';
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setCameraEnabled(true, { facingMode: target });
    } catch (e) { console.error('Flip camera failed:', e); }
  };

  return (
    <div className="space-y-3">
      {isHost && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="w-full aspect-video object-cover"
            data-testid="dj-camera-preview"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-white text-[10px] font-bold uppercase">You (Host)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={toggleMic}
          className={`${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white h-10`}
          data-testid="pub-toggle-mic-btn"
          title={micOn ? 'Mute mic' : 'Unmute mic'}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button
          onClick={toggleCam}
          className={`${camOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white h-10`}
          data-testid="pub-toggle-cam-btn"
          title={camOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button
          onClick={flipCamera}
          className="bg-slate-700 hover:bg-slate-600 text-white h-10"
          data-testid="pub-flip-cam-btn"
          title="Flip camera"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-700 text-white h-10"
          data-testid="pub-leave-btn"
          title={label}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
