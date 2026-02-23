import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Send, Bell, Users, Mail, UtensilsCrossed, 
  LogOut, BarChart3, Trash2, Eye, Check, X, Plus, Edit2, 
  Lock, User, AlertCircle, RefreshCw, Upload, Image, Megaphone, 
  Calendar, ToggleLeft, ToggleRight, Share2, Instagram, Facebook, ExternalLink,
  ImagePlus, Grid3X3, GripVertical, Coins, Gift, Award, Briefcase, BadgeCheck, DollarSign, MapPin, Video,
  Ticket, Star, Clock, ImageUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import { 
  adminLogin, adminLogout, checkAdminAuth, getAdminStats,
  getLoyaltyMembers, deleteLoyaltyMember,
  getContacts, updateContactStatus,
  getAdminMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  sendPushNotification, getNotificationHistory,
  uploadImage, listUploads, deleteUpload,
  getAdminSpecials, createSpecial, updateSpecial, deleteSpecial, resendSpecialNotification,
  getAdminSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink,
  getAdminInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost,
  getAdminGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem,
  adminGetUsers, adminGiftTokens, adminUpdateUserRole, adminGetCashouts, adminProcessCashout,
  adminGetLocations, adminCreateLocation, adminUpdateLocation, adminDeleteLocation, adminReorderLocations,
  adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent,
  adminGetGallerySubmissions, adminDeleteGallerySubmission
} from '../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Login Component
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminLogin(username, password);
      onLogin();
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center pb-2">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers"
            className="h-24 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-red-500" />
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <div>
              <label className="text-slate-300 text-sm block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter username"
                  required
                  data-testid="admin-username-input"
                />
              </div>
            </div>
            
            <div>
              <label className="text-slate-300 text-sm block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter password"
                  required
                  data-testid="admin-password-input"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
              data-testid="admin-login-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Stats Component
