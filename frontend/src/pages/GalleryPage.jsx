import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Play, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '../components/ui/button';

// Default gallery content (can be managed via admin panel later)
const defaultGalleryItems = [
  // Images
  { type: 'image', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop', caption: 'Fresh & Hot Pizza', category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&h=800&fit=crop', caption: 'Seafood Delight', category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=800&fit=crop', caption: "Chef's Special", category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=800&fit=crop', caption: 'Wings & Things', category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=800&fit=crop', caption: 'Fine Dining Experience', category: 'ambiance' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=800&fit=crop', caption: 'Restaurant Interior', category: 'ambiance' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=800&fit=crop', caption: 'Bar & Lounge', category: 'ambiance' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=800&fit=crop', caption: 'Premium Steak', category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=800&fit=crop', caption: 'Dessert Selection', category: 'food' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1482049016gy85-7d3e86aa738d?w=800&h=800&fit=crop', caption: 'Cocktails & Spirits', category: 'drinks' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&h=800&fit=crop', caption: 'Signature Cocktails', category: 'drinks' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&h=800&fit=crop', caption: 'Brunch Favorites', category: 'food' },
  // Videos (placeholders - these would be actual video URLs in production)
  { type: 'video', url: 'https://customer-assets.emergentagent.com/videos/restaurant-promo.mp4', thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=450&fit=crop', caption: 'Welcome to Fin & Feathers', category: 'promo' },
  { type: 'video', url: 'https://customer-assets.emergentagent.com/videos/kitchen-tour.mp4', thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=450&fit=crop', caption: 'Behind the Scenes', category: 'promo' },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

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
