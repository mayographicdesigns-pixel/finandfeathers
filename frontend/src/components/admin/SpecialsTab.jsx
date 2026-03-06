import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, X, Megaphone, Star, Bell, RefreshCw, Upload, Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminSpecials, 
  createSpecial, 
  updateSpecial, 
  deleteSpecial, 
  resendSpecialNotification,
  adminGetDailySpecials, 
  adminUpdateDailySpecials,
  uploadImage
} from '../../services/api';
import { locations } from '../../mockData';

const SpecialsTab = () => {
  const [specials, setSpecials] = useState([]);
  const [dailySpecials, setDailySpecials] = useState([]);
  const [dailySaving, setDailySaving] = useState(false);
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    location_id: '',
    send_notification: true
  });

  useEffect(() => {
    fetchSpecials();
    fetchDailySpecials();
  }, []);

  const defaultDailySpecials = [
    { day_index: 0, specials: [{ id: '0-0', name: "The Sunday Slide", description: "Close out the weekend with $5 Daily Specials", hours: "6pm – Close", emoji: "🌅" }] },
    { day_index: 1, specials: [{ id: '1-0', name: "Margarita Monday", description: "Sip on $5 Margaritas all day long", hours: "12pm – 8pm", emoji: "🍹" }] },
    { day_index: 2, specials: [{ id: '2-0', name: "Tito's, Tacos & Tequila", description: "$5 Tito's, $5 Margaritas, and $5 Tacos. The perfect Tuesday trio", hours: "12pm – 8pm", emoji: "🌮" }] },
    { day_index: 3, specials: [{ id: '3-0', name: "Wine Down (or Whiskey Up)", description: "$5 Select wine glasses, $10 Bottles, or $5 Select Whiskey shots", hours: "12pm – 8pm", emoji: "🍷" }] },
    { day_index: 4, specials: [{ id: '4-0', name: "Martini Madness", description: "Elevate your Thursday with $5 Martinis. Strawberry, Peach, Mango, Watermelon, Lemon Drop, Melon, Blue (+$1)", hours: "12pm – 8pm", emoji: "🍸" }] },
    { day_index: 5, specials: [{ id: '5-0', name: "Friday Re-Up", description: "$5 cocktails and $5 shots all day long", hours: "12pm – 8pm", emoji: "🍾" }] },
    { day_index: 6, specials: [{ id: '6-0', name: "Saturday Prime", description: "Special $5 menu available", hours: "5pm – 8pm", emoji: "🌟" }] }
  ];

  const fetchDailySpecials = async () => {
    try {
      const data = await adminGetDailySpecials();
      const converted = defaultDailySpecials.map((def) => {
        const existingDay = (data || []).find(item => item.day_index === def.day_index);
        if (existingDay) {
          if (existingDay.specials && Array.isArray(existingDay.specials)) {
            return existingDay;
          }
          return {
            day_index: def.day_index,
            specials: [{
              id: `${def.day_index}-0`,
              name: existingDay.name || def.specials[0].name,
              description: existingDay.description || def.specials[0].description,
              hours: existingDay.hours || def.specials[0].hours,
              emoji: existingDay.emoji || def.specials[0].emoji
            }]
          };
        }
        return def;
      });
      setDailySpecials(converted);
    } catch (err) {
      setDailySpecials(defaultDailySpecials);
    }
  };

  const updateDailySpecial = (dayIndex, specialIndex, field, value) => {
    setDailySpecials(prev => prev.map((day) => {
      if (day.day_index === dayIndex) {
        const updatedSpecials = [...day.specials];
        updatedSpecials[specialIndex] = { ...updatedSpecials[specialIndex], [field]: value };
        return { ...day, specials: updatedSpecials };
      }
      return day;
    }));
  };

  const addSpecialToDay = (dayIndex) => {
    setDailySpecials(prev => prev.map((day) => {
      if (day.day_index === dayIndex) {
        const newId = `${dayIndex}-${day.specials.length}`;
        return {
          ...day,
          specials: [...day.specials, { id: newId, name: "", description: "", hours: "", emoji: "⭐" }]
        };
      }
      return day;
    }));
  };

  const removeSpecialFromDay = (dayIndex, specialIndex) => {
    setDailySpecials(prev => prev.map((day) => {
      if (day.day_index === dayIndex && day.specials.length > 1) {
        const updatedSpecials = day.specials.filter((_, idx) => idx !== specialIndex);
        return { ...day, specials: updatedSpecials };
      }
      return day;
    }));
  };

  const saveDailySpecials = async () => {
    setDailySaving(true);
    try {
      const flattenedSpecials = dailySpecials.map(day => ({
        day_index: day.day_index,
        specials: day.specials,
        name: day.specials[0]?.name || '',
        description: day.specials[0]?.description || '',
        hours: day.specials[0]?.hours || '',
        emoji: day.specials[0]?.emoji || '⭐'
      }));
      await adminUpdateDailySpecials(flattenedSpecials);
      toast({ title: 'Success', description: "Today's specials updated" });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDailySaving(false);
    }
  };

  const fetchSpecials = async () => {
    try {
      const data = await getAdminSpecials();
      setSpecials(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      setFormData({ ...formData, image: fullUrl });
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({ title: 'Error', description: 'Title and description are required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSpecial) {
        await updateSpecial(editingSpecial.id, {
          title: formData.title,
          description: formData.description,
          image: formData.image || null,
          location_id: formData.location_id || null
        });
        setSpecials(specials.map(s => 
          s.id === editingSpecial.id 
            ? { ...s, ...formData, location_id: formData.location_id || null } 
            : s
        ));
        toast({ title: 'Success', description: 'Special updated!' });
      } else {
        const result = await createSpecial({
          ...formData,
          location_id: formData.location_id || null
        });
        setSpecials([result.special, ...specials]);
        
        const notifResult = result.notification_result;
        if (formData.send_notification && notifResult) {
          toast({ 
            title: 'Special Posted!', 
            description: `Sent to ${notifResult.sent} app users` 
          });
        } else {
          toast({ title: 'Special Created', description: 'Special saved (no notification sent)' });
        }
      }
      
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (special) => {
    setEditingSpecial(special);
    setFormData({
      title: special.title,
      description: special.description,
      image: special.image || '',
      location_id: special.location_id || '',
      send_notification: false
    });
    setShowForm(true);
  };

  const handleToggleActive = async (special) => {
    try {
      await updateSpecial(special.id, { is_active: !special.is_active });
      setSpecials(specials.map(s => 
        s.id === special.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast({ title: 'Success', description: `Special ${special.is_active ? 'deactivated' : 'activated'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleResendNotification = async (special) => {
    try {
      const result = await resendSpecialNotification(special.id);
      toast({ title: 'Notification Sent!', description: `Sent to ${result.result.sent} app users` });
      fetchSpecials();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this special?')) return;
    try {
      await deleteSpecial(id);
      setSpecials(specials.filter(s => s.id !== id));
      toast({ title: 'Success', description: 'Special deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSpecial(null);
    setFormData({ title: '', description: '', image: '', location_id: '', send_notification: true });
  };

  const getLocationName = (locationId) => {
    if (!locationId) return 'All Locations';
    const location = locations.find(l => l.slug === locationId || l.id.toString() === locationId);
    return location ? location.name.replace('Fin & Feathers - ', '') : 'Unknown Location';
  };

  const filteredSpecials = selectedLocation === 'all' 
    ? specials 
    : specials.filter(s => 
        s.location_id === selectedLocation || 
        (selectedLocation === 'global' && !s.location_id)
      );

  const specialsByLocation = locations.map(loc => ({
    location: loc,
    specials: specials.filter(s => s.location_id === loc.slug || s.location_id === loc.id.toString())
  }));

  const globalSpecials = specials.filter(s => !s.location_id);

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Post New Special */}
      <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-500" />
            {editingSpecial ? 'Edit Special' : 'Post a Special'}
          </CardTitle>
          <p className="text-slate-400 text-sm">
            {editingSpecial 
              ? 'Update this special - changes will be reflected immediately'
              : 'Create a special/promotion and automatically notify all app users'
            }
          </p>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-red-600 hover:bg-red-700 w-full"
              data-testid="new-special-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Special
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm block mb-2">Special Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekend Happy Hour - 50% Off Apps!"
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                  data-testid="special-title-input"
                />
              </div>
              
              <div>
                <label className="text-slate-300 text-sm block mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the special..."
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                  required
                  data-testid="special-description-input"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Location (optional)</label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                  data-testid="special-location-select"
                >
                  <option value="">All Locations (Global)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.slug}>
                      {loc.name.replace('Fin & Feathers - ', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Image (optional)</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Image URL or upload"
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                    data-testid="special-image-input"
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
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => setLightboxImage(formData.image)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {!editingSpecial && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="send-notification"
                    checked={formData.send_notification}
                    onChange={(e) => setFormData({ ...formData, send_notification: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="send-notification" className="text-slate-300 text-sm">
                    Send push notification to all app users
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  disabled={submitting}
                  data-testid="post-special-button"
                >
                  {submitting ? 'Saving...' : editingSpecial ? 'Save Changes' : 'Post Special'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Daily Specials */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Today's Special (Rotates by Day)
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Update the daily special fields. Click + to add multiple specials for the same day.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {dailySpecials.map((day) => (
            <div key={day.day_index} className="rounded-lg border border-slate-700/50 bg-slate-900/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                <span className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
                  {dayLabels[day.day_index]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSpecialToDay(day.day_index)}
                  className="text-green-400 hover:bg-green-900/30 h-7 px-2"
                  data-testid={`add-special-day-${day.day_index}`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="p-3 space-y-3">
                {day.specials.map((special, specialIndex) => (
                  <div key={special.id || specialIndex} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                    <div className="md:col-span-3">
                      <Input
                        value={special.name}
                        onChange={(e) => updateDailySpecial(day.day_index, specialIndex, 'name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-sm"
                        placeholder="Special title"
                        data-testid={`daily-special-name-${day.day_index}-${specialIndex}`}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        value={special.description}
                        onChange={(e) => updateDailySpecial(day.day_index, specialIndex, 'description', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-sm"
                        placeholder="Description"
                        rows={1}
                        data-testid={`daily-special-description-${day.day_index}-${specialIndex}`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        value={special.hours}
                        onChange={(e) => updateDailySpecial(day.day_index, specialIndex, 'hours', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-sm"
                        placeholder="Hours"
                        data-testid={`daily-special-hours-${day.day_index}-${specialIndex}`}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Input
                        value={special.emoji}
                        onChange={(e) => updateDailySpecial(day.day_index, specialIndex, 'emoji', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-sm text-center"
                        placeholder="⭐"
                        data-testid={`daily-special-emoji-${day.day_index}-${specialIndex}`}
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-center">
                      {day.specials.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecialFromDay(day.day_index, specialIndex)}
                          className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0"
                          data-testid={`remove-special-${day.day_index}-${specialIndex}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              onClick={saveDailySpecials}
              className="bg-red-600 hover:bg-red-700"
              disabled={dailySaving}
              data-testid="save-daily-specials-btn"
            >
              {dailySaving ? 'Saving...' : 'Save Today\'s Specials'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Filter */}
      <div className="flex items-center gap-4">
        <label className="text-slate-300 text-sm">Filter by Location:</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
          data-testid="filter-location-select"
        >
          <option value="all">All Specials</option>
          <option value="global">Global (All Locations)</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.slug}>
              {loc.name.replace('Fin & Feathers - ', '')}
            </option>
          ))}
        </select>
        <span className="text-slate-500 text-sm">
          Showing {filteredSpecials.length} special{filteredSpecials.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Specials List */}
      <div>
        <h3 className="text-white font-semibold mb-4">
          {selectedLocation === 'all' ? 'All Specials' : `Specials for ${getLocationName(selectedLocation)}`} ({filteredSpecials.length})
        </h3>
        {filteredSpecials.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center text-slate-400">
              No specials found. Create your first special above!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSpecials.map((special) => (
              <Card 
                key={special.id} 
                className={`border ${special.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
                data-testid={`special-card-${special.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {special.image && (
                      <div 
                        className="relative cursor-pointer group"
                        onClick={() => setLightboxImage(special.image)}
                      >
                        <img 
                          src={special.image} 
                          alt="" 
                          className="w-24 h-24 object-cover rounded transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-white font-semibold truncate">{special.title}</h4>
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{special.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`px-2 py-1 rounded text-xs ${special.is_active ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {special.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-blue-600/30 text-blue-300 border border-blue-600/50">
                            {getLocationName(special.location_id)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>Created: {new Date(special.created_at).toLocaleDateString()}</span>
                        {special.notification_sent && (
                          <span className="text-green-400">
                            Notified {special.notification_sent_at && new Date(special.notification_sent_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(special)}
                          className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"
                          data-testid={`edit-special-${special.id}`}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(special)}
                          className="border-slate-600 text-slate-300"
                        >
                          {special.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendNotification(special)}
                          className="border-blue-600 text-blue-400"
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Resend Notification
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(special.id)}
                          className="text-red-400 hover:bg-red-900/30"
                          data-testid={`delete-special-${special.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Specials by Location Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Specials by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">All Locations</span>
                <span className="bg-green-600/30 text-green-300 px-2 py-1 rounded text-xs">
                  {globalSpecials.filter(s => s.is_active).length} active
                </span>
              </div>
              <p className="text-slate-400 text-sm">{globalSpecials.length} total specials</p>
            </div>
            
            {specialsByLocation.map(({ location, specials: locSpecials }) => (
              <div key={location.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm truncate">
                    {location.name.replace('Fin & Feathers - ', '')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    locSpecials.filter(s => s.is_active).length > 0 
                      ? 'bg-green-600/30 text-green-300' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {locSpecials.filter(s => s.is_active).length} active
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{locSpecials.length} total specials</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedLocation(location.slug);
                    setFormData({ ...formData, location_id: location.slug });
                    setShowForm(true);
                  }}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 p-0 h-auto"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Special
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="special-lightbox"
        >
          <Button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </Button>
          <img 
            src={lightboxImage}
            alt="Special"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default SpecialsTab;
