import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { locations } from '../mockData';
import { getPageContent } from '../services/api';

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
  const [status, setStatus] = useState('idle'); // idle, requesting, locating, found, error, too_far
  const [nearestLocation, setNearestLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageContent, setPageContent] = useState({});
  const heroHtml = pageContent.hero || 'Find the closest Fin \u0026 Feathers location to check in.';

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
              <p className="text-slate-300 mb-6">
                Let us find your nearest Fin & Feathers location to check you in.
              </p>
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
                <Button
                  onClick={() => navigate(`/locations/${nearestLocation.slug}?checkin=true`)}
                  className="w-full bg-red-600 hover:bg-red-700 h-12"
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
