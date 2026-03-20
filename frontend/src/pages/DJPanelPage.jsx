import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Check, X, Mic, Music, MapPin, LogOut, RefreshCw, ChevronRight, Calendar, Clock } from 'lucide-react';

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
      await fetch(`${API_URL}/api/dj/checkout/${djProfile.id}`, { method: 'POST' });
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

  const locationName = (slug) => {
    const loc = locations.find(l => l.slug === slug);
    return loc ? loc.name?.replace('Fin & Feathers - ', '') : slug;
  };

  // Get locations where this DJ is scheduled
  const scheduledLocations = [...new Set(mySchedule.map(s => s.location_slug))];

  // LOGIN SCREEN
  if (!djProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4" data-testid="dj-login">
        <Card className="bg-slate-900 border-slate-700 w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">DJ Check-In</h1>
            <p className="text-slate-400 text-sm mb-5">Select your name or enter it below</p>

            {/* Scheduled DJ names as buttons */}
            {scheduledNames.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {scheduledNames.map(name => (
                  <button
                    key={name}
                    onClick={() => handleLogin(name)}
                    disabled={logging}
                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm hover:bg-red-600 hover:border-red-600 transition-colors"
                    data-testid={`dj-select-${name.replace(/\s/g, '-')}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-xs mb-3">Or enter a different name:</p>
              <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="flex gap-2">
                <Input
                  value={djName}
                  onChange={e => setDjName(e.target.value)}
                  placeholder="DJ name"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                  data-testid="dj-name-input"
                />
                <Button
                  type="submit"
                  disabled={!djName.trim() || logging}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="dj-login-btn"
                >
                  Go
                </Button>
              </form>
            </div>

            <button onClick={() => navigate('/')} className="text-slate-500 text-xs mt-4 hover:text-slate-300">
              Back to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LOCATION SELECT SCREEN
  if (!checkedInLocation) {
    return (
      <div className="min-h-screen bg-black p-4" data-testid="dj-location-select">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">Hey, {djProfile.stage_name || djProfile.name}</h1>
              <p className="text-slate-400 text-sm">Select your location to check in</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400" data-testid="dj-logout-btn">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* My Schedule Summary */}
          {mySchedule.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 mb-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Your Schedule This Week
                </h3>
                <div className="space-y-1">
                  {mySchedule.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white">{s.day_of_week}</span>
                      <span className="text-slate-400">{locationName(s.location_slug)} • {s.time_slot}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled locations first, then all others */}
          <div className="space-y-2">
            {scheduledLocations.length > 0 && (
              <p className="text-xs text-slate-500 uppercase tracking-wide px-1">Your Locations</p>
            )}
            {locations
              .filter(loc => scheduledLocations.includes(loc.slug))
              .map(loc => {
                const locSchedule = mySchedule.filter(s => s.location_slug === loc.slug);
                return (
                  <button
                    key={loc.slug}
                    onClick={() => handleCheckIn(loc.slug)}
                    className="w-full flex items-center gap-3 bg-slate-900 border border-red-500/30 rounded-xl p-4 text-left hover:border-red-500/60 transition-colors"
                    data-testid={`dj-loc-${loc.slug}`}
                  >
                    <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white block">{loc.name}</span>
                      <span className="text-xs text-slate-500">
                        {locSchedule.map(s => `${s.day_of_week} ${s.time_slot}`).join(' | ')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400" />
                  </button>
                );
              })}

            {locations.filter(loc => !scheduledLocations.includes(loc.slug)).length > 0 && (
              <p className="text-xs text-slate-500 uppercase tracking-wide px-1 mt-4">Other Locations</p>
            )}
            {locations
              .filter(loc => !scheduledLocations.includes(loc.slug))
              .map(loc => (
                <button
                  key={loc.slug}
                  onClick={() => handleCheckIn(loc.slug)}
                  className="w-full flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-600 transition-colors"
                  data-testid={`dj-loc-${loc.slug}`}
                >
                  <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <span className="text-white flex-1">{loc.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))}
          </div>
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

        {/* Today's Schedule at this location */}
        {locationSchedule.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 mb-4">
            <CardContent className="p-3">
              <h3 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Schedule — {locationName(checkedInLocation)}</h3>
              <div className="space-y-1">
                {locationSchedule.map((s, i) => (
                  <div key={i} className={`flex items-center justify-between text-sm py-1 px-2 rounded ${s.dj_name === djProfile.name ? 'bg-red-500/10 text-red-400' : 'text-slate-400'}`}>
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
