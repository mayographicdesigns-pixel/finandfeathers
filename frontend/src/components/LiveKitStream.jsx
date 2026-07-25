import React, { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Video, X, Mic, MicOff, VideoOff, RotateCw } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = window.location.origin;

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
        // Mark stream as live in backend
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
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Could not get broadcast token');
        }
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
      <BroadcasterUI onStop={handleStop} />
    </LiveKitRoom>
  );
};

const BroadcasterUI = ({ onStop }) => {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const videoRef = useRef(null);

  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localCam = tracks.find(t => t.participant?.isLocal);

  useEffect(() => {
    if (localCam?.publication?.track && videoRef.current) {
      localCam.publication.track.attach(videoRef.current);
      return () => {
        try { localCam.publication.track.detach(videoRef.current); } catch (e) { console.error(e); }
      };
    }
  }, [localCam?.publication?.track]);

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
    // Toggle facing mode — LiveKit re-publishes with a new track
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
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
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
          <span className="text-white text-[10px] font-bold uppercase">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={toggleMic}
          className={`${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white h-10`}
          data-testid="dj-toggle-mic-btn"
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button
          onClick={toggleCam}
          className={`${camOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white h-10`}
          data-testid="dj-toggle-cam-btn"
        >
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button
          onClick={flipCamera}
          className="bg-slate-700 hover:bg-slate-600 text-white h-10"
          data-testid="dj-flip-cam-btn"
          title="Flip camera"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white h-10"
          data-testid="dj-stop-broadcast-btn"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};


/**
 * LiveKit Viewer — subscribes to the DJ's video/audio at a location.
 */
export const LiveKitViewer = ({ locationSlug, viewerName = 'Viewer' }) => {
  const [conn, setConn] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
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
          const msg = await res.text();
          if (res.status === 409) {
            throw new Error('Stream ended');
          }
          throw new Error(msg || 'Could not join stream');
        }
        const data = await res.json();
        if (!cancelled) setConn(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not join stream');
      }
    })();
    return () => { cancelled = true; };
  }, [locationSlug, viewerName]);

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
      token={conn.token}
      serverUrl={conn.url}
      connect
      audio={false}
      video={false}
      data-lk-theme="default"
      className="!bg-transparent"
    >
      <ViewerStage />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

const ViewerStage = () => {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true }
  );
  const remote = tracks.find(t => !t.participant?.isLocal);

  if (!remote) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center rounded-lg" data-testid="livekit-viewer-waiting">
        <div className="text-center">
          <Video className="w-10 h-10 text-slate-500 mx-auto mb-2 animate-pulse" />
          <p className="text-slate-400 text-sm">Waiting for DJ video…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden" data-testid="livekit-viewer-stage">
      <VideoTrack
        trackRef={remote}
        className="w-full aspect-video object-contain bg-black"
      />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="text-white text-[10px] font-bold uppercase">Live</span>
      </div>
    </div>
  );
};
