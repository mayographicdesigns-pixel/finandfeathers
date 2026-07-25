import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, ArrowLeft, MapPin, Loader2, ChevronDown, Check,
  Wine, UtensilsCrossed, Shield, Headphones, ChefHat, UserCheck, Music
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { getLocations } from '../services/api';

const API_URL = window.location.origin;

const STAFF_POSITIONS = [
  { id: 'dj', label: 'DJ', icon: Headphones, color: '#ef4444' },
  { id: 'bartender', label: 'Bartender', icon: Wine, color: '#f97316' },
  { id: 'server', label: 'Server', icon: UtensilsCrossed, color: '#eab308' },
  { id: 'cook', label: 'Cook', icon: ChefHat, color: '#22c55e' },
  { id: 'manager', label: 'Manager', icon: Shield, color: '#6366f1' },
];

const CheckInPage = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationList, setShowLocationList] = useState(false);
  const [findingLocation, setFindingLocation] = useState(true);

  const [name, setName] = useState('');
  const [role, setRole] = useState('guest'); // 'guest' | 'staff'
  const [staffPosition, setStaffPosition] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  // Fade-in
  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Prefill name from prior session
  useEffect(() => {
    const savedName = localStorage.getItem('ff_user_name') || localStorage.getItem('ff_guest_name') || '';
    if (savedName) setName(savedName);
  }, []);

  // Location detection: URL slug > saved > geolocation > first
  useEffect(() => {
    (async () => {
      try {
        const locs = await getLocations();
        const nonHibachi = (locs || []).filter(l => l.slug !== 'hibachi-food-truck');
        setLocations(nonHibachi);

        if (urlSlug) {
          const match = nonHibachi.find(l => l.slug === urlSlug);
          if (match) { setSelectedLocation(match); setFindingLocation(false); return; }
        }

        const savedSlug = localStorage.getItem('ff_user_location');
        if (savedSlug) {
          const saved = nonHibachi.find(l => l.slug === savedSlug);
          if (saved) { setSelectedLocation(saved); setFindingLocation(false); return; }
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              let closest = nonHibachi[0];
              let minDist = Infinity;
              nonHibachi.forEach(loc => {
                if (loc.latitude && loc.longitude) {
                  const d = Math.hypot(latitude - loc.latitude, longitude - loc.longitude);
                  if (d < minDist) { minDist = d; closest = loc; }
                }
              });
              setSelectedLocation(closest);
              setFindingLocation(false);
            },
            () => { setSelectedLocation(nonHibachi[0]); setFindingLocation(false); },
            { timeout: 5000 }
          );
        } else {
          setSelectedLocation(nonHibachi[0]);
          setFindingLocation(false);
        }
      } catch {
        setFindingLocation(false);
      }
    })();
  }, [urlSlug]);

  const canSubmit = (
    !!selectedLocation &&
    !!name.trim() &&
    (role === 'guest' || (role === 'staff' && !!staffPosition))
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!name.trim()) setError('Please enter your name');
      else if (!selectedLocation) setError('Please pick a location');
      else if (role === 'staff' && !staffPosition) setError('Please select your role');
      return;
    }
    setSaving(true);
    setError('');

    const finalName = name.trim();
    const finalRole = role === 'guest' ? 'guest' : staffPosition;
    const profileId = localStorage.getItem('ff_user_profile_id');

    let userId = profileId;
    if (!profileId) {
      let guestId = localStorage.getItem('ff_guest_id');
      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('ff_guest_id', guestId);
      }
      localStorage.setItem('ff_guest_name', finalName);
      userId = guestId;
    }

    // Update profile role if the user is signed in and picked a staff role
    if (profileId && finalRole !== 'guest') {
      try {
        await fetch(`${API_URL}/api/user/profile/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: finalRole, staff_title: finalRole }),
        });
      } catch (e) { console.error('Profile update failed:', e); }
    }

    // Record check-in
    try {
      await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: selectedLocation.slug,
          display_name: finalName,
          avatar_emoji: profileId ? (localStorage.getItem('ff_user_avatar') || '') : '👤',
          user_profile_id: userId,
        }),
      });
    } catch (e) { console.error('Check-in failed:', e); }

    localStorage.setItem('ff_user_location', selectedLocation.slug);
    if (!profileId) localStorage.setItem('ff_user_name', finalName);
    // Session flag so the homepage never re-shows a login modal.
    try { sessionStorage.setItem('ff_welcome_shown_session', 'true'); } catch (e) { console.error(e); }
    localStorage.setItem('ff_welcome_shown', 'true');

    setSaving(false);

    // Route by role
    if (finalRole === 'dj') {
      navigate('/dj');
    } else {
      navigate(`/social/${selectedLocation.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-40%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-red-900/10 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-800/8 blur-[100px]" />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-700 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Top nav row */}
        <div className="flex justify-between items-center mb-5 px-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors"
            data-testid="checkin-back-home"
          >
            <ArrowLeft className="w-4 h-4" /><span>Home</span>
          </button>
          <button
            onClick={() => navigate('/account')}
            className="text-red-400/80 hover:text-red-300 text-sm font-medium transition-colors"
            data-testid="checkin-my-account"
          >
            My Account
          </button>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <img
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
              alt="Fin & Feathers"
              className="max-h-16 w-auto mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight" data-testid="checkin-title">
              Check In
            </h1>
            <p className="text-slate-500 text-sm">Sign in and join the vibe in one step</p>
          </div>

          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          {/* Single-step form */}
          <div className="px-8 py-6 space-y-5">
            {/* Name */}
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Your Name</label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. Alex"
                className="bg-slate-800/60 border-slate-700 text-white h-11"
                autoFocus={!name}
                data-testid="checkin-name-input"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Location</label>
              {findingLocation ? (
                <div className="flex items-center gap-2 h-11 px-3 rounded-md bg-slate-800/60 border border-slate-700 text-slate-500 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finding your nearest location…</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowLocationList(v => !v)}
                    className="w-full flex items-center justify-between gap-2 h-11 px-3 rounded-md bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-colors"
                    data-testid="checkin-location-btn"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-white text-sm font-medium truncate">
                        {selectedLocation ? selectedLocation.name?.replace('Fin & Feathers - ', '') : 'Select a location'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showLocationList ? 'rotate-180' : ''}`} />
                  </button>

                  {showLocationList && (
                    <div className="mt-2 max-h-52 overflow-y-auto space-y-1 rounded-md border border-slate-800 bg-slate-900/60 p-1">
                      {locations.map(loc => (
                        <button
                          key={loc.slug}
                          onClick={() => { setSelectedLocation(loc); setShowLocationList(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                            selectedLocation?.slug === loc.slug
                              ? 'bg-red-600/20 text-white'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                          data-testid={`checkin-location-option-${loc.slug}`}
                        >
                          <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${selectedLocation?.slug === loc.slug ? 'text-red-400' : 'text-slate-500'}`} />
                          <span className="text-sm truncate">{loc.name?.replace('Fin & Feathers - ', '')}</span>
                          {selectedLocation?.slug === loc.slug && <Check className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Role toggle */}
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">I&apos;m a…</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setRole('guest'); setStaffPosition(null); setError(''); }}
                  className={`flex items-center justify-center gap-2 h-11 rounded-md border transition-all ${
                    role === 'guest'
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                  data-testid="checkin-role-guest"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Guest</span>
                </button>
                <button
                  onClick={() => { setRole('staff'); setError(''); }}
                  className={`flex items-center justify-center gap-2 h-11 rounded-md border transition-all ${
                    role === 'staff'
                      ? 'bg-slate-700 border-slate-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                  data-testid="checkin-role-staff"
                >
                  <Music className="w-4 h-4" />
                  <span className="text-sm font-medium">Staff</span>
                </button>
              </div>

              {/* Staff position sub-picker */}
              {role === 'staff' && (
                <div className="mt-3 grid grid-cols-5 gap-2" data-testid="staff-position-grid">
                  {STAFF_POSITIONS.map((pos) => {
                    const Icon = pos.icon;
                    const active = staffPosition === pos.id;
                    return (
                      <button
                        key={pos.id}
                        onClick={() => { setStaffPosition(pos.id); setError(''); }}
                        className={`flex flex-col items-center justify-center gap-1 h-16 rounded-md border transition-all ${
                          active ? 'border-red-500 bg-red-600/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                        }`}
                        data-testid={`checkin-staff-position-${pos.id}`}
                        style={active ? { boxShadow: `0 0 0 1px ${pos.color}66 inset` } : undefined}
                      >
                        <Icon className="w-4 h-4" style={{ color: pos.color }} />
                        <span className="text-[10px] text-slate-300 leading-none">{pos.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center" data-testid="checkin-error">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-40"
              data-testid="checkin-submit-btn"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  {role === 'staff' && staffPosition === 'dj' ? 'Check In & Go to DJ Panel' : 'Check In'}
                </>
              )}
            </Button>

            <p className="text-slate-600 text-[10px] text-center">
              By checking in, you&apos;ll appear on the Vibe Wall for this location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
