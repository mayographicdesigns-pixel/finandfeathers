import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Calendar, ShoppingBag, Home, Edit2, Save, X, Settings, LogOut, Plus, Trash2, ZoomIn } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import ImageUploader from '../components/ImageUploader';
import ImageLightbox from '../components/ImageLightbox';
import { getLocations, verifyAdminToken, adminUpdateLocation, adminCreateLocation, adminDeleteLocation } from '../services/api';
import { toast } from '../hooks/use-toast';

const LocationsPage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [sortedLocations, setSortedLocations] = useState([]);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Lightbox state
  const [lightboxLocation, setLightboxLocation] = useState(null);

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

  // Sort locations by distance when user location changes
  useEffect(() => {
    if (userLocation && sortedLocations.length > 0) {
      const locationsWithDistance = sortedLocations.map(loc => {
        const coords = loc.coordinates || { lat: 0, lng: 0 };
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          coords.lat, 
          coords.lng
        );
        return { ...loc, distance };
      });
      
      // Sort by distance (closest first)
      locationsWithDistance.sort((a, b) => a.distance - b.distance);
      setSortedLocations(locationsWithDistance);
    }
  }, [userLocation]);

  const fetchLocations = async () => {
    setIsLoading(true);
    const locations = await getLocations();
    
    // If we already have user location, calculate distances
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
    } else {
      setSortedLocations(locations);
    }
    setIsLoading(false);
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

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxLocation && e.key === 'Escape') {
        setLightboxLocation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxLocation]);

  const handleImageClick = (e, location) => {
    e.stopPropagation();
    if (!editMode) {
      setLightboxLocation(location);
    }
  };

  // Get user's geolocation and sort locations
  useEffect(() => {
    if (sortedLocations.length === 0) return;
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          
          // Sort locations by distance
          const sorted = [...sortedLocations].map(loc => ({
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
  }, [sortedLocations.length > 0]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-6">
            Elevated dining meets Southern soul. Find a location near you.
          </p>
          
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

        {/* Location Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {sortedLocations.map((location, index) => (
            <Card 
              key={location.id} 
              className={`overflow-hidden bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group cursor-pointer ${editMode ? 'ring-2 ring-red-500/50 ring-dashed' : ''}`}
              onClick={() => editMode ? handleEditLocation(location) : navigate(`/locations/${location.slug}`)}
            >
              {/* Location Image */}
              <div 
                className="relative h-48 overflow-hidden"
                onClick={(e) => handleImageClick(e, location)}
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
                    <div className="bg-white/90 rounded-full p-2">
                      <ZoomIn className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>
                )}
                {!editMode && location.distance && index === 0 && (
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
                    Reservations (Text): {location.reservation_phone}
                  </div>
                </div>

                {/* Hours */}
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <p className="text-slate-400 text-xs">
                    {typeof location.hours === 'object' 
                      ? `Mon-Thu: ${location.hours.monday || 'Closed'} | Fri-Sat: ${location.hours.friday || 'Closed'} | Sun: ${location.hours.sunday || 'Closed'}`
                      : location.hours
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); navigate('/menu'); }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Menu
                  </Button>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); window.open(location.online_ordering, '_blank'); }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Order Online
                  </Button>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); window.location.href = location.reservations; }}
                    variant="outline"
                    className="w-full border-red-600 text-red-500 hover:bg-slate-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Make Reservation (Text)
                  </Button>
                  
                  <Button
                    onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`, '_blank'); }}
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

      {/* Image Lightbox */}
      {lightboxLocation && (
        <ImageLightbox 
          image={{ 
            url: lightboxLocation.image, 
            name: lightboxLocation.name,
            description: lightboxLocation.address
          }}
          onClose={() => setLightboxLocation(null)}
        />
      )}
    </div>
  );
};

export default LocationsPage;
