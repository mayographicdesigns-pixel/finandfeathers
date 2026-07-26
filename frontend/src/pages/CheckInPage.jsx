import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Loader2, ChevronDown, Check, UserCheck
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { getLocations, getUserProfileByEmail, createUserProfile } from '../services/api';

const API_URL = window.location.origin;

const CheckInPage = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationList, setShowLocationList] = useState(false);
  const [findingLocation, setFindingLocation] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [magicStatus, setMagicStatus] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Prefill from prior session — signed-in user OR returning guest
  useEffect(() => {
    (async () => {
      const savedProfileId = localStorage.getItem('ff_user_profile_id');
      if (savedProfileId) {
        try {
          const res = await fetch(`${API_URL}/api/user/profile/${savedProfileId}`);
          if (res.ok) {
            const p = await res.json();
            if (p?.name) setName(p.name);
            if (p?.email) setEmail(p.email);
            if (p?.phone) setPhone(p.phone);
            return;
          }
        } catch (e) { console.error(e); }
      }
      const savedName = localStorage.getItem('ff_user_name') || localStorage.getItem('ff_guest_name') || '';
      const savedEmail = localStorage.getItem('ff_guest_email') || '';
      const savedPhone = localStorage.getItem('ff_guest_phone') || '';
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedPhone) setPhone(savedPhone);
    })();
  }, []);

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

  const handleSendMagicLink = async () => {
    setMagicStatus('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter your email above first');
      return;
    }
    setError('');
    setMagicSending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          base_url: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Could not send link');
      setMagicStatus(data.email_sent
        ? 'Check your inbox — a sign-in link is on the way.'
        : 'Link created. Check your email (or ask staff for the sign-in URL).');
    } catch (e) {
      setMagicStatus(`Failed: ${e.message}`);
    } finally {
      setMagicSending(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!selectedLocation) { setError('Please pick a location'); return; }
    setSaving(true);
    setError('');

    const finalName = name.trim();
    const finalEmail = email.trim();
    const finalPhone = phone.trim();
    let profileId = localStorage.getItem('ff_user_profile_id');
    let profile = null;

    // Sign-up / Sign-in: if email is provided, upsert a user profile so users can
    // return and be recognized. No password — email is the identifier.
    if (finalEmail) {
      try {
        const existing = await getUserProfileByEmail(finalEmail);
        if (existing?.id) {
          profile = existing;
          profileId = existing.id;
          localStorage.setItem('ff_user_profile_id', existing.id);
        } else {
          const created = await createUserProfile({
            name: finalName,
            email: finalEmail,
            phone: finalPhone || null,
            avatar_emoji: '👤',
          });
          if (created?.id) {
            profile = created;
            profileId = created.id;
            localStorage.setItem('ff_user_profile_id', created.id);
          }
        }
      } catch (e) { console.error('Profile upsert failed:', e); }
    }

    // Fallback: guest without email
    let userId = profileId;
    if (!userId) {
      let guestId = localStorage.getItem('ff_guest_id');
      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('ff_guest_id', guestId);
      }
      userId = guestId;
    }

    // Persist name/email/phone locally too
    localStorage.setItem('ff_user_name', finalName);
    if (finalEmail) localStorage.setItem('ff_guest_email', finalEmail);
    if (finalPhone) localStorage.setItem('ff_guest_phone', finalPhone);
    localStorage.setItem('ff_guest_name', finalName);

    // Record the check-in
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
    try { sessionStorage.setItem('ff_welcome_shown_session', 'true'); } catch (e) { console.error(e); }
    localStorage.setItem('ff_welcome_shown', 'true');

    setSaving(false);

    // Route by profile's staff title — set in "My Account". Staff DJs land in
    // the DJ Panel automatically; everyone else lands on the Vibe Wall.
    const staffTitle = (profile?.staff_title || profile?.role || '').toString().toLowerCase();
    if (staffTitle === 'dj') {
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

          <div className="px-8 py-6 space-y-4">
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

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Email <span className="text-slate-600 normal-case">(optional — used to remember you)</span></label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="bg-slate-800/60 border-slate-700 text-white h-11"
                data-testid="checkin-email-input"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Phone <span className="text-slate-600 normal-case">(optional)</span></label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="(555) 555-5555"
                className="bg-slate-800/60 border-slate-700 text-white h-11"
                data-testid="checkin-phone-input"
              />
            </div>

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
                <><UserCheck className="w-4 h-4 mr-2" />Check In</>
              )}
            </Button>

            <div className="flex items-center gap-2 text-slate-600 text-[10px]">
              <div className="flex-1 h-px bg-slate-800" />
              <span>OR</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleSendMagicLink}
              disabled={magicSending || !email.trim()}
              className="w-full text-red-400 hover:text-red-300 text-xs font-medium py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="magic-link-btn"
            >
              {magicSending ? 'Sending link…' : 'Email me a sign-in link instead'}
            </button>
            {magicStatus && (
              <p
                className={`text-[11px] text-center ${magicStatus.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}
                data-testid="magic-link-status"
              >
                {magicStatus}
              </p>
            )}

            <p className="text-slate-600 text-[10px] text-center">
              Staff can set their role (DJ, bartender, server, cook, manager) in <span className="text-red-400">My Account</span> after checking in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
