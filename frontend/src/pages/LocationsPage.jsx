import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Calendar, ShoppingBag, Home, Edit2, Save, X, Settings, LogOut, Plus, Trash2, Star, MessageSquare, Clock, Users, Music, Truck } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ImageUploader from '../components/ImageUploader';
import { getLocations, verifyAdminToken, adminUpdateLocation, adminCreateLocation, adminDeleteLocation, getPageContent, getDJSchedulesForLocation, getDJAtLocation } from '../services/api';
import { toast } from '../hooks/use-toast';

// Reservation Modal Component
const ReservationModal = ({ isOpen, onClose, location }) => {
  const [guestName, setGuestName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [occasion, setOccasion] = useState('Just Dining');
  const [availableTimes, setAvailableTimes] = useState([]);

  // Generate time slots based on day of week
  const generateTimeSlots = (selectedDate) => {
    if (!selectedDate) return [];
    
    const dateObj = new Date(selectedDate + 'T12:00:00'); // Add time to avoid timezone issues
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let startHour, endHour, startMinute = 0;
    
    // Operating hours based on day:
    // Mon-Thu (1-4): 11am-10pm, last seating 8pm (2hr before close)
    // Fri-Sat (5-6): 11am-11:30pm, last seating 9:30pm
    // Sun (0): 10am-10pm, last seating 8pm
    
    if (dayOfWeek === 0) { // Sunday
      startHour = 10; // 10am
      endHour = 20;   // Last seating 8pm (closes 10pm)
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Mon-Thu
      startHour = 11; // 11am
      endHour = 20;   // Last seating 8pm (closes 10pm)
    } else { // Fri-Sat
      startHour = 11;  // 11am
      endHour = 21;    // Last seating 9:30pm (closes 11:30pm)
    }
    
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      // Add :00 slot
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push({
        value: time24,
        label: `${hour12}:00 ${ampm}`
      });
      
      // Add :30 slot (except for last hour on Fri-Sat which goes to 9:30)
      if (hour < endHour || (dayOfWeek >= 5 && hour === 21)) {
        const time24Half = `${hour.toString().padStart(2, '0')}:30`;
        slots.push({
          value: time24Half,
          label: `${hour12}:30 ${ampm}`
        });
      }
    }
    
    return slots;
  };

  // Update available times when date changes
  React.useEffect(() => {
    if (date) {
      const slots = generateTimeSlots(date);
      setAvailableTimes(slots);
      // Reset time if previously selected time is no longer available
      if (time && !slots.find(s => s.value === time)) {
        setTime('');
      }
    } else {
      setAvailableTimes([]);
    }
  }, [date]);

  // Get day name for display
  const getDayInfo = () => {
    if (!date) return null;
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0) {
      return { day: 'Sunday', hours: '10AM - 10PM', lastSeating: '8:00 PM' };
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      return { day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'][dayOfWeek], hours: '11AM - 10PM', lastSeating: '8:00 PM' };
    } else {
      return { day: dayOfWeek === 5 ? 'Friday' : 'Saturday', hours: '11AM - 11:30PM', lastSeating: '9:30 PM' };
    }
  };

  const dayInfo = getDayInfo();

  if (!isOpen || !location) return null;

  // Extract location short name (remove "Fin & Feathers - " prefix)
  const locationShortName = location.name.replace('Fin & Feathers - ', '').toUpperCase();

  // Extract phone number from reservation_phone (remove formatting)
  const phoneNumber = location.reservation_phone?.replace(/[^0-9]/g, '') || '';

  const handleSendBooking = () => {
    if (!guestName.trim()) {
      toast({ title: 'Required', description: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (!date) {
      toast({ title: 'Required', description: 'Please select a date', variant: 'destructive' });
      return;
    }
    if (!time) {
      toast({ title: 'Required', description: 'Please select a time', variant: 'destructive' });
      return;
    }

    // Format the date for display
    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });

    // Format time for display
    const selectedTimeSlot = availableTimes.find(t => t.value === time);
    const formattedTime = selectedTimeSlot ? selectedTimeSlot.label : time;

    // Create the SMS body with reservation details
    const smsBody = `Hi! I'd like to make a reservation at Fin & Feathers ${locationShortName}.

Name: ${guestName}
Date: ${formattedDate}
Time: ${formattedTime}
Guests: ${guests}
Occasion: ${occasion}

Acknowledgement: I understand my reservation is for 2 hours, starting from my scheduled time or when the first guest arrives.

Please confirm availability. Thank you!`;

    // Encode the SMS body for URL
    const encodedBody = encodeURIComponent(smsBody);

    // Create SMS link - works on both iOS and Android
    const smsLink = `sms:${phoneNumber}?body=${encodedBody}`;

    // Open SMS app
    window.location.href = smsLink;

    // Close modal after sending
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-700 w-full max-w-md relative overflow-hidden rounded-3xl my-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
          data-testid="reservation-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        <CardContent className="p-6 pt-8">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">
              BOOK {locationShortName}
            </h2>
            <p className="text-slate-500 text-sm tracking-widest uppercase mt-1">
              Secure your table via SMS
            </p>
          </div>

          {/* 2-Hour Limit Notice - Red */}
          <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-3 mb-5">
            <p className="text-red-400 text-xs text-center font-medium">
              I understand that my reservation is for a maximum of 2 hours, starting from my scheduled time or when the first member of my party arrives.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Guest Name */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
                Guest Name
              </label>
              <Input
                type="text"
                placeholder="Who is dining?"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-xl text-base placeholder:text-slate-600"
                data-testid="reservation-guest-name"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-xl text-base [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert"
                data-testid="reservation-date"
              />
              {dayInfo && (
                <p className="text-slate-500 text-xs mt-1">
                  {dayInfo.day} hours: {dayInfo.hours}
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
                Time {dayInfo && <span className="text-slate-600 normal-case">(Last seating {dayInfo.lastSeating})</span>}
              </label>
              <Select value={time} onValueChange={setTime} disabled={!date}>
                <SelectTrigger 
                  className="bg-slate-800 border-slate-700 text-white h-14 rounded-xl text-base disabled:opacity-50"
                  data-testid="reservation-time"
                >
                  <SelectValue placeholder={date ? "Select a time" : "Select date first"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {availableTimes.map((slot) => (
                    <SelectItem 
                      key={slot.value} 
                      value={slot.value} 
                      className="text-white hover:bg-slate-700"
                    >
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guests and Occasion Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
                  Guests
                </label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger 
                    className="bg-slate-800 border-slate-700 text-white h-14 rounded-xl text-base"
                    data-testid="reservation-guests"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'].map((num) => (
                      <SelectItem 
                        key={num} 
                        value={String(num)} 
                        className="text-white hover:bg-slate-700"
                      >
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
                  Occasion
                </label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger 
                    className="bg-slate-800 border-slate-700 text-white h-14 rounded-xl text-base"
                    data-testid="reservation-occasion"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {['Just Dining', 'Birthday', 'Anniversary', 'Date Night', 'Business', 'Celebration', 'Other'].map((occ) => (
                      <SelectItem 
                        key={occ} 
                        value={occ} 
                        className="text-white hover:bg-slate-700"
                      >
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendBooking}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-14 rounded-xl text-base font-bold tracking-wide"
              data-testid="reservation-send-btn"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              SEND BOOKING REQUEST
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LocationsPage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [sortedLocations, setSortedLocations] = useState([]);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isLoading, setIsLoading] = useState(true);
  const [closestLocationId, setClosestLocationId] = useState(null);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const locationRefs = useRef({});
  const [searchParams] = useSearchParams();
  const isOrderFlow = searchParams.get('order') === '1';
  const [pageContent, setPageContent] = useState({});
  const heroHtml = pageContent.hero || 'ELEVATED DINING MEETS SOUTHERN SOUL. EVERY DISH CRAFTED WITH FRESH INGREDIENTS AND GENUINE HOSPITALITY.';
  
  // Reservation modal state
  const [reservationLocation, setReservationLocation] = useState(null);
  
  // Admin editing state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    image: '',
    hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
    coordinates: { lat: 0, lng: 0 },
    reservation_phone: '',
    online_ordering: '',
    reservations: ''
  });

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

  // Fetch locations from API
  useEffect(() => {
    // Check if admin is logged in
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
    
    fetchLocations();
    requestUserLocation();
    fetchPageContent();
  }, []);

  // Request user's location for sorting
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Location permission denied:', error);
          setLocationPermission('denied');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Sort locations by distance when locations or user location changes
  useEffect(() => {
    if (locations.length === 0) {
      setSortedLocations([]);
      setClosestLocationId(null);
      return;
    }

    if (userLocation) {
      const locationsWithDistance = locations.map(loc => {
        const coords = loc.coordinates || { lat: 0, lng: 0 };
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
        return { ...loc, distance };
      });

      locationsWithDistance.sort((a, b) => a.distance - b.distance);
      setSortedLocations(locationsWithDistance);
      setClosestLocationId(locationsWithDistance[0]?.id || null);
    } else {
      setSortedLocations(locations);
      setClosestLocationId(null);
    }
  }, [locations, userLocation]);

  useEffect(() => {
    if (isOrderFlow) {
      setHasAutoScrolled(false);
    }
  }, [isOrderFlow]);

  useEffect(() => {
    if (!isOrderFlow || !closestLocationId || hasAutoScrolled) return;
    const target = locationRefs.current[closestLocationId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasAutoScrolled(true);
    }
  }, [isOrderFlow, closestLocationId, hasAutoScrolled]);

  const fetchLocations = async () => {
    setIsLoading(true);
    const fetchedLocations = await getLocations();
    setLocations(fetchedLocations || []);
    setIsLoading(false);
  };

  const fetchPageContent = async () => {
    try {
      const content = await getPageContent('locations');
      const map = {};
      (content || []).forEach((entry) => {
        map[entry.section_key] = entry.html || '';
      });
      setPageContent(map);
    } catch (error) {
      console.error('Failed to fetch page content', error);
    }
  };

  // Admin functions
  const handleEditLocation = (location) => {
    setEditingLocation({ ...location });
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;
    try {
      await adminUpdateLocation(editingLocation.id, editingLocation);
      await fetchLocations();
      setEditingLocation(null);
      toast({ title: 'Success', description: 'Location updated!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      toast({ title: 'Error', description: 'Name and address are required', variant: 'destructive' });
      return;
    }
    try {
      // Generate slug from name
      const slug = newLocation.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await adminCreateLocation({
        ...newLocation,
        slug
      });
      await fetchLocations();
      setShowAddModal(false);
      setNewLocation({
        name: '',
        slug: '',
        address: '',
        phone: '',
        image: '',
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
        coordinates: { lat: 0, lng: 0 },
        reservation_phone: '',
        online_ordering: '',
        reservations: ''
      });
      toast({ title: 'Success', description: 'Location added!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await adminDeleteLocation(locationId);
      await fetchLocations();
      setEditingLocation(null);
      toast({ title: 'Deleted', description: 'Location removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setEditMode(false);
    toast({ title: 'Logged Out', description: 'Admin session ended' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Reservation Modal */}
      <ReservationModal
        isOpen={!!reservationLocation}
        onClose={() => setReservationLocation(null)}
        location={reservationLocation}
      />

      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode - Location Editor</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 h-8"
                  data-testid="add-location-btn"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Location
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditMode(false)}
                  className="border-white text-white hover:bg-white/20 h-8"
                >
                  Done Editing
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setEditMode(true)}
                className="bg-white text-red-600 hover:bg-gray-100 h-8"
                data-testid="edit-locations-btn"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Locations
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => navigate('/admin')}
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

      {/* Edit Location Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="bg-slate-900 border-red-600/50 w-full max-w-lg my-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Edit Location</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditingLocation(null)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Name</label>
                  <Input
                    value={editingLocation.name}
                    onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Address</label>
                  <Input
                    value={editingLocation.address}
                    onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Phone</label>
                    <Input
                      value={editingLocation.phone}
                      onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Reservation Phone</label>
                    <Input
                      value={editingLocation.reservation_phone || ''}
                      onChange={(e) => setEditingLocation({ ...editingLocation, reservation_phone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Image</label>
                  <ImageUploader 
                    currentImage={editingLocation.image}
                    onImageUpload={(url) => setEditingLocation({ ...editingLocation, image: url })}
                  />
                  <div className="mt-2">
                    <label className="text-xs text-slate-400">Or enter URL directly:</label>
                    <Input
                      value={editingLocation.image || ''}
                      onChange={(e) => setEditingLocation({ ...editingLocation, image: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Online Ordering URL</label>
                  <Input
                    value={editingLocation.online_ordering || ''}
                    onChange={(e) => setEditingLocation({ ...editingLocation, online_ordering: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="location-online-ordering-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Review Link</label>
                  <Input
                    value={editingLocation.review_link || ''}
                    onChange={(e) => setEditingLocation({ ...editingLocation, review_link: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="location-review-link-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Directions Link</label>
                  <Input
                    value={editingLocation.directions_link || ''}
                    onChange={(e) => setEditingLocation({ ...editingLocation, directions_link: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="location-directions-link-input"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveLocation} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => handleDeleteLocation(editingLocation.id)} 
                    variant="outline" 
                    className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="bg-slate-900 border-green-600/50 w-full max-w-lg my-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add Location</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Name *</label>
                  <Input
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Fin & Feathers - New Location"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Address *</label>
                  <Input
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Phone</label>
                    <Input
                      value={newLocation.phone}
                      onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Reservation Phone</label>
                    <Input
                      value={newLocation.reservation_phone}
                      onChange={(e) => setNewLocation({ ...newLocation, reservation_phone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Image</label>
                  <ImageUploader 
                    currentImage={newLocation.image}
                    onImageUpload={(url) => setNewLocation({ ...newLocation, image: url })}
                  />
                  <div className="mt-2">
                    <label className="text-xs text-slate-400">Or enter URL directly:</label>
                    <Input
                      value={newLocation.image}
                      onChange={(e) => setNewLocation({ ...newLocation, image: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <Button onClick={handleAddLocation} className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className={`container mx-auto px-4 py-12 ${isAdmin ? 'pt-20' : ''}`}>
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers Restaurants"
              className="max-h-32 md:max-h-40 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
          <div
            className="text-slate-300 text-lg max-w-2xl mx-auto mb-6"
            data-testid="page-content-locations-hero"
            dangerouslySetInnerHTML={{ __html: heroHtml }}
          />
          
          {/* Home Button */}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-slate-800/70 border-red-600/50 text-red-500 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 transition-all duration-300 px-6 py-2.5 rounded-lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
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

        {isOrderFlow && (
          <div className="text-center mb-8" data-testid="order-flow-banner">
            <p className="text-amber-400 text-sm">
              Select a restaurant to order online. The closest location is highlighted for you.
            </p>
          </div>
        )}

        {/* Location Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {sortedLocations.map((location, index) => (
            <Card 
              key={location.id} 
              ref={(el) => {
                if (el) locationRefs.current[location.id] = el;
              }}
              className={`overflow-hidden bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group cursor-pointer ${editMode ? 'ring-2 ring-red-500/50 ring-dashed' : ''} ${closestLocationId === location.id && location.distance && isOrderFlow ? 'ring-2 ring-amber-500/60' : ''}`}
              onClick={() => editMode ? handleEditLocation(location) : navigate(`/locations/${location.slug}`)}
              data-testid={`location-card-${location.id}`}
            >
              {/* Location Image */}
              <div 
                className="relative h-48 overflow-hidden"
              >
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {editMode ? (
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Edit2 className="w-3 h-3" />
                    Click to Edit
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-semibold">View Location</span>
                  </div>
                )}
                {!editMode && location.distance && location.id === closestLocationId && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Nearest Location
                  </div>
                )}
                {!editMode && location.location_type === 'food-truck' && (
                  <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Food Truck
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
                
                {/* Reservation Phone - hide for food trucks */}
                {location.location_type !== 'food-truck' && location.reservation_phone && (
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="text-slate-400 text-xs">
                      Reservations (Text): {location.reservation_phone}
                    </div>
                  </div>
                )}

                {/* Hours - hide for food trucks */}
                {location.location_type !== 'food-truck' && (
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <p className="text-slate-400 text-xs">
                      {typeof location.hours === 'object' 
                        ? `Mon-Thu: ${location.hours.monday || 'Closed'} | Fri-Sat: ${location.hours.friday || 'Closed'} | Sun: ${location.hours.sunday || 'Closed'}`
                        : location.hours
                      }
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      // Food trucks go to their own menu on the info page
                      if (location.location_type === 'food-truck') {
                        navigate(`/locations/${location.slug}?tab=info`);
                      } else {
                        navigate('/menu');
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Menu
                  </Button>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); window.open(location.online_ordering, '_blank'); }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid={`order-online-${location.id}`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Order Online
                  </Button>
                  
                  {/* Make Reservation - hide for food trucks */}
                  {location.location_type !== 'food-truck' && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); setReservationLocation(location); }}
                      variant="outline"
                      className="w-full border-red-600 text-red-500 hover:bg-slate-700"
                      data-testid={`reservation-btn-${location.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Make Reservation
                    </Button>
                  )}
                  
                  {location.review_link && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); window.open(location.review_link, '_blank'); }}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid={`review-link-${location.id}`}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Leave a Review
                    </Button>
                  )}

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const directionsUrl = location.directions_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
                      window.open(directionsUrl, '_blank');
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid={`directions-link-${location.id}`}
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
