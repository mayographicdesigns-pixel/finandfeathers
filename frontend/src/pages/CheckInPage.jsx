import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowLeft, X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { getLocations } from '../services/api';

const API_URL = window.location.origin;

const STAFF_POSITIONS = [
  { id: 'dj', label: 'DJ', icon: Briefcase },
  { id: 'bartender', label: 'Bartender', icon: Briefcase },
  { id: 'server', label: 'Server', icon: Briefcase },
  { id: 'manager', label: 'Manager', icon: Briefcase },
];

const CheckInPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('choose'); // 'choose' | 'staff-role'
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [findingLocation, setFindingLocation] = useState(true);

  // Detect closest location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const locs = await getLocations();
        const nonHibachi = (locs || []).filter(l => l.slug !== 'hibachi-food-truck');
        setLocations(nonHibachi);

        // Check saved location
        const saved = localStorage.getItem('ff_user_location');
        if (saved && nonHibachi.find(l => l.slug === saved)) {
          setSelectedLocation(nonHibachi.find(l => l.slug === saved));
          setFindingLocation(false);
          return;
        }

        // Geolocation
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
  }, []);

  const checkInAndNavigate = async (role) => {
    if (!selectedLocation) return;
    setSaving(true);
    const profileId = localStorage.getItem('ff_user_profile_id');
    const userName = localStorage.getItem('ff_user_name') || 'Guest';
    const userAvatar = localStorage.getItem('ff_user_avatar') || '😊';

    // Update profile role
    if (profileId) {
      try {
        await fetch(`${API_URL}/api/user/profile/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, staff_title: role !== 'customer' ? role : undefined }),
        });
      } catch {}
    }

    // Create check-in record
    try {
      await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: selectedLocation.slug,
          display_name: userName,
          avatar_emoji: userAvatar,
          user_profile_id: profileId
        }),
      });
    } catch {}

    localStorage.setItem('ff_user_location', selectedLocation.slug);
    setSaving(false);

    // Route DJ to DJ panel, everyone else to social wall
    if (role === 'dj') {
      navigate('/dj');
    } else {
      navigate(`/social/${selectedLocation.slug}`);
    }
  };

  const handleClose = () => navigate('/');

  const locationLabel = selectedLocation?.name?.replace('Fin & Feathers - ', '') || '';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-red-600/30 w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm" data-testid="checkin-back-home">
              <ArrowLeft className="w-4 h-4 inline mr-1" />Home
            </button>
            <button onClick={() => navigate('/account')} className="text-red-400 hover:text-red-300 text-sm font-medium" data-testid="checkin-my-account">
              My Account
            </button>
          </div>

          {/* Logo */}
          <img
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
            alt="Fin & Feathers Restaurants"
            className="max-h-24 w-auto mx-auto mb-4 object-contain"
          />

          {/* Location Badge */}
          {findingLocation ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding your location...
            </div>
          ) : selectedLocation && (
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 bg-slate-800/70 rounded-full px-4 py-2 border border-slate-700/50">
                <MapPin className="w-4 h-4 text-red-500" />
                <select
                  value={selectedLocation.slug}
                  onChange={(e) => {
                    const loc = locations.find(l => l.slug === e.target.value);
                    if (loc) setSelectedLocation(loc);
                  }}
                  className="bg-transparent text-white text-sm font-semibold border-none outline-none cursor-pointer appearance-none"
                  data-testid="checkin-location-select"
                >
                  {locations.map(loc => (
                    <option key={loc.slug} value={loc.slug} className="bg-slate-800 text-white">
                      {loc.name?.replace('Fin & Feathers - ', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Client or Staff */}
          {step === 'choose' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Check In</h1>
              <p className="text-slate-400 text-sm mb-6">How are you joining us today?</p>
              <div className="flex gap-4">
                <Button
                  onClick={() => checkInAndNavigate('customer')}
                  disabled={saving || !selectedLocation}
                  className="flex-1 h-28 flex-col gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-semibold transition-all hover:scale-[1.03]"
                  data-testid="checkin-client-btn"
                >
                  {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Users className="w-8 h-8" />}
                  Client
                </Button>
                <Button
                  onClick={() => setStep('staff-role')}
                  disabled={!selectedLocation}
                  className="flex-1 h-28 flex-col gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-base font-semibold transition-all hover:scale-[1.03]"
                  data-testid="checkin-staff-btn"
                >
                  <Briefcase className="w-8 h-8" />
                  Staff
                </Button>
              </div>
              <Button onClick={handleClose} variant="ghost" className="mt-6 w-full text-slate-500 hover:text-white text-sm" data-testid="checkin-close-btn">
                <X className="w-4 h-4 mr-1" /> Close
              </Button>
            </>
          )}

          {/* Step 2: Staff Role Picker */}
          {step === 'staff-role' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">What's your role?</h1>
              <p className="text-slate-400 text-sm mb-6">Select your position</p>
              <div className="grid grid-cols-2 gap-3">
                {STAFF_POSITIONS.map((pos) => (
                  <Button
                    key={pos.id}
                    onClick={() => checkInAndNavigate(pos.id)}
                    disabled={saving}
                    className="h-24 flex-col gap-2 bg-slate-800 hover:bg-red-600/80 text-white border border-slate-700 hover:border-red-500 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                    data-testid={`staff-position-${pos.id}`}
                  >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <pos.icon className="w-6 h-6" />}
                    {pos.label}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setStep('choose')} variant="ghost" className="mt-4 text-slate-500 hover:text-white text-sm" data-testid="back-to-type-btn">
                Back
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
