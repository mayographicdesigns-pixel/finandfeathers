import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Home, Calendar, ShoppingBag, Instagram, Facebook, Twitter, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { locations } from '../mockData';

const LocationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const location = useMemo(() => {
    return locations.find(loc => loc.slug === slug);
  }, [slug]);

  if (!location) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Location Not Found</h1>
          <Button onClick={() => navigate('/locations')} className="bg-red-600 hover:bg-red-700">
            View All Locations
          </Button>
        </div>
      </div>
    );
  }

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todaysSpecial = location.weeklySpecials.find(s => s.day.toLowerCase() === currentDay);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-slate-800/70 border-red-600/50 text-red-500 hover:bg-slate-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          
          <Button
            onClick={() => navigate('/locations')}
            variant="outline"
            className="bg-slate-800/70 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <MapPin className="w-4 h-4 mr-2" />
            All Locations
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers Restaurants"
            className="h-24 md:h-32 w-auto mx-auto cursor-pointer mb-4"
            onClick={() => navigate('/')}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{location.name}</h1>
          <p className="text-slate-300">{location.address}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Google Map */}
          <Card className="bg-slate-800/80 border-slate-700/50 overflow-hidden">
            <CardContent className="p-0">
              <iframe
                title={`Map to ${location.name}`}
                width="100%"
                height="400"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(location.address)}&zoom=15`}
                allowFullScreen
              ></iframe>
              <div className="p-4 bg-slate-900/50">
                <Button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`, '_blank')}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Hours */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="bg-slate-800/80 border-slate-700/50">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-white font-semibold text-sm">Main Line</p>
                      <a href={`tel:${location.phone}`} className="text-slate-300 text-sm hover:text-red-500">
                        {location.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-white font-semibold text-sm">Reservations (Text)</p>
                      <a href={location.reservations} className="text-slate-300 text-sm hover:text-red-500">
                        {location.reservationPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-white font-semibold text-sm">Address</p>
                      <p className="text-slate-300 text-sm">{location.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="bg-slate-800/80 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-red-500" />
                  <h2 className="text-2xl font-bold text-white">Hours</h2>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(location.hours).map(([day, hours]) => (
                    <div key={day} className={`flex justify-between ${day === currentDay ? 'text-red-500 font-semibold' : 'text-slate-300'}`}>
                      <span className="capitalize">{day}</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate('/menu')}
            className="bg-red-600 hover:bg-red-700 text-white h-14 text-lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            View Menu
          </Button>
          
          <Button
            onClick={() => window.open(location.onlineOrdering, '_blank')}
            className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white h-14 text-lg"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Order Online
          </Button>
          
          <Button
            onClick={() => window.location.href = location.reservations}
            className="bg-slate-800 hover:bg-slate-700 border-2 border-red-600 text-red-500 h-14 text-lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Make Reservation
          </Button>
        </div>

        {/* Today's Special Highlight */}
        {todaysSpecial && (
          <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-600/50 mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                🔥 Today's Special - {todaysSpecial.day}
              </h2>
              <p className="text-xl text-center text-slate-200 font-semibold mb-4">
                {todaysSpecial.special}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Weekly Specials */}
        <Card className="bg-slate-800/80 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Weekly Specials</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {location.weeklySpecials.map((special, index) => (
                <div
                  key={index}
                  className={`bg-slate-900/50 rounded-lg p-4 border ${
                    special.day.toLowerCase() === currentDay
                      ? 'border-red-500 shadow-lg shadow-red-500/20'
                      : 'border-slate-700'
                  }`}
                >
                  <h3 className={`font-bold mb-2 ${
                    special.day.toLowerCase() === currentDay ? 'text-red-500' : 'text-white'
                  }`}>
                    {special.day}
                  </h3>
                  <p className="text-slate-300 text-sm">{special.special}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="bg-slate-800/80 border-slate-700/50">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Follow Us</h2>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.open(location.socialMedia.instagram, '_blank')}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center"
              >
                <Instagram className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={() => window.open(location.socialMedia.facebook, '_blank')}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
              >
                <Facebook className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={() => window.open(location.socialMedia.twitter, '_blank')}
                className="w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 transition-all duration-300 flex items-center justify-center"
              >
                <Twitter className="w-6 h-6 text-white" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationDetailPage;
