import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthCallback Component
 * 
 * Handles the OAuth callback from Emergent Google Auth.
 * Processes the session_id from URL fragment and exchanges it for a session.
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/account', { replace: true });
          return;
        }

        // Exchange session_id for session via backend
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/auth/google/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Authentication failed');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
          // Store user info in localStorage for easy access
          localStorage.setItem('ff_user_profile_id', data.user.id);
          localStorage.setItem('ff_user_info', JSON.stringify({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone
          }));
          localStorage.setItem('ff_auth_provider', 'google');
          
          // Navigate to account page with user data
          navigate('/account', { 
            replace: true,
            state: { user: data.user, justLoggedIn: true }
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        // Navigate to account page to show error
        navigate('/account', { 
          replace: true,
          state: { authError: error.message }
        });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Signing you in...</p>
        <p className="text-slate-400 text-sm mt-2">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
};

export default AuthCallback;
