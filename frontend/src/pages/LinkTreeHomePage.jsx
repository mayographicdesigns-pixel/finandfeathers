import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, Phone, Mail, Instagram, Facebook, Twitter, Clock, X, Image as ImageIcon, Edit2, Save, LogOut, Settings, GripVertical, Navigation, User, Users, ShoppingBag, Calendar, Download, RefreshCw, Share, MoreVertical, Plus, Briefcase, Mic, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import DailyVideoCarousel from '../components/DailyVideoCarousel';
import { locations } from '../mockData';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  signupLoyalty, 
  subscribeToPush, 
  getPublicSocialLinks, 
  getPublicInstagramFeed, 
  getPublicSpecials,
  getHomepageContent,
  updateHomepageContent,
  verifyAdminToken,
  uploadImage,
  getPageContent,
  getPublicEvents
} from '../services/api';
import { safeHtml } from '../utils/sanitize';

const API_URL = window.location.origin;

// Welcome Popup Component
// Instagram embed component — loads the official IG embed.js and renders the profile widget
const InstagramEmbed = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/finandfeathers/?utm_source=ig_embed&utm_campaign=loading"
        data-instgrm-version="14"
        style={{
          background: '#FFF', border: 0, borderRadius: 3,
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: 1, maxWidth: 540, minWidth: 200, padding: 0, width: '99.375%'
        }}
      >
        <div style={{ padding: 16 }}>
          <a
            href="https://www.instagram.com/finandfeathers/?utm_source=ig_embed&utm_campaign=loading"
            style={{ background: '#FFFFFF', lineHeight: 0, padding: 0, textAlign: 'center', textDecoration: 'none', width: '100%' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', flexGrow: 0, height: 40, marginRight: 14, width: 40 }} />
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#F4F4F4', borderRadius: 4, flexGrow: 0, height: 14, marginBottom: 6, width: 100 }} />
                <div style={{ backgroundColor: '#F4F4F4', borderRadius: 4, flexGrow: 0, height: 14, width: 60 }} />
              </div>
            </div>
            <div style={{ padding: '19% 0' }} />
            <div style={{ display: 'block', height: 50, margin: '0 auto 12px', width: 50 }}>
              <svg width="50px" height="50px" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                    <g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631" /></g>
                  </g>
                </g>
              </svg>
            </div>
            <div style={{ paddingTop: 8 }}>
              <div style={{ color: '#3897f0', fontFamily: 'Arial,sans-serif', fontSize: 14, fontWeight: 550, lineHeight: '18px' }}>
                View this profile on Instagram
              </div>
            </div>
          </a>
        </div>
      </blockquote>
    </div>
  );
};

