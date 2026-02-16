import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Clock, Home, Calendar, ShoppingBag, Instagram, Facebook, Twitter, ExternalLink, Navigation, Users, LogIn, LogOut, Smile, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { locations } from '../mockData';
import { checkInAtLocation, getCheckedInUsers, checkOut } from '../services/api';
import { useToast } from '../hooks/use-toast';

const AVATAR_EMOJIS = ['😊', '😎', '🤩', '🥳', '😋', '🍗', '🦐', '🍹', '🔥', '💯', '🎉', '✨'];
const MOODS = ['Vibing', 'Hungry', 'Celebrating', 'Date Night', 'Girls Night', 'With Friends', 'Solo Dining', 'Business Dinner'];

const LocationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check-in state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [myCheckIn, setMyCheckIn] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedMood, setSelectedMood] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const location = useMemo(() => {
    return locations.find(loc => loc.slug === slug);
  }, [slug]);

  // Check for checkin parameter in URL (from QR code scan)
  useEffect(() => {
    const shouldCheckIn = searchParams.get('checkin');
    if (shouldCheckIn === 'true' && !myCheckIn) {
      setShowCheckInModal(true);
    }
  }, [searchParams, myCheckIn]);

  // Load checked-in users
  useEffect(() => {
    if (slug) {
      loadCheckedInUsers();
      // Check if user already checked in (from localStorage)
      const savedCheckIn = localStorage.getItem(`checkin_${slug}`);
      if (savedCheckIn) {
        setMyCheckIn(JSON.parse(savedCheckIn));
      }
    }
  }, [slug]);

  // Refresh checked-in users every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (slug) loadCheckedInUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  const loadCheckedInUsers = async () => {
    const users = await getCheckedInUsers(slug);
    setCheckedInUsers(users);
  };

  const handleCheckIn = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a display name to check in",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const checkInData = {
        location_slug: slug,
        display_name: displayName.trim(),
        avatar_emoji: selectedEmoji,
        mood: selectedMood || null,
        message: message.trim() || null
      };

      const result = await checkInAtLocation(checkInData);
      setMyCheckIn(result);
      localStorage.setItem(`checkin_${slug}`, JSON.stringify(result));
      setShowCheckInModal(false);
      await loadCheckedInUsers();

      toast({
        title: "You're checked in! 🎉",
        description: `Welcome to ${location?.name}! Others can now see you're here.`,
      });
    } catch (error) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!myCheckIn) return;

    try {
      await checkOut(myCheckIn.id);
      localStorage.removeItem(`checkin_${slug}`);
      setMyCheckIn(null);
      await loadCheckedInUsers();

      toast({
        title: "Checked out",
        description: "Thanks for visiting! See you next time.",
      });
    } catch (error) {
      // Even if API fails, clear local state
      localStorage.removeItem(`checkin_${slug}`);
      setMyCheckIn(null);
    }
  };

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
  const todaysSpecial = location.weeklySpecials?.find(s => s.day.toLowerCase() === currentDay);

  return (
    <div className="min-h-screen bg-black">
      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-red-600/50 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Check In</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCheckInModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-slate-300 mb-6">
                Join the vibe at <span className="text-red-500 font-semibold">{location.name}</span>! 
                Let others know you're here.
              </p>

              {/* Display Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                <Input
                  type="text"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={20}
                />
              </div>

              {/* Avatar Emoji */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Pick Your Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 text-2xl rounded-lg flex items-center justify-center transition-all ${
                        selectedEmoji === emoji 
                          ? 'bg-red-600 scale-110' 
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">What's Your Vibe?</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        selectedMood === mood 
                          ? 'bg-red-600 text-white' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Quick Message (optional)</label>
                <Input
                  type="text"
                  placeholder="What are you excited about?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
              >
                {isLoading ? 'Checking in...' : `Check In ${selectedEmoji}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
            className="max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
          <h1 className="text-3xl md:text-4xl font-bold text-white">{location.name}</h1>
          <p className="text-slate-400 mt-2">{location.address}</p>
        </div>

        {/* Who's Here Section - Social Environment */}
        <Card className="mb-6 bg-gradient-to-br from-red-900/30 to-slate-800/80 border-red-600/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                Who's Here Right Now
              </h2>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {checkedInUsers.length} {checkedInUsers.length === 1 ? 'person' : 'people'}
              </span>
            </div>

            {/* Check-in/out button */}
            {myCheckIn ? (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-600/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{myCheckIn.avatar_emoji}</span>
                  <div>
                    <p className="text-white font-semibold">You're checked in!</p>
                    <p className="text-slate-400 text-sm">Others can see you're here</p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckOut}
                  variant="outline"
                  size="sm"
                  className="border-red-600/50 text-red-500 hover:bg-red-900/30"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Check Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowCheckInModal(true)}
                className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Check In & Join the Vibe
              </Button>
            )}

            {/* Checked-in users grid */}
            {checkedInUsers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {checkedInUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      myCheckIn?.id === user.id 
                        ? 'bg-green-900/30 border border-green-600/30' 
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-3xl block mb-1">{user.avatar_emoji}</span>
                    <p className="text-white font-medium text-sm truncate">{user.display_name}</p>
                    {user.mood && (
                      <p className="text-red-400 text-xs mt-1">{user.mood}</p>
                    )}
                    {user.message && (
                      <p className="text-slate-400 text-xs mt-1 truncate">"{user.message}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Smile className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Be the first to check in!</p>
                <p className="text-slate-500 text-sm">Let others know you're enjoying the vibe</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Map & Directions */}
          <Card className="bg-slate-900/80 border-slate-700">
            <CardContent className="p-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title={`Map of ${location.name}`}
                />
              </div>
              <Button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`, '_blank')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-slate-400 text-sm">Main Line</p>
                      <a href={`tel:${location.phone}`} className="text-white hover:text-red-400">
                        {location.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-slate-400 text-sm">Reservations (Text)</p>
                      <a href={location.reservations} className="text-white hover:text-red-400">
                        {location.reservationPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-slate-400 text-sm">Address</p>
                      <p className="text-white">{location.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  Hours
                </h2>
                
                <div className="space-y-2">
                  {Object.entries(location.hours).map(([day, hours]) => (
                    <div 
                      key={day} 
                      className={`flex justify-between ${
                        day === currentDay ? 'text-red-500 font-semibold' : 'text-slate-300'
                      }`}
                    >
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Button
            onClick={() => navigate('/menu')}
            className="bg-red-600 hover:bg-red-700 h-12"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Menu
          </Button>
          
          <Button
            onClick={() => navigate(`/location/${slug}`)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Order Online
          </Button>
          
          <Button
            onClick={() => window.open(location.reservations, '_blank')}
            variant="outline"
            className="border-red-600/50 text-red-400 hover:bg-red-900/30 h-12"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Reservations
          </Button>
          
          <Button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`, '_blank')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
        </div>

        {/* Today's Special */}
        {todaysSpecial && (
          <Card className="mt-6 bg-gradient-to-r from-red-900/30 to-slate-800/50 border-red-600/30">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Today's Special</h2>
              <p className="text-red-400 text-lg">{todaysSpecial.special}</p>
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {location.socialMedia && (
          <div className="flex justify-center gap-4 mt-8">
            {location.socialMedia.instagram && (
              <Button
                onClick={() => window.open(location.socialMedia.instagram, '_blank')}
                variant="ghost"
                size="lg"
                className="text-pink-500 hover:text-pink-400 hover:bg-pink-900/20"
              >
                <Instagram className="w-6 h-6" />
              </Button>
            )}
            {location.socialMedia.facebook && (
              <Button
                onClick={() => window.open(location.socialMedia.facebook, '_blank')}
                variant="ghost"
                size="lg"
                className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
              >
                <Facebook className="w-6 h-6" />
              </Button>
            )}
            {location.socialMedia.twitter && (
              <Button
                onClick={() => window.open(location.socialMedia.twitter, '_blank')}
                variant="ghost"
                size="lg"
                className="text-sky-500 hover:text-sky-400 hover:bg-sky-900/20"
              >
                <Twitter className="w-6 h-6" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDetailPage;
