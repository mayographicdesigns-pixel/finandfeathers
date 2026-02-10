import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Calendar, ShoppingBag, Truck } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { locations } from '../mockData';

const HomePage = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-wide">
            Fin & Feathers
          </h1>
          <p className="text-amber-500 text-xl font-semibold tracking-wider mb-4">RESTAURANTS</p>
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
                  <MapPin className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">{location.address}</p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <a href={`tel:${location.phone}`} className="text-slate-300 text-sm hover:text-amber-500 transition-colors">
                    {location.phone}
                  </a>
                </div>

                {/* Hours */}
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <p className="text-slate-400 text-xs">{location.hours}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Menu
                  </Button>
                  
                  <Button
                    onClick={() => window.open(location.onlineOrdering, '_blank')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Order Pickup
                  </Button>
                  
                  <Button
                    onClick={() => window.open(location.delivery, '_blank')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Order Delivery
                  </Button>
                  
                  <Button
                    onClick={() => window.open(location.reservations, '_blank')}
                    variant="outline"
                    className="w-full border-amber-600 text-amber-500 hover:bg-slate-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Make Reservation
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

export default HomePage;
