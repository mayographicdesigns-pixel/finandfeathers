import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Check, X, Mic, Music, MapPin, LogOut, RefreshCw, ChevronRight, Calendar, Clock, DollarSign, Save, Video, Users } from 'lucide-react';
import { LiveKitBroadcaster } from '../components/LiveKitStream';

const API_URL = window.location.origin;

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DJPanelPage = () => {
  const navigate = useNavigate();
  const [djProfile, setDjProfile] = useState(null);
  const [djName, setDjName] = useState('');
  const [logging, setLogging] = useState(false);
  const [locations, setLocations] = useState([]);
  const [checkedInLocation, setCheckedInLocation] = useState(null);
  const [karaokeActive, setKaraokeActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const [played, setPlayed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduledNames, setScheduledNames] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
  const [locationSchedule, setLocationSchedule] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState({ cash_app_username: '', venmo_username: '', zelle_info: '' });
  const [savingLinks, setSavingLinks] = useState(false);
  const [linksSaved, setLinksSaved] = useState(false);
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [savingStream, setSavingStream] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  // LiveKit broadcast state
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  // Load saved DJ session
  useEffect(() => {
    const saved = localStorage.getItem('ff_dj_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setDjProfile(profile);
      if (profile.current_location) {
        setCheckedInLocation(profile.current_location);
      }
    }
    fetchLocations();
    fetchScheduledNames();
  }, []);

  // Poll queue when checked in
  useEffect(() => {
    if (!checkedInLocation) return;
    fetchKaraokeStatus();
    fetchQueue();
    fetchLocationSchedule();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [checkedInLocation]);

  // Fetch DJ's full schedule when logged in
  useEffect(() => {
    if (!djProfile) return;
    fetchMySchedule();
    fetchPaymentLinks();
  }, [djProfile]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/locations`);
      setLocations(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchScheduledNames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dj/weekly-schedule/names/all`);
      const names = await res.json();
      setScheduledNames(names);
    } catch (e) { console.error(e); }
  };

  const fetchMySchedule = async () => {
    if (!djProfile) return;
    try {
      const res = await fetch(`${API_URL}/api/dj/weekly-schedule`);
      const all = await res.json();
      const mine = all.filter(e => e.dj_name === djProfile.name);
      mine.sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
      setMySchedule(mine);
    } catch (e) { console.error(e); }
  };

  const fetchLocationSchedule = async () => {
    if (!checkedInLocation) return;
    try {
      const res = await fetch(`${API_URL}/api/dj/weekly-schedule/${checkedInLocation}`);
      const entries = await res.json();
      entries.sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
      setLocationSchedule(entries);
    } catch (e) { console.error(e); }
  };

  const fetchKaraokeStatus = async () => {
    if (!checkedInLocation) return;
    try {
      const res = await fetch(`${API_URL}/api/karaoke/status/${checkedInLocation}`);
      const data = await res.json();
      setKaraokeActive(data.active);
    } catch (e) { console.error(e); }
  };

  const fetchPaymentLinks = async () => {
    if (!djProfile) return;
    try {
      const res = await fetch(`${API_URL}/api/dj/profile/${djProfile.id}`);
      const data = await res.json();
      setPaymentLinks({
        cash_app_username: data.cash_app_username || '',
        venmo_username: data.venmo_username || '',
        zelle_info: data.zelle_info || ''
      });
      if (data.live_stream_url) {
        setLiveStreamUrl(data.live_stream_url);
        setStreamActive(true);
      }
    } catch (e) { console.error(e); }
  };

  const goLive = async () => {
    if (!djProfile || !liveStreamUrl.trim()) return;
    setSavingStream(true);
    try {
      await fetch(`${API_URL}/api/dj/live-stream/${djProfile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_stream_url: liveStreamUrl.trim() })
      });
      setStreamActive(true);
    } catch (e) { console.error(e); }
    finally { setSavingStream(false); }
  };

  const stopLive = async () => {
    if (!djProfile) return;
    setSavingStream(true);
    try {
      await fetch(`${API_URL}/api/dj/live-stream/${djProfile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_stream_url: '' })
      });
      setStreamActive(false);
      setLiveStreamUrl('');
    } catch (e) { console.error(e); }
    finally { setSavingStream(false); }
  };

  // ---- IN-APP CAMERA STREAM (LiveKit) ----
  const startBroadcast = () => {
    setBroadcastError('');
    setBroadcasting(true);
    setStreamActive(true);
  };

  const stopBroadcast = () => {
    setBroadcasting(false);
    setStreamActive(false);
    setViewerCount(0);
  };

  // Poll viewer count from LiveKit stream status while broadcasting
  useEffect(() => {
    if (!broadcasting || !checkedInLocation) return;
    let cancelled = false;
    const poll = async () => {
      try {
        // Reuse the existing viewer-count endpoint from the WebSocket relay; LiveKit
        // participants are tracked via the `stream/active` endpoint as an approximate
        // signal. We keep the number user-facing but non-critical.
        const res = await fetch(`${API_URL}/api/livekit/stream/status/${checkedInLocation}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.active) {
          // viewer_count isn't exposed by LiveKit REST here; leave as 0 unless
          // a future admin webhook writes it back.
        }
      } catch (e) { console.error('Viewer poll error:', e); }
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [broadcasting, checkedInLocation]);

  const savePaymentLinks = async () => {
    if (!djProfile) return;
    setSavingLinks(true);
    try {
      await fetch(`${API_URL}/api/dj/profile/${djProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentLinks)
      });
      setLinksSaved(true);
      setTimeout(() => setLinksSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSavingLinks(false); }
  };

  const fetchQueue = useCallback(async () => {
    if (!checkedInLocation) return;
    try {
      const res = await fetch(`${API_URL}/api/karaoke/queue/${checkedInLocation}`);
      const data = await res.json();
      setQueue(data.pending || []);
      setPlayed(data.played || []);
    } catch (e) { console.error(e); }
  }, [checkedInLocation]);

  const handleLogin = async (name) => {
    const loginName = name || djName.trim();
    if (!loginName) return;
    setLogging(true);
    try {
      const res = await fetch(`${API_URL}/api/dj/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName })
      });
      const data = await res.json();
      setDjProfile(data);
      localStorage.setItem('ff_dj_profile', JSON.stringify(data));
      if (data.current_location) setCheckedInLocation(data.current_location);
    } catch (e) { console.error(e); }
    finally { setLogging(false); }
  };

  const handleCheckIn = async (slug) => {
    try {
      await fetch(`${API_URL}/api/dj/checkin/${djProfile.id}?location_slug=${slug}`, { method: 'POST' });
      setCheckedInLocation(slug);
      const updated = { ...djProfile, current_location: slug };
      setDjProfile(updated);
      localStorage.setItem('ff_dj_profile', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const handleCheckOut = async () => {
    try {
      if (karaokeActive) {
        await fetch(`${API_URL}/api/karaoke/toggle/${checkedInLocation}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false, dj_id: djProfile.id })
        });
        setKaraokeActive(false);
      }
      if (broadcasting) {
        try {
          await fetch(`${API_URL}/api/livekit/stream/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location_slug: checkedInLocation, dj_id: djProfile.id })
          });
        } catch (e) { console.error(e); }
        setBroadcasting(false);
      }
      if (streamActive) {
        await fetch(`${API_URL}/api/dj/live-stream/${djProfile.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ live_stream_url: '' })
        });
        setStreamActive(false);
        setLiveStreamUrl('');
      }
      await fetch(`${API_URL}/api/dj/checkout/${djProfile.id}`, { method: 'POST' });
      // Auto-turn off karaoke when DJ checks out
      if (karaokeActive) {
        await fetch(`${API_URL}/api/karaoke/toggle/${checkedInLocation}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false, dj_id: djProfile.id })
        });
        setKaraokeActive(false);
      }
      setCheckedInLocation(null);
      setQueue([]);
      setPlayed([]);
      setLocationSchedule([]);
      const updated = { ...djProfile, current_location: null };
      setDjProfile(updated);
      localStorage.setItem('ff_dj_profile', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const toggleKaraoke = async () => {
    try {
      const res = await fetch(`${API_URL}/api/karaoke/toggle/${checkedInLocation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !karaokeActive, dj_id: djProfile.id })
      });
      const data = await res.json();
      setKaraokeActive(data.active);
      if (!data.active) setQueue([]);
      // When DJ starts karaoke, navigate to the wall to manage queue + signups
      if (data.active && checkedInLocation) {
        navigate(`/social/${checkedInLocation}`);
      }
    } catch (e) { console.error(e); }
  };

  const markSong = async (id, status) => {
    try {
      await fetch(`${API_URL}/api/social/song-request/${id}/status?status=${status}`, { method: 'PUT' });
      fetchQueue();
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    if (checkedInLocation) handleCheckOut();
    setDjProfile(null);
    setMySchedule([]);
    localStorage.removeItem('ff_dj_profile');
  };

  const goToVibeWall = async () => {
    if (!checkedInLocation || !djProfile) return;
    // Ensure DJ has a user profile for the social wall
    let profileId = localStorage.getItem('ff_user_profile_id');
    if (!profileId) {
      try {
        const res = await fetch(`${API_URL}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: djProfile.stage_name || djProfile.name,
            role: 'dj',
            staff_title: 'DJ',
            avatar_emoji: djProfile.avatar_emoji || '🎧'
          })
        });
        const data = await res.json();
        if (data && data.id) {
          profileId = data.id;
          localStorage.setItem('ff_user_profile_id', data.id);
          localStorage.setItem('ff_user_info', JSON.stringify({
            name: djProfile.stage_name || djProfile.name,
            role: 'dj',
            staff_title: 'DJ'
          }));
        }
      } catch (e) { console.error('Failed to create DJ user profile:', e); }
    }
    localStorage.setItem('ff_user_location', checkedInLocation);
    navigate(`/social/${checkedInLocation}`);
  };

  const locationName = (slug) => {
    const loc = locations.find(l => l.slug === slug);
    return loc ? loc.name?.replace('Fin & Feathers - ', '') : slug;
  };

  // Get locations where this DJ is scheduled
  const scheduledLocations = djProfile
    ? [...new Set(mySchedule.map(s => s.location_slug))]
    : [];

  // Combined login + check-in handler
  const handleLoginAndCheckIn = async (loginName, locSlug) => {
    const trimmed = (loginName || '').trim();
    if (!trimmed || !locSlug) return;
    setLogging(true);
    try {
      // 1) Login (creates/loads DJ profile)
      const loginRes = await fetch(`${API_URL}/api/dj/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      const profile = await loginRes.json();
      // 2) Check in at location
      await fetch(`${API_URL}/api/dj/checkin/${profile.id}?location_slug=${locSlug}`, { method: 'POST' });
      const updated = { ...profile, current_location: locSlug };
      setDjProfile(updated);
      setCheckedInLocation(locSlug);
      localStorage.setItem('ff_dj_profile', JSON.stringify(updated));
    } catch (e) { console.error(e); }
    finally { setLogging(false); }
  };

  // COMBINED CHECK-IN SCREEN (name + location on one page)
  if (!djProfile || !checkedInLocation) {
    // If already logged in (djProfile), lock name field to that identity
    const effectiveName = djProfile ? (djProfile.stage_name || djProfile.name) : djName;
    const hasName = !!(djProfile || djName.trim());
    return (
      <div className="min-h-screen bg-black p-4 flex items-start justify-center" data-testid="dj-checkin">
        <div className="w-full max-w-md pt-8">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1" data-testid="dj-back-home">
              ← Home
            </button>
            {djProfile && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-400" data-testid="dj-logout-btn">
                <LogOut className="w-4 h-4 mr-1" /> Switch DJ
              </Button>
            )}
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">DJ Check-In</h1>
                <p className="text-slate-400 text-sm">Enter your name and pick a location — both in one step.</p>
              </div>

              {/* DJ NAME */}
              <div className="mb-4">
                <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">DJ Name</label>
                {djProfile ? (
                  <div className="flex items-center justify-between h-10 px-3 rounded-md bg-slate-800/60 border border-slate-700">
                    <span className="text-white text-sm font-medium">{effectiveName}</span>
                    <button onClick={handleLogout} className="text-red-400 text-xs" data-testid="dj-change-name-btn">Change</button>
                  </div>
                ) : (
                  <>
                    {scheduledNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {scheduledNames.map(n => (
                          <button
                            key={n}
                            onClick={() => setDjName(n)}
                            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                              djName === n
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                            data-testid={`dj-select-${n.replace(/\s/g, '-')}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                    <Input
                      value={djName}
                      onChange={(e) => setDjName(e.target.value)}
                      placeholder="Or type a name…"
                      className="bg-slate-800 border-slate-700 text-white text-sm h-10"
                      data-testid="dj-name-input"
                    />
                  </>
                )}
              </div>

              {/* LOCATION */}
              <div className="mb-4">
                <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Location</label>

                {scheduledLocations.length > 0 && (
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Your Locations</p>
                )}
                <div className="space-y-1.5 mb-2">
                  {locations.filter(l => scheduledLocations.includes(l.slug)).map(loc => {
                    const locSchedule = mySchedule.filter(s => s.location_slug === loc.slug);
                    return (
                      <button
                        key={loc.slug}
                        onClick={() => handleLoginAndCheckIn(effectiveName, loc.slug)}
                        disabled={!hasName || logging}
                        className="w-full flex items-center gap-2.5 bg-slate-800/50 border border-red-500/30 rounded-lg p-3 text-left hover:border-red-500/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        data-testid={`dj-loc-${loc.slug}`}
                      >
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm block">{loc.name?.replace('Fin & Feathers - ', '')}</span>
                          {locSchedule.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {locSchedule.map(s => `${s.day_of_week} ${s.time_slot}`).join(' | ')}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {locations.filter(l => !scheduledLocations.includes(l.slug)).length > 0 && (
                  <>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 mt-3">Other Locations</p>
                    <div className="space-y-1.5">
                      {locations.filter(l => !scheduledLocations.includes(l.slug)).map(loc => (
                        <button
                          key={loc.slug}
                          onClick={() => handleLoginAndCheckIn(effectiveName, loc.slug)}
                          disabled={!hasName || logging}
                          className="w-full flex items-center gap-2.5 bg-slate-800/40 border border-slate-700 rounded-lg p-3 text-left hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          data-testid={`dj-loc-${loc.slug}`}
                        >
                          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-white text-sm flex-1">{loc.name?.replace('Fin & Feathers - ', '')}</span>
                          <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {!hasName && (
                <p className="text-slate-500 text-xs text-center mt-2" data-testid="dj-hint-name-first">
                  Enter your DJ name above, then tap a location to check in.
                </p>
              )}
              {logging && (
                <p className="text-red-400 text-xs text-center mt-2 flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking you in…
                </p>
              )}

              {/* Schedule preview when logged in */}
              {djProfile && mySchedule.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Your Schedule This Week
                  </h3>
                  <div className="space-y-1">
                    {mySchedule.map((s, i) => (
                      <div key={`sched-${i}`} className="flex items-center justify-between text-xs">
                        <span className="text-white">{s.day_of_week}</span>
                        <span className="text-slate-400">{locationName(s.location_slug)} • {s.time_slot}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // DJ DASHBOARD (checked in)
  return (
    <div className="min-h-screen bg-black p-4" data-testid="dj-dashboard">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">{djProfile.stage_name || djProfile.name}</h1>
            <p className="text-red-400 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {locationName(checkedInLocation)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckOut}
            className="border-slate-700 text-slate-300 hover:bg-red-900/30 hover:border-red-600"
            data-testid="dj-checkout-btn"
          >
            <LogOut className="w-4 h-4 mr-1" /> Check Out
          </Button>
        </div>

        {/* View Vibe Wall Button */}
        <Button
          onClick={goToVibeWall}
          className="w-full mb-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white h-12 text-sm font-semibold rounded-xl"
          data-testid="dj-view-vibe-btn"
        >
          <Users className="w-4 h-4 mr-2" /> View Vibe Wall &amp; Chat
        </Button>

        {/* Today's Schedule at this location */}
        {locationSchedule.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardContent className="p-3">
              <h3 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Schedule — {locationName(checkedInLocation)}</h3>
              <div className="space-y-1">
                {locationSchedule.map((s, i) => (
                  <div key={`slot-${i}`} className={`flex items-center justify-between text-sm py-1 px-2 rounded ${s.dj_name === djProfile.name ? 'bg-red-500/10 text-red-400' : 'text-slate-400'}`}>
                    <span className="font-medium">{s.day_of_week}</span>
                    <span>{s.dj_name} • {s.time_slot}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Karaoke Toggle */}
        <Card className={`mb-4 border ${karaokeActive ? 'bg-red-500/10 border-red-500/40' : 'bg-slate-900 border-slate-800'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${karaokeActive ? 'bg-red-500/30' : 'bg-slate-800'}`}>
                <Mic className={`w-5 h-5 ${karaokeActive ? 'text-red-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className="text-white font-medium">Karaoke Mode</p>
                <p className={`text-xs ${karaokeActive ? 'text-red-400' : 'text-slate-500'}`}>
                  {karaokeActive ? 'LIVE - Guests can sign up' : 'Off'}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleKaraoke}
              className={karaokeActive ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}
              data-testid="karaoke-toggle-btn"
            >
              {karaokeActive ? 'Stop' : 'Start'}
            </Button>
          </CardContent>
        </Card>

        {/* Go Live — Video Stream */}
        <Card className={`mb-4 border ${streamActive ? 'bg-green-900/20 border-green-500/40' : 'bg-slate-900 border-slate-800'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${streamActive ? 'bg-green-500/30' : 'bg-slate-800'}`}>
                <Video className={`w-5 h-5 ${streamActive ? 'text-green-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Go Live</p>
                <p className={`text-xs ${streamActive ? 'text-green-400' : 'text-slate-500'}`}>
                  {broadcasting
                    ? 'LIVE FROM CAMERA — Viewers can watch on the Vibe page'
                    : streamActive
                      ? 'STREAMING — Viewers can watch on the Vibe page'
                      : 'Stream from your camera or paste a link'}
                </p>
              </div>
            </div>

            {broadcasting ? (
              <LiveKitBroadcaster
                locationSlug={checkedInLocation}
                djId={djProfile.id}
                djName={djProfile.stage_name || djProfile.name}
                onStop={stopBroadcast}
              />
            ) : streamActive ? (
              <div className="space-y-2">
                <div className="bg-slate-800/50 rounded-lg p-2 text-xs text-slate-400 break-all">
                  {liveStreamUrl}
                </div>
                <Button
                  onClick={stopLive}
                  disabled={savingStream}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm h-9"
                  data-testid="dj-stop-live-btn"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  {savingStream ? 'Stopping...' : 'Stop Live Stream'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Camera option */}
                <Button
                  onClick={startBroadcast}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-sm h-11 font-semibold"
                  data-testid="dj-go-live-camera-btn"
                >
                  <Video className="w-4 h-4 mr-2" /> Go Live with Camera
                </Button>
                {broadcastError && (
                  <p className="text-red-400 text-xs text-center">{broadcastError}</p>
                )}
                <div className="flex items-center gap-2 text-slate-600 text-[10px]">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span>or paste a link</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                {/* URL paste option */}
                <div className="flex gap-2">
                  <Input
                    value={liveStreamUrl}
                    onChange={e => setLiveStreamUrl(e.target.value)}
                    placeholder="YouTube, Facebook, Twitch URL..."
                    className="bg-slate-800 border-slate-700 text-white text-sm h-9 flex-1"
                    data-testid="dj-stream-url-input"
                  />
                  <Button
                    onClick={goLive}
                    disabled={savingStream || !liveStreamUrl.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm h-9 px-4 shrink-0"
                    data-testid="dj-go-live-btn"
                  >
                    {savingStream ? '...' : 'Go Live'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Links */}
        <Card className="mb-4 bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-400" />
              <h3 className="text-white font-medium text-sm">Tip Payment Links</h3>
              {linksSaved && <span className="text-green-400 text-xs ml-auto">Saved!</span>}
            </div>
            <p className="text-slate-500 text-xs mb-3">Guests can tip you via these links when requesting songs</p>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Cash App (e.g. $YourTag)</label>
                <Input
                  value={paymentLinks.cash_app_username}
                  onChange={e => setPaymentLinks(p => ({ ...p, cash_app_username: e.target.value }))}
                  placeholder="$YourCashTag"
                  className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                  data-testid="dj-cashapp-input"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Venmo (e.g. @YourUsername)</label>
                <Input
                  value={paymentLinks.venmo_username}
                  onChange={e => setPaymentLinks(p => ({ ...p, venmo_username: e.target.value }))}
                  placeholder="@YourVenmo"
                  className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                  data-testid="dj-venmo-input"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Zelle (phone or email)</label>
                <Input
                  value={paymentLinks.zelle_info}
                  onChange={e => setPaymentLinks(p => ({ ...p, zelle_info: e.target.value }))}
                  placeholder="phone or email"
                  className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                  data-testid="dj-zelle-input"
                />
              </div>
              <Button
                onClick={savePaymentLinks}
                disabled={savingLinks}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9 mt-1"
                data-testid="dj-save-links-btn"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savingLinks ? 'Saving...' : 'Save Payment Links'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        {karaokeActive && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Song Queue ({queue.length})</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRefreshing(true); fetchQueue().finally(() => setRefreshing(false)); }}
                className="text-slate-400 hover:text-white"
                data-testid="refresh-queue-btn"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {queue.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6 text-center text-slate-500">
                  No songs in queue. Waiting for requests...
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 mb-6">
                {queue.map((item, idx) => (
                  <Card key={item.id} className="bg-slate-900 border-slate-800" data-testid={`queue-item-${item.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-sm font-bold">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.song}</p>
                        <p className="text-slate-400 text-xs truncate">{item.name}{item.artist ? ` - ${item.artist}` : ''}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => markSong(item.id, 'played')}
                          className="w-8 h-8 bg-green-600/20 hover:bg-green-600/40 rounded-lg flex items-center justify-center transition-colors"
                          data-testid={`mark-played-${item.id}`}
                          title="Mark as sung"
                        >
                          <Check className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => markSong(item.id, 'skipped')}
                          className="w-8 h-8 bg-slate-700/50 hover:bg-red-600/30 rounded-lg flex items-center justify-center transition-colors"
                          data-testid={`mark-skipped-${item.id}`}
                          title="Skip"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recently Played */}
            {played.length > 0 && (
              <>
                <h3 className="text-slate-500 text-xs font-medium uppercase mb-2">Recently Sung</h3>
                <div className="space-y-1 mb-6">
                  {played.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{item.name} — {item.song}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DJPanelPage;
