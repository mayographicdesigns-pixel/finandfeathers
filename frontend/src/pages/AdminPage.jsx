import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Send, Bell, Users, Mail, UtensilsCrossed, 
  LogOut, BarChart3, Trash2, Eye, Check, X, Plus, Edit2, 
  Lock, User, AlertCircle, RefreshCw, Upload, Image, Megaphone, 
  Calendar, ToggleLeft, ToggleRight, Share2, Instagram, Facebook, ExternalLink
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
  getAdminInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost
} from '../services/api';

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
const SpecialsTab = () => {
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
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
      const result = await createSpecial(formData);
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
      
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
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
    setFormData({ title: '', description: '', image: '', send_notification: true });
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Post New Special */}
      <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-500" />
            Post a Special
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Create a special/promotion and automatically notify all app users
          </p>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full bg-red-600 hover:bg-red-700 h-12"
              data-testid="new-special-button"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Special
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm block mb-2">Special Title</label>
                <Input
                  placeholder="e.g., Weekend Happy Hour - 50% Off Apps!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                  data-testid="special-title-input"
                />
              </div>
              
              <div>
                <label className="text-slate-300 text-sm block mb-2">Description</label>
                <Textarea
                  placeholder="Describe the special... This will be shown to customers and in the notification"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                  required
                  data-testid="special-description-input"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Image (optional)</label>
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
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-slate-600 text-slate-300"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image && (
                  <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded mt-2" />
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, send_notification: !formData.send_notification })}
                  className="flex items-center gap-2"
                >
                  {formData.send_notification ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-500" />
                  )}
                </button>
                <div>
                  <p className="text-white text-sm font-medium">
                    {formData.send_notification ? 'Will notify all app users' : 'No notification'}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {formData.send_notification 
                      ? 'Push notification will be sent immediately to all users with the app installed'
                      : 'Special will be saved but no notification sent'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 h-11"
                  data-testid="post-special-button"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Megaphone className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Posting...' : 'Post Special'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Specials List */}
      <div>
        <h3 className="text-white font-semibold mb-4">All Specials ({specials.length})</h3>
        {specials.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center text-slate-400">
              No specials posted yet. Create your first special above!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {specials.map((special) => (
              <Card 
                key={special.id} 
                className={`border ${special.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {special.image && (
                      <img src={special.image} alt="" className="w-20 h-20 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-semibold">{special.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{special.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${special.is_active ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          {special.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>Created: {new Date(special.created_at).toLocaleDateString()}</span>
                        {special.notification_sent && (
                          <span className="text-green-400">
                            Notified {special.notification_sent_at && new Date(special.notification_sent_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
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
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
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
                  <Button onClick={() => setActiveTab('members')} className="bg-blue-600 hover:bg-blue-700">
                    <Users className="w-4 h-4 mr-2" /> View Members
                  </Button>
                  <Button onClick={() => setActiveTab('contacts')} className="bg-green-600 hover:bg-green-700">
                    <Mail className="w-4 h-4 mr-2" /> View Contacts
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

        {activeTab === 'members' && <LoyaltyMembersTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'menu' && <MenuItemsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
};

export default AdminPage;
