import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowLeft, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

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

  const handleClientSelect = async () => {
    const profileId = localStorage.getItem('ff_user_profile_id');
    if (profileId) {
      try {
        await fetch(`${API_URL}/api/user/profile/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'customer' }),
        });
      } catch {}
    }
    navigate('/');
  };

  const handlePositionSelect = async (position) => {
    setSaving(true);
    const profileId = localStorage.getItem('ff_user_profile_id');
    if (profileId) {
      try {
        await fetch(`${API_URL}/api/user/profile/${profileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: position, staff_title: position }),
        });
      } catch {}
    }
    setSaving(false);
    if (position === 'dj') {
      navigate('/dj');
    } else {
      navigate('/');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-red-600/30 w-full max-w-md relative">
        <CardContent className="p-8 text-center">
          {/* Close bypass button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            data-testid="checkin-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation links */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white text-sm"
              data-testid="checkin-back-home"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />Home
            </button>
            <button
              onClick={() => navigate('/account')}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
              data-testid="checkin-my-account"
            >
              My Account
            </button>
          </div>

          {/* Logo */}
          <img
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
            alt="Fin & Feathers Restaurants"
            className="max-h-24 w-auto mx-auto mb-6 object-contain"
          />

          {/* Step 1: Client or Staff */}
          {step === 'choose' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
              <p className="text-slate-400 text-sm mb-8">How are you joining us today?</p>
              <div className="flex gap-4">
                <Button
                  onClick={handleClientSelect}
                  className="flex-1 h-28 flex-col gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-semibold transition-all hover:scale-[1.03]"
                  data-testid="checkin-client-btn"
                >
                  <Users className="w-8 h-8" />
                  Client
                </Button>
                <Button
                  onClick={() => setStep('staff-role')}
                  className="flex-1 h-28 flex-col gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-base font-semibold transition-all hover:scale-[1.03]"
                  data-testid="checkin-staff-btn"
                >
                  <Briefcase className="w-8 h-8" />
                  Staff
                </Button>
              </div>
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
                    onClick={() => handlePositionSelect(pos.id)}
                    disabled={saving}
                    className="h-24 flex-col gap-2 bg-slate-800 hover:bg-red-600/80 text-white border border-slate-700 hover:border-red-500 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                    data-testid={`staff-position-${pos.id}`}
                  >
                    <pos.icon className="w-6 h-6" />
                    {pos.label}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setStep('choose')}
                variant="ghost"
                className="mt-4 text-slate-500 hover:text-white text-sm"
                data-testid="back-to-type-btn"
              >
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
