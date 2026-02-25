import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { initiateGoogleLogin, registerUserWithPassword, loginUserWithPassword, adminLogin, requestPasswordReset } from '../../services/api';

// Signup Form Component - allows creating account with Google or email/password
const SignupForm = ({ onProfileCreated, authError }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('options'); // 'options', 'signup', 'login', 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    avatar_emoji: '😊'
  });
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [debugResetUrl, setDebugResetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const AVATAR_EMOJIS = ['😊', '😎', '🤩', '😋', '😄', '🤙', '🔥', '💯', '🎉', '✨', '🍗', '🍺'];

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' });
      return;
    }
    
    if (formData.username.length < 3) {
      toast({ title: 'Error', description: 'Username must be at least 3 characters', variant: 'destructive' });
      return;
    }
    
    if (!formData.email.trim() || !formData.password) {
      toast({ title: 'Error', description: 'Email and password are required', variant: 'destructive' });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUserWithPassword(formData.email, formData.password, formData.name, formData.username);
      
      if (result.success && result.user) {
        localStorage.setItem('ff_user_profile_id', result.user.id);
        localStorage.setItem('ff_user_info', JSON.stringify({
          name: result.user.name,
          username: result.user.username,
          email: result.user.email,
          phone: result.user.phone
        }));
        localStorage.setItem('ff_auth_provider', 'email');
        
        toast({ title: 'Account Created!', description: 'Welcome to Fin & Feathers!' });
        onProfileCreated(result.user);
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create account', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      toast({ title: 'Error', description: 'Email and password are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Try admin login first (redirects to /admin on success)
      try {
        const adminResult = await adminLogin(formData.email.trim(), formData.password);
        if (adminResult?.access_token) {
          localStorage.removeItem('ff_user_profile_id');
          localStorage.removeItem('ff_user_info');
          localStorage.removeItem('ff_auth_provider');
          toast({ title: 'Admin Access Granted', description: 'Redirecting to admin dashboard...' });
          navigate('/admin');
          return;
        }
      } catch (adminError) {
        // Continue to user login if admin login fails
      }

      const result = await loginUserWithPassword(formData.email, formData.password);
      
      if (result.success && result.user) {
        localStorage.setItem('ff_user_profile_id', result.user.id);
        localStorage.setItem('ff_user_info', JSON.stringify({
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone
        }));
        localStorage.setItem('ff_auth_provider', 'email');
        
        toast({ title: 'Welcome Back!', description: `Logged in as ${result.user.name}` });
        onProfileCreated(result.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: error.message || 'Login failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy quick signup (without password)
  const handleQuickSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter your name', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.email) {
        const existing = await getUserProfileByEmail(formData.email);
        if (existing) {
          localStorage.setItem('ff_user_profile_id', existing.id);
          localStorage.setItem('ff_user_info', JSON.stringify({
            name: existing.name,
            email: existing.email,
            phone: existing.phone
          }));
          toast({ title: 'Welcome Back!', description: `Logged in as ${existing.name}` });
          onProfileCreated(existing);
          return;
        }
      }

      const newProfile = await createUserProfile({
        name: formData.name.trim(),
        email: formData.email || null,
        phone: formData.phone || null,
        avatar_emoji: formData.avatar_emoji
      });

      localStorage.setItem('ff_user_profile_id', newProfile.id);
      localStorage.setItem('ff_user_info', JSON.stringify({
        name: newProfile.name,
        email: newProfile.email,
        phone: newProfile.phone
      }));

      toast({ title: 'Account Created!', description: 'Welcome to Fin & Feathers!' });
      onProfileCreated(newProfile);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create account', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-original.png"
            alt="Fin & Feathers"
            className="max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain"
            data-testid="auth-logo"
          />
          <h1 className="text-2xl font-bold text-white">
            {authMode === 'login' ? 'Welcome Back!' : authMode === 'forgot' ? 'Forgot Password?' : 'Join Fin & Feathers'}
          </h1>
          <p className="text-slate-400 mt-2">
            {authMode === 'login' ? 'Sign in to your account' : authMode === 'forgot' ? 'We\'ll send you a reset link' : 'Create your account to start earning rewards'}
          </p>
        </div>

        {/* Auth Error Message */}
        {authError && (
          <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {authError}
          </div>
        )}

        <Card className="bg-slate-900 border-red-600/30">
          <CardContent className="p-6">
            {/* Auth Options View */}
            {authMode === 'options' && (
              <div className="space-y-4">
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 text-base font-medium flex items-center justify-center gap-3"
                  data-testid="google-login-btn"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900 text-slate-500">or</span>
                  </div>
                </div>

                {/* Email Sign Up Button */}
                <Button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base"
                  data-testid="email-signup-btn"
                >
                  Sign up with Email
                </Button>

                <p className="text-center text-slate-400 text-sm mt-4">
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="text-red-400 hover:text-red-300 font-medium"
                    data-testid="auth-goto-login-btn"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}

            {/* Email Signup Form */}
            {authMode === 'signup' && (
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="signup-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username *</label>
                  <Input
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="signup-username-input"
                  />
                  <p className="text-slate-500 text-xs mt-1">Letters, numbers, and underscores only</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="signup-email-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="signup-password-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="signup-confirm-password-input"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-password"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="mr-2"
                    data-testid="signup-show-password-toggle"
                  />
                  <label htmlFor="show-password" className="text-slate-400 text-sm">Show password</label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg mt-4"
                  data-testid="signup-submit-btn"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <p className="text-center text-slate-400 text-sm mt-4">
                  <button 
                    type="button"
                    onClick={() => setAuthMode('options')}
                    className="text-red-400 hover:text-red-300"
                    data-testid="signup-back-to-options-btn"
                  >
                    ← Back to options
                  </button>
                </p>
              </form>
            )}

            {/* Email Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username or Email</label>
                  <Input
                    type="text"
                    placeholder="Username or email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="login-email-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                    data-testid="login-password-input"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show-password-login"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="mr-2"
                      data-testid="login-show-password-toggle"
                    />
                    <label htmlFor="show-password-login" className="text-slate-400 text-sm">Show password</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-red-400 hover:text-red-300 text-sm"
                    data-testid="forgot-password-link"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg mt-4"
                  data-testid="login-submit-btn"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900 text-slate-500">or</span>
                  </div>
                </div>

                {/* Google Sign In in login mode */}
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 h-10 text-sm font-medium flex items-center justify-center gap-2"
                  data-testid="google-login-inline-btn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-center text-slate-400 text-sm mt-4">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-red-400 hover:text-red-300 font-medium"
                    data-testid="login-goto-signup-btn"
                  >
                    Sign Up
                  </button>
                </p>

                <p className="text-center mt-2">
                  <button 
                    type="button"
                    onClick={() => setAuthMode('options')}
                    className="text-slate-500 hover:text-slate-400 text-sm"
                  >
                    ← Back to options
                  </button>
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {authMode === 'forgot' && (
              <div className="space-y-4">
                {!forgotSent ? (
                  <>
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Forgot Password?</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Enter your username or email and we'll send you a reset link
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Username or Email
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your username or email"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        data-testid="forgot-identifier-input"
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={isSubmitting || !forgotIdentifier.trim()}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          const result = await requestPasswordReset(forgotIdentifier);
                          setForgotSent(true);
                          // For testing, show the reset link
                          if (result._debug_reset_url) {
                            setDebugResetUrl(result._debug_reset_url);
                          }
                          toast({ title: 'Success', description: result.message });
                        } catch (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                      data-testid="send-reset-link-btn"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">Check Your Email</h2>
                    <p className="text-slate-400 text-sm">
                      If an account exists with that username or email, we've sent a password reset link.
                    </p>
                    
                    {/* Debug: Show reset link for testing */}
                    {debugResetUrl && (
                      <div className="mt-4 p-3 bg-amber-900/30 border border-amber-600/30 rounded-lg">
                        <p className="text-amber-400 text-xs mb-2">Debug: Reset Link (remove in production)</p>
                        <button
                          onClick={() => navigate(debugResetUrl)}
                          className="text-amber-300 text-sm underline hover:text-amber-200"
                          data-testid="debug-reset-link"
                        >
                          Click here to reset password
                        </button>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => {
                        setForgotSent(false);
                        setForgotIdentifier('');
                        setDebugResetUrl('');
                        setAuthMode('login');
                      }}
                      className="mt-6 bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      Back to Login
                    </Button>
                  </div>
                )}

                {!forgotSent && (
                  <p className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-slate-500 hover:text-slate-400 text-sm"
                    >
                      ← Back to Login
                    </button>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
