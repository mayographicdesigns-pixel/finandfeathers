import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Play, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getPublicGallery } from '../services/api';

// Default gallery content using actual Fin & Feathers images (fallback)
const defaultGalleryItems = [
  // Food Images from F&F website
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
  // Brunch Images
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/3.png', caption: 'French Toast', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-The-Ultimate-scaled.jpg', caption: 'Ultimate French Toast Sandwich', category: 'food' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Breakfast-Burrito-1-scaled.jpg', caption: 'Breakfast Burrito', category: 'food' },
  // Ambiance Images
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg', caption: 'Restaurant Ambiance', category: 'ambiance' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg', caption: 'Dining Experience', category: 'ambiance' },
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/augies_cafe_smb_parent__atlanta__new_business__86_hero-e1666179925108.jpg', caption: 'Brunch Setting', category: 'ambiance' },
  // Drinks
  { type: 'image', url: 'https://finandfeathersrestaurants.com/wp-content/uploads/2025/06/Patron-1.webp', caption: 'Margarita Special', category: 'drinks' },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch gallery items from API with fallback to defaults
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getPublicGallery();
        if (data && data.length > 0) {
          // Transform API data to match our format
          const transformedData = data.map(item => ({
            type: 'image',
            url: item.image_url,
            caption: item.title,
            category: item.category
          }));
          setGalleryItems(transformedData);
        } else {
          // Use default items if API returns empty
          setGalleryItems(defaultGalleryItems);
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
        // Fallback to defaults on error
        setGalleryItems(defaultGalleryItems);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Filter items based on category
  const filteredItems = activeFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter || item.type === activeFilter);

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'image', label: 'Photos', icon: ImageIcon },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'food', label: 'Food', icon: null },
    { id: 'ambiance', label: 'Ambiance', icon: null },
    { id: 'drinks', label: 'Drinks', icon: null },
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
            <button
              key={index}
              onClick={() => setSelectedItem(item)}
              className="aspect-square rounded-lg overflow-hidden group cursor-pointer relative bg-slate-900"
              data-testid={`gallery-item-${index}`}
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
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-3xl">
                    +
                  </span>
                )}
              </div>

              {/* Caption on hover */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs truncate">{item.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No items found in this category</p>
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
