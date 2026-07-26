import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = window.location.origin;

const MagicLinkVerifyPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This sign-in link is missing a token.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/magic-link/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setState('error');
          setMessage(err.detail || 'Could not sign you in with this link.');
          return;
        }
        const data = await res.json();
        const u = data.user || {};
        localStorage.setItem('ff_user_profile_id', u.id);
        if (u.name) {
          localStorage.setItem('ff_user_name', u.name);
          localStorage.setItem('ff_guest_name', u.name);
        }
        if (u.email) localStorage.setItem('ff_guest_email', u.email);
        if (u.phone) localStorage.setItem('ff_guest_phone', u.phone);
        localStorage.setItem('ff_auth_provider', 'magic-link');
        try { sessionStorage.setItem('ff_welcome_shown_session', 'true'); } catch (e) { console.error(e); }
        localStorage.setItem('ff_welcome_shown', 'true');
        setUserName(u.name || u.email || '');
        setState('success');
        // Auto-redirect to check-in so they can pick their location
        setTimeout(() => {
          const staffTitle = (u.staff_title || u.role || '').toString().toLowerCase();
          if (staffTitle === 'dj') {
            navigate('/dj');
          } else {
            navigate('/checkin');
          }
        }, 1200);
      } catch (e) {
        console.error(e);
        setState('error');
        setMessage('Something went wrong verifying your link.');
      }
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800/60 rounded-2xl p-8 text-center" data-testid="magic-verify-card">
        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-white mb-1">Signing you in…</h1>
            <p className="text-slate-500 text-sm">One moment.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" data-testid="magic-verify-success-icon" />
            <h1 className="text-xl font-semibold text-white mb-1">Welcome back{userName ? `, ${userName}` : ''}!</h1>
            <p className="text-slate-400 text-sm">Redirecting…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" data-testid="magic-verify-error-icon" />
            <h1 className="text-xl font-semibold text-white mb-1">Link Issue</h1>
            <p className="text-slate-400 text-sm mb-4">{message}</p>
            <Button onClick={() => navigate('/checkin')} className="bg-red-600 hover:bg-red-700 text-white" data-testid="magic-verify-back-btn">
              Back to Check In
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MagicLinkVerifyPage;
