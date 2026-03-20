import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Check, X, Mic, Music, MapPin, LogIn, LogOut, RefreshCw, ChevronRight } from 'lucide-react';

const API_URL = window.location.origin;

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
  }, []);

  // Poll queue when checked in
  useEffect(() => {
    if (!checkedInLocation) return;
    fetchKaraokeStatus();
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [checkedInLocation]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/locations`);
      const data = await res.json();
      setLocations(data);
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

  const handleLogin = async () => {
    if (!djName.trim()) return;
    setLogging(true);
    try {
      const res = await fetch(`${API_URL}/api/dj/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: djName.trim() })
      });
      const data = await res.json();
      setDjProfile(data);
      localStorage.setItem('ff_dj_profile', JSON.stringify(data));
      if (data.current_location) setCheckedInLocation(data.current_location);
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
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
      // Turn off karaoke if active
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
      if (!data.active) {
        setQueue([]);
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
    localStorage.removeItem('ff_dj_profile');
  };

  const locationName = (slug) => {
    const loc = locations.find(l => l.slug === slug);
    return loc ? loc.name?.replace('Fin & Feathers - ', '') : slug;
  };

  // LOGIN SCREEN
  if (!djProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4" data-testid="dj-login">
        <Card className="bg-slate-900 border-slate-700 w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">DJ Check-In</h1>
            <p className="text-slate-400 text-sm mb-6">Enter your name to get started</p>
            <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <Input
                value={djName}
                onChange={e => setDjName(e.target.value)}
                placeholder="Your DJ name"
                className="bg-slate-800 border-slate-700 text-white text-center text-lg h-12"
                data-testid="dj-name-input"
              />
              <Button
                type="submit"
                disabled={!djName.trim() || logging}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
                data-testid="dj-login-btn"
              >
                {logging ? 'Loading...' : 'Enter'}
              </Button>
            </form>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Hey, {djProfile.stage_name || djProfile.name}</h1>
              <p className="text-slate-400 text-sm">Select your location</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400" data-testid="dj-logout-btn">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-2">
            {locations.map(loc => (
              <button
                key={loc.slug}
                onClick={() => handleCheckIn(loc.slug)}
                className="w-full flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-red-500/50 transition-colors"
                data-testid={`dj-loc-${loc.slug}`}
              >
                <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
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
                  {karaokeActive ? 'LIVE - Guests can request songs' : 'Off'}
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
