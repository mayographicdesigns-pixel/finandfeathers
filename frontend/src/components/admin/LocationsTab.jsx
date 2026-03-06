import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Upload, RefreshCw, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { 
  adminGetLocations, 
  adminCreateLocation, 
  adminUpdateLocation, 
  adminDeleteLocation,
  uploadImage
} from '../../services/api';

const LocationsTab = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const locationFileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    address: '',
    phone: '',
    reservation_phone: '',
    image: '',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-10pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    coordinates: { lat: 33.7547, lng: -84.3733 },
    online_ordering: '',
    reservations: '',
    social_media: { instagram: '', facebook: '', twitter: '' },
    weekly_specials: []
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await adminGetLocations();
      setLocations(data);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image (JPG, PNG, GIF, or WebP)', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      setFormData({ ...formData, image: fullUrl });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (locationFileInputRef.current) {
        locationFileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await adminUpdateLocation(editingLocation.id, formData);
        toast({ title: 'Success', description: 'Location updated successfully' });
      } else {
        await adminCreateLocation(formData);
        toast({ title: 'Success', description: 'Location created successfully' });
      }
      setShowForm(false);
      setEditingLocation(null);
      resetForm();
      fetchLocations();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      slug: location.slug || '',
      name: location.name || '',
      address: location.address || '',
      phone: location.phone || '',
      reservation_phone: location.reservation_phone || '',
      image: location.image || '',
      hours: location.hours || {
        monday: 'Closed', tuesday: 'Closed', wednesday: 'Closed',
        thursday: 'Closed', friday: 'Closed', saturday: 'Closed', sunday: 'Closed'
      },
      coordinates: location.coordinates || { lat: 0, lng: 0 },
      online_ordering: location.online_ordering || '',
      reservations: location.reservations || '',
      social_media: location.social_media || { instagram: '', facebook: '', twitter: '' },
      weekly_specials: location.weekly_specials || []
    });
    setShowForm(true);
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await adminDeleteLocation(locationId);
      toast({ title: 'Success', description: 'Location deleted successfully' });
      fetchLocations();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (location) => {
    try {
      await adminUpdateLocation(location.id, { is_active: !location.is_active });
      toast({ title: 'Success', description: `Location ${location.is_active ? 'hidden' : 'shown'}` });
      fetchLocations();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '', name: '', address: '', phone: '', reservation_phone: '', image: '',
      hours: { monday: '11am-10pm', tuesday: '11am-10pm', wednesday: '11am-10pm',
               thursday: '11am-10pm', friday: '11am-12am', saturday: '10am-12am', sunday: '10am-10pm' },
      coordinates: { lat: 33.7547, lng: -84.3733 },
      online_ordering: '', reservations: '',
      social_media: { instagram: '', facebook: '', twitter: '' },
      weekly_specials: []
    });
  };

  const updateHours = (day, value) => {
    setFormData(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: value }
    }));
  };

  const updateSpecial = (index, field, value) => {
    setFormData(prev => {
      const specials = [...prev.weekly_specials];
      specials[index] = { ...specials[index], [field]: value };
      return { ...prev, weekly_specials: specials };
    });
  };

  const addSpecial = () => {
    setFormData(prev => ({
      ...prev,
      weekly_specials: [...prev.weekly_specials, { day: 'Monday', special: '' }]
    }));
  };

  const removeSpecial = (index) => {
    setFormData(prev => ({
      ...prev,
      weekly_specials: prev.weekly_specials.filter((_, i) => i !== index)
    }));
  };

  const handleToggleFeature = async (location, feature) => {
    try {
      await adminUpdateLocation(location.id, { [feature]: !location[feature] });
      const featureLabels = {
        check_in_enabled: 'Check-In',
        social_wall_enabled: 'Social Wall',
        tip_staff_enabled: 'Tip Staff',
        dj_tips_enabled: 'DJ Tips'
      };
      toast({ title: 'Updated', description: `${featureLabels[feature]} ${location[feature] ? 'disabled' : 'enabled'}` });
      fetchLocations();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Manage Locations ({locations.length})</h2>
        <Button 
          onClick={() => { resetForm(); setEditingLocation(null); setShowForm(true); }}
          className="bg-red-600 hover:bg-red-700"
          data-testid="add-location-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Location
        </Button>
      </div>

      {/* Location Form Modal */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingLocation(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Location Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Fin & Feathers - Edgewood"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                    data-testid="location-name-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">URL Slug *</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="edgewood-atlanta"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="345 Edgewood Ave SE, Atlanta, GA 30312"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(404) 855-5524"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Reservation Phone</label>
                  <Input
                    value={formData.reservation_phone}
                    onChange={(e) => setFormData({ ...formData, reservation_phone: e.target.value })}
                    placeholder="(404) 692-1252"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">Location Image *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Image URL or upload"
                    required
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                  />
                  <input
                    type="file"
                    ref={locationFileInputRef}
                    onChange={handleLocationImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => locationFileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-2">
                    <img src={formData.image} alt="Preview" className="w-32 h-20 object-cover rounded border border-slate-600" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Online Ordering URL</label>
                  <Input
                    value={formData.online_ordering}
                    onChange={(e) => setFormData({ ...formData, online_ordering: e.target.value })}
                    placeholder="https://order.toasttab.com/..."
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Reservation Link</label>
                  <Input
                    value={formData.reservations}
                    onChange={(e) => setFormData({ ...formData, reservations: e.target.value })}
                    placeholder="sms:14046921252?..."
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lat}
                    onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) } })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lng}
                    onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) } })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Hours */}
              <div>
                <label className="text-sm text-slate-300 block mb-2">Hours</label>
                <div className="grid grid-cols-7 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day}>
                      <label className="text-xs text-slate-400 block capitalize">{day.slice(0, 3)}</label>
                      <Input
                        value={formData.hours[day]}
                        onChange={(e) => updateHours(day, e.target.value)}
                        placeholder="11am-10pm"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Specials */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300">Weekly Specials</label>
                  <Button type="button" size="sm" onClick={addSpecial} className="bg-slate-700">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {formData.weekly_specials.map((special, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={special.day}
                      onChange={(e) => updateSpecial(index, 'day', e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <Input
                      value={special.special}
                      onChange={(e) => updateSpecial(index, 'special', e.target.value)}
                      placeholder="$5 Wings & Margaritas"
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeSpecial(index)} className="text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLocation(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Locations List */}
      <div className="grid gap-4">
        {locations.map((location) => (
          <Card key={location.id} className={`border-slate-700 ${location.is_active ? 'bg-slate-800/50' : 'bg-slate-800/20 opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{location.name}</h3>
                      <p className="text-slate-400 text-sm">{location.address}</p>
                      <p className="text-slate-400 text-sm">{location.phone}</p>
                      <p className="text-slate-500 text-xs mt-1">slug: /{location.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(location)}
                        className={location.is_active ? 'text-green-400' : 'text-slate-500'}
                        title={location.is_active ? 'Hide' : 'Show'}
                      >
                        {location.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(location)}
                        className="text-blue-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(location.id)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Feature Toggles */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2">Features</p>
                    <div className="flex flex-wrap gap-3">
                      {/* Check-In Toggle */}
                      <button
                        onClick={() => handleToggleFeature(location, 'check_in_enabled')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                          location.check_in_enabled 
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                            : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                        }`}
                        data-testid={`toggle-checkin-${location.slug}`}
                      >
                        {location.check_in_enabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        Check-In
                      </button>
                      
                      {/* Social Wall Toggle */}
                      <button
                        onClick={() => handleToggleFeature(location, 'social_wall_enabled')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                          location.social_wall_enabled 
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                            : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                        }`}
                        data-testid={`toggle-socialwall-${location.slug}`}
                      >
                        {location.social_wall_enabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        Social Wall
                      </button>
                      
                      {/* Tip Staff Toggle */}
                      <button
                        onClick={() => handleToggleFeature(location, 'tip_staff_enabled')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                          location.tip_staff_enabled 
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' 
                            : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                        }`}
                        data-testid={`toggle-tipstaff-${location.slug}`}
                      >
                        {location.tip_staff_enabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        Tip Staff
                      </button>
                      
                      {/* DJ Tips Toggle */}
                      <button
                        onClick={() => handleToggleFeature(location, 'dj_tips_enabled')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                          location.dj_tips_enabled 
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                            : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                        }`}
                        data-testid={`toggle-djtips-${location.slug}`}
                      >
                        {location.dj_tips_enabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        DJ Tips
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No locations found. Add your first location!
        </div>
      )}
    </div>
  );
};

export default LocationsTab;
