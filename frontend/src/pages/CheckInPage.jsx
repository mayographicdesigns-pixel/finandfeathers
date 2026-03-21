import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Loader2, Navigation, AlertCircle, Mic, Music, DollarSign, CreditCard, ExternalLink, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { locations } from '../mockData';
import { getPageContent } from '../services/api';

const API_URL = window.location.origin;

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const CheckInPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('idle'); // idle, requesting, locating, found, error, too_far
  const [nearestLocation, setNearestLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageContent, setPageContent] = useState({});
  const [karaokeActive, setKaraokeActive] = useState(false);
  const [djPresent, setDjPresent] = useState(false);
  const [djInfo, setDjInfo] = useState(null);
  const [showSongForm, setShowSongForm] = useState(false);
  const [songName, setSongName] = useState('');
  const [singerName, setSingerName] = useState('');
  const [songSubmitted, setSongSubmitted] = useState(false);
  const [submittingSong, setSubmittingSong] = useState(false);
  const [showTipping, setShowTipping] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState(null);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [tipProcessing, setTipProcessing] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(searchParams.get('tip') === 'success');
  const heroHtml = pageContent.hero || 'Find the closest Fin & Feathers location to check in.';

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const content = await getPageContent('checkin');
      const map = {};
      (content || []).forEach((entry) => {
        map[entry.section_key] = entry.html || '';
      });
      setPageContent(map);
    } catch (error) {
      console.error('Failed to fetch page content', error);
    }
  };

  const checkKaraokeStatus = async (locationSlug) => {
    try {
      const res = await fetch(`${API_URL}/api/karaoke/status/${locationSlug}`);
      const data = await res.json();
      setKaraokeActive(data.active);
      if (!data.active) {
        // Check if DJ is present without karaoke
        const dRes = await fetch(`${API_URL}/api/dj/at-location/${locationSlug}`);
        const dData = await dRes.json();
        setDjPresent(dData && dData.checked_in);
        if (dData && dData.checked_in) {
          setDjInfo(dData);
        }
      } else {
        // Also fetch DJ info for tipping during karaoke
        const dRes = await fetch(`${API_URL}/api/dj/at-location/${locationSlug}`);
        const dData = await dRes.json();
        if (dData && dData.checked_in) {
          setDjInfo(dData);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSongSubmit = async (e) => {
    e.preventDefault();
    if (!songName.trim() || !singerName.trim() || !nearestLocation) return;
    setSubmittingSong(true);
    try {
      await fetch(`${API_URL}/api/social/song-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: nearestLocation.slug,
          request_type: karaokeActive ? 'karaoke' : 'song_request',
          name: singerName.trim(),
          song: songName.trim()
        })
      });
      setSongSubmitted(true);
      // Show tipping after song request (not karaoke signups)
      if (!karaokeActive && djInfo) {
        setShowTipping(true);
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingSong(false); }
  };

  const handleStripeTip = async (amount) => {
    if (!nearestLocation || !amount || amount < 1) return;
    setTipProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/dj/tip/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: nearestLocation.slug,
          amount: parseFloat(amount),
          tipper_name: singerName || 'Anonymous',
          origin_url: window.location.origin
        })
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (e) { console.error(e); }
    finally { setTipProcessing(false); }
  };

  const handleExternalTip = async (method) => {
    // Record that the user clicked an external payment link
    try {
      await fetch(`${API_URL}/api/dj/tip/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_slug: nearestLocation.slug,
          tipper_name: singerName || 'Anonymous',
          payment_method: method,
          amount: 0
        })
      });
    } catch (e) { console.error(e); }
  };

  const hasDjPaymentLinks = djInfo && (djInfo.cash_app_username || djInfo.venmo_username || djInfo.zelle_info);
  const tipAmounts = [3, 5, 10, 20];

  const requestLocationAndFindNearest = () => {
    setStatus('requesting');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('locating');
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Find nearest location
        let nearest = null;
        let minDistance = Infinity;

        locations.forEach((loc) => {
          if (loc.coordinates) {
            const dist = calculateDistance(
              userLat, userLon,
              loc.coordinates.lat, loc.coordinates.lng
            );
            if (dist < minDistance) {
              minDistance = dist;
              nearest = loc;
            }
          }
        });

        if (nearest) {
          setNearestLocation(nearest);
          setDistance(minDistance);
          checkKaraokeStatus(nearest.slug);

          // If within 0.5 miles (reasonable restaurant range), auto-redirect
          if (minDistance <= 0.5) {
            setStatus('found');
            // Redirect to location check-in after short delay
            setTimeout(() => {
              navigate(`/locations/${nearest.slug}?checkin=true`);
            }, 1500);
          } else {
            // Too far from any location
            setStatus('too_far');
          }
        } else {
          setStatus('error');
          setErrorMessage('Could not find any nearby locations');
        }
      },
      (error) => {
        setStatus('error');
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Location permission denied. Please enable location access to check in.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setErrorMessage('Location request timed out.');
            break;
          default:
            setErrorMessage('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Auto-request location on mount
  useEffect(() => {
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      requestLocationAndFindNearest();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-red-600/30 w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers Restaurants"
            className="max-h-24 w-auto mx-auto mb-6 object-contain"
          />

          {/* Idle State */}
          {status === 'idle' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-4">Welcome!</h1>
              <div
                className="text-slate-300 mb-6"
                data-testid="page-content-checkin-hero"
                dangerouslySetInnerHTML={{ __html: heroHtml }}
              />
              <Button
                onClick={requestLocationAndFindNearest}
                className="w-full bg-red-600 hover:bg-red-700 h-14 text-lg"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Find My Location
              </Button>
            </>
          )}

          {/* Requesting Permission */}
          {status === 'requesting' && (
            <>
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Allow Location Access</h1>
              <p className="text-slate-300 mb-4">
                Please allow location access to find your nearest Fin & Feathers restaurant.
              </p>
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            </>
          )}

          {/* Locating */}
          {status === 'locating' && (
            <>
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Navigation className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Finding Your Location...</h1>
              <p className="text-slate-300 mb-4">
                Looking for the nearest Fin & Feathers restaurant.
              </p>
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            </>
          )}

          {/* Found - Redirecting */}
          {status === 'found' && nearestLocation && (
            <>
              <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Found You!</h1>
              <p className="text-green-400 text-lg font-semibold mb-2">
                {nearestLocation.name}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                {distance < 0.1 ? 'You are here!' : `${distance.toFixed(2)} miles away`}
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Taking you to check in...</span>
              </div>
            </>
          )}

          {/* Too Far */}
          {status === 'too_far' && nearestLocation && (
            <>
              <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Not Quite There Yet!</h1>
              <p className="text-slate-300 mb-2">
                Your nearest location is:
              </p>
              <p className="text-red-400 text-lg font-semibold mb-1">
                {nearestLocation.name}
              </p>
              <p className="text-slate-400 text-sm mb-6">
                {distance.toFixed(1)} miles away
              </p>
              
              <div className="space-y-3">
                {karaokeActive && !showSongForm && !songSubmitted && (
                  <Button
                    onClick={() => setShowSongForm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 h-12 animate-pulse"
                    data-testid="karaoke-request-btn"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Karaoke Sign Up
                  </Button>
                )}
                {!karaokeActive && djPresent && !showSongForm && !songSubmitted && (
                  <Button
                    onClick={() => setShowSongForm(true)}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12"
                    data-testid="request-song-btn"
                  >
                    <Music className="w-5 h-5 mr-2" />
                    Request a Song
                  </Button>
                )}
                {(karaokeActive || djPresent) && showSongForm && !songSubmitted && (
                  <form onSubmit={handleSongSubmit} className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                    <Input
                      value={singerName}
                      onChange={e => setSingerName(e.target.value)}
                      placeholder="Your name"
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="karaoke-singer-name"
                    />
                    <Input
                      value={songName}
                      onChange={e => setSongName(e.target.value)}
                      placeholder="Song you want to sing"
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="karaoke-song-name"
                    />
                    <Button
                      type="submit"
                      disabled={!songName.trim() || !singerName.trim() || submittingSong}
                      className="w-full bg-red-600 hover:bg-red-700"
                      data-testid="karaoke-submit-btn"
                    >
                      {submittingSong ? 'Submitting...' : 'Add to Queue'}
                    </Button>
                  </form>
                )}
                {(karaokeActive || djPresent) && songSubmitted && !showTipping && (
                  <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 text-center">
                    <p className="text-green-400 font-medium">{karaokeActive ? "You're in the queue!" : "Song request sent!"}</p>
                    <p className="text-slate-400 text-xs mt-1">{karaokeActive ? 'Watch the board for your turn' : 'The DJ will get to your request'}</p>
                  </div>
                )}

                {/* Tipping Flow - shown after song request */}
                {showTipping && djInfo && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4" data-testid="tip-dj-section">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600/20 rounded-full mb-2">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-green-400 font-medium text-sm mb-1">Song request sent!</p>
                      <h3 className="text-white font-bold text-lg">Tip {djInfo.stage_name || djInfo.dj_name}?</h3>
                      <p className="text-slate-400 text-xs mt-1">Show your appreciation</p>
                    </div>

                    {/* Preset Stripe tip amounts */}
                    <div className="space-y-2">
                      <p className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Pay with Card
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {tipAmounts.map(amt => (
                          <Button
                            key={amt}
                            onClick={() => { setSelectedTipAmount(amt); setCustomTipAmount(''); }}
                            variant={selectedTipAmount === amt ? 'default' : 'outline'}
                            className={`h-11 text-base font-bold ${selectedTipAmount === amt ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white'}`}
                            data-testid={`tip-amount-${amt}`}
                          >
                            ${amt}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Custom $"
                          value={customTipAmount}
                          onChange={e => { setCustomTipAmount(e.target.value); setSelectedTipAmount(null); }}
                          className="bg-slate-800 border-slate-600 text-white flex-1"
                          data-testid="tip-custom-amount"
                        />
                        <Button
                          onClick={() => handleStripeTip(selectedTipAmount || customTipAmount)}
                          disabled={(!selectedTipAmount && !customTipAmount) || tipProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 font-bold"
                          data-testid="tip-pay-card-btn"
                        >
                          {tipProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tip'}
                        </Button>
                      </div>
                    </div>

                    {/* DJ's personal payment links */}
                    {hasDjPaymentLinks && (
                      <div className="space-y-2 pt-2 border-t border-slate-700">
                        <p className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Or tip directly
                        </p>
                        <div className="flex flex-col gap-2">
                          {djInfo.cash_app_username && (
                            <a
                              href={`https://cash.app/${djInfo.cash_app_username.replace('$', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleExternalTip('cashapp')}
                              className="flex items-center gap-3 bg-[#00D632]/10 border border-[#00D632]/30 rounded-lg px-4 py-3 hover:bg-[#00D632]/20 transition-colors"
                              data-testid="tip-cashapp-link"
                            >
                              <span className="text-[#00D632] font-bold text-lg">$</span>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">Cash App</p>
                                <p className="text-slate-400 text-xs">{djInfo.cash_app_username}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                          )}
                          {djInfo.venmo_username && (
                            <a
                              href={`https://venmo.com/${djInfo.venmo_username.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleExternalTip('venmo')}
                              className="flex items-center gap-3 bg-[#008CFF]/10 border border-[#008CFF]/30 rounded-lg px-4 py-3 hover:bg-[#008CFF]/20 transition-colors"
                              data-testid="tip-venmo-link"
                            >
                              <span className="text-[#008CFF] font-bold text-lg">V</span>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">Venmo</p>
                                <p className="text-slate-400 text-xs">{djInfo.venmo_username}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                          )}
                          {djInfo.zelle_info && (
                            <div
                              className="flex items-center gap-3 bg-[#6D1ED4]/10 border border-[#6D1ED4]/30 rounded-lg px-4 py-3"
                              data-testid="tip-zelle-info"
                            >
                              <span className="text-[#6D1ED4] font-bold text-lg">Z</span>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">Zelle</p>
                                <p className="text-slate-400 text-xs">{djInfo.zelle_info}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skip */}
                    <Button
                      onClick={() => setShowTipping(false)}
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-white text-sm"
                      data-testid="tip-skip-btn"
                    >
                      No thanks, maybe next time
                    </Button>
                  </div>
                )}

                {/* Tip success message */}
                {tipSuccess && (
                  <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 text-center" data-testid="tip-success-msg">
                    <p className="text-green-400 font-medium">Thank you for your tip!</p>
                    <p className="text-slate-400 text-xs mt-1">The DJ appreciates your generosity</p>
                  </div>
                )}
                <Button
                  onClick={() => navigate(`/locations/${nearestLocation.slug}?checkin=true`)}
                  className={`w-full ${karaokeActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} h-12`}
                >
                  Check In Anyway
                </Button>
                <Button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestLocation.address)}`, '_blank')}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-12"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button
                  onClick={() => navigate('/locations')}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                >
                  View All Locations
                </Button>
              </div>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Oops!</h1>
              <p className="text-slate-300 mb-6">
                {errorMessage}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={requestLocationAndFindNearest}
                  className="w-full bg-red-600 hover:bg-red-700 h-12"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/locations')}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-12"
                >
                  Choose Location Manually
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
