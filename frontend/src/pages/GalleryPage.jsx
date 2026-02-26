import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Play, Image as ImageIcon, Video, Upload, Camera, User, CheckCircle, Plus, Settings, LogOut, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { 
  getPublicGallery, 
  submitGalleryPhoto, 
  uploadImage,
  verifyAdminToken,
  createGalleryItem,
  deleteGalleryItem,
  getPageContent
} from '../services/api';

// Default gallery content using actual Fin & Feathers images (fallback)
const defaultGalleryItems = [
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg', caption: 'F&F Signature Wings', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC05965_edited-1.jpg', caption: "Fin's Tacos", category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC05963_edited-1.jpg', caption: 'Dynamite Pepper Shrimp', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg', caption: 'Marinated Malibu Ribeye', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Honey-Bourbon-Salmon-scaled.jpg', caption: 'Honey Bourbon Salmon', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/IMG_1574-e1666013652186.jpg', caption: 'New Zealand Lamb Chops', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6624.jpg', caption: 'Lobster Tails', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg', caption: 'Shrimp & Grits', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg', caption: 'Chicken & Waffle', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Jerk-Turkey-Burger-scaled.jpg', caption: 'F&F Jerk Turkey Burger', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Fire-Chicken-Sandwhich-scaled.jpg', caption: 'Fire Chicken Sandwich', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6577.jpg', caption: 'Fried Pickles', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/3.png', caption: 'French Toast', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-The-Ultimate-scaled.jpg', caption: 'Ultimate French Toast Sandwich', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Breakfast-Burrito-1-scaled.jpg', caption: 'Breakfast Burrito', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg', caption: 'Restaurant Ambiance', category: 'ambiance' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg', caption: 'Dining Experience', category: 'ambiance' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/augies_cafe_smb_parent__atlanta__new_business__86_hero-e1666179925108.jpg', caption: 'Brunch Setting', category: 'ambiance' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2025/06/Patron-1.webp', caption: 'Margarita Special', category: 'drinks' },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [pageContent, setPageContent] = useState({});
  
  // User/Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState('patron');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Check user status on mount
  useEffect(() => {
    const checkUserStatus = async () => {
      // Check if admin
      const isValidAdmin = await verifyAdminToken();
      setIsAdmin(isValidAdmin);
      
      // Check if user is logged in
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        setCurrentUser(JSON.parse(userProfile));
      }
      
      // Check if checked in
      const checkedIn = localStorage.getItem('checkedInLocation');
      if (checkedIn) {
        setIsCheckedIn(true);
      }
    };
    
    checkUserStatus();
    fetchGallery();
    fetchPageContent();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const data = await getPublicGallery();
      if (data && data.length > 0) {
        const transformedData = data.map(item => ({
          id: item.id,
          type: 'image',
          url: item.image_url,
          caption: item.title,
          category: item.category,
          submittedBy: item.submitted_by
        }));
        setGalleryItems(transformedData);
      } else {
        setGalleryItems(defaultGalleryItems);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setGalleryItems(defaultGalleryItems);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageContent = async () => {
    try {
      const content = await getPageContent('gallery');
      const map = {};
      (content || []).forEach((entry) => {
        map[entry.section_key] = entry.html || '';
      });
      setPageContent(map);
    } catch (error) {
      console.error('Failed to fetch page content', error);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
        setShowUploadModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Check if user can upload photos
  const canUploadPhotos = currentUser || isCheckedIn || isAdmin;

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image must be under 10MB', variant: 'destructive' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo upload
  const handleUploadPhoto = async () => {
    if (!previewImage) {
      toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' });
      return;
    }

    setUploadingImage(true);
    try {
      // Convert base64 to blob for upload
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      // Upload image
      const uploadResult = await uploadImage(file);
      
      if (isAdmin) {
        // Admin creates gallery item directly
        await createGalleryItem({
          title: uploadCaption || 'Gallery Photo',
          image_url: uploadResult.url,
          category: uploadCategory
        });
        toast({ title: 'Success', description: 'Photo added to gallery!' });
      } else if (currentUser) {
        // User submits photo for approval
        await submitGalleryPhoto(
          currentUser.id,
          uploadResult.url,
          uploadCaption,
          isCheckedIn ? localStorage.getItem('checkedInLocation') : null
        );
        toast({ title: 'Submitted!', description: 'Your photo has been submitted for review.' });
      }
      
      // Reset and refresh
      setShowUploadModal(false);
      setPreviewImage(null);
      setUploadCaption('');
      setUploadCategory('patron');
      fetchGallery();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle delete (admin only)
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      await deleteGalleryItem(itemId);
      toast({ title: 'Deleted', description: 'Gallery item removed' });
      fetchGallery();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setEditMode(false);
    toast({ title: 'Logged Out', description: 'Admin session ended' });
  };

  // Filter items based on category
  const filteredItems = activeFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter || item.type === activeFilter);

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'food', label: 'Food', icon: null },
    { id: 'drinks', label: 'Drinks', icon: null },
    { id: 'ambiance', label: 'Ambiance', icon: null },
    { id: 'patron', label: 'Guest Photos', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 px-4">
      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode - Gallery Manager</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditMode(false)}
                className="border-white text-white hover:bg-white/20 h-8"
              >
                Done Editing
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setEditMode(true)}
                className="bg-white text-red-600 hover:bg-gray-100 h-8"
              >
                Edit Gallery
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 hover:bg-green-700 h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Photo
            </Button>
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

      <div className={`max-w-6xl mx-auto ${isAdmin ? 'mt-12' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-white hover:bg-slate-800"
              data-testid="gallery-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Gallery</h1>
              <p className="text-slate-400 text-sm">Photos & Videos from Fin & Feathers</p>
            </div>
          </div>
          
          {/* Upload Button for Users */}
          {canUploadPhotos && !isAdmin && (
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="upload-photo-btn"
            >
              <Camera className="w-4 h-4 mr-2" />
              Share Your Photo
            </Button>
          )}
        </div>

        {/* User Status Banner */}
        {(currentUser || isCheckedIn) && !isAdmin && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400 text-sm">
              {isCheckedIn ? "You're checked in! " : ""}
              {currentUser ? `Welcome, ${currentUser.name}! ` : ""}
              Share your F&F experience with us!
            </span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              variant={activeFilter === cat.id ? 'default' : 'outline'}
              className={`
                ${activeFilter === cat.id 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                  : 'bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }
                text-sm px-4 py-2 rounded-full
              `}
              data-testid={`filter-${cat.id}`}
            >
              {cat.icon && <cat.icon className="w-4 h-4 mr-1" />}
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id || index}
              className="aspect-square rounded-lg overflow-hidden group cursor-pointer relative bg-slate-900"
              data-testid={`gallery-item-${index}`}
            >
              <button
                onClick={() => !editMode && setSelectedItem(item)}
                className="w-full h-full"
              >
                <img 
                  src={item.type === 'video' ? item.thumbnail : item.url}
                  alt={item.caption || `Gallery item ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  ) : !editMode && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-3xl">
                      +
                    </span>
                  )}
                </div>

                {/* Caption on hover */}
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs truncate">{item.caption}</p>
                    {item.submittedBy && (
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <User className="w-3 h-3" /> Guest Photo
                      </p>
                    )}
                  </div>
                )}

                {/* Patron badge */}
                {item.category === 'patron' && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Guest
                  </div>
                )}
              </button>

              {/* Delete button for admin in edit mode */}
              {editMode && isAdmin && item.id && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No items found in this category</p>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-red-500" />
                    {isAdmin ? 'Add to Gallery' : 'Share Your Photo'}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Image Preview/Upload Area */}
                <div 
                  className="border-2 border-dashed border-slate-600 rounded-lg p-4 mb-4 text-center cursor-pointer hover:border-red-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div className="py-8">
                      <Upload className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400">Click to select an image</p>
                      <p className="text-slate-500 text-xs mt-1">Max 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Caption */}
                <div className="mb-4">
                  <label className="text-sm text-slate-300 mb-1 block">Caption (optional)</label>
                  <Input
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Describe your photo..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Category (Admin only) */}
                {isAdmin && (
                  <div className="mb-4">
                    <label className="text-sm text-slate-300 mb-1 block">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="food">Food</option>
                      <option value="drinks">Drinks</option>
                      <option value="ambiance">Ambiance</option>
                      <option value="patron">Guest Photo</option>
                    </select>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleUploadPhoto}
                  disabled={!previewImage || uploadingImage}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {uploadingImage ? (
                    'Uploading...'
                  ) : isAdmin ? (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Gallery
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Submit Photo
                    </>
                  )}
                </Button>

                {!isAdmin && (
                  <p className="text-slate-500 text-xs text-center mt-3">
                    Photos are reviewed before appearing in the gallery
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedItem && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
            data-testid="gallery-lightbox"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors z-10"
              data-testid="lightbox-close-btn"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="max-w-5xl max-h-[90vh] w-full relative" onClick={(e) => e.stopPropagation()}>
              {selectedItem.type === 'video' ? (
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <video
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full rounded-lg"
                    poster={selectedItem.thumbnail}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <img 
                  src={selectedItem.url}
                  alt={selectedItem.caption || 'Gallery image'}
                  className="max-w-full max-h-[80vh] mx-auto object-contain rounded-lg"
                />
              )}
              
              {selectedItem.caption && (
                <p className="text-white text-center mt-4 text-lg">{selectedItem.caption}</p>
              )}
              {selectedItem.submittedBy && (
                <p className="text-slate-400 text-center mt-2 text-sm flex items-center justify-center gap-2">
                  <User className="w-4 h-4" /> Guest Photo
                </p>
              )}
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-8"
            data-testid="gallery-home-btn"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
