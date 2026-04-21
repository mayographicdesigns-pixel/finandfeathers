import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, ArrowLeft, X, MapPin, Loader2, ChevronDown,
  Music, Wine, UtensilsCrossed, Shield, Headphones, ChefHat, UserCheck
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
  const [step, setStep] = useState('choose'); // 'choose' | 'guest-name' | 'staff-role' | 'pick-location'
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [findingLocation, setFindingLocation] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [stepTransition, setStepTransition] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const locs = await getLocations();
        const nonHibachi = (locs || []).filter(l => l.slug !== 'hibachi-food-truck');
        setLocations(nonHibachi);

        // If URL has a slug, use that location directly
        if (urlSlug) {
          const match = nonHibachi.find(l => l.slug === urlSlug);
          if (match) {
            setSelectedLocation(match);
            setFindingLocation(false);
            return;
          }
        }

        const saved = localStorage.getItem('ff_user_location');
        if (saved && nonHibachi.find(l => l.slug === saved)) {
          setSelectedLocation(nonHibachi.find(l => l.slug === saved));
          setFindingLocation(false);
          return;
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              let closest = nonHibachi[0];
              let minDist = Infinity;
              nonHibachi.forEach(loc => {
                if (loc.latitude && loc.longitude) {
                  const d = Math.sqrt(
                    Math.pow(latitude - loc.latitude, 2) +
                    Math.pow(longitude - loc.longitude, 2)
                  );
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
    };
    detectLocation();
  }, [urlSlug]);

  useEffect(() => {
    const name = localStorage.getItem('ff_user_name') || localStorage.getItem('ff_guest_name') || '';
    if (name) setGuestName(name);
  }, []);

  const switchStep = useCallback((newStep) => {
    setStepTransition(true);
    setTimeout(() => {
      setStep(newStep);
      setStepTransition(false);
    }, 200);
  }, []);

  const doCheckIn = async (role, displayName) => {
    if (!selectedLocation) return;
    setSaving(true);
    const profileId = localStorage.getItem('ff_user_profile_id');
    const name = displayName || guestName.trim() || 'Guest';

    let userId = profileId;
    if (!profileId) {
      let guestId = localStorage.getItem('ff_guest_id');
      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('ff_guest_id', guestId);
      }
      localStorage.setItem('ff_guest_name', name);
      userId = guestId;
    }

    if (profileId && role !== 'guest') {
      try {
        await fetch(`${API_URL}/api/user/profile/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, staff_title: role }),
        });
      } catch (e) { console.error('Profile update failed:', e); }
    }

    try {
      await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: selectedLocation.slug,
          display_name: name,
          avatar_emoji: profileId ? (localStorage.getItem('ff_user_avatar') || '') : '👤',
          user_profile_id: userId
        }),
      });
    } catch (e) { console.error('Check-in failed:', e); }

    localStorage.setItem('ff_user_location', selectedLocation.slug);
    if (!profileId) localStorage.setItem('ff_user_name', name);
    setSaving(false);

    if (role === 'dj') {
      navigate('/dj');
    } else {
      navigate(`/social/${selectedLocation.slug}`);
    }
  };

  const handleGuestClick = () => {
    const profileId = localStorage.getItem('ff_user_profile_id');
    if (profileId) {
      doCheckIn('guest', localStorage.getItem('ff_user_name') || 'Guest');
    } else {
      switchStep('guest-name');
    }
  };

  const handleGuestSubmit = () => {
    if (!guestName.trim()) return;
    doCheckIn('guest', guestName.trim());
  };

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    switchStep('choose');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-40%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-red-900/10 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-800/8 blur-[100px]" />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-700 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex justify-between items-center mb-5 px-1">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors" data-testid="checkin-back-home">
            <ArrowLeft className="w-4 h-4" /><span>Home</span>
          </button>
          <button onClick={() => navigate('/account')} className="text-red-400/80 hover:text-red-300 text-sm font-medium transition-colors" data-testid="checkin-my-account">
            My Account
          </button>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <img
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
              alt="Fin & Feathers"
              className="max-h-20 w-auto mx-auto mb-5 object-contain"
            />

            {findingLocation ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finding your location...</span>
              </div>
            ) : selectedLocation && step !== 'pick-location' && (
              <button
                onClick={() => switchStep('pick-location')}
                className="inline-flex items-center gap-2 bg-slate-900/70 border border-slate-700/40 rounded-full px-4 py-2 hover:border-red-500/40 transition-colors"
                data-testid="checkin-location-btn"
              >
                <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{selectedLocation.name?.replace('Fin & Feathers - ', '')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              </button>
            )}
          </div>

          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          {/* Step content */}
          <div className={`px-8 py-6 transition-all duration-200 ${stepTransition ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

            {/* PICK LOCATION */}
            {step === 'pick-location' && (
              <>
                <h1 className="text-xl font-semibold text-white mb-1 tracking-tight" data-testid="pick-location-title">Select Location</h1>
                <p className="text-slate-500 text-sm mb-5">Which Fin & Feathers are you at?</p>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {locations.map(loc => (
                    <button
                      key={loc.slug}
                      onClick={() => handleLocationSelect(loc)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                        selectedLocation?.slug === loc.slug
                          ? 'bg-red-600/20 border border-red-500/40'
                          : 'bg-slate-800/50 border border-slate-700/40 hover:border-slate-600'
                      }`}
                      data-testid={`location-${loc.slug}`}
                    >
                      <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedLocation?.slug === loc.slug ? 'text-red-500' : 'text-slate-500'}`} />
                      <div className="text-left flex-1">
                        <p className="text-white text-sm font-medium">{loc.name?.replace('Fin & Feathers - ', '')}</p>
                        {loc.address && <p className="text-slate-500 text-xs truncate">{loc.address}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => switchStep('choose')} className="mt-4 w-full py-2 text-slate-600 hover:text-slate-400 text-sm transition-colors flex items-center justify-center gap-1.5" data-testid="back-from-location">
                  <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
                </button>
              </>
            )}

            {/* CHOOSE: Guest or Staff */}
            {step === 'choose' && (
              <>
                <h1 className="text-xl font-semibold text-white mb-1 tracking-tight" data-testid="checkin-title">Check In</h1>
                <p className="text-slate-500 text-sm mb-6">How are you joining us today?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGuestClick}
                    disabled={saving || !selectedLocation}
                    className="group relative flex flex-col items-center justify-center gap-3 h-32 rounded-xl bg-red-600 hover:bg-red-500 transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                    data-testid="checkin-guest-btn"
                  >
                    {saving ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <span className="text-white font-semibold text-base">Guest</span>
                  </button>
                  <button
                    onClick={() => switchStep('staff-role')}
                    disabled={!selectedLocation}
                    className="group relative flex flex-col items-center justify-center gap-3 h-32 rounded-xl bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                    data-testid="checkin-staff-btn"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                      <Music className="w-6 h-6 text-slate-300" />
                    </div>
                    <span className="text-white font-semibold text-base">Staff</span>
                  </button>
                </div>
                <button onClick={() => navigate('/')} className="mt-5 w-full py-2.5 text-slate-600 hover:text-slate-400 text-sm transition-colors flex items-center justify-center gap-1.5" data-testid="checkin-close-btn">
                  <X className="w-3.5 h-3.5" /><span>Close</span>
                </button>
              </>
            )}

            {/* GUEST NAME */}
            {step === 'guest-name' && (
              <>
                <h1 className="text-xl font-semibold text-white mb-1 tracking-tight" data-testid="guest-name-title">What's your name?</h1>
                <p className="text-slate-500 text-sm mb-5">So others can see who's here</p>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuestSubmit()}
                  placeholder="Enter your name"
                  className="bg-slate-800/60 border-slate-700 text-white mb-4"
                  autoFocus
                  data-testid="checkin-name-input"
                />
                <Button onClick={handleGuestSubmit} disabled={!guestName.trim() || saving} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12" data-testid="checkin-go-btn">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserCheck className="w-4 h-4 mr-2" />Check In</>}
                </Button>
                <button onClick={() => switchStep('choose')} className="mt-4 w-full py-2 text-slate-600 hover:text-slate-400 text-sm transition-colors flex items-center justify-center gap-1.5" data-testid="back-to-choose-btn">
                  <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
                </button>
              </>
            )}

            {/* STAFF ROLE */}
            {step === 'staff-role' && (
              <>
                <h1 className="text-xl font-semibold text-white mb-1 tracking-tight" data-testid="staff-role-title">Select Your Role</h1>
                <p className="text-slate-500 text-sm mb-6">Tap your position to check in</p>
                <div className="space-y-2.5">
                  {STAFF_POSITIONS.map((pos) => {
                    const Icon = pos.icon;
                    return (
                      <button
                        key={pos.id}
                        onClick={() => doCheckIn(pos.id, localStorage.getItem('ff_user_name') || 'Staff')}
                        disabled={saving}
                        className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-slate-600 transition-all duration-300 active:scale-[0.98] disabled:opacity-40"
                        data-testid={`staff-position-${pos.id}`}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${pos.color}20`, border: `1px solid ${pos.color}30` }}>
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: pos.color }} /> : <Icon className="w-5 h-5" style={{ color: pos.color }} />}
                        </div>
                        <span className="text-white font-medium text-sm">{pos.label}</span>
                        <ArrowLeft className="w-4 h-4 text-slate-600 ml-auto rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => switchStep('choose')} className="mt-5 w-full py-2.5 text-slate-600 hover:text-slate-400 text-sm transition-colors flex items-center justify-center gap-1.5" data-testid="back-to-type-btn">
                  <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