// Facebook Page Plugin embed — iframe with fallback link
const FacebookEmbed = () => {
  return (
    <div className="flex justify-center">
      <div style={{ maxWidth: 500, width: '100%' }}>
        <div className="rounded-lg overflow-hidden mb-3 bg-slate-900">
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffinandfeathersrestaurants&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&hide_cta=true&appId=&color_scheme=dark"
            width="100%"
            height="500"
            style={{ border: 'none', overflow: 'hidden', display: 'block' }}
            scrolling="no"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Fin & Feathers Facebook Feed"
          />
        </div>
        <Button
          onClick={() => window.open('https://www.facebook.com/finandfeathersrestaurants', '_blank')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="fb-visit-btn"
        >
          <Facebook className="w-4 h-4 mr-2" />
          Visit on Facebook
        </Button>
      </div>
    </div>
  );
};

const STAFF_POSITIONS = [
  { id: 'dj', label: 'DJ' },
  { id: 'bartender', label: 'Bartender' },
  { id: 'server', label: 'Server' },
  { id: 'manager', label: 'Manager' },
];

const WelcomePopup = ({ onClose, onSubmit }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'staff-position'
  const [userType, setUserType] = useState(null); // 'client' | 'staff'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [findingLocation, setFindingLocation] = useState(false);
  const [closestLocation, setClosestLocation] = useState(null);

  const isReturningUser = !!localStorage.getItem('ff_welcome_shown');
  const hasProfile = !!localStorage.getItem('ff_user_profile_id');

  // Save selected location and close popup — stay on homepage
  const selectLocation = (slug) => {
    sessionStorage.setItem('ff_welcome_shown_session', 'true');
    localStorage.setItem('ff_user_location', slug);
    onClose();
  };

  useEffect(() => {
    findClosestLocation();
  }, []);

  const findClosestLocation = () => {
    setFindingLocation(true);
    if (!navigator.geolocation) {
      // No geolocation support — don't default, let user pick
      setClosestLocation(null);
      setFindingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        let nearest = null;
        let minDistance = Infinity;
        locations.forEach(loc => {
          if (loc.coordinates) {
            const R = 3959;
            const dLat = (loc.coordinates.lat - userLat) * Math.PI / 180;
            const dLon = (loc.coordinates.lng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(loc.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            if (dist < minDistance) { minDistance = dist; nearest = loc; }
          }
        });
        setClosestLocation(nearest);
        setFindingLocation(false);
      },
      () => {
        // Geolocation denied — don't default, let user pick
        setClosestLocation(null);
        setFindingLocation(false);
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  };

  const finishSubmit = async (role, staffTitle) => {
    setIsSubmitting(true);
    try {
      const userInfo = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role: role,
        staff_title: staffTitle || null,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('ff_user_info', JSON.stringify(userInfo));
      sessionStorage.setItem('ff_welcome_shown_session', 'true');
      localStorage.setItem('ff_welcome_shown', 'true');
      if (onSubmit) await onSubmit(userInfo);

      if (role === 'dj') {
        navigate('/dj');
      } else {
        // Save location if detected, then close popup (stay on homepage)
        if (closestLocation) {
          localStorage.setItem('ff_user_location', closestLocation.slug);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSelect = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }
    setUserType('client');
    finishSubmit('customer', null);
  };

  const handleStaffSelect = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }
    setUserType('staff');
    setStep('staff-position');
  };

  const handlePositionSelect = (positionId) => {
    finishSubmit(positionId, positionId);
  };

  const handleClose = () => {
    sessionStorage.setItem('ff_welcome_shown_session', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-red-600/50 w-full max-w-md relative my-2 sm:my-0">
        <CardContent className="p-4 sm:p-6 pt-6 sm:pt-8">
          {/* Logo */}
          <div className="text-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
              alt="Fin & Feathers"
              className="max-h-14 sm:max-h-20 w-auto mx-auto mb-3"
              loading="eager"
              decoding="async"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Welcome to Fin & Feathers!
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Join the vibe and connect with others at your nearest location
            </p>
          </div>

          {/* Closest Location - Primary focus */}
          {closestLocation && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 mb-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-medium mb-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>You're near</span>
              </div>
              <p className="text-white font-bold text-lg mb-0.5">{closestLocation.name.replace('Fin & Feathers - ', '')}</p>
              <p className="text-slate-400 text-xs">{closestLocation.address}</p>
            </div>
          )}

          {findingLocation && (
            <div className="text-center text-slate-400 text-xs mb-3">
              <span className="animate-pulse">Finding your nearest location...</span>
            </div>
          )}

          {/* Returning user — simplified quick-action view */}
          {isReturningUser && step === 'form' && (
            <>
              {closestLocation ? (
                <>
                  {/* Geolocation detected — show nearest + select button */}
                  <Button
                    onClick={() => selectLocation(closestLocation.slug)}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-semibold transition-all hover:scale-[1.02] mb-3"
                    data-testid="welcome-select-location-btn"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Select {closestLocation.name.replace('Fin & Feathers - ', '')}
                  </Button>

                  {/* Other locations */}
                  <div className="mb-3">
                    <p className="text-slate-500 text-xs text-center mb-2">Or choose another location</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {locations.filter(l => l.slug !== closestLocation.slug).map(loc => (
                        <button
                          key={loc.slug}
                          onClick={() => selectLocation(loc.slug)}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-red-600/40 transition-all text-left"
                          data-testid={`welcome-location-${loc.slug}`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{loc.name.replace('Fin & Feathers - ', '')}</p>
                            <p className="text-slate-500 text-xs truncate">{loc.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : !findingLocation ? (
                <>
                  {/* Geolocation denied/off — show full location list */}
                  <div className="text-center mb-3">
                    <MapPin className="w-6 h-6 text-red-400 mx-auto mb-1" />
                    <p className="text-white text-sm font-semibold">Find Your Location</p>
                    <p className="text-slate-400 text-xs">Select the location you're visiting</p>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto mb-3">
                    {locations.map(loc => (
                      <button
                        key={loc.slug}
                        onClick={() => selectLocation(loc.slug)}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-red-600/40 transition-all text-left"
                        data-testid={`welcome-location-${loc.slug}`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{loc.name.replace('Fin & Feathers - ', '')}</p>
                          <p className="text-slate-500 text-xs truncate">{loc.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full text-slate-500 hover:text-white text-sm"
                data-testid="welcome-close-btn"
              >
                <X className="w-4 h-4 mr-1" /> Close
              </Button>
            </>
          )}

          {/* New user — Step 1: Login prompt + Guest option */}
          {!isReturningUser && step === 'form' && (
            <>
              {/* Primary: Log In / Sign Up */}
              <Button
                onClick={() => {
                  sessionStorage.setItem('ff_welcome_shown_session', 'true');
                  if (closestLocation) localStorage.setItem('ff_user_location', closestLocation.slug);
                  navigate('/account');
                }}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-semibold transition-all hover:scale-[1.02] mb-3"
                data-testid="welcome-login-btn"
              >
                Log In / Sign Up
              </Button>

              {/* Location selection */}
              <div className="mb-3">
                {closestLocation ? (
                  <p className="text-slate-500 text-xs text-center mb-2">Or choose another location</p>
                ) : !findingLocation ? (
                  <div className="text-center mb-2">
                    <MapPin className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <p className="text-slate-400 text-xs">Select your location</p>
                  </div>
                ) : null}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(closestLocation ? locations.filter(l => l.slug !== closestLocation.slug) : locations).map(loc => (
                    <button
                      key={loc.slug}
                      onClick={() => selectLocation(loc.slug)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-red-600/40 transition-all text-left"
                      data-testid={`welcome-newuser-location-${loc.slug}`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{loc.name.replace('Fin & Feathers - ', '')}</p>
                        <p className="text-slate-500 text-xs truncate">{loc.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary: Continue as Guest */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/50" /></div>
                <div className="relative flex justify-center"><span className="bg-slate-900 px-3 text-slate-500 text-xs">or continue as guest</span></div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                    data-testid="welcome-name-input"
                  />
                </div>
              </div>

              <label className="block text-xs font-medium text-slate-300 mb-2">I am a...</label>
              <div className="flex gap-3">
                <Button
                  onClick={handleClientSelect}
                  disabled={isSubmitting}
                  className="flex-1 h-20 flex-col gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                  data-testid="welcome-client-btn"
                >
                  <Users className="w-6 h-6" />
                  Client
                </Button>
                <Button
                  onClick={handleStaffSelect}
                  disabled={isSubmitting}
                  className="flex-1 h-20 flex-col gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                  data-testid="welcome-staff-btn"
                >
                  <Briefcase className="w-6 h-6" />
                  Staff
                </Button>
              </div>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="mt-4 w-full text-slate-500 hover:text-white text-sm"
                data-testid="welcome-skip-btn"
              >
                <X className="w-4 h-4 mr-1" /> Close
              </Button>
            </>
          )}

          {/* Step 2: Staff Position Picker */}
          {step === 'staff-position' && (
            <>
              <h3 className="text-lg font-bold text-white mb-1 text-center">What's your role?</h3>
              <p className="text-slate-400 text-xs mb-4 text-center">Select your position</p>
              <div className="grid grid-cols-2 gap-3">
                {STAFF_POSITIONS.map(pos => (
                  <Button
                    key={pos.id}
                    onClick={() => handlePositionSelect(pos.id)}
                    disabled={isSubmitting}
                    className="h-20 flex-col gap-1.5 bg-slate-800 hover:bg-red-600/80 text-white border border-slate-700 hover:border-red-500 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                    data-testid={`welcome-position-${pos.id}`}
                  >
                    <Briefcase className="w-5 h-5" />
                    {pos.label}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setStep('form')}
                variant="ghost"
                className="mt-4 w-full text-slate-500 hover:text-white text-sm"
                data-testid="welcome-back-btn"
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

// Install App Modal Component - Shows platform-specific instructions
const InstallAppModal = ({ isOpen, onClose, isIOS, isAndroid }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-red-600/50 w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
          data-testid="install-modal-close-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <CardContent className="p-6 pt-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Download className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              INSTALL FIN & FEATHERS
            </h2>
            <p className="text-slate-400 text-sm">
              Add our app to your home screen for quick access
            </p>
          </div>

          {/* Platform-specific instructions */}
          {isIOS ? (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Safari</span>
                  Installation Steps
                </h3>
                <ol className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Tap the <Share className="w-4 h-4 inline mx-1 text-blue-400" /> Share button at the bottom of Safari</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong className="text-white">"Add"</strong> in the top right corner</span>
                  </li>
                </ol>
              </div>
              <p className="text-slate-500 text-xs text-center">
                The app will appear on your home screen like a native app
              </p>
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Chrome</span>
                  Installation Steps
                </h3>
                <ol className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Tap the <MoreVertical className="w-4 h-4 inline mx-1 text-slate-400" /> menu button (3 dots) in Chrome</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Tap <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong className="text-white">"Install"</strong> to confirm</span>
                  </li>
                </ol>
              </div>
              <p className="text-slate-500 text-xs text-center">
                The app will be added to your home screen and app drawer
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Installation Steps</h3>
                <ol className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Look for the install icon <Plus className="w-4 h-4 inline mx-1 text-slate-400" /> in the address bar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Or use browser menu → <strong className="text-white">"Install Fin & Feathers"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Click <strong className="text-white">"Install"</strong> to add to your device</span>
                  </li>
                </ol>
              </div>
              <p className="text-slate-500 text-xs text-center">
                Works best in Chrome, Edge, or Safari browsers
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
            data-testid="install-modal-got-it-btn"
          >
            Got It!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Default content
const defaultContent = {
  tagline: "ELEVATED DINING MEETS SOUTHERN SOUL. EVERY DISH CRAFTED WITH FRESH INGREDIENTS AND GENUINE HOSPITALITY",
  logo_url: "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
  contact_phone: "(404) 855-5524",
  contact_email: "info@finandfeathersrestaurants.com",
  contact_address: "Multiple Locations across Georgia & Las Vegas",
  social_feed_images: [
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg', caption: 'F&F Signature Wings' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg', caption: 'Shrimp & Grits' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg', caption: 'Malibu Ribeye' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg', caption: 'Chicken & Waffle' },
  ]
};

// Sortable Image Component for drag-and-drop reordering
const SortableImage = ({ image, index, editMode, editingImageIndex, setEditingImageIndex, setLightboxImage, editingContent, setEditingContent, fileInputRef, handleImageUpload }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
    >
      {/* Drag Handle - only in edit mode */}
      {editMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-1 left-1 z-10 bg-black/70 rounded p-1 cursor-grab active:cursor-grabbing hover:bg-black/90 transition-colors"
          data-testid={`drag-handle-image-${index}`}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
      
      <button
        onClick={() => editMode ? setEditingImageIndex(index) : setLightboxImage(image)}
        className={`aspect-square rounded-lg overflow-hidden cursor-pointer block w-full ${editMode ? 'ring-2 ring-red-500 ring-dashed' : ''}`}
        data-testid={`social-feed-image-${index}`}
      >
        <img 
          src={image.url}
          alt={image.caption || `Feed image ${index + 1}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        {editMode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-6 h-6 text-white" />
          </div>
        )}
      </button>
      
      {/* Edit Modal for Image */}
      {editMode && editingImageIndex === index && (
        <div className="absolute top-full left-0 mt-2 z-20 bg-slate-800 border border-slate-600 rounded-lg p-3 w-64 shadow-xl">
          <Input
            placeholder="Image URL"
            value={editingContent.social_feed_images[index]?.url || ''}
            onChange={(e) => {
              const newImages = [...editingContent.social_feed_images];
              newImages[index] = { ...newImages[index], url: e.target.value };
              setEditingContent({ ...editingContent, social_feed_images: newImages });
            }}
            className="bg-slate-900 border-slate-700 text-white text-sm mb-2"
          />
          <Input
            placeholder="Caption"
            value={editingContent.social_feed_images[index]?.caption || ''}
            onChange={(e) => {
              const newImages = [...editingContent.social_feed_images];
              newImages[index] = { ...newImages[index], caption: e.target.value };
              setEditingContent({ ...editingContent, social_feed_images: newImages });
            }}
            className="bg-slate-900 border-slate-700 text-white text-sm mb-2"
          />
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageUpload(e, index)}
              accept="image/*"
              className="hidden"
            />
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-xs"
            >
              Upload
            </Button>
            <Button 
              size="sm" 
              onClick={() => setEditingImageIndex(null)}
              className="bg-red-600 hover:bg-red-700 text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const LinkTreeHomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);
  const [instagramFeed, setInstagramFeed] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [socialFeedTab, setSocialFeedTab] = useState('facebook');
  const [showFeedExpanded, setShowFeedExpanded] = useState(false);
  
  // Welcome popup state
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  
  // Admin editing state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(defaultContent);
  const [editingContent, setEditingContent] = useState(defaultContent);
  const [pageContent, setPageContent] = useState({});
  const [events, setEvents] = useState([]);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const fileInputRef = useRef(null);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // DnD sensors for image reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Karaoke & DJ state - check if any location has active karaoke or a DJ present
  const [karaokeLocation, setKaraokeLocation] = useState(null);
  const [djLocation, setDjLocation] = useState(null);
  const [liveStreamInfo, setLiveStreamInfo] = useState(null); // { location_slug, dj_name, viewer_count }

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // Check for active in-app streams first
        const streamRes = await fetch(`${API_URL}/api/stream/active`);
        const streams = await streamRes.json();
        if (streams.length > 0) {
          setLiveStreamInfo(streams[0]);
        }

        const res = await fetch(`${API_URL}/api/locations`);
        const locs = await res.json();
        for (const loc of locs) {
          // Check if DJ is live and streaming
          const dRes = await fetch(`${API_URL}/api/dj/next-session/${loc.slug}`);
          const dData = await dRes.json();
          if (dData.is_live && dData.live_stream_url) {
            setDjLocation(loc);
            // If it's not an in-app stream, still show as live
            if (!liveStreamInfo && !dData.live_stream_url.startsWith('in-app://')) {
              setLiveStreamInfo({ location_slug: loc.slug, dj_name: dData.dj_stage_name || dData.dj_name, viewer_count: 0 });
            }
          }
          // Check karaoke
          if (dData.karaoke_active) {
            setKaraokeLocation(loc);
          }
        }
      } catch (e) { console.error(e); }
    };
    checkLiveStatus();
    const poll = setInterval(checkLiveStatus, 15000);
    return () => clearInterval(poll);
  }, []);

  // Handle drag end for image reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id.replace('image-', ''));
    const newIndex = parseInt(over.id.replace('image-', ''));
    
    const newImages = arrayMove(editingContent.social_feed_images, oldIndex, newIndex);
    setEditingContent({ ...editingContent, social_feed_images: newImages });
    toast({ title: 'Reordered', description: 'Image order updated. Click "Save Changes" to persist.' });
  };

  // Check if welcome popup should be shown - uses sessionStorage to show once per browser session
  useEffect(() => {
    const hasSeenThisSession = sessionStorage.getItem('ff_welcome_shown_session');
    
    if (!hasSeenThisSession) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // PWA Install detection
  useEffect(() => {
    // Check if app is running in standalone mode (installed)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://');
      setIsAppInstalled(isStandalone);
    };
    
    checkInstalled();
    
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroidDevice = /android/i.test(userAgent);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsAppInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for successful install
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      toast({ title: 'App Installed!', description: 'Fin & Feathers has been added to your home screen.' });
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle PWA install / force update
  const handleInstallApp = async () => {
    if (isAppInstalled) {
      // Clear ALL caches, unregister service worker, and hard reload
      toast({ title: 'Updating App', description: 'Clearing cache and loading latest version...' });
      try {
        // 1. Delete all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        // 2. Unregister service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
        }
        // 3. Clear localStorage version so UpdatePrompt re-triggers
        localStorage.removeItem('ff_app_version');
        // 4. Hard reload (bypass browser cache)
        setTimeout(() => {
          window.location.href = window.location.origin + '/?cache_bust=' + Date.now();
        }, 500);
      } catch (error) {
        console.error('Update failed:', error);
        window.location.reload();
      }
      return;
    }
    
    // If we have the deferred prompt (Chrome/Android), use it directly
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }
    
    // Otherwise show installation instructions modal
    setShowInstallModal(true);
  };

  useEffect(() => {
    // Check if admin is logged in
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
    
    // Fetch all data
    const fetchData = async () => {
      try {
        const [links, feed, activeSpecials, homepageContent, homePageContent, eventsData] = await Promise.all([
          getPublicSocialLinks(),
          getPublicInstagramFeed(),
          getPublicSpecials(),
          getHomepageContent(),
          getPageContent('home'),
          getPublicEvents()
        ]);
        setSocialLinks(links);
        setInstagramFeed(feed);
        setSpecials(activeSpecials);
        setEvents(eventsData.filter(e => e.image && e.featured));

        const pageContentMap = {};
        (homePageContent || []).forEach((entry) => {
          pageContentMap[entry.section_key] = entry.html || '';
        });
        setPageContent(pageContentMap);
        
        // Set homepage content - merge with defaults to ensure all fields exist
        if (homepageContent) {
          const mergedContent = { ...defaultContent, ...homepageContent };
          // Ensure social_feed_images is always an array
          if (!mergedContent.social_feed_images || !Array.isArray(mergedContent.social_feed_images)) {
            mergedContent.social_feed_images = defaultContent.social_feed_images;
          }
          // Shuffle gallery images for variety on each page load
          const shuffled = [...mergedContent.social_feed_images];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          mergedContent.social_feed_images = shuffled;
          setContent(mergedContent);
          setEditingContent(mergedContent);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleLoyaltySignup = async (e) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast({
        title: "Required Fields",
        description: "Please enter your name and email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      await signupLoyalty({
        name: name,
        email: email,
        phone: phone || null,
        marketing_consent: agreeToMarketing
      });

      toast({
        title: "Welcome to Fin & Feathers!",
        description: "You've been added to our loyalty program."
      });

      // Clear form
      setEmail('');
      setName('');
      setPhone('');
      setAgreeToMarketing(false);

      // Redirect to Toast Tab rewards signup
      window.open('https://www.toasttab.com/fins-feathers-douglasville-7430-douglas-blvd-zmrgr/rewardsSignup', '_blank');
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error.message || "Unable to complete signup. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Admin functions
  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await updateHomepageContent(editingContent);
      setContent(editingContent);
      setEditMode(false);
      toast({ title: 'Success', description: 'Homepage content saved!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContent(content);
    setEditMode(false);
    setEditingImageIndex(null);
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    try {
      const result = await uploadImage(file);
      const backendUrl = window.location.origin;
      const fullUrl = `${backendUrl}${result.url}`;
      
      const newImages = [...editingContent.social_feed_images];
      newImages[index] = { ...newImages[index], url: fullUrl };
      setEditingContent({ ...editingContent, social_feed_images: newImages });
      toast({ title: 'Success', description: 'Image uploaded!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingImageIndex(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setEditMode(false);
    toast({ title: 'Logged Out', description: 'Admin session ended' });
  };

  // Default social links if none configured
  const defaultSocialLinks = [
    { platform: 'instagram', url: 'https://instagram.com/finandfeathers', username: '@finandfeathers' },
    { platform: 'facebook', url: 'https://facebook.com/finandfeathersrestaurants', username: 'Fin & Feathers Restaurants' },
    { platform: 'twitter', url: 'https://twitter.com/finandfeathers', username: '@finandfeathers' }
  ];

  const displaySocialLinks = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;
  const displayContent = editMode ? editingContent : content;
  const heroHtml = pageContent.hero || displayContent.tagline;

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'tiktok': return () => <span className="text-lg">🎵</span>;
      default: return ExternalLink;
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4 relative" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/home-bg.jpg)',
      backgroundSize: '100% auto',
      backgroundPosition: 'top center',
      backgroundRepeat: 'repeat-y'
    }}>
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <WelcomePopup 
          onClose={() => setShowWelcomePopup(false)}
          onSubmit={async (userInfo) => {
            try {
              const res = await fetch(`${API_URL}/api/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userInfo)
              });
              const data = await res.json();
              if (data && data.id) {
                localStorage.setItem('ff_user_profile_id', data.id);
              }
            } catch (e) { console.error('Failed to save user profile:', e); }
          }}
        />
      )}

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
      />

      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleSaveContent}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 h-8"
                  data-testid="save-homepage-btn"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="border-white text-white hover:bg-white/20 h-8"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setEditMode(true)}
                className="bg-white text-red-600 hover:bg-gray-100 h-8"
                data-testid="edit-homepage-btn"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Page
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/20 h-8"
            >
              Dashboard
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleAdminLogout}
              className="text-white hover:bg-white/20 h-8"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <div className={`max-w-2xl mx-auto ${isAdmin ? 'pt-12' : ''}`}>
        {/* Logo/Header */}
        <div className="text-center mb-8 relative group">
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Editable</span>
            </div>
          )}
          <img 
            src={displayContent.logo_url}
            alt="Fin & Feathers Restaurants"
            className={`max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain ${editMode ? 'ring-2 ring-red-500 ring-dashed rounded-lg p-2' : ''}`}
          />
          {editMode ? (
            <Input
              value={editingContent.tagline}
              onChange={(e) => setEditingContent({ ...editingContent, tagline: e.target.value })}
              className="bg-slate-800 border-red-500 text-white text-center max-w-md mx-auto"
              data-testid="edit-tagline-input"
            />
          ) : (
            <div
              className="text-slate-300 text-sm"
              data-testid="page-content-home-hero"
              {...safeHtml(heroHtml)}
            />
          )}
          
          {/* House Rules */}
          <div className="mt-4 p-3 bg-red-900/30 border border-red-600/50 rounded-lg space-y-1.5">
            <p className="text-red-400 text-base text-center font-bold">House Rules</p>
            <p className="text-red-300/90 text-sm text-center">
              <span className="font-semibold">Age Requirement:</span> We are a 21+ establishment. Please ensure all guests have a valid government-issued ID ready upon arrival.
            </p>
            <p className="text-red-300/90 text-sm text-center">
              <span className="font-semibold">Service Policy:</span> To support our dedicated team, a 20% automatic gratuity is added to all checks.
            </p>
          </div>
        </div>

        {/* Weekly Specials Section */}
        <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-600/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white">This Week's Specials</h2>
            </div>
            <DailyVideoCarousel />
          </CardContent>
        </Card>

        {/* All buttons and sections — uniform spacing */}
        <div className="flex flex-col gap-3">
          {/* View Full Menu */}
          <Button
            onClick={() => navigate('/menu')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            View Full Menu
          </Button>

          {/* Order Online */}
          <Button
            onClick={() => navigate('/locations?order=1')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="order-online-btn"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order Online
          </Button>

          {/* Find a Location */}
          <Button
            onClick={() => navigate('/locations')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find a Location
          </Button>

          {/* Check In ! / My Account */}
          <Button
            onClick={() => {
              const profileId = localStorage.getItem('ff_user_profile_id');
              const userLocation = localStorage.getItem('ff_user_location');
              if (profileId && userLocation) {
                navigate(`/social/${userLocation}`);
              } else if (profileId) {
                navigate(`/social/${locations[0]?.slug || 'midtown'}`);
              } else {
                navigate('/account');
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="my-account-btn"
          >
            <User className="w-5 h-5 mr-2" />
            {localStorage.getItem('ff_user_profile_id') ? 'Check In !' : 'My Account'}
          </Button>

          {/* DJ IS LIVE STREAMING banner */}
          {liveStreamInfo && (
            <Button
              onClick={() => navigate(`/social/${liveStreamInfo.location_slug}`)}
              className="w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-700 hover:via-red-600 hover:to-orange-600 text-white h-16 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-red-600/30 relative overflow-hidden"
              data-testid="dj-live-streaming-btn"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }} />
              <span className="relative flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                DJ {liveStreamInfo.dj_name} is LIVE — Watch Now
              </span>
            </Button>
          )}

          {/* Karaoke/Song Request (when live) */}
          {karaokeLocation && (
            <Button
              onClick={() => navigate(`/locations/${karaokeLocation.slug}?checkin=true`)}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] animate-pulse"
              data-testid="karaoke-live-btn"
            >
              <Mic className="w-5 h-5 mr-2 shrink-0" />
              Karaoke Sign Up - Live at {karaokeLocation.name?.replace('Fin & Feathers - ', '')}!
            </Button>
          )}

          {!karaokeLocation && djLocation && (
            <Button
              onClick={() => navigate(`/locations/${djLocation.slug}?checkin=true`)}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
              data-testid="request-song-btn"
            >
              <Music className="w-5 h-5 mr-2 shrink-0" />
              Request a Song at {djLocation.name?.replace('Fin & Feathers - ', '')}
            </Button>
          )}

          {/* Featured Events Images Grid */}
          {events.length > 0 && (
            <div data-testid="featured-events-section">
              <p className="text-slate-400 text-xs text-center mb-2 uppercase tracking-wider font-semibold">Featured Events</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {events.slice(0, 4).map((event, index) => (
                  <div
                    key={event.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    data-testid={`event-image-${index}`}
                    onClick={() => setViewingEvent(event)}
                  >
                    <img
                      src={event.image.startsWith('/api/') ? `${window.location.origin}${event.image}` : event.image}
                      alt={event.name || event.title || 'Event'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                      <div>
                        <p className="text-white text-xs font-semibold leading-tight">{event.name || event.title}</p>
                        <p className="text-red-400 text-[10px]">{event.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events & Tickets */}
          <Button
            onClick={() => navigate('/events')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="events-btn"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Events & Tickets
          </Button>

          {/* Follow Us — Toggle */}
          {!showFeedExpanded ? (
            <Button
              onClick={() => setShowFeedExpanded(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
              data-testid="follow-us-btn"
            >
              <Instagram className="w-5 h-5 mr-2 shrink-0" />
              Follow Us
              <Facebook className="w-5 h-5 ml-2 shrink-0" />
            </Button>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700" data-testid="social-feed-section">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <h2 className="text-lg font-bold text-white">Follow Us</h2>
                    <Facebook className="w-5 h-5 text-blue-500" />
                  </div>
                  <button
                    onClick={() => setShowFeedExpanded(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                    data-testid="follow-us-collapse-btn"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSocialFeedTab('facebook')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                      socialFeedTab === 'facebook'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                    data-testid="social-feed-fb-tab"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                  <button
                    onClick={() => setSocialFeedTab('instagram')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                      socialFeedTab === 'instagram'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                    data-testid="social-feed-ig-tab"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </button>
                </div>
                {socialFeedTab === 'facebook' && (
                  <div className="rounded-lg overflow-hidden" data-testid="fb-feed-embed">
                    <FacebookEmbed />
                  </div>
                )}
                {socialFeedTab === 'instagram' && (
                  <div className="rounded-lg overflow-hidden" data-testid="ig-feed-embed">
                    <InstagramEmbed />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Leave a Review */}
          <Button
            onClick={() => {
              const savedSlug = localStorage.getItem('ff_user_location');
              const loc = locations.find(l => l.slug === savedSlug);
              const reviewUrl = loc?.googleReviewUrl || locations[0]?.googleReviewUrl || 'https://search.google.com/local/writereview?placeid=ChIJ26FE7bAD9YgRW0ewfP-8kXU';
              window.open(reviewUrl, '_blank');
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="leave-review-btn"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Leave a Review
          </Button>

          {/* Gallery Preview Grid */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">Gallery</h2>
                {editMode && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2">
                    Drag to reorder - Click to edit
                  </span>
                )}
              </div>
              {editMode ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayContent.social_feed_images.map((_, index) => `image-${index}`)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {displayContent.social_feed_images.map((image, index) => (
                        <SortableImage
                          key={`image-${index}`}
                          image={image}
                          index={index}
                          editMode={editMode}
                          editingImageIndex={editingImageIndex}
                          setEditingImageIndex={setEditingImageIndex}
                          setLightboxImage={setLightboxImage}
                          editingContent={editingContent}
                          setEditingContent={setEditingContent}
                          fileInputRef={fileInputRef}
                          handleImageUpload={handleImageUpload}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div 
                  className="grid grid-cols-4 gap-2 mb-4 cursor-pointer"
                  onClick={() => navigate('/gallery')}
                >
                  {displayContent.social_feed_images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="aspect-square rounded-lg overflow-hidden block w-full"
                        data-testid={`gallery-preview-image-${index}`}
                      >
                        <img 
                          src={image.url}
                          alt={image.caption || `Gallery image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => navigate('/gallery')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                data-testid="view-gallery-btn"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                View Full Gallery
              </Button>
            </CardContent>
          </Card>

          {/* F&F Merch */}
          <Button
            onClick={() => navigate('/merch')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="merch-btn"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            F&F Merch Shop
          </Button>
        </div>

        {/* Loyalty Signup Form */}
        <Card className="mt-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-red-600/30">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Join Our Loyalty Program</h2>
            <p className="text-slate-400 text-sm mb-4 text-center">Get exclusive offers and rewards!</p>
            
            <form onSubmit={handleLoyaltySignup} className="space-y-3">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
              <Input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              
              <label className="flex items-start gap-2 text-slate-400 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToMarketing}
                  onChange={(e) => setAgreeToMarketing(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  By checking this box, you agree to receive marketing communications from Fin & Feathers Restaurants via email, SMS, and push notifications
                </span>
              </label>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
              >
                Join Now
              </Button>
            </form>

            {/* Careers Button */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Button
                onClick={() => navigate('/careers')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white h-12 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
                data-testid="careers-btn"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                We're Hiring - Apply Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info - Editable */}
        <Card className="mt-3 bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3 text-center">Contact Us</h3>
            {editMode && <span className="block text-center text-xs bg-red-500 text-white px-2 py-1 rounded mb-3 mx-auto w-fit">Edit Contact Info</span>}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_phone}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_phone: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-phone-input"
                  />
                ) : (
                  <a href={`tel:${displayContent.contact_phone}`} className="hover:text-red-400">
                    {displayContent.contact_phone}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_email}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_email: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-email-input"
                  />
                ) : (
                  <a href={`mailto:${displayContent.contact_email}`} className="hover:text-red-400">
                    {displayContent.contact_email}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_address}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_address: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-address-input"
                  />
                ) : (
                  <span>{displayContent.contact_address}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install App Button */}
        <Card className="mt-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-red-600/30">
          <CardContent className="p-4">
            <Button
              onClick={handleInstallApp}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
              data-testid="install-app-btn"
            >
              {isAppInstalled ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Update App
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </>
              )}
            </Button>
            <p className="text-slate-400 text-xs text-center mt-2">
              {isAppInstalled 
                ? 'Clear cache & get the latest version' 
                : 'Add to your home screen for quick access'}
            </p>
          </CardContent>
        </Card>

        {/* Social Links Footer */}
        <div className="flex justify-center gap-4 mb-4">
          {displaySocialLinks.map((link, index) => {
            const Icon = getSocialIcon(link.platform);
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-300" />
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs">
          <p>&copy; 2024 Fin & Feathers Restaurants. All rights reserved.</p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && !editMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Gallery image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4 text-lg">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Event Image Popup */}
      {viewingEvent && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingEvent(null)}
          data-testid="event-image-popup"
        >
          <button
            onClick={() => setViewingEvent(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingEvent.image?.startsWith('/api/') ? `${window.location.origin}${viewingEvent.image}` : viewingEvent.image}
              alt={viewingEvent.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 rounded-b-lg">
              <h3 className="text-white text-xl font-bold">{viewingEvent.name}</h3>
              {viewingEvent.description && (
                <p className="text-slate-300 text-sm mt-1 line-clamp-3">{viewingEvent.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                {viewingEvent.date && <span>{viewingEvent.date}</span>}
                {viewingEvent.time && <span>{viewingEvent.time}</span>}
                {viewingEvent.location && <span>{viewingEvent.location}</span>}
              </div>
              <Button
                onClick={() => { setViewingEvent(null); navigate('/events'); }}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              >
                View Event Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkTreeHomePage;
