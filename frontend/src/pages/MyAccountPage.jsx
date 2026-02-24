import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  User, Coins, Camera, History, Gift, Calendar, 
  Instagram, Twitter, Facebook, ArrowLeft, Edit2, 
  Save, X, Plus, Trash2, CreditCard, Sparkles, Music, Wine, Upload,
  DollarSign, Send, Award, Briefcase, BadgeCheck, ArrowRightLeft, Loader2, LogOut
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import {
  getUserProfile,
  getUserProfileByEmail,
  createUserProfile,
  updateUserProfile,
  purchaseTokens,
  getTokenBalance,
  getTokenHistory,
  getUserVisits,
  getUserGallerySubmissions,
  submitGalleryPhoto,
  uploadImage,
  uploadProfilePhoto,
  getStaffList,
  transferTokens,
  getTransferHistory,
  requestCashout,
  getCashoutHistory,
  transferTipsToPersonal,
  getTokenPackages,
  createTokenCheckout,
  checkTokenCheckoutStatus,
  createStripeTokenCheckout,
  getStripeCheckoutStatus,
  pollStripePaymentStatus,
  initiateGoogleLogin,
  registerUserWithPassword,
  loginUserWithPassword,
  checkUserAuth,
  userLogout,
  requestPasswordReset
} from '../services/api';

// Role badge component
const RoleBadge = ({ role, staffTitle }) => {
  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-600', icon: BadgeCheck },
    management: { label: 'Management', color: 'bg-purple-600', icon: Briefcase },
    staff: { label: staffTitle || 'Staff', color: 'bg-blue-600', icon: Award },
    customer: { label: 'Member', color: 'bg-slate-600', icon: User }
  };
  
  const config = roleConfig[role] || roleConfig.customer;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

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
            src="https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/logo-1.png"
            alt="Fin & Feathers"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">
            {authMode === 'login' ? 'Welcome Back!' : 'Join Fin & Feathers'}
          </h1>
          <p className="text-slate-400 mt-2">
            {authMode === 'login' ? 'Sign in to your account' : 'Create your account to start earning rewards'}
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

const MyAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const profilePhotoInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  
  // Auth error from OAuth callback
  const authError = location.state?.authError;
  
  // Check if user was just logged in via OAuth
  const justLoggedIn = location.state?.justLoggedIn;
  const oauthUser = location.state?.user;
  
  // Token state
  const [tokenPackages, setTokenPackages] = useState({});
  const [selectedPackage, setSelectedPackage] = useState('50');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  
  // History state
  const [visits, setVisits] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  
  // Staff-specific state
  const [staffList, setStaffList] = useState([]);
  const [tipAmount, setTipAmount] = useState(10);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [tipMessage, setTipMessage] = useState('');
  const [isTipping, setIsTipping] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const [cashoutHistory, setCashoutHistory] = useState([]);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [cashoutMethod, setCashoutMethod] = useState('venmo');
  const [cashoutDetails, setCashoutDetails] = useState('');
  const [isRequestingCashout, setIsRequestingCashout] = useState(false);
  const [transferToPersonalAmount, setTransferToPersonalAmount] = useState(0);

  // Load token packages on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const packages = await getTokenPackages();
        setTokenPackages(packages);
      } catch (error) {
        console.error('Error loading token packages:', error);
      }
    };
    loadPackages();
  }, []);

  // Check for payment return from WooCommerce or Stripe
  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    
    if (sessionId && paymentStatus === 'success') {
      // Stripe payment return
      handleStripePaymentReturn(sessionId, transactionId);
    } else if (transactionId && paymentStatus === 'success') {
      // WooCommerce payment return
      handlePaymentReturn(transactionId);
    } else if (paymentStatus === 'cancelled') {
      toast({ title: 'Payment Cancelled', description: 'Your token purchase was cancelled', variant: 'destructive' });
      window.history.replaceState({}, '', '/account');
    }
  }, [searchParams]);

  const handleStripePaymentReturn = async (sessionId, transactionId) => {
    setIsCheckingPayment(true);
    try {
      const result = await pollStripePaymentStatus(sessionId, 10, 2000);
      
      if (result.success) {
        toast({ 
          title: 'Payment Successful!', 
          description: 'Tokens have been added to your account!' 
        });
        // Refresh profile to get new balance
        if (profile) {
          const updatedProfile = await getUserProfile(profile.id);
          setProfile(updatedProfile);
          setEditedProfile(updatedProfile);
          // Refresh token history
          const history = await getTokenHistory(profile.id);
          setTokenHistory(history);
        }
      } else if (result.error === 'Payment expired') {
        toast({ title: 'Payment Expired', description: 'Please try again', variant: 'destructive' });
      } else {
        toast({ title: 'Payment Status', description: 'Please check your email for confirmation', variant: 'default' });
      }
    } catch (error) {
      console.error('Error checking Stripe payment status:', error);
      toast({ title: 'Error', description: 'Could not verify payment status', variant: 'destructive' });
    } finally {
      setIsCheckingPayment(false);
      window.history.replaceState({}, '', '/account');
    }
  };

  const handlePaymentReturn = async (transactionId) => {
    setIsCheckingPayment(true);
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 3000;

    const pollStatus = async () => {
      if (attempts >= maxAttempts) {
        setIsCheckingPayment(false);
        toast({ title: 'Payment Status', description: 'Please check your email for confirmation', variant: 'default' });
        window.history.replaceState({}, '', '/account');
        return;
      }

      try {
        const result = await checkTokenCheckoutStatus(transactionId);
        
        if (result.payment_status === 'paid') {
          setIsCheckingPayment(false);
          toast({ 
            title: 'Payment Successful!', 
            description: `${result.tokens_credited} tokens have been added to your account!` 
          });
          // Refresh profile to get new balance
          if (profile) {
            const updatedProfile = await getUserProfile(profile.id);
            setProfile(updatedProfile);
            setEditedProfile(updatedProfile);
            // Refresh token history
            const history = await getTokenHistory(profile.id);
            setTokenHistory(history);
          }
          window.history.replaceState({}, '', '/account');
          return;
        } else if (result.status === 'expired') {
          setIsCheckingPayment(false);
          toast({ title: 'Payment Expired', description: 'Please try again', variant: 'destructive' });
          window.history.replaceState({}, '', '/account');
          return;
        }

        // Continue polling
        attempts++;
        setTimeout(pollStatus, pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        setTimeout(pollStatus, pollInterval);
      }
    };

    pollStatus();
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // Check if user came from OAuth callback with user data
      if (oauthUser && justLoggedIn) {
        setProfile(oauthUser);
        setEditedProfile(oauthUser);
        loadAdditionalData(oauthUser.id, oauthUser.role);
        setIsLoading(false);
        // Clear location state
        window.history.replaceState({}, '', '/account');
        toast({ title: 'Welcome!', description: `Signed in as ${oauthUser.name}` });
        return;
      }
      
      // Check localStorage for user info
      const savedUser = localStorage.getItem('ff_user_info');
      const savedProfileId = localStorage.getItem('ff_user_profile_id');
      
      if (savedProfileId) {
        // Try to load existing profile
        const existingProfile = await getUserProfile(savedProfileId);
        if (existingProfile) {
          setProfile(existingProfile);
          setEditedProfile(existingProfile);
          loadAdditionalData(existingProfile.id, existingProfile.role);
          setIsLoading(false);
          return;
        }
      }
      
      // Try to check if user is authenticated via session cookie
      const sessionUser = await checkUserAuth();
      if (sessionUser) {
        localStorage.setItem('ff_user_profile_id', sessionUser.id);
        localStorage.setItem('ff_user_info', JSON.stringify({
          name: sessionUser.name,
          email: sessionUser.email,
          phone: sessionUser.phone
        }));
        setProfile(sessionUser);
        setEditedProfile(sessionUser);
        loadAdditionalData(sessionUser.id, sessionUser.role);
        setIsLoading(false);
        return;
      }
      
      if (savedUser) {
        const userInfo = JSON.parse(savedUser);
        // Try to find by email
        if (userInfo.email) {
          const existingProfile = await getUserProfileByEmail(userInfo.email);
          if (existingProfile) {
            localStorage.setItem('ff_user_profile_id', existingProfile.id);
            setProfile(existingProfile);
            setEditedProfile(existingProfile);
            loadAdditionalData(existingProfile.id, existingProfile.role);
            setIsLoading(false);
            return;
          }
        }
        
        // Create new profile with saved info
        const newProfile = await createUserProfile({
          name: userInfo.name || 'Guest',
          phone: userInfo.phone || null,
          email: userInfo.email || null,
          avatar_emoji: '😊'
        });
        localStorage.setItem('ff_user_profile_id', newProfile.id);
        setProfile(newProfile);
        setEditedProfile(newProfile);
        loadAdditionalData(newProfile.id, newProfile.role);
      } else {
        // No saved user - redirect to home or show signup prompt
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdditionalData = async (userId, userRole = 'customer') => {
    try {
      const [historyData, visitsData, submissionsData, staffData, transferData] = await Promise.all([
        getTokenHistory(userId),
        getUserVisits(userId),
        getUserGallerySubmissions(userId),
        getStaffList(),
        getTransferHistory(userId)
      ]);
      setTokenHistory(historyData);
      setVisits(visitsData);
      setSubmissions(submissionsData);
      setStaffList(staffData);
      setTransferHistory(transferData);
      
      // Load cashout history for staff
      if (userRole === 'staff') {
        const cashouts = await getCashoutHistory(userId);
        setCashoutHistory(cashouts);
      }
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      const updated = await updateUserProfile(profile.id, {
        name: editedProfile.name,
        phone: editedProfile.phone,
        email: editedProfile.email,
        avatar_emoji: editedProfile.avatar_emoji,
        birthdate: editedProfile.birthdate,
        anniversary: editedProfile.anniversary,
        special_dates: editedProfile.special_dates,
        instagram_handle: editedProfile.instagram_handle,
        facebook_handle: editedProfile.facebook_handle,
        twitter_handle: editedProfile.twitter_handle,
        tiktok_handle: editedProfile.tiktok_handle
      });
      setProfile(updated);
      setEditedProfile(updated);
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'Your profile has been saved' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingProfilePhoto(true);
    try {
      const result = await uploadProfilePhoto(profile.id, file);
      const photoUrl = `${process.env.REACT_APP_BACKEND_URL}${result.url}`;
      
      // Update local state
      setProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
      setEditedProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
      
      toast({ title: 'Photo Updated!', description: 'Your profile photo has been saved' });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handlePurchaseTokens = async (paymentMethod = 'stripe') => {
    if (!profile || !selectedPackage) return;
    
    setIsPurchasing(true);
    try {
      let result;
      if (paymentMethod === 'stripe') {
        result = await createStripeTokenCheckout(selectedPackage, profile.id);
      } else {
        result = await createTokenCheckout(profile.id, selectedPackage);
      }
      // Redirect to checkout
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsPurchasing(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingPhoto(true);
    try {
      // Upload the image first
      const uploadResult = await uploadImage(file);
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadResult.url}`;
      
      // Submit to gallery
      await submitGalleryPhoto(profile.id, imageUrl, photoCaption || null);
      
      // Refresh submissions
      const newSubmissions = await getUserGallerySubmissions(profile.id);
      setSubmissions(newSubmissions);
      setPhotoCaption('');
      
      toast({ title: 'Photo Submitted!', description: 'Your photo has been added to the gallery' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addSpecialDate = () => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: [...(prev.special_dates || []), { name: '', date: '' }]
    }));
  };

  const removeSpecialDate = (index) => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: prev.special_dates.filter((_, i) => i !== index)
    }));
  };

  const updateSpecialDate = (index, field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: prev.special_dates.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  // Emoji picker options
  const emojiOptions = ['😊', '😎', '🤠', '🥳', '😇', '🤩', '👨', '👩', '🧑', '👴', '👵', '🎉'];

  // Handle tipping a staff member
  const handleTipStaff = async () => {
    if (!profile || !selectedStaff || tipAmount < 1) return;
    
    setIsTipping(true);
    try {
      const result = await transferTokens(profile.id, selectedStaff.id, tipAmount, 'tip', tipMessage);
      setProfile(prev => ({ ...prev, token_balance: result.sender_new_balance }));
      setTransferHistory(prev => [result.transfer, ...prev]);
      toast({ 
        title: 'Tip Sent!', 
        description: `You tipped ${result.receiver_name} ${tipAmount} tokens` 
      });
      setSelectedStaff(null);
      setTipAmount(10);
      setTipMessage('');
    } catch (error) {
      console.error('Error tipping:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsTipping(false);
    }
  };

  // Handle staff cashout request
  const handleRequestCashout = async () => {
    if (!profile || profile.role !== 'staff') return;
    
    const cashoutBalance = profile.cashout_balance || 0;
    if (cashoutBalance < 20) {
      toast({ title: 'Minimum Not Met', description: 'You need at least $20 to cash out', variant: 'destructive' });
      return;
    }
    
    if (!cashoutDetails) {
      toast({ title: 'Missing Details', description: 'Please enter your payment details', variant: 'destructive' });
      return;
    }
    
    const amountToCashout = cashoutAmount || cashoutBalance;
    const tokensEquivalent = Math.floor(amountToCashout * 10);
    
    setIsRequestingCashout(true);
    try {
      const result = await requestCashout(profile.id, tokensEquivalent, cashoutMethod, cashoutDetails);
      setProfile(prev => ({ ...prev, cashout_balance: result.new_balance }));
      setCashoutHistory(prev => [result.cashout, ...prev]);
      toast({ 
        title: 'Cashout Requested!', 
        description: `$${result.payout_amount.toFixed(2)} will be sent to your ${cashoutMethod}` 
      });
      setCashoutAmount(0);
      setCashoutDetails('');
    } catch (error) {
      console.error('Error requesting cashout:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsRequestingCashout(false);
    }
  };

  // Handle transferring tips to personal token balance
  const handleTransferToPersonal = async () => {
    if (!profile || profile.role !== 'staff' || transferToPersonalAmount < 1) return;
    
    try {
      const result = await transferTipsToPersonal(profile.id, transferToPersonalAmount);
      setProfile(prev => ({ 
        ...prev, 
        cashout_balance: result.new_cashout_balance,
        token_balance: result.new_token_balance 
      }));
      toast({ 
        title: 'Transfer Complete!', 
        description: `Added ${result.tokens_added} tokens to your personal balance` 
      });
      setTransferToPersonalAmount(0);
    } catch (error) {
      console.error('Error transferring:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your profile...</div>
      </div>
    );
  }

  if (!profile) {
    return <SignupForm 
      onProfileCreated={(newProfile) => {
        setProfile(newProfile);
        setEditedProfile(newProfile);
        loadAdditionalData(newProfile.id, newProfile.role);
      }}
      authError={authError}
    />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hidden file input for profile photo */}
      <input
        type="file"
        ref={profilePhotoInputRef}
        onChange={handleProfilePhotoUpload}
        accept="image/*"
        className="hidden"
        data-testid="profile-photo-input"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-red-900/40 to-slate-950 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            {/* Logout Button */}
            <Button
              onClick={async () => {
                await userLogout();
                setProfile(null);
                toast({ title: 'Logged Out', description: 'You have been signed out' });
              }}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="logout-btn"
            >
              <X className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {/* Profile Photo/Avatar */}
            <div className="relative group">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-500"
                  data-testid="profile-photo"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-4xl border-2 border-slate-700">
                  {profile.avatar_emoji}
                </div>
              )}
              {/* Upload overlay */}
              <button
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={uploadingProfilePhoto}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                data-testid="upload-photo-btn"
              >
                {uploadingProfilePhoto ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white" data-testid="profile-name">
                  {profile.name}
                </h1>
                <RoleBadge role={profile.role} staffTitle={profile.staff_title} />
              </div>
              <p className="text-slate-400">{profile.email || 'No email set'}</p>
            </div>
            
            {/* Staff Earnings (only for staff) */}
            {profile.role === 'staff' && (
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl px-4 py-2 text-center mr-2">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-green-100" />
                  <span className="text-2xl font-bold text-white" data-testid="cashout-balance">
                    {(profile.cashout_balance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-green-100">Tips Earned</div>
              </div>
            )}
            
            {/* Token Balance */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl px-4 py-2 text-center">
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-amber-100" />
                <span className="text-2xl font-bold text-white" data-testid="token-balance">
                  {profile.token_balance || 0}
                </span>
              </div>
              <div className="text-xs text-amber-100">F&F Tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`w-full bg-slate-800/50 border border-slate-700 mb-6 ${profile.role === 'staff' ? 'grid-cols-5' : ''}`}>
            <TabsTrigger 
              value="profile" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="tokens" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-tokens"
            >
              <Coins className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger 
              value="tip" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-tip"
            >
              <Gift className="w-4 h-4 mr-2" />
              Tip Staff
            </TabsTrigger>
            {profile.role === 'staff' && (
              <TabsTrigger 
                value="earnings" 
                className="flex-1 data-[state=active]:bg-green-600"
                data-testid="tab-earnings"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Earnings
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="photos" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-photos"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-history"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Personal Information</CardTitle>
                {!isEditing ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-red-400 hover:text-red-300"
                    data-testid="edit-profile-btn"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile(profile);
                      }}
                      className="text-slate-400"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="save-profile-btn"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Photo */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {profile.profile_photo_url ? (
                      <img 
                        src={profile.profile_photo_url} 
                        alt={profile.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-4xl border-2 border-slate-700">
                        {profile.avatar_emoji}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={uploadingProfilePhoto}
                        className="border-slate-600 text-slate-300"
                        data-testid="change-photo-btn"
                      >
                        {uploadingProfilePhoto ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {profile.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Avatar Emoji (fallback) */}
                {isEditing && (
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Fallback Avatar (shown if no photo)</label>
                    <div className="flex gap-2 flex-wrap">
                      {emojiOptions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setEditedProfile(prev => ({ ...prev, avatar_emoji: emoji }))}
                          className={`text-2xl p-2 rounded-lg transition-all ${
                            editedProfile?.avatar_emoji === emoji 
                              ? 'bg-red-600 scale-110' 
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Name</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile?.name || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-name"
                    />
                  ) : (
                    <p className="text-white">{profile.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Phone</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile?.phone || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="(555) 123-4567"
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-white">{profile.phone || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="you@example.com"
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-white">{profile.email || 'Not set'}</p>
                  )}
                </div>

                {/* Birthdate */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" />
                    Birthdate
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile?.birthdate || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-birthdate"
                    />
                  ) : (
                    <p className="text-white">
                      {profile.birthdate 
                        ? new Date(profile.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Anniversary */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-1">
                    <Gift className="w-4 h-4" />
                    Anniversary
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile?.anniversary || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, anniversary: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-anniversary"
                    />
                  ) : (
                    <p className="text-white">
                      {profile.anniversary 
                        ? new Date(profile.anniversary).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Special Dates */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Special Dates
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(editedProfile?.special_dates || []).map((sd, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={sd.name}
                            onChange={e => updateSpecialDate(idx, 'name', e.target.value)}
                            placeholder="Event name"
                            className="bg-slate-800 border-slate-600 text-white flex-1"
                          />
                          <Input
                            type="date"
                            value={sd.date}
                            onChange={e => updateSpecialDate(idx, 'date', e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white w-40"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpecialDate(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addSpecialDate}
                        className="border-slate-600 text-slate-300"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Date
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {(profile.special_dates || []).length > 0 ? (
                        profile.special_dates.map((sd, idx) => (
                          <p key={idx} className="text-white">
                            {sd.name}: {new Date(sd.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-500">No special dates set</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.instagram_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, instagram_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.instagram_handle || 'Not set'}</span>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.facebook_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, facebook_handle: e.target.value }))}
                      placeholder="username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.facebook_handle || 'Not set'}</span>
                  )}
                </div>

                {/* Twitter */}
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-sky-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.twitter_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, twitter_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.twitter_handle || 'Not set'}</span>
                  )}
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-white" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.tiktok_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, tiktok_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.tiktok_handle || 'Not set'}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 border-amber-600/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-200 text-sm mb-1">Your Balance</p>
                    <div className="flex items-center gap-2">
                      <Coins className="w-8 h-8 text-amber-400" />
                      <span className="text-4xl font-bold text-white">{profile.token_balance || 0}</span>
                      <span className="text-amber-200">tokens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-200/70 text-xs">$1 = 10 tokens</p>
                    <p className="text-amber-200/70 text-xs">Use for tips & drinks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Tokens */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Buy F&F Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCheckingPayment && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-amber-500/20 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    <span className="text-amber-400">Verifying your payment...</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(tokenPackages).map(([key, pkg]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPackage(key)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPackage === key
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                      }`}
                      data-testid={`package-${key}`}
                    >
                      <div className="text-lg font-bold text-white">${pkg.amount.toFixed(0)}</div>
                      <div className="text-xs text-slate-400">{pkg.tokens} tokens</div>
                    </button>
                  ))}
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handlePurchaseTokens('stripe')}
                    disabled={isPurchasing || isCheckingPayment || !selectedPackage}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    data-testid="purchase-tokens-stripe-btn"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting to Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {selectedPackage && tokenPackages[selectedPackage] 
                          ? `Pay with Card - $${tokenPackages[selectedPackage].amount.toFixed(2)}`
                          : 'Select a Package'
                        }
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handlePurchaseTokens('woocommerce')}
                    disabled={isPurchasing || isCheckingPayment || !selectedPackage}
                    variant="outline"
                    className="w-full border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white"
                    data-testid="purchase-tokens-woo-btn"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay via F&F Store
                  </Button>
                </div>
                
                <p className="text-xs text-slate-500 text-center">
                  Secure checkout. Tokens are used to tip DJs and send drinks to friends at F&F locations.
                </p>
              </CardContent>
            </Card>

            {/* Token History */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Token History</CardTitle>
              </CardHeader>
              <CardContent>
                {tokenHistory.length > 0 ? (
                  <div className="space-y-2">
                    {tokenHistory.map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {tx.payment_method === 'gift' ? (
                            <Gift className="w-5 h-5 text-pink-400" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-green-400" />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {tx.payment_method === 'gift' ? 'Gift from Admin' : 'Purchase'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">+{tx.tokens_purchased}</p>
                          {tx.payment_method !== 'gift' && (
                            <p className="text-xs text-slate-400">${tx.amount_usd}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No token history yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tip Staff Tab */}
          <TabsContent value="tip" className="space-y-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-400" />
                  Tip Our Amazing Staff
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Show appreciation to our bartenders, servers, and DJs with a token tip!
                </p>
                
                {/* Staff List */}
                {staffList.length > 0 ? (
                  <div className="grid gap-3">
                    {staffList.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          selectedStaff?.id === staff.id
                            ? 'border-pink-500 bg-pink-500/20'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {staff.profile_photo_url ? (
                          <img 
                            src={staff.profile_photo_url.startsWith('http') ? staff.profile_photo_url : `${process.env.REACT_APP_BACKEND_URL}${staff.profile_photo_url}`}
                            alt={staff.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{staff.avatar_emoji || '😊'}</span>
                        )}
                        <div>
                          <p className="text-white font-medium">{staff.name}</p>
                          <p className="text-slate-400 text-sm">{staff.staff_title || 'Staff'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No staff members available for tipping</p>
                )}

                {/* Tip Form (when staff selected) */}
                {selectedStaff && (
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-pink-500/30">
                    <p className="text-white mb-3">Tip <span className="text-pink-400 font-bold">{selectedStaff.name}</span></p>
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[10, 20, 50, 100].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setTipAmount(amount)}
                          className={`p-2 rounded-lg border transition-all ${
                            tipAmount === amount
                              ? 'border-pink-500 bg-pink-500/20 text-white'
                              : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        type="number"
                        min="1"
                        value={tipAmount}
                        onChange={e => setTipAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="bg-slate-700 border-slate-600 text-white w-24"
                      />
                      <span className="text-slate-400">tokens (${(tipAmount / 10).toFixed(2)})</span>
                    </div>
                    
                    <Input
                      value={tipMessage}
                      onChange={e => setTipMessage(e.target.value)}
                      placeholder="Add a message (optional)"
                      className="bg-slate-700 border-slate-600 text-white mb-3"
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleTipStaff}
                        disabled={isTipping || (profile.token_balance || 0) < tipAmount}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                        data-testid="send-tip-btn"
                      >
                        {isTipping ? 'Sending...' : `Send ${tipAmount} Token Tip`}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStaff(null)}
                        className="border-slate-600 text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {(profile.token_balance || 0) < tipAmount && (
                      <p className="text-red-400 text-xs mt-2">Insufficient balance. You have {profile.token_balance || 0} tokens.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer History */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  Transfer History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transferHistory.length > 0 ? (
                  <div className="space-y-2">
                    {transferHistory.slice(0, 10).map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {tx.from_user_id === profile.id ? (
                            <Send className="w-5 h-5 text-red-400" />
                          ) : (
                            <Gift className="w-5 h-5 text-green-400" />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {tx.from_user_id === profile.id ? 'Sent' : 'Received'} ({tx.transfer_type})
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.from_user_id === profile.id ? 'text-red-400' : 'text-green-400'}`}>
                            {tx.from_user_id === profile.id ? '-' : '+'}{tx.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No transfers yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Earnings Tab (only for staff role) */}
          {profile.role === 'staff' && (
            <TabsContent value="earnings" className="space-y-4">
              {/* Earnings Summary */}
              <Card className="bg-gradient-to-r from-green-900/50 to-green-800/30 border-green-600/30">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-green-200 text-sm mb-1">Available to Cash Out</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-green-400" />
                        <span className="text-4xl font-bold text-white">{(profile.cashout_balance || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-green-200 text-sm mb-1">Total Lifetime Earnings</p>
                      <div className="flex items-center gap-2">
                        <Award className="w-8 h-8 text-green-400" />
                        <span className="text-4xl font-bold text-white">${(profile.total_earnings || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Out */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Cash Out Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-sm">
                      <span className="text-green-400 font-bold">80% payout rate</span> • Minimum $20 to cash out
                    </p>
                  </div>
                  
                  {(profile.cashout_balance || 0) >= 20 ? (
                    <>
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">Amount to Cash Out</label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">$</span>
                          <Input
                            type="number"
                            min="20"
                            max={profile.cashout_balance || 0}
                            value={cashoutAmount || (profile.cashout_balance || 0)}
                            onChange={e => setCashoutAmount(Math.min(profile.cashout_balance || 0, Math.max(20, parseFloat(e.target.value) || 20)))}
                            className="bg-slate-800 border-slate-600 text-white w-32"
                          />
                          <span className="text-slate-400">
                            = ${((cashoutAmount || profile.cashout_balance || 0) * 0.8).toFixed(2)} payout
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['venmo', 'cashapp', 'bank'].map(method => (
                            <button
                              key={method}
                              onClick={() => setCashoutMethod(method)}
                              className={`p-2 rounded-lg border capitalize transition-all ${
                                cashoutMethod === method
                                  ? 'border-green-500 bg-green-500/20 text-white'
                                  : 'border-slate-600 bg-slate-800 text-slate-300'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-slate-400 block mb-2">
                          {cashoutMethod === 'venmo' ? 'Venmo Username' : 
                           cashoutMethod === 'cashapp' ? 'Cash App $Cashtag' : 
                           'Bank Account Details'}
                        </label>
                        <Input
                          value={cashoutDetails}
                          onChange={e => setCashoutDetails(e.target.value)}
                          placeholder={cashoutMethod === 'venmo' ? '@username' : 
                                       cashoutMethod === 'cashapp' ? '$cashtag' : 
                                       'Account number'}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                      
                      <Button
                        onClick={handleRequestCashout}
                        disabled={isRequestingCashout || !cashoutDetails}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="request-cashout-btn"
                      >
                        {isRequestingCashout ? 'Processing...' : `Request Cashout ($${((cashoutAmount || profile.cashout_balance || 0) * 0.8).toFixed(2)})`}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-400">You need at least $20 to cash out.</p>
                      <p className="text-slate-500 text-sm">Current balance: ${(profile.cashout_balance || 0).toFixed(2)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transfer to Personal Account */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5" />
                    Transfer to Personal Token Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    Convert your tip earnings to tokens you can use at F&F locations.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <Input
                      type="number"
                      min="1"
                      max={profile.cashout_balance || 0}
                      value={transferToPersonalAmount}
                      onChange={e => setTransferToPersonalAmount(Math.min(profile.cashout_balance || 0, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="bg-slate-800 border-slate-600 text-white w-24"
                    />
                    <span className="text-slate-400">= {Math.floor(transferToPersonalAmount * 10)} tokens</span>
                  </div>
                  
                  <Button
                    onClick={handleTransferToPersonal}
                    disabled={transferToPersonalAmount < 1 || transferToPersonalAmount > (profile.cashout_balance || 0)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    data-testid="transfer-personal-btn"
                  >
                    Transfer {Math.floor(transferToPersonalAmount * 10)} Tokens
                  </Button>
                </CardContent>
              </Card>

              {/* Cashout History */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Cashout History</CardTitle>
                </CardHeader>
                <CardContent>
                  {cashoutHistory.length > 0 ? (
                    <div className="space-y-2">
                      {cashoutHistory.map((co, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                          <div>
                            <p className="text-white font-medium">${co.amount_usd.toFixed(2)} via {co.payment_method}</p>
                            <p className="text-xs text-slate-400">{new Date(co.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            co.status === 'paid' ? 'bg-green-600 text-white' :
                            co.status === 'approved' ? 'bg-blue-600 text-white' :
                            co.status === 'rejected' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {co.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No cashout requests yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            {/* Upload Photo */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Submit a Photo to Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors">
                    {uploadingPhoto ? (
                      <p className="text-slate-400">Uploading...</p>
                    ) : (
                      <>
                        <Camera className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-400">Click to upload a photo</p>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* My Submissions */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">My Gallery Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {submissions.map((sub, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={sub.image_url} 
                          alt={sub.caption || 'Gallery submission'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {sub.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg">
                            <p className="text-white text-xs truncate">{sub.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No photos submitted yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_visits || 0}</p>
                  <p className="text-xs text-slate-400">Visits</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_posts || 0}</p>
                  <p className="text-xs text-slate-400">Posts</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_photos || 0}</p>
                  <p className="text-xs text-slate-400">Photos</p>
                </CardContent>
              </Card>
            </div>

            {/* Visit History */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length > 0 ? (
                  <div className="space-y-2">
                    {visits.map((visit, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{visit.location_name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(visit.checked_in_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No visit history yet. Check in at a location!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAccountPage;
