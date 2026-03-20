import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Upload, RefreshCw, Ticket, Star, Calendar, Clock, MapPin, Wand2, Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { 
  adminGetEvents, 
  adminCreateEvent, 
  adminUpdateEvent, 
  adminDeleteEvent,
  adminGetLocations,
  uploadImage
} from '../../services/api';

const API_URL = window.location.origin;

const EventsTab = () => {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef(null);
  const flyerInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    location_slug: '',
    image: '',
    featured: false,
    free_entry: false,
    packages: ['general'],
    package_prices: { general: 25, vip: 75, table: 200 }
  });

  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await adminGetEvents();
      setEvents(data);
      toast({ title: 'Refreshed', description: 'Events loaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await adminGetLocations();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const handleImageUpload = async (e) => {
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

    setUploading(true);
    try {
      const result = await uploadImage(file);
      setFormData({ ...formData, image: result.url });
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFlyerExtract = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    toast({ title: 'AI Reading Flyer...', description: 'Extracting event details from your flyer' });

    try {
      // Upload the image first
      const imgResult = await uploadImage(file);

      // Extract event details via AI
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/events/extract-flyer`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Failed to extract event details');
      const extracted = await res.json();

      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        description: extracted.description || prev.description,
        date: extracted.date || prev.date,
        time: extracted.time || prev.time,
        location: extracted.location || prev.location,
        image: imgResult.url,
        featured: extracted.featured || false,
      }));

      setShowForm(true);
      toast({ title: 'AI Extracted!', description: 'Event details filled in — review and save' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setExtracting(false);
      if (flyerInputRef.current) flyerInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.date || !formData.time) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        await adminUpdateEvent(editingEvent.id, formData);
        setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...formData } : ev));
        toast({ title: 'Saved', description: 'Event updated successfully' });
      } else {
        const newEvent = await adminCreateEvent(formData);
        setEvents([...events, newEvent]);
        toast({ title: 'Saved', description: 'Event created successfully' });
      }
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location || '',
      location_slug: event.location_slug || '',
      image: event.image || '',
      featured: event.featured || false,
      free_entry: event.free_entry || false,
      packages: event.packages || ['general'],
      package_prices: event.package_prices || { general: 25, vip: 75, table: 200 }
    });
    setShowForm(true);
  };

  const handleToggleActive = async (event) => {
    try {
      await adminUpdateEvent(event.id, { is_active: !event.is_active });
      setEvents(events.map(ev => ev.id === event.id ? { ...ev, is_active: !ev.is_active } : ev));
      toast({ title: 'Saved', description: `Event ${event.is_active ? 'hidden' : 'shown'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (event) => {
    try {
      await adminUpdateEvent(event.id, { featured: !event.featured });
      setEvents(events.map(ev => ev.id === event.id ? { ...ev, featured: !ev.featured } : ev));
      toast({ title: 'Saved', description: `Event ${event.featured ? 'unfeatured' : 'featured'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await adminDeleteEvent(id);
      setEvents(events.filter(ev => ev.id !== id));
      toast({ title: 'Deleted', description: 'Event removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      name: '', description: '', date: '', time: '', location: '', location_slug: '',
      image: '', featured: false, free_entry: false, packages: ['general'],
      package_prices: { general: 25, vip: 75, table: 200 }
    });
  };

  const togglePackage = (pkg) => {
    const newPackages = formData.packages.includes(pkg)
      ? formData.packages.filter(p => p !== pkg)
      : [...formData.packages, pkg];
    setFormData({ ...formData, packages: newPackages });
  };

  const updatePackagePrice = (pkg, value) => {
    const parsed = value === '' ? 0 : parseFloat(value);
    const normalized = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setFormData(prev => ({
      ...prev,
      package_prices: { ...prev.package_prices, [pkg]: normalized }
    }));
  };

  const getPackageLabel = (pkg) => {
    const amount = formData.package_prices?.[pkg] ?? 0;
    const priceLabel = amount <= 0 ? 'Free' : `$${amount}`;
    if (pkg === 'general') return `General (${priceLabel})`;
    if (pkg === 'vip') return `VIP (${priceLabel})`;
    if (pkg === 'table') return `Table (${priceLabel})`;
    return pkg;
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Save & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-500" />
            Events Management
          </h3>
          <p className="text-slate-400 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            data-testid="events-refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>

          {/* AI Flyer Extract */}
          <input
            type="file"
            ref={flyerInputRef}
            onChange={handleFlyerExtract}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => flyerInputRef.current?.click()}
            disabled={extracting}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="ai-flyer-btn"
          >
            {extracting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
            {extracting ? 'Reading...' : 'AI Flyer Read'}
          </Button>

          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700" data-testid="add-event-btn">
            <Plus className="w-4 h-4 mr-1" /> Add Event
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h4 className="text-white font-semibold mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Event Name *</label>
                  <Input
                    placeholder="e.g., Friday Night Live"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="event-name-input"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Location Text</label>
                  <Input
                    placeholder="e.g., Edgewood (Atlanta)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    data-testid="event-location-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Reservation Location</label>
                <select
                  value={formData.location_slug}
                  onChange={(e) => setFormData({ ...formData, location_slug: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                  data-testid="event-location-slug"
                >
                  <option value="">Use event location text</option>
                  <option value="all-locations">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.slug}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Description *</label>
                <Textarea
                  placeholder="Describe the event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Date *</label>
                  <Input
                    placeholder="e.g., Every Friday or December 25, 2025"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Time *</label>
                  <Input
                    placeholder="e.g., 9PM - 2AM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-slate-300 text-sm block mb-2">Event Image</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL or upload"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image && (
                  <img src={formData.image.startsWith('/api/') ? `${window.location.origin}${formData.image}` : formData.image} alt="Preview" className="h-32 w-48 object-cover rounded-lg border border-slate-700 mt-3" />
                )}
              </div>

              {/* Ticket Packages */}
              <div>
                <label className="text-slate-300 text-sm block mb-2">Available Ticket Packages</label>
                <div className="flex gap-3">
                  {['general', 'vip', 'table'].map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => togglePackage(pkg)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        formData.packages.includes(pkg)
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {getPackageLabel(pkg)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket Prices */}
              <div>
                <label className="text-slate-300 text-sm block mb-2">Ticket Prices</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['general', 'vip', 'table'].map(pkg => (
                    <div key={pkg} className="space-y-2">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">
                        {pkg === 'general' ? 'General' : pkg === 'vip' ? 'VIP' : 'Table'} Price
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.package_prices?.[pkg] ?? 0}
                        onChange={(e) => updatePackagePrice(pkg, e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured & Free Entry Toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="featured-checkbox" className="text-slate-300 text-sm flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" /> Featured Event
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="free-entry-checkbox"
                    checked={formData.free_entry || false}
                    onChange={(e) => setFormData({ ...formData, free_entry: e.target.checked })}
                    className="rounded"
                    data-testid="free-entry-toggle"
                  />
                  <label htmlFor="free-entry-checkbox" className="text-slate-300 text-sm flex items-center gap-1">
                    <Ticket className="w-4 h-4 text-green-500" /> Free Entry (shows "Reserve" instead of "Get Tickets")
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting} data-testid="save-event-btn">
                  <Save className="w-4 h-4 mr-1" />
                  {submitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Save Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No events yet</p>
            <p className="text-slate-500 text-sm">Create events or upload a flyer to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card 
              key={event.id} 
              className={`overflow-hidden ${event.is_active !== false ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
            >
              <div className="md:flex">
                {event.image && (
                  <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                    <img src={event.image.startsWith('/api/') ? `${window.location.origin}${event.image}` : event.image} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold">{event.name}</h4>
                        {event.featured && (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-500 text-black font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" /> Featured
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${event.is_active !== false ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          {event.is_active !== false ? 'Active' : 'Hidden'}
                        </span>
                        {event.location_slug === 'all-locations' && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-600 text-white">All Locations</span>
                        )}
                        {event.free_entry && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-600 text-white">Free Entry</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {event.packages?.map(pkg => (
                          <span key={pkg} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                            {pkg}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(event)} className="border-yellow-600 text-yellow-400">
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleToggleFeatured(event)} className="border-slate-600 text-slate-300">
                        <Star className="w-3 h-3 mr-1" /> {event.featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleToggleActive(event)} className="border-slate-600 text-slate-300">
                        {event.is_active !== false ? 'Hide' : 'Show'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(event.id)} className="text-red-400 hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsTab;
