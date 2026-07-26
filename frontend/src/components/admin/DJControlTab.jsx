import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Radio, MapPin, LogOut, X, RefreshCw, Music,
  Mic, Circle, UserCheck, ChevronDown, AlertTriangle, Send
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const API_URL = window.location.origin;

const DJControlTab = () => {
  const [djs, setDjs] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [karaokeStatus, setKaraokeStatus] = useState({}); // {slug: bool}
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const refreshAll = useCallback(async () => {
    try {
      const [djRes, streamRes, locRes] = await Promise.all([
        fetch(`${API_URL}/api/dj/profiles`),
        fetch(`${API_URL}/api/livekit/streams/active`),
        fetch(`${API_URL}/api/locations`),
      ]);
      const [djData, streamData, locData] = await Promise.all([
        djRes.json(), streamRes.json(), locRes.json()
      ]);
      setDjs(Array.isArray(djData) ? djData : []);
      setLiveStreams(Array.isArray(streamData) ? streamData : []);
      const locs = (locData || []).filter(l => l.slug !== 'hibachi-food-truck');
      setLocations(locs);

      // Pull karaoke status per location in parallel
      const kStatuses = await Promise.all(
        locs.map(l => fetch(`${API_URL}/api/karaoke/status/${l.slug}`).then(r => r.json()).catch(() => ({ active: false })))
      );
      const kMap = {};
      locs.forEach((l, i) => { kMap[l.slug] = !!kStatuses[i]?.active; });
      setKaraokeStatus(kMap);
    } catch (e) {
      console.error('DJ control refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const iv = setInterval(refreshAll, 15000);
    return () => clearInterval(iv);
  }, [refreshAll]);

  const isLive = (dj) => {
    if (!dj?.current_location) return false;
    return liveStreams.some(s => s.dj_id === dj.id || s.location_slug === dj.current_location);
  };

  const locationLabel = (slug) => {
    if (!slug) return '';
    const loc = locations.find(l => l.slug === slug);
    return loc?.name?.replace('Fin & Feathers - ', '') || slug;
  };

  const forceEndLive = async (dj) => {
    if (!dj?.current_location) return;
    if (!window.confirm(`Force-end ${dj.stage_name || dj.name}'s live stream at ${locationLabel(dj.current_location)}?`)) return;
    setBusyId(dj.id);
    try {
      await fetch(`${API_URL}/api/livekit/stream/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_slug: dj.current_location, dj_id: dj.id })
      });
      toast({ title: 'Live ended', description: `${dj.stage_name || dj.name} is off the air.` });
      refreshAll();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  const checkIn = async (dj, slug) => {
    setBusyId(dj.id);
    try {
      const res = await fetch(`${API_URL}/api/dj/checkin/${dj.id}?location_slug=${slug}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Checked in', description: `${dj.stage_name || dj.name} → ${locationLabel(slug)}` });
      refreshAll();
    } catch (e) {
      toast({ title: 'Check-in failed', description: e.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  const checkOut = async (dj) => {
    if (!window.confirm(`Check out ${dj.stage_name || dj.name}?`)) return;
    setBusyId(dj.id);
    try {
      // End live too if they were broadcasting
      if (isLive(dj) && dj.current_location) {
        await fetch(`${API_URL}/api/livekit/stream/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location_slug: dj.current_location, dj_id: dj.id })
        });
      }
      await fetch(`${API_URL}/api/dj/checkout/${dj.id}`, { method: 'POST' });
      toast({ title: 'Checked out', description: `${dj.stage_name || dj.name} is off shift.` });
      refreshAll();
    } catch (e) {
      toast({ title: 'Check-out failed', description: e.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  const toggleKaraoke = async (slug, active, dj = null) => {
    setBusyId(`karaoke-${slug}`);
    try {
      const res = await fetch(`${API_URL}/api/karaoke/toggle/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, dj_id: dj?.id || null })
      });
      if (!res.ok) throw new Error(await res.text());
      setKaraokeStatus(k => ({ ...k, [slug]: active }));
      toast({ title: active ? 'Karaoke ON' : 'Karaoke OFF', description: locationLabel(slug) });
    } catch (e) {
      toast({ title: 'Karaoke toggle failed', description: e.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  const activeDjs = djs.filter(dj => !!dj.current_location);
  const offlineDjs = djs.filter(dj => !dj.current_location);

  // ---- Emergency Broadcast ----
  const [ebMessage, setEbMessage] = useState('');
  const [ebAuthor, setEbAuthor] = useState('Fin & Feathers Management');
  const [ebSending, setEbSending] = useState(false);
  const [ebConfirm, setEbConfirm] = useState(false);

  const sendEmergencyBroadcast = async () => {
    const msg = ebMessage.trim();
    if (!msg) return;
    setEbSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/wall/emergency-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ content: msg, author_name: ebAuthor.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Broadcast failed');
      toast({ title: 'Emergency broadcast sent', description: `Delivered to ${data.count} locations.` });
      setEbMessage('');
      setEbConfirm(false);
    } catch (e) {
      toast({ title: 'Broadcast failed', description: e.message, variant: 'destructive' });
    } finally { setEbSending(false); }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400" data-testid="dj-control-loading">Loading DJs…</div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dj-control-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500" /> DJ Control
          </h2>
          <p className="text-slate-400 text-sm">
            {activeDjs.length} on shift · {liveStreams.length} live · {offlineDjs.length} off shift
          </p>
        </div>
        <Button
          onClick={refreshAll}
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          data-testid="dj-control-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Emergency Broadcast */}
      <Card className="bg-gradient-to-br from-amber-950/40 to-red-950/40 border-amber-500/30" data-testid="emergency-broadcast-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Emergency Broadcast</h3>
            <span className="text-[10px] text-amber-300/70 uppercase tracking-wide ml-auto">Admin-only · fans out to every location</span>
          </div>
          <input
            type="text"
            value={ebAuthor}
            onChange={(e) => setEbAuthor(e.target.value)}
            placeholder="Author name (default: Fin & Feathers Management)"
            className="w-full bg-slate-900/70 border border-slate-700 rounded-md h-9 px-3 text-white text-xs mb-2 focus:border-amber-500/50 focus:outline-none"
            data-testid="emergency-author-input"
          />
          <textarea
            value={ebMessage}
            onChange={(e) => setEbMessage(e.target.value)}
            placeholder="e.g. Free shots at Edgewood in 10 min!"
            maxLength={500}
            rows={2}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-md p-3 text-white text-sm mb-3 focus:border-amber-500/50 focus:outline-none resize-none"
            data-testid="emergency-message-input"
          />
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">{ebMessage.length}/500</span>
            {ebConfirm ? (
              <div className="flex gap-2" data-testid="emergency-confirm-row">
                <Button
                  onClick={() => setEbConfirm(false)}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9"
                  data-testid="emergency-cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmergencyBroadcast}
                  disabled={ebSending}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white h-9 font-semibold"
                  data-testid="emergency-confirm-send-btn"
                >
                  {ebSending ? 'Sending…' : 'Confirm Broadcast'}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setEbConfirm(true)}
                disabled={!ebMessage.trim()}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white h-9 font-semibold disabled:opacity-40"
                data-testid="emergency-broadcast-btn"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Broadcast to All Locations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* On Shift */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">On Shift</h3>
        {activeDjs.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center text-slate-500 text-sm">No DJs currently checked in.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeDjs.map(dj => (
              <Card key={dj.id} className="bg-slate-900 border-slate-800" data-testid={`dj-row-${dj.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isLive(dj) ? 'bg-red-500/20' : 'bg-slate-800'}`}>
                      {isLive(dj) ? (
                        <Circle className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                      ) : (
                        <Mic className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">
                          {dj.stage_name || dj.name}
                        </span>
                        {isLive(dj) && (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" /> Live
                          </span>
                        )}
                        {karaokeStatus[dj.current_location] && (
                          <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                            <Music className="w-2.5 h-2.5" /> Karaoke
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs truncate">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {locationLabel(dj.current_location)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLive(dj) && (
                        <Button
                          size="sm"
                          onClick={() => forceEndLive(dj)}
                          disabled={busyId === dj.id}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                          data-testid={`dj-force-end-live-${dj.id}`}
                        >
                          <X className="w-3 h-3 mr-1" /> Stop Live
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleKaraoke(dj.current_location, !karaokeStatus[dj.current_location], dj)}
                        disabled={busyId === `karaoke-${dj.current_location}`}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8 text-xs"
                        data-testid={`dj-toggle-karaoke-${dj.id}`}
                      >
                        <Music className="w-3 h-3 mr-1" />
                        {karaokeStatus[dj.current_location] ? 'K: On' : 'K: Off'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkOut(dj)}
                        disabled={busyId === dj.id}
                        className="border-slate-700 text-red-400 hover:bg-red-900/20 h-8 text-xs"
                        data-testid={`dj-checkout-${dj.id}`}
                      >
                        <LogOut className="w-3 h-3 mr-1" /> Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Off Shift */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Off Shift ({offlineDjs.length})</h3>
        <div className="space-y-2">
          {offlineDjs.map(dj => {
            const expanded = expandedId === dj.id;
            return (
              <Card key={dj.id} className="bg-slate-900 border-slate-800" data-testid={`dj-row-${dj.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm truncate block">{dj.stage_name || dj.name}</span>
                      <p className="text-slate-600 text-xs">Off shift</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setExpandedId(expanded ? '' : dj.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-white h-8 text-xs"
                      data-testid={`dj-checkin-toggle-${dj.id}`}
                    >
                      <UserCheck className="w-3 h-3 mr-1" /> Check In
                      <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-1.5" data-testid={`dj-checkin-locations-${dj.id}`}>
                      {locations.map(loc => (
                        <button
                          key={loc.slug}
                          onClick={() => { checkIn(dj, loc.slug); setExpandedId(''); }}
                          disabled={busyId === dj.id}
                          className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 hover:border-red-500/40 rounded-md px-2 py-1.5 text-left transition-colors disabled:opacity-40"
                          data-testid={`dj-checkin-loc-${dj.id}-${loc.slug}`}
                        >
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="text-white text-[11px] truncate">{loc.name?.replace('Fin & Feathers - ', '')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DJControlTab;
