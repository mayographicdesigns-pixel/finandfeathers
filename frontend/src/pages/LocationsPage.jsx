import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Calendar, ShoppingBag, Home } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { locations } from '../mockData';

const LocationsPage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [sortedLocations, setSortedLocations] = useState(locations);
  const [locationPermission, setLocationPermission] = useState('prompt');

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Get user's geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          
          // Sort locations by distance
          const sorted = [...locations].map(loc => ({
            ...loc,
            distance: calculateDistance(latitude, longitude, loc.coordinates.lat, loc.coordinates.lng)
          })).sort((a, b) => a.distance - b.distance);
          
          setSortedLocations(sorted);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocationPermission('denied');
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers Restaurants"
              className="h-32 md:h-40 w-auto"
            />
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Elevated dining meets Southern soul. Find a location near you.
          </p>
        </div>

        {/* Location Permission Notice */}
        {locationPermission === 'granted' && userLocation && (
          <div className="text-center mb-8">
            <p className="text-green-400 text-sm">
              📍 Locations sorted by distance from you
            </p>
          </div>
        )}
        
        {locationPermission === 'denied' && (
          <div className="text-center mb-8">
            <p className="text-slate-400 text-sm">
              Enable location services to see the nearest restaurant
            </p>
          </div>
        )}

        {/* Location Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {sortedLocations.map((location, index) => (
            <Card 
              key={location.id} 
              className="overflow-hidden bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
            >
              {/* Location Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {location.distance && index === 0 && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Nearest Location
                  </div>
                )}
                {location.distance && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {location.distance.toFixed(1)} miles away
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">{location.name}</h3>
                
                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">{location.address}</p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <a href={`tel:${location.phone}`} className="text-slate-300 text-sm hover:text-red-500 transition-colors">
                    {location.phone}
                  </a>
                </div>
                
                {/* Reservation Phone */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="text-slate-400 text-xs">
                    Reservations (Text): {location.reservationPhone}
                  </div>
                </div>

                {/* Hours */}
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <p className="text-slate-400 text-xs">{location.hours}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Menu
                  </Button>
                  
                  <Button
                    onClick={() => window.open(location.locationUrl, '_blank')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Order Online
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = location.reservations}
                    variant="outline"
                    className="w-full border-red-600 text-red-500 hover:bg-slate-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Make Reservation (Text)
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`, '_blank')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationsPage;