const DashboardStats = ({ stats }) => {
  const statItems = [
    { label: 'Loyalty Members', value: stats?.loyalty_members || 0, icon: Users, color: 'text-blue-500' },
    { label: 'New Contacts', value: stats?.new_contacts || 0, icon: Mail, color: 'text-green-500' },
    { label: 'Menu Items', value: stats?.menu_items || 0, icon: UtensilsCrossed, color: 'text-yellow-500' },
    { label: 'Notifications Sent', value: stats?.notifications_sent || 0, icon: Bell, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <Card key={index} className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">{item.label}</p>
                <p className="text-2xl font-bold text-white">{item.value}</p>
              </div>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Loyalty Members Tab
const LoyaltyMembersTab = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await getLoyaltyMembers();
      setMembers(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await deleteLoyaltyMember(id);
      setMembers(members.filter(m => m.id !== id));
      toast({ title: 'Success', description: 'Member deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Loyalty Program Members ({members.length})</h3>
        <Button variant="outline" size="sm" onClick={fetchMembers} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>
      
      {members.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No loyalty members yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-slate-400 text-sm">{member.email}</p>
                  {member.phone && <p className="text-slate-500 text-xs">{member.phone}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  data-testid={`delete-member-${member.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Contacts Tab
const ContactsTab = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateContactStatus(id, status);
      setContacts(contacts.map(c => c.id === id ? { ...c, status } : c));
      toast({ title: 'Success', description: 'Status updated' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  const statusColors = {
    new: 'bg-green-600',
    reviewed: 'bg-blue-600',
    resolved: 'bg-slate-600'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Contact Submissions ({contacts.length})</h3>
        <Button variant="outline" size="sm" onClick={fetchContacts} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No contact submissions yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-slate-400 text-sm">{contact.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs text-white ${statusColors[contact.status] || statusColors.new}`}>
                    {contact.status || 'new'}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{contact.message}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contact.id, 'reviewed')}
                    className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                  >
                    <Eye className="w-3 h-3 mr-1" /> Mark Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contact.id, 'resolved')}
                    className="border-green-600 text-green-400 hover:bg-green-900/30"
                  >
                    <Check className="w-3 h-3 mr-1" /> Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Menu Items Tab
const MenuItemsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', image: '', badges: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getAdminMenuItems();
      setItems(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image (JPG, PNG, GIF, or WebP)', variant: 'destructive' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      // Construct full URL for the uploaded image
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      setFormData({ ...formData, image: fullUrl });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
        badges: formData.badges ? formData.badges.split(',').map(b => b.trim()) : []
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        toast({ title: 'Success', description: 'Menu item updated' });
      } else {
        const newItem = await createMenuItem(itemData);
        setItems([...items, newItem]);
        toast({ title: 'Success', description: 'Menu item created' });
      }
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      badges: item.badges?.join(', ') || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      setItems(items.filter(i => i.id !== id));
      toast({ title: 'Success', description: 'Menu item deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', category: '', image: '', badges: '' });
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Menu Items ({items.length})</h3>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Item Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                />
                <Input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                />
              </div>
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Category (e.g., starters, entrees)"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                />
                <Input
                  placeholder="Badges (comma separated)"
                  value={formData.badges}
                  onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm block">Menu Item Image</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL (or upload below)"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                    required
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    data-testid="image-upload-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="upload-image-button"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="ml-2">{uploading ? 'Uploading...' : 'Upload'}</span>
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-2 flex items-center gap-3">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded border border-slate-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="text-slate-400 text-xs truncate max-w-xs">{formData.image}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingItem ? 'Update' : 'Create'} Item
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No menu items in database yet. Add items or they will be loaded from mock data.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{item.name}</p>
                    <span className="text-red-400 font-semibold">${item.price}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{item.category}</p>
                  <p className="text-slate-500 text-xs truncate">{item.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="text-blue-400 hover:bg-blue-900/30"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Notifications Tab
const NotificationsTab = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getNotificationHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch notification history');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const result = await sendPushNotification({ title, body, url, send_to_all: true });
      toast({ title: 'Success', description: `Sent to ${result.result.sent} subscribers` });
      setTitle('');
      setBody('');
      setUrl('/');
      fetchHistory();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Send Push Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <Input
              placeholder="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
            <Textarea
              placeholder="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              rows={3}
              required
            />
            <Input
              placeholder="Click URL (e.g., /menu)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700"
              data-testid="send-notification-button"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send to All Subscribers'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-white font-semibold mb-3">Recent Notifications</h3>
        {history.length === 0 ? (
          <p className="text-slate-400 text-sm">No notifications sent yet</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((notif, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3">
                  <p className="text-white font-medium text-sm">{notif.title}</p>
                  <p className="text-slate-400 text-xs">{notif.body}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(notif.sent_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Specials Tab - Post specials that auto-send to app users
// Import locations from mockData
import { locations } from '../mockData';

const SpecialsTab = () => {
  const [specials, setSpecials] = useState([]);
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
  }, []);

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

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
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
        // Update existing special
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
        // Create new special
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

  // Filter specials by selected location
  const filteredSpecials = selectedLocation === 'all' 
    ? specials 
    : specials.filter(s => 
        s.location_id === selectedLocation || 
        (selectedLocation === 'global' && !s.location_id)
      );

  // Group specials by location for display
  const specialsByLocation = locations.map(loc => ({
    location: loc,
    specials: specials.filter(s => s.location_id === loc.slug || s.location_id === loc.id.toString())
  }));

  // Global specials (no location)
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
                  placeholder="Describe the special... This will be shown to customers and in the notification"
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                  required
                  data-testid="special-description-input"
                />
              </div>

              {/* Location Selection */}
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
                <p className="text-slate-500 text-xs mt-1">
                  Leave empty to apply to all locations
                </p>
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
                    data-testid="special-upload-button"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
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
                    <p className="text-slate-400 text-xs mt-1">Click to preview larger</p>
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

              <p className="text-slate-500 text-xs">
                {formData.send_notification && !editingSpecial
                  ? '🔔 A notification will be sent to all users who have enabled push notifications'
                  : editingSpecial 
                    ? '✏️ Updating existing special - use "Resend Notification" to notify users again'
                    : 'Special will be saved but no notification sent'}
              </p>

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
            {/* Global Specials */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">All Locations</span>
                <span className="bg-green-600/30 text-green-300 px-2 py-1 rounded text-xs">
                  {globalSpecials.filter(s => s.is_active).length} active
                </span>
              </div>
              <p className="text-slate-400 text-sm">{globalSpecials.length} total specials</p>
            </div>
            
            {/* Per-Location */}
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

      {/* Lightbox for viewing images large */}
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

// Gallery Tab - Manage gallery images
const GalleryTab = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    category: 'food',
    display_order: 0
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await getAdminGallery();
      // Sort by display_order
      const sorted = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setGalleryItems(sorted);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = galleryItems.findIndex(item => item.id === active.id);
    const newIndex = galleryItems.findIndex(item => item.id === over.id);
    
    // Optimistic update
    const newItems = arrayMove(galleryItems, oldIndex, newIndex);
    setGalleryItems(newItems);

    // Update all display orders in the database
    setSaving(true);
    try {
      const updates = newItems.map((item, index) => 
        updateGalleryItem(item.id, { display_order: index })
      );
      await Promise.all(updates);
      toast({ title: 'Success', description: 'Gallery order saved' });
    } catch (err) {
      // Revert on error
      fetchGallery();
      toast({ title: 'Error', description: 'Failed to save order', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image (JPG, PNG, GIF, WEBP)', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      setFormData({ ...formData, image_url: fullUrl });
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
    if (!formData.title || !formData.image_url) {
      toast({ title: 'Error', description: 'Title and image are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingItem) {
        await updateGalleryItem(editingItem.id, formData);
        setGalleryItems(galleryItems.map(item => 
          item.id === editingItem.id ? { ...item, ...formData } : item
        ));
        toast({ title: 'Success', description: 'Gallery item updated' });
      } else {
        const newItemData = { ...formData, display_order: galleryItems.length };
        const newItem = await createGalleryItem(newItemData);
        setGalleryItems([...galleryItems, newItem]);
        toast({ title: 'Success', description: 'Gallery item added' });
      }
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      image_url: item.image_url,
      category: item.category,
      display_order: item.display_order || 0
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item) => {
    try {
      await updateGalleryItem(item.id, { is_active: !item.is_active });
      setGalleryItems(galleryItems.map(i => 
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ));
      toast({ title: 'Success', description: `Item ${item.is_active ? 'hidden' : 'shown'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      await deleteGalleryItem(id);
      setGalleryItems(galleryItems.filter(i => i.id !== id));
      toast({ title: 'Success', description: 'Gallery item deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', image_url: '', category: 'food', display_order: 0 });
  };

  const categoryLabels = {
    food: 'Food',
    ambiance: 'Ambiance',
    drinks: 'Drinks',
    promo: 'Promotional'
  };

  const categoryColors = {
    food: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    ambiance: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    drinks: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    promo: 'bg-red-500/20 text-red-400 border-red-500/50'
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-red-500" />
            Gallery Management
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Manage images displayed on the Gallery page ({galleryItems.length} items)
            {saving && <span className="ml-2 text-yellow-500">(Saving order...)</span>}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700" data-testid="add-gallery-item-btn">
          <ImagePlus className="w-4 h-4 mr-2" /> Add Image
        </Button>
      </div>

      {/* Drag & Drop Instructions */}
      {galleryItems.length > 1 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400 text-sm">Drag images to reorder. Changes are saved automatically.</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h4 className="text-white font-semibold mb-4">
              {editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Title</label>
                  <Input
                    placeholder="e.g., Signature Wings"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="gallery-title-input"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                    data-testid="gallery-category-select"
                  >
                    <option value="food">Food</option>
                    <option value="ambiance">Ambiance</option>
                    <option value="drinks">Drinks</option>
                    <option value="promo">Promotional</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-slate-300 text-sm block mb-2">Image</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL or upload below"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                    data-testid="gallery-image-url-input"
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
                    data-testid="gallery-upload-btn"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image_url && (
                  <div className="mt-3">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="gallery-save-btn">
                  {editingItem ? 'Update' : 'Add to Gallery'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid with Drag & Drop */}
      {galleryItems.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Grid3X3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No gallery items yet</p>
            <p className="text-slate-500 text-sm">Upload images to display on your Gallery page</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={galleryItems.map(item => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <SortableGalleryCard
                  key={item.id}
                  item={item}
                  categoryLabels={categoryLabels}
                  categoryColors={categoryColors}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

// Sortable Gallery Card Component
const SortableGalleryCard = ({ item, categoryLabels, categoryColors, onEdit, onToggleActive, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden ${item.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'} ${isDragging ? 'shadow-2xl ring-2 ring-red-500' : ''}`}
      data-testid={`gallery-item-${item.id}`}
    >
      <div className="relative aspect-square">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 z-10 bg-black/50 rounded p-1.5 cursor-grab active:cursor-grabbing hover:bg-black/70 transition-colors"
          data-testid={`drag-handle-${item.id}`}
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>
        
        <img 
          src={item.image_url} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs border ${categoryColors[item.category]}`}>
          {categoryLabels[item.category]}
        </div>
        {!item.is_active && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium">Hidden</span>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="text-white font-medium text-sm truncate">{item.title}</p>
        <div className="flex items-center justify-end gap-1 mt-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="text-slate-400 hover:text-white h-8 w-8 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggleActive(item)} className="text-slate-400 h-8 w-8 p-0">
            {item.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Locations Tab - Manage restaurant locations
const LocationsTab = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
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
                <label className="text-sm text-slate-300 block mb-1">Image URL *</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
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

// Videos Tab - Manage promo video carousel
const VideosTab = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    day_of_week: -1,
    is_common: false,
    display_order: 0
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingVideo 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${editingVideo.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos`;
      
      const response = await fetch(url, {
        method: editingVideo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: editingVideo ? 'Video updated' : 'Video created' });
        setShowForm(false);
        setEditingVideo(null);
        resetForm();
        fetchVideos();
      } else {
        throw new Error('Failed to save video');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      url: video.url || '',
      day_of_week: video.day_of_week ?? -1,
      is_common: video.is_common || false,
      display_order: video.display_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Video deleted' });
        fetchVideos();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (video) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !video.is_active })
      });
      if (response.ok) {
        toast({ title: 'Success', description: `Video ${video.is_active ? 'hidden' : 'shown'}` });
        fetchVideos();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', url: '', day_of_week: -1, is_common: false, display_order: 0 });
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Promo Videos ({videos.length})</h2>
        <Button
          onClick={() => { resetForm(); setEditingVideo(null); setShowForm(true); }}
          className="bg-red-600 hover:bg-red-700"
          data-testid="add-video-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Video
        </Button>
      </div>

      {/* Video Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingVideo(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Monday Special Promo"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-1">Video URL *</label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value), is_common: parseInt(e.target.value) === -1 ? formData.is_common : false })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-2"
                  >
                    <option value={-1}>All Days (Common)</option>
                    {dayNames.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Display Order</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_common"
                  checked={formData.is_common}
                  onChange={(e) => setFormData({ ...formData, is_common: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_common" className="text-sm text-slate-300">
                  Common video (shows after day-specific videos)
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingVideo ? 'Update Video' : 'Create Video'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingVideo(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <div className="space-y-3">
        {videos.map((video) => (
          <Card key={video.id} className={`border-slate-700 ${video.is_active ? 'bg-slate-800/50' : 'bg-slate-800/20 opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{video.title}</h3>
                  <p className="text-slate-400 text-sm truncate max-w-md">{video.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${video.is_common ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {video.is_common ? 'Common' : dayNames[video.day_of_week] || 'All Days'}
                    </span>
                    <span className="text-xs text-slate-500">Order: {video.display_order}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(video)}
                    className={video.is_active ? 'text-green-400' : 'text-slate-500'}
                  >
                    {video.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(video)} className="text-blue-400">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No promo videos yet. Add your first video!
        </div>
      )}
    </div>
  );
};

// Social Tab - Manage social links and Instagram feed
const SocialTab = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [linkForm, setLinkForm] = useState({ platform: 'instagram', url: '', username: '' });
  const [postForm, setPostForm] = useState({ instagram_url: '', caption: '', image_url: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [links, posts] = await Promise.all([
        getAdminSocialLinks(),
        getAdminInstagramPosts()
      ]);
      setSocialLinks(links);
      setInstagramPosts(posts);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const newLink = await createSocialLink(linkForm);
      setSocialLinks([...socialLinks, newLink]);
      setShowLinkForm(false);
      setLinkForm({ platform: 'instagram', url: '', username: '' });
      toast({ title: 'Success', description: 'Social link added' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Delete this social link?')) return;
    try {
      await deleteSocialLink(id);
      setSocialLinks(socialLinks.filter(l => l.id !== id));
      toast({ title: 'Success', description: 'Social link deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleLinkActive = async (link) => {
    try {
      await updateSocialLink(link.id, { is_active: !link.is_active });
      setSocialLinks(socialLinks.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      setPostForm({ ...postForm, image_url: `${backendUrl}${result.url}` });
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const newPost = await createInstagramPost(postForm);
      setInstagramPosts([...instagramPosts, newPost]);
      setShowPostForm(false);
      setPostForm({ instagram_url: '', caption: '', image_url: '' });
      toast({ title: 'Success', description: 'Instagram post added to feed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Remove this post from feed?')) return;
    try {
      await deleteInstagramPost(id);
      setInstagramPosts(instagramPosts.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Post removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: () => <span className="text-lg">🎵</span>,
    twitter: () => <span className="text-lg">𝕏</span>
  };

  const platformColors = {
    instagram: 'from-purple-600 to-pink-500',
    facebook: 'from-blue-600 to-blue-500',
    tiktok: 'from-black to-gray-800',
    twitter: 'from-gray-800 to-black'
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Social Links Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-red-500" />
            Social Media Links
          </h3>
          <Button onClick={() => setShowLinkForm(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        </div>

        {showLinkForm && (
          <Card className="bg-slate-800 border-slate-700 mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={linkForm.platform}
                    onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter/X</option>
                  </select>
                  <Input
                    placeholder="Username (e.g., @finandfeathers)"
                    value={linkForm.username}
                    onChange={(e) => setLinkForm({ ...linkForm, username: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                  <Input
                    placeholder="Full URL"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Save Link</Button>
                  <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {socialLinks.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No social links added yet. Add your Instagram, Facebook, or TikTok links!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {socialLinks.map((link) => {
              const Icon = platformIcons[link.platform] || ExternalLink;
              return (
                <Card key={link.id} className={`border ${link.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${platformColors[link.platform]} flex items-center justify-center`}>
                        {typeof Icon === 'function' && Icon.prototype ? <Icon className="w-5 h-5 text-white" /> : <Icon />}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{link.platform}</p>
                        <p className="text-slate-400 text-sm">{link.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleLinkActive(link)} className="text-slate-400">
                        {link.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteLink(link.id)} className="text-red-400 hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Instagram Feed Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Instagram Feed (Homepage)
          </h3>
          <Button onClick={() => setShowPostForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            <Plus className="w-4 h-4 mr-2" /> Add Post
          </Button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Add Instagram posts to display on your homepage. You can paste the Instagram URL or upload an image directly.
        </p>

        {showPostForm && (
          <Card className="bg-slate-800 border-slate-700 mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  placeholder="Instagram Post URL (e.g., https://instagram.com/p/...)"
                  value={postForm.instagram_url}
                  onChange={(e) => setPostForm({ ...postForm, instagram_url: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <Textarea
                  placeholder="Caption (optional)"
                  value={postForm.caption}
                  onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={2}
                />
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Image (upload or paste URL)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL"
                      value={postForm.image_url}
                      onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                    />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-slate-600 text-slate-300">
                      {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {postForm.image_url && <img src={postForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded mt-2" />}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-500">Add to Feed</Button>
                  <Button type="button" variant="outline" onClick={() => setShowPostForm(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {instagramPosts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No Instagram posts added yet. Add posts to show on your homepage!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {instagramPosts.map((post) => (
              <Card key={post.id} className="bg-slate-800/50 border-slate-700 overflow-hidden group">
                <div className="relative aspect-square">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {post.instagram_url && (
                      <a href={post.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    )}
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-500">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                {post.caption && (
                  <CardContent className="p-2">
                    <p className="text-slate-300 text-xs truncate">{post.caption}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Events Tab - Manage events and ticketing
const EventsTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: '',
    featured: false,
    packages: ['general']
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await adminGetEvents();
      setEvents(data);
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

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
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
    if (!formData.name || !formData.description || !formData.date || !formData.time) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        await adminUpdateEvent(editingEvent.id, formData);
        setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...formData } : ev));
        toast({ title: 'Success', description: 'Event updated' });
      } else {
        const newEvent = await adminCreateEvent(formData);
        setEvents([...events, newEvent]);
        toast({ title: 'Success', description: 'Event created' });
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
      image: event.image || '',
      featured: event.featured || false,
      packages: event.packages || ['general']
    });
    setShowForm(true);
  };

  const handleToggleActive = async (event) => {
    try {
      await adminUpdateEvent(event.id, { is_active: !event.is_active });
      setEvents(events.map(ev => ev.id === event.id ? { ...ev, is_active: !ev.is_active } : ev));
      toast({ title: 'Success', description: `Event ${event.is_active ? 'hidden' : 'shown'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (event) => {
    try {
      await adminUpdateEvent(event.id, { featured: !event.featured });
      setEvents(events.map(ev => ev.id === event.id ? { ...ev, featured: !ev.featured } : ev));
      toast({ title: 'Success', description: `Event ${event.featured ? 'unfeatured' : 'featured'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await adminDeleteEvent(id);
      setEvents(events.filter(ev => ev.id !== id));
      toast({ title: 'Success', description: 'Event deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      image: '',
      featured: false,
      packages: ['general']
    });
  };

  const togglePackage = (pkg) => {
    const newPackages = formData.packages.includes(pkg)
      ? formData.packages.filter(p => p !== pkg)
      : [...formData.packages, pkg];
    setFormData({ ...formData, packages: newPackages });
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-500" />
            Events Management
          </h3>
          <p className="text-slate-400 text-sm mt-1">Manage events displayed on the Events & Tickets page</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700" data-testid="add-event-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
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
                  <label className="text-slate-300 text-sm block mb-2">Location</label>
                  <Input
                    placeholder="e.g., Edgewood (Atlanta) or All Locations"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    data-testid="event-location-input"
                  />
                </div>
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
                  data-testid="event-description-input"
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
                    data-testid="event-date-input"
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
                    data-testid="event-time-input"
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
                    data-testid="event-image-input"
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
                  <div className="mt-3">
                    <img src={formData.image} alt="Preview" className="h-32 w-48 object-cover rounded-lg border border-slate-700" />
                  </div>
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
                      {pkg === 'general' && 'General ($25)'}
                      {pkg === 'vip' && 'VIP ($75)'}
                      {pkg === 'table' && 'Table ($200)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="featured-checkbox" className="text-slate-300 text-sm flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" /> Mark as Featured Event
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting} data-testid="save-event-btn">
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
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
            <p className="text-slate-500 text-sm">Create events to display on the Events & Tickets page</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card 
              key={event.id} 
              className={`overflow-hidden ${event.is_active !== false ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
              data-testid={`event-card-${event.id}`}
            >
              <div className="md:flex">
                {event.image && (
                  <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                    <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
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


// Gallery Submissions Tab - View and moderate user photo submissions
const GallerySubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await adminGetGallerySubmissions();
      setSubmissions(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photo submission? This will also remove it from the public gallery.')) return;
    try {
      await adminDeleteGallerySubmission(id);
      setSubmissions(submissions.filter(s => s.id !== id));
      toast({ title: 'Success', description: 'Submission removed from gallery' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageUp className="w-5 h-5 text-red-500" />
            User Photo Submissions
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Photos submitted by users are auto-approved to the gallery. Remove inappropriate content here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <ImageUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No user submissions yet</p>
            <p className="text-slate-500 text-sm">User-submitted photos will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map(submission => (
            <Card key={submission.id} className="bg-slate-800/50 border-slate-700 overflow-hidden" data-testid={`submission-${submission.id}`}>
              <div 
                className="aspect-video cursor-pointer group relative"
                onClick={() => setLightboxImage(submission)}
              >
                <img 
                  src={submission.image_url} 
                  alt={submission.caption || 'User submission'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-medium text-sm">{submission.user_name}</p>
                    {submission.caption && (
                      <p className="text-slate-400 text-xs line-clamp-2 mt-1">{submission.caption}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(submission.id)}
                    className="text-red-400 hover:bg-red-900/30 flex-shrink-0"
                    data-testid={`delete-submission-${submission.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage.image_url}
              alt={lightboxImage.caption || 'User submission'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{lightboxImage.user_name}</p>
              {lightboxImage.caption && <p className="text-slate-400 mt-1">{lightboxImage.caption}</p>}
              <p className="text-slate-500 text-sm mt-2">{new Date(lightboxImage.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Users Tab - Manage users and gift tokens
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [giftTokens, setGiftTokens] = useState(10);
  const [giftMessage, setGiftMessage] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [staffTitle, setStaffTitle] = useState('');
  const [cashouts, setCashouts] = useState([]);
  const [showCashouts, setShowCashouts] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCashouts();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminGetUsers();
      setUsers(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCashouts = async () => {
    try {
      const data = await adminGetCashouts();
      setCashouts(data);
    } catch (err) {
      console.error('Error fetching cashouts:', err);
    }
  };

  const handleGiftTokens = async () => {
    if (!selectedUser || giftTokens < 1) return;
    
    setIsGifting(true);
    try {
      const result = await adminGiftTokens(selectedUser.id, giftTokens, giftMessage || null);
      toast({ 
        title: 'Tokens Gifted!', 
        description: `${giftTokens} tokens sent to ${result.user_name}. New balance: ${result.new_balance}` 
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, token_balance: result.new_balance }
          : u
      ));
      
      setSelectedUser(null);
      setGiftTokens(10);
      setGiftMessage('');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGifting(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    if (!newRole) return;
    
    try {
      await adminUpdateUserRole(userId, newRole, newRole === 'staff' ? staffTitle : null);
      toast({ title: 'Role Updated', description: `User role changed to ${newRole}` });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, role: newRole, staff_title: newRole === 'staff' ? staffTitle : u.staff_title }
          : u
      ));
      
      setEditingRole(null);
      setNewRole('');
      setStaffTitle('');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleProcessCashout = async (cashoutId, status) => {
    try {
      await adminProcessCashout(cashoutId, status);
      toast({ title: 'Cashout Processed', description: `Request ${status}` });
      setCashouts(prev => prev.map(c => 
        c.id === cashoutId ? { ...c, status } : c
      ));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getRoleBadge = (role, staffTitle) => {
    const config = {
      admin: { label: 'Admin', color: 'bg-red-600', icon: BadgeCheck },
      management: { label: 'Management', color: 'bg-purple-600', icon: Briefcase },
      staff: { label: staffTitle || 'Staff', color: 'bg-blue-600', icon: Award },
      customer: { label: 'Member', color: 'bg-slate-600', icon: User }
    };
    const c = config[role] || config.customer;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCashouts = cashouts.filter(c => c.status === 'pending');

  if (loading) return <div className="text-white text-center py-8">Loading users...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">User Profiles ({users.length})</h3>
        <Button
          variant={showCashouts ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCashouts(!showCashouts)}
          className={showCashouts ? "bg-green-600" : "border-slate-600 text-slate-300"}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Cashouts {pendingCashouts.length > 0 && `(${pendingCashouts.length})`}
        </Button>
      </div>

      {/* Pending Cashouts */}
      {showCashouts && pendingCashouts.length > 0 && (
        <Card className="bg-green-900/30 border-green-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Pending Cashout Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCashouts.map(co => (
              <div key={co.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">${co.amount_usd.toFixed(2)} via {co.payment_method}</p>
                  <p className="text-xs text-slate-400">{co.payment_details}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleProcessCashout(co.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleProcessCashout(co.id, 'rejected')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white flex-1"
          data-testid="user-search-input"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-md px-3"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="staff">Staff</option>
          <option value="management">Management</option>
        </select>
      </div>

      {/* Gift Tokens Modal */}
      {selectedUser && !editingRole && (
        <Card className="bg-amber-900/30 border-amber-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              Gift Tokens to {selectedUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">Current balance:</span>
              <span className="text-amber-400 font-bold">{selectedUser.token_balance || 0} tokens</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setGiftTokens(amount)}
                  className={`p-2 rounded-lg border transition-all ${
                    giftTokens === amount
                      ? 'border-amber-500 bg-amber-500/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={giftTokens}
                onChange={e => setGiftTokens(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-slate-800 border-slate-600 text-white w-24"
              />
              <span className="text-slate-400">tokens (${(giftTokens / 10).toFixed(2)} value)</span>
            </div>

            <Input
              placeholder="Optional message..."
              value={giftMessage}
              onChange={e => setGiftMessage(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleGiftTokens}
                disabled={isGifting}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                data-testid="confirm-gift-btn"
              >
                <Coins className="w-4 h-4 mr-2" />
                {isGifting ? 'Sending...' : `Gift ${giftTokens} Tokens`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <Card className="bg-purple-900/30 border-purple-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Change Role for {editingRole.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">Current role:</span>
              {getRoleBadge(editingRole.role, editingRole.staff_title)}
            </div>
            
            <div>
              <label className="text-sm text-slate-400 block mb-2">New Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['customer', 'staff', 'management'].map(role => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`p-2 rounded-lg border capitalize transition-all ${
                      newRole === role
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-600 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {newRole === 'staff' && (
              <div>
                <label className="text-sm text-slate-400 block mb-2">Staff Title</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Bartender', 'Server', 'DJ', 'Host'].map(title => (
                    <button
                      key={title}
                      onClick={() => setStaffTitle(title)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        staffTitle === title
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <Input
                  value={staffTitle}
                  onChange={e => setStaffTitle(e.target.value)}
                  placeholder="Or enter custom title..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => handleUpdateRole(editingRole.id)}
                disabled={!newRole}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Update Role
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditingRole(null); setNewRole(''); setStaffTitle(''); }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map(user => (
            <Card key={user.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Profile Photo or Avatar */}
                    {user.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `${process.env.REACT_APP_BACKEND_URL}${user.profile_photo_url}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
                      />
                    ) : (
                      <span className="text-3xl">{user.avatar_emoji || '😊'}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{user.name}</p>
                        {getRoleBadge(user.role, user.staff_title)}
                      </div>
                      <p className="text-slate-400 text-sm">{user.email || 'No email'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>Visits: {user.total_visits || 0}</span>
                        <span>Posts: {user.total_posts || 0}</span>
                        {user.role === 'staff' && (
                          <span className="text-green-400">Tips: ${(user.cashout_balance || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Token Balance */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">{user.token_balance || 0}</span>
                      </div>
                      <span className="text-xs text-slate-500">tokens</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => { setEditingRole(user); setNewRole(user.role); setStaffTitle(user.staff_title || ''); }}
                        className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-600/50"
                        title="Change Role"
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-600/50"
                        data-testid={`gift-tokens-${user.id}`}
                        title="Gift Tokens"
                      >
                        <Gift className="w-4 h-4" />
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
  );
};

// Main Admin Page Component
const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await checkAdminAuth();
    setIsAuthenticated(!!user);
    setLoading(false);
    if (user) {
      fetchStats();
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={checkAuth} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'specials', label: 'Post Special', icon: Megaphone },
    { id: 'events', label: 'Events', icon: Ticket },
    { id: 'gallery', label: 'Gallery', icon: Grid3X3 },
    { id: 'submissions', label: 'Submissions', icon: ImageUp },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
    { id: 'users', label: 'Users', icon: Coins },
    { id: 'members', label: 'Loyalty', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-black" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers"
              className="h-10 cursor-pointer"
              onClick={() => navigate('/')}
            />
            <span className="text-white font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white"
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
              data-testid="admin-logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            <DashboardStats stats={stats} />
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setActiveTab('specials')} className="bg-red-600 hover:bg-red-700">
                    <Megaphone className="w-4 h-4 mr-2" /> Post Special
                  </Button>
                  <Button onClick={() => setActiveTab('gallery')} className="bg-orange-600 hover:bg-orange-700">
                    <Grid3X3 className="w-4 h-4 mr-2" /> Manage Gallery
                  </Button>
                  <Button onClick={() => setActiveTab('menu')} className="bg-yellow-600 hover:bg-yellow-700">
                    <UtensilsCrossed className="w-4 h-4 mr-2" /> Manage Menu
                  </Button>
                  <Button onClick={() => setActiveTab('notifications')} className="bg-purple-600 hover:bg-purple-700">
                    <Bell className="w-4 h-4 mr-2" /> Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'specials' && <SpecialsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'submissions' && <GallerySubmissionsTab />}
        {activeTab === 'locations' && <LocationsTab />}
        {activeTab === 'videos' && <VideosTab />}
        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'members' && <LoyaltyMembersTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'menu' && <MenuItemsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
};

export default AdminPage;
