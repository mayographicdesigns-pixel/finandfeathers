import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, Phone, Mail, Instagram, Facebook, Twitter, Clock, X, Image as ImageIcon, Edit2, Save, LogOut, Settings, GripVertical, Navigation, User, ShoppingBag, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import DailyVideoCarousel from '../components/DailyVideoCarousel';
import { locations } from '../mockData';
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
import { 
  signupLoyalty, 
  subscribeToPush, 
  getPublicSocialLinks, 
  getPublicInstagramFeed, 
  getPublicSpecials,
  getHomepageContent,
  updateHomepageContent,
  verifyAdminToken,
  uploadImage,
  getPageContent
} from '../services/api';

// Welcome Popup Component
const WelcomePopup = ({ onClose, onSubmit }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [findingLocation, setFindingLocation] = useState(false);
  const [closestLocation, setClosestLocation] = useState(null);

  // Find closest location on mount
  useEffect(() => {
    findClosestLocation();
  }, []);

  const findClosestLocation = () => {
    setFindingLocation(true);
    
    if (!navigator.geolocation) {
      // Default to first location if geolocation not available
      setClosestLocation(locations[0]);
      setFindingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Calculate distance to each location
        let nearest = locations[0];
        let minDistance = Infinity;
        
        locations.forEach(loc => {
          if (loc.coordinates) {
            const distance = calculateDistance(
              userLat, userLng,
              loc.coordinates.lat, loc.coordinates.lng
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearest = loc;
            }
          }
        });
        
        setClosestLocation(nearest);
        setFindingLocation(false);
      },
      (error) => {
        console.log('Geolocation error:', error);
        // Default to first location
        setClosestLocation(locations[0]);
        setFindingLocation(false);
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save user info to localStorage
      const userInfo = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('ff_user_info', JSON.stringify(userInfo));
      
      // Mark popup as shown (both sessionStorage and localStorage for form submission)
      sessionStorage.setItem('ff_welcome_shown_session', 'true');
      localStorage.setItem('ff_welcome_shown', 'true');
      
      // Call onSubmit callback
      if (onSubmit) {
        await onSubmit(userInfo);
      }
      
      // Navigate to closest location's social page
      if (closestLocation) {
        navigate(`/locations/${closestLocation.slug}?checkin=true`);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Set sessionStorage to prevent showing again in this session
    sessionStorage.setItem('ff_welcome_shown_session', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-red-600/50 w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
          data-testid="welcome-close-btn"
        >
          <X className="w-6 h-6" />
        </button>

        <CardContent className="p-6 pt-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png"
              alt="Fin & Feathers"
              className="max-h-20 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to Fin & Feathers!
            </h2>
            <p className="text-slate-400 text-sm">
              Join the vibe and connect with others at your nearest location
            </p>
          </div>

          {/* Closest Location */}
          {closestLocation && (
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                <Navigation className="w-4 h-4" />
                <span>Your nearest location:</span>
              </div>
              <p className="text-white font-semibold">{closestLocation.name.replace('Fin & Feathers - ', '')}</p>
              <p className="text-slate-400 text-xs">{closestLocation.address}</p>
            </div>
          )}

          {findingLocation && (
            <div className="text-center text-slate-400 text-sm mb-4">
              <span className="animate-pulse">Finding your nearest location...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                required
                data-testid="welcome-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="welcome-phone-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="welcome-email-input"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
              data-testid="welcome-submit-btn"
            >
              {isSubmitting ? 'Connecting...' : 'Join the Vibe'}
            </Button>

            <p className="text-slate-500 text-xs text-center">
              We'll take you to the social hub at your nearest location
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Default content
const defaultContent = {
  tagline: "ELEVATED DINING MEETS SOUTHERN SOUL. EVERY DISH CRAFTED WITH FRESH INGREDIENTS AND GENUINE HOSPITALITY",
  logo_url: "https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png",
  contact_phone: "(404) 855-5524",
  contact_email: "info@finandfeathersrestaurants.com",
  contact_address: "Multiple Locations across Georgia & Las Vegas",
  social_feed_images: [
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg', caption: 'F&F Signature Wings' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg', caption: 'Shrimp & Grits' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg', caption: 'Malibu Ribeye' },
    { url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg', caption: 'Chicken & Waffle' },
  ]
};

// Sortable Image Component for drag-and-drop reordering
const SortableImage = ({ image, index, editMode, editingImageIndex, setEditingImageIndex, setLightboxImage, editingContent, setEditingContent, fileInputRef, handleImageUpload }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
    >
      {/* Drag Handle - only in edit mode */}
      {editMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-1 left-1 z-10 bg-black/70 rounded p-1 cursor-grab active:cursor-grabbing hover:bg-black/90 transition-colors"
          data-testid={`drag-handle-image-${index}`}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
      
      <button
        onClick={() => editMode ? setEditingImageIndex(index) : setLightboxImage(image)}
        className={`aspect-square rounded-lg overflow-hidden cursor-pointer block w-full ${editMode ? 'ring-2 ring-red-500 ring-dashed' : ''}`}
        data-testid={`social-feed-image-${index}`}
      >
        <img 
          src={image.url}
          alt={image.caption || `Feed image ${index + 1}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {editMode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-6 h-6 text-white" />
          </div>
        )}
      </button>
      
      {/* Edit Modal for Image */}
      {editMode && editingImageIndex === index && (
        <div className="absolute top-full left-0 mt-2 z-20 bg-slate-800 border border-slate-600 rounded-lg p-3 w-64 shadow-xl">
          <Input
            placeholder="Image URL"
            value={editingContent.social_feed_images[index]?.url || ''}
            onChange={(e) => {
              const newImages = [...editingContent.social_feed_images];
              newImages[index] = { ...newImages[index], url: e.target.value };
              setEditingContent({ ...editingContent, social_feed_images: newImages });
            }}
            className="bg-slate-900 border-slate-700 text-white text-sm mb-2"
          />
          <Input
            placeholder="Caption"
            value={editingContent.social_feed_images[index]?.caption || ''}
            onChange={(e) => {
              const newImages = [...editingContent.social_feed_images];
              newImages[index] = { ...newImages[index], caption: e.target.value };
              setEditingContent({ ...editingContent, social_feed_images: newImages });
            }}
            className="bg-slate-900 border-slate-700 text-white text-sm mb-2"
          />
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageUpload(e, index)}
              accept="image/*"
              className="hidden"
            />
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-xs"
            >
              Upload
            </Button>
            <Button 
              size="sm" 
              onClick={() => setEditingImageIndex(null)}
              className="bg-red-600 hover:bg-red-700 text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const LinkTreeHomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);
  const [instagramFeed, setInstagramFeed] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Welcome popup state
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  
  // Admin editing state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(defaultContent);
  const [editingContent, setEditingContent] = useState(defaultContent);
  const [pageContent, setPageContent] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const fileInputRef = useRef(null);

  // DnD sensors for image reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle drag end for image reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id.replace('image-', ''));
    const newIndex = parseInt(over.id.replace('image-', ''));
    
    const newImages = arrayMove(editingContent.social_feed_images, oldIndex, newIndex);
    setEditingContent({ ...editingContent, social_feed_images: newImages });
    toast({ title: 'Reordered', description: 'Image order updated. Click "Save Changes" to persist.' });
  };

  // Check if welcome popup should be shown - uses sessionStorage to show once per browser session
  useEffect(() => {
    // Check both sessionStorage (current session) and localStorage (user submitted form)
    const hasSeenThisSession = sessionStorage.getItem('ff_welcome_shown_session');
    const hasSubmittedForm = localStorage.getItem('ff_welcome_shown');
    
    if (!hasSeenThisSession && !hasSubmittedForm) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Check if admin is logged in
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
    
    // Fetch all data
    const fetchData = async () => {
      try {
        const [links, feed, activeSpecials, homepageContent, homePageContent] = await Promise.all([
          getPublicSocialLinks(),
          getPublicInstagramFeed(),
          getPublicSpecials(),
          getHomepageContent(),
          getPageContent('home')
        ]);
        setSocialLinks(links);
        setInstagramFeed(feed);
        setSpecials(activeSpecials);

        const pageContentMap = {};
        (homePageContent || []).forEach((entry) => {
          pageContentMap[entry.section_key] = entry.html || '';
        });
        setPageContent(pageContentMap);
        
        // Set homepage content - merge with defaults to ensure all fields exist
        if (homepageContent) {
          const mergedContent = { ...defaultContent, ...homepageContent };
          // Ensure social_feed_images is always an array
          if (!mergedContent.social_feed_images || !Array.isArray(mergedContent.social_feed_images)) {
            mergedContent.social_feed_images = defaultContent.social_feed_images;
          }
          setContent(mergedContent);
          setEditingContent(mergedContent);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleLoyaltySignup = async (e) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast({
        title: "Required Fields",
        description: "Please enter your name and email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      await signupLoyalty({
        full_name: name,
        email: email,
        phone_number: phone || null,
        marketing_consent: agreeToMarketing
      });

      toast({
        title: "Welcome to Fin & Feathers!",
        description: "You've been added to our loyalty program."
      });

      // Clear form
      setEmail('');
      setName('');
      setPhone('');
      setAgreeToMarketing(false);

      // Redirect to Toast Tab rewards signup
      window.open('https://www.toasttab.com/fins-feathers-douglasville-7430-douglas-blvd-zmrgr/rewardsSignup', '_blank');
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error.message || "Unable to complete signup. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Admin functions
  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await updateHomepageContent(editingContent);
      setContent(editingContent);
      setEditMode(false);
      toast({ title: 'Success', description: 'Homepage content saved!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContent(content);
    setEditMode(false);
    setEditingImageIndex(null);
  };

  const handleImageUpload = async (e, index) => {
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

    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${result.url}`;
      
      const newImages = [...editingContent.social_feed_images];
      newImages[index] = { ...newImages[index], url: fullUrl };
      setEditingContent({ ...editingContent, social_feed_images: newImages });
      toast({ title: 'Success', description: 'Image uploaded!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingImageIndex(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setEditMode(false);
    toast({ title: 'Logged Out', description: 'Admin session ended' });
  };

  // Default social links if none configured
  const defaultSocialLinks = [
    { platform: 'instagram', url: 'https://instagram.com/finandfeathers', username: '@finandfeathers' },
    { platform: 'facebook', url: 'https://facebook.com/finandfeathers', username: 'Fin & Feathers' },
    { platform: 'twitter', url: 'https://twitter.com/finandfeathers', username: '@finandfeathers' }
  ];

  const displaySocialLinks = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;
  const displayContent = editMode ? editingContent : content;
  const heroHtml = pageContent.hero || displayContent.tagline;

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'tiktok': return () => <span className="text-lg">🎵</span>;
      default: return ExternalLink;
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4 relative">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <WelcomePopup 
          onClose={() => setShowWelcomePopup(false)}
          onSubmit={(userInfo) => {
            // Optionally save user info to backend/loyalty
            console.log('User info submitted:', userInfo);
          }}
        />
      )}

      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleSaveContent}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 h-8"
                  data-testid="save-homepage-btn"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="border-white text-white hover:bg-white/20 h-8"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setEditMode(true)}
                className="bg-white text-red-600 hover:bg-gray-100 h-8"
                data-testid="edit-homepage-btn"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Page
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

      <div className={`max-w-2xl mx-auto ${isAdmin ? 'pt-12' : ''}`}>
        {/* Logo/Header */}
        <div className="text-center mb-8 relative group">
          {editMode && (
            <div className="absolute -top-2 -right-2 z-10">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Editable</span>
            </div>
          )}
          <img 
            src={displayContent.logo_url}
            alt="Fin & Feathers Restaurants"
            className={`max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain ${editMode ? 'ring-2 ring-red-500 ring-dashed rounded-lg p-2' : ''}`}
          />
          {editMode ? (
            <Input
              value={editingContent.tagline}
              onChange={(e) => setEditingContent({ ...editingContent, tagline: e.target.value })}
              className="bg-slate-800 border-red-500 text-white text-center max-w-md mx-auto"
              data-testid="edit-tagline-input"
            />
          ) : (
            <p className="text-slate-300 text-sm">{displayContent.tagline}</p>
          )}
        </div>

        {/* Weekly Specials Section */}
        <Card className="mb-6 bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-600/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white">This Week's Specials</h2>
            </div>
            <DailyVideoCarousel />
          </CardContent>
        </Card>

        {/* Main Link Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => navigate('/menu')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            View Full Menu
          </Button>

          <Button
            onClick={() => navigate('/locations')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find a Location
          </Button>

          <Button
            onClick={() => navigate('/locations?order=1')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="order-online-btn"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order Online
          </Button>

          <Button
            onClick={() => navigate('/gallery')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="gallery-btn"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Gallery
          </Button>
        </div>

        {/* Gallery Preview - Links to Gallery Page */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">Gallery</h2>
              {editMode && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2">
                  Drag to reorder • Click to edit
                </span>
              )}
            </div>
            
            {editMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayContent.social_feed_images.map((_, index) => `image-${index}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {displayContent.social_feed_images.map((image, index) => (
                      <SortableImage
                        key={`image-${index}`}
                        image={image}
                        index={index}
                        editMode={editMode}
                        editingImageIndex={editingImageIndex}
                        setEditingImageIndex={setEditingImageIndex}
                        setLightboxImage={setLightboxImage}
                        editingContent={editingContent}
                        setEditingContent={setEditingContent}
                        fileInputRef={fileInputRef}
                        handleImageUpload={handleImageUpload}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div 
                className="grid grid-cols-4 gap-2 mb-4 cursor-pointer"
                onClick={() => navigate('/gallery')}
              >
                {displayContent.social_feed_images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div
                      className="aspect-square rounded-lg overflow-hidden block w-full"
                      data-testid={`gallery-preview-image-${index}`}
                    >
                      <img 
                        src={image.url}
                        alt={image.caption || `Gallery image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* View Full Gallery Button */}
            <Button
              onClick={() => navigate('/gallery')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white mb-4"
              data-testid="view-gallery-btn"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              View Full Gallery
            </Button>
            
            {/* Social Follow Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => window.open('https://instagram.com/finandfeathers', '_blank')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Instagram className="w-4 h-4 mr-2" />
                Follow on Instagram
              </Button>
              <Button
                onClick={() => window.open('https://facebook.com/finandfeathers', '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Follow on Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* More Link Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => navigate('/merch')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="merch-btn"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            F&F Merch Shop
          </Button>

          <Button
            onClick={() => navigate('/events')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="events-btn"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Events & Tickets
          </Button>

          <Button
            onClick={() => navigate('/account')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            data-testid="my-account-btn"
          >
            <User className="w-5 h-5 mr-2" />
            My Account
          </Button>

          <Button
            onClick={() => window.open('https://g.page/r/CfinandfeathersReview', '_blank')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Leave a Review
          </Button>
        </div>

        {/* Loyalty Signup Form */}
        <Card className="mb-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-red-600/30">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Join Our Loyalty Program</h2>
            <p className="text-slate-400 text-sm mb-4 text-center">Get exclusive offers and rewards!</p>
            
            <form onSubmit={handleLoyaltySignup} className="space-y-3">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
              <Input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              
              <label className="flex items-start gap-2 text-slate-400 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToMarketing}
                  onChange={(e) => setAgreeToMarketing(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  By checking this box, you agree to receive marketing communications from Fin & Feathers Restaurants via email, SMS, and push notifications
                </span>
              </label>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
              >
                Join Now
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info - Editable */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3 text-center">Contact Us</h3>
            {editMode && <span className="block text-center text-xs bg-red-500 text-white px-2 py-1 rounded mb-3 mx-auto w-fit">Edit Contact Info</span>}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_phone}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_phone: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-phone-input"
                  />
                ) : (
                  <a href={`tel:${displayContent.contact_phone}`} className="hover:text-red-400">
                    {displayContent.contact_phone}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_email}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_email: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-email-input"
                  />
                ) : (
                  <a href={`mailto:${displayContent.contact_email}`} className="hover:text-red-400">
                    {displayContent.contact_email}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                {editMode ? (
                  <Input
                    value={editingContent.contact_address}
                    onChange={(e) => setEditingContent({ ...editingContent, contact_address: e.target.value })}
                    className="bg-slate-900 border-red-500 text-white h-8 text-sm"
                    data-testid="edit-address-input"
                  />
                ) : (
                  <span>{displayContent.contact_address}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links Footer */}
        <div className="flex justify-center gap-4 mb-4">
          {displaySocialLinks.map((link, index) => {
            const Icon = getSocialIcon(link.platform);
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-300" />
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs">
          <p>&copy; 2024 Fin & Feathers Restaurants. All rights reserved.</p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && !editMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Gallery image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4 text-lg">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkTreeHomePage;
