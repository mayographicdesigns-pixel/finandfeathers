import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Home, RefreshCw, Edit2, Save, X, Settings, LogOut, Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import MenuCard from '../components/MenuCard';
import MenuLineItem from '../components/MenuLineItem';
import ImageUploader from '../components/ImageUploader';
import ImageLightbox from '../components/ImageLightbox';
import { menuItems as mockMenuItems } from '../mockData';
import { getPublicMenuItems, verifyAdminToken, updateMenuItem, createMenuItem, deleteMenuItem, getPageContent, getDailySpecials } from '../services/api';
import { toast } from '../hooks/use-toast';

const MenuPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [pageContent, setPageContent] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [dailySpecialsMap, setDailySpecialsMap] = useState({});
  
  // Admin editing state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'starters',
    image_url: '',
    is_available: true
  });
  
  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState(null);

  // Category display names
  const categoryNames = {
    'daily-specials': '$5 Daily Specials',
    'starters': 'Starters',
    'sides': 'Sides',
    'entrees': 'Entrees',
    'seafood-grits': 'Seafood & Grits',
    'sandwiches': 'Sandwiches',
    'salads': 'Salads',
    'cocktails': 'Signature Cocktails',
    'signature-cocktails': 'Signature Cocktails',
    'mocktails': 'Handcrafted Mocktails',
    'sodas-spritzers': 'Sodas & Spritzers',
    'teas-lemonades': 'Teas & Lemonades',
    'chilled-juices': 'Chilled Juices',
    'custom-lemonades': 'Custom Fruit Lemonades',
    'hookah': 'Hookah',
    'brunch': 'Brunch',
    'brunch-drinks': 'Brunch Drinks',
    'brunch-sides': 'Brunch Sides'
  };

  // Main categories (4 buttons)
  const mainCategories = [
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'daily-specials', name: '$5 Daily Specials', icon: '⭐' },
    { id: 'food', name: 'Food', icon: '🍽️' },
    { id: 'cocktails', name: 'Cocktails', icon: '🍹' },
    { id: 'non-alcoholic', name: 'Non-Alcoholic', icon: '🥤' },
    { id: 'hookah', name: 'Hookah', icon: '💨' }
  ];

  // Food sub-categories
  const foodSubCategories = [
    { id: 'starters', name: 'Starters', icon: '🍤' },
    { id: 'sides', name: 'Sides', icon: '🍟' },
    { id: 'entrees', name: 'Entrees', icon: '🍖' },
    { id: 'seafood-grits', name: 'Seafood & Grits', icon: '🦞' },
    { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
    { id: 'salads', name: 'Salads', icon: '🥗' },
    { id: 'brunch', name: 'Brunch', icon: '🥞' },
    { id: 'brunch-sides', name: 'Brunch Sides', icon: '🥓' }
  ];

  // Cocktails sub-categories
  const cocktailSubCategories = [
    { id: 'signature-cocktails', name: 'Signature Cocktails', icon: '🍸' },
    { id: 'brunch-drinks', name: 'Brunch Drinks', icon: '🥂' }
  ];

  // All food category IDs
  const foodCategoryIds = ['starters', 'sides', 'entrees', 'seafood-grits', 'sandwiches', 'salads', 'brunch', 'brunch-sides'];
  
  // All cocktail category IDs
  const cocktailCategoryIds = ['cocktails', 'signature-cocktails', 'brunch-drinks'];
  const nonAlcoholicCategoryIds = ['mocktails', 'sodas-spritzers', 'teas-lemonades', 'chilled-juices', 'custom-lemonades'];

  // Daily Specials by day of week
  const DEFAULT_DAILY_SPECIALS = {
    0: { // Sunday
      name: "The Sunday Slide",
      description: "Close out the weekend with $5 Daily Specials",
      hours: "6pm – Close",
      emoji: "🌅"
    },
    1: { // Monday
      name: "Margarita Monday",
      description: "Sip on $5 Margaritas all day long",
      hours: "12pm – 8pm",
      emoji: "🍹"
    },
    2: { // Tuesday
      name: "Tito's, Tacos & Tequila",
      description: "$5 Tito's, $5 Margaritas, and $5 Tacos. The perfect Tuesday trio",
      hours: "12pm – 8pm",
      emoji: "🌮"
    },
    3: { // Wednesday
      name: "Wine Down (or Whiskey Up)",
      description: "$5 Select wine glasses, $10 Bottles, or $5 Select Whiskey shots",
      hours: "12pm – 8pm",
      emoji: "🍷"
    },
    4: { // Thursday
      name: "Martini Madness",
      description: "Elevate your Thursday with $5 Martinis. Strawberry, Peach, Mango, Watermelon, Lemon Drop, Melon, Blue (+$1)",
      hours: "12pm – 8pm",
      emoji: "🍸"
    },
    5: { // Friday
      name: "The Premium Power Hour",
      description: "$6 Select Premium cocktails and shots",
      hours: "6pm – 8pm",
      emoji: "⚡"
    },
    6: { // Saturday
      name: "Saturday Prime",
      description: "Special $5 menu available",
      hours: "5pm – 8pm",
      emoji: "🌟"
    }
  };

  const buildDailySpecialsMap = (specialsList) => {
    const map = { ...DEFAULT_DAILY_SPECIALS };
    (specialsList || []).forEach((special) => {
      if (typeof special.day_index === 'number') {
        map[special.day_index] = {
          name: special.name,
          description: special.description,
          hours: special.hours,
          emoji: special.emoji
        };
      }
    });
    return map;
  };

  // Get today's special
  const getTodaysSpecial = () => {
    const today = new Date().getDay();
    const map = Object.keys(dailySpecialsMap).length > 0 ? dailySpecialsMap : DEFAULT_DAILY_SPECIALS;
    return map[today] || DEFAULT_DAILY_SPECIALS[today];
  };

  const todaysSpecial = getTodaysSpecial();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const heroHtml = pageContent.hero || 'ELEVATED DINING MEETS SOUTHERN SOUL. EVERY DISH CRAFTED WITH FRESH INGREDIENTS AND GENUINE HOSPITALITY.';

  const renderLineItems = (items) => (
    <div className="space-y-3">
      {items.map((item) => (
        <MenuLineItem key={item.id} item={item} isExpanded={expandedItemId === item.id} onToggleExpand={handleToggleExpand} />
      ))}
    </div>
  );

  const renderClassicRefreshments = () => {
    const sodas = itemsByCategory['sodas-spritzers'] || [];
    const teas = itemsByCategory['teas-lemonades'] || [];
    const juices = itemsByCategory['chilled-juices'] || [];

    if (sodas.length === 0 && teas.length === 0 && juices.length === 0) return null;

    return (
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">Classic Refreshments ($2.50)</h3>
        {sodas.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-300 mb-3">Sodas & Spritzers</h4>
            {renderLineItems(sodas)}
          </div>
        )}
        {teas.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-300 mb-3">Teas & Lemonades</h4>
            {renderLineItems(teas)}
          </div>
        )}
        {juices.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-slate-300 mb-3">Chilled Juices</h4>
            {renderLineItems(juices)}
          </div>
        )}
      </div>
    );
  };

  const handleToggleExpand = (item) => {
    setExpandedItemId((prev) => (prev === item.id ? null : item.id));
  };

  // Fetch menu items from API on mount
  useEffect(() => {
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
    fetchMenuItems();
    fetchPageContent();
    fetchDailySpecials();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const items = await getPublicMenuItems();
      if (items && items.length > 0) {
        setMenuItems(items);
        setUsingMockData(false);
      } else {
        setMenuItems(mockMenuItems);
        setUsingMockData(true);
      }
    } catch (error) {
      console.error('Failed to fetch menu items, using mock data:', error);
      setMenuItems(mockMenuItems);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageContent = async () => {
    try {
      const content = await getPageContent('menu');
      const map = {};
      (content || []).forEach((entry) => {
        map[entry.section_key] = entry.html || '';
      });
      setPageContent(map);
    } catch (error) {
      console.error('Failed to fetch page content', error);
    }
  };

  const fetchDailySpecials = async () => {
    try {
      const data = await getDailySpecials();
      if (data && data.length > 0) {
        setDailySpecialsMap(buildDailySpecialsMap(data));
      } else {
        setDailySpecialsMap(DEFAULT_DAILY_SPECIALS);
      }
    } catch (error) {
      console.error('Failed to fetch daily specials', error);
      setDailySpecialsMap(DEFAULT_DAILY_SPECIALS);
    }
  };

  // Handle main category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveSubCategory(null);
  };

  // Handle sub-category change
  const handleSubCategoryChange = (subCatId) => {
    setActiveSubCategory(subCatId === activeSubCategory ? null : subCatId);
  };

  // Admin functions
  const handleEditItem = (item) => {
    setEditingItem({ ...item });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await updateMenuItem(editingItem.id, editingItem);
      await fetchMenuItems();
      setEditingItem(null);
      toast({ title: 'Success', description: 'Menu item updated!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }
    try {
      await createMenuItem({
        ...newItem,
        price: parseFloat(newItem.price)
      });
      await fetchMenuItems();
      setShowAddModal(false);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: 'starters',
        image_url: '',
        is_available: true
      });
      toast({ title: 'Success', description: 'Menu item added!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      await fetchMenuItems();
      toast({ title: 'Deleted', description: 'Menu item removed' });
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
      if (lightboxItem && e.key === 'Escape') {
        setLightboxItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem]);

  const handleImageClick = (item) => {
    if (!editMode) {
      setLightboxItem(item);
    }
  };

  // Group items by category for "All" view
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    const knownCategories = [
      'daily-specials', 'starters', 'sides', 'entrees', 
      'seafood-grits', 'sandwiches', 'salads', 'brunch', 'brunch-sides',
      'cocktails', 'signature-cocktails', 'brunch-drinks',
      'mocktails', 'sodas-spritzers', 'teas-lemonades', 'chilled-juices', 'custom-lemonades'
    ];
    
    knownCategories.forEach(cat => {
      grouped[cat] = [];
    });

    menuItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  }, [menuItems]);

  // Filter items based on active category and sub-category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menuItems;
    }
    
    if (activeCategory === 'daily-specials') {
      return menuItems.filter(item => item.category === 'daily-specials');
    }
    
    if (activeCategory === 'food') {
      if (activeSubCategory) {
        return menuItems.filter(item => item.category === activeSubCategory);
      }
      return menuItems.filter(item => foodCategoryIds.includes(item.category));
    }
    
    if (activeCategory === 'cocktails') {
      if (activeSubCategory) {
        return menuItems.filter(item => item.category === activeSubCategory);
      }
      return menuItems.filter(item => cocktailCategoryIds.includes(item.category));
    }

    if (activeCategory === 'non-alcoholic') {
      return menuItems.filter(item => nonAlcoholicCategoryIds.includes(item.category));
    }
    
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, activeSubCategory, menuItems]);

  // Render a section of items
  const renderSection = (title, items, variant = 'compact', gridCols = 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', isLineItem = false) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
          {title}
        </h3>
        <div className={`grid ${gridCols} ${isLineItem ? 'gap-3' : 'gap-5'}`}>
          {items.map((item) => (
            isLineItem ? (
              <MenuLineItem key={item.id} item={item} isExpanded={expandedItemId === item.id} onToggleExpand={handleToggleExpand} />
            ) : (
              <MenuCard 
                key={item.id} 
                item={item} 
                variant={variant} 
                editMode={editMode} 
                onEdit={handleEditItem} 
                onImageClick={handleImageClick} 
                isExpanded={expandedItemId === item.id}
                onToggleExpand={handleToggleExpand}
              />
            )
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading menu...</p>
        </div>
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
            <span className="text-sm font-medium">Admin Mode - Menu Editor</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 h-8"
                  data-testid="add-menu-item-btn"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
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
                data-testid="edit-menu-btn"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Menu
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

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-red-600/50 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Edit Menu Item</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Name</label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Description</label>
                  <Textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Category</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                    >
                      {Object.entries(categoryNames).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Image</label>
                  <ImageUploader 
                    currentImage={editingItem.image_url}
                    onImageUpload={(url) => setEditingItem({ ...editingItem, image_url: url })}
                  />
                  <div className="mt-2">
                    <label className="text-xs text-slate-400">Or enter URL directly:</label>
                    <Input
                      value={editingItem.image_url || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveItem} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => handleDeleteItem(editingItem.id)} 
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-green-600/50 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add Menu Item</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Name *</label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Dish name"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Description</label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Price ($) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="12.99"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                    >
                      {Object.entries(categoryNames).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Image</label>
                  <ImageUploader 
                    currentImage={newItem.image_url}
                    onImageUpload={(url) => setNewItem({ ...newItem, image_url: url })}
                  />
                  <div className="mt-2">
                    <label className="text-xs text-slate-400">Or enter URL directly:</label>
                    <Input
                      value={newItem.image_url}
                      onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <Button onClick={handleAddItem} className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxItem && (
        <ImageLightbox 
          image={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      )}

      {/* Header with logo and location */}
      <div className={`container mx-auto px-4 pt-8 pb-4 ${isAdmin ? 'mt-12' : ''}`}>
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers Restaurants"
              className="max-h-32 md:max-h-40 w-auto mx-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-slate-800/70 border-red-600/50 text-red-500 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 transition-all duration-300 px-6 py-2.5 rounded-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            
            <Button
              onClick={() => navigate('/locations')}
              variant="outline"
              className="bg-slate-800/70 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 px-6 py-2.5 rounded-lg"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Locations
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Our Menu
        </h2>
        <div
          className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          data-testid="page-content-menu-hero"
          dangerouslySetInnerHTML={{ __html: heroHtml }}
        />
        {usingMockData && (
          <p className="text-yellow-500 text-sm mt-2">
            Showing sample menu. Admin can add items via the dashboard.
          </p>
        )}
      </div>

      {/* Signature Selections Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-2xl">✨</span>
          <h2 className="text-3xl font-bold text-white">Signature Selections</h2>
        </div>
      </div>

      {/* Main Category Filter - 4 buttons */}
      <div className="container mx-auto px-4 mb-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              data-testid={`category-${cat.id}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Category Filter for Food */}
      {activeCategory === 'food' && (
        <div className="container mx-auto px-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {foodSubCategories.map((subCat) => (
              <button
                key={subCat.id}
                onClick={() => handleSubCategoryChange(subCat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubCategory === subCat.id
                    ? 'bg-red-500/80 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                data-testid={`subcategory-${subCat.id}`}
              >
                <span>{subCat.icon}</span>
                <span>{subCat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cocktails Sections Header Only */}
      {activeCategory === 'cocktails' && (
        <div className="container mx-auto px-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-slate-400 text-sm">$5 Specials • Signature • Brunch Drinks</span>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="container mx-auto px-4 pb-16">
        
        {/* ALL VIEW - Show everything organized with drinks at the bottom */}
        {activeCategory === 'all' && (
          <div className="space-y-10">
            {/* $5 Daily Specials */}
            {itemsByCategory['daily-specials']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 border-b border-slate-700 pb-3">
                  $5 Daily Specials
                </h3>
                <p className="text-slate-400 text-sm mb-4">MON-FRI 12PM-8PM • SATURDAY 5PM-8PM • SUNDAY 6PM-CLOSE</p>
                
                {/* Today's Special Highlight */}
                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-4 mb-6" data-testid="todays-special-highlight">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl" data-testid="todays-special-emoji">{todaysSpecial.emoji}</span>
                    <span className="text-red-400 font-semibold text-sm uppercase tracking-wide" data-testid="todays-special-day">Today's Special • {todayName}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1" data-testid="todays-special-title">{todaysSpecial.name}</h4>
                  <p className="text-slate-300 text-sm mb-2" data-testid="todays-special-description">{todaysSpecial.description}</p>
                  <p className="text-red-400 text-xs font-medium" data-testid="todays-special-hours">{todaysSpecial.hours}</p>
                </div>
                
                {/* Food Items */}
                {itemsByCategory['daily-specials'].filter(item => item.type === 'food').length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold text-slate-300 mb-4">Food</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {itemsByCategory['daily-specials']
                        .filter(item => item.type === 'food')
                        .map((item) => (
                          <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} onImageClick={handleImageClick} isExpanded={expandedItemId === item.id} onToggleExpand={handleToggleExpand} />
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Drink Items within Daily Specials */}
                {itemsByCategory['daily-specials'].filter(item => item.type === 'drink').length > 0 && (
                  <div>
                    <h4 className="text-xl font-semibold text-slate-300 mb-4">Drinks</h4>
                    <div className="space-y-3">
                      {itemsByCategory['daily-specials']
                        .filter(item => item.type === 'drink')
                        .map((item) => (
                          <MenuLineItem key={item.id} item={item} isExpanded={expandedItemId === item.id} onToggleExpand={handleToggleExpand} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FOOD SECTIONS */}
            {renderSection('Starters', itemsByCategory['starters'])}
            {renderSection('Sides', itemsByCategory['sides'], 'compact', 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', true)}
            {renderSection('Entrees', itemsByCategory['entrees'], 'default', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}
            {renderSection('Seafood & Grits', itemsByCategory['seafood-grits'], 'default', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}
            {renderSection('Sandwiches', itemsByCategory['sandwiches'])}
            {renderSection('Salads', itemsByCategory['salads'])}
            {renderSection('Brunch', itemsByCategory['brunch'])}
            {renderSection('Brunch Sides', itemsByCategory['brunch-sides'], 'compact', 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', true)}

            {/* DRINKS AT THE BOTTOM */}
            <div className="pt-8 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-2xl">🍹</span>
                <h2 className="text-3xl font-bold text-white">Cocktails & Drinks</h2>
              </div>
              
              {renderSection('Signature Cocktails', [...(itemsByCategory['cocktails'] || []), ...(itemsByCategory['signature-cocktails'] || [])], 'compact', 'grid-cols-1', true)}
              {renderSection('Brunch Drinks', itemsByCategory['brunch-drinks'], 'compact', 'grid-cols-1', true)}
              {renderSection('Handcrafted Mocktails ($5.50)', itemsByCategory['mocktails'], 'compact', 'grid-cols-1', true)}
              {renderClassicRefreshments()}
              {renderSection('Custom Fruit Lemonades ($3.50)', itemsByCategory['custom-lemonades'], 'compact', 'grid-cols-1', true)}
            </div>
          </div>
        )}

        {/* DAILY SPECIALS VIEW */}
        {activeCategory === 'daily-specials' && (
          <div>
            <p className="text-slate-400 text-sm mb-4">MON-FRI 12PM-8PM • SATURDAY 5PM-8PM • SUNDAY 6PM-CLOSE</p>
            
            {/* Today's Special Highlight */}
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-4 mb-6" data-testid="todays-special-highlight">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" data-testid="todays-special-emoji">{todaysSpecial.emoji}</span>
                <span className="text-red-400 font-semibold text-sm uppercase tracking-wide" data-testid="todays-special-day">Today's Special • {todayName}</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-1" data-testid="todays-special-title">{todaysSpecial.name}</h4>
              <p className="text-slate-300 text-sm mb-2" data-testid="todays-special-description">{todaysSpecial.description}</p>
              <p className="text-red-400 text-xs font-medium" data-testid="todays-special-hours">{todaysSpecial.hours}</p>
            </div>
            
            {/* Food section */}
            {filteredItems.filter(item => item.type === 'food').length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Food</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredItems
                    .filter(item => item.type === 'food')
                    .map((item) => (
                      <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} onImageClick={handleImageClick} />
                    ))}
                </div>
              </div>
            )}
            
            {/* Drinks section */}
            {filteredItems.filter(item => item.type === 'drink').length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Drinks</h3>
                <div className="space-y-3">
                  {filteredItems
                    .filter(item => item.type === 'drink')
                    .map((item) => (
                      <MenuLineItem key={item.id} item={item} isExpanded={expandedItemId === item.id} onToggleExpand={handleToggleExpand} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOD VIEW */}
        {activeCategory === 'food' && (
          <div className="space-y-10">
            {activeSubCategory ? (
              // Show only selected sub-category
              <>
                {activeSubCategory === 'sides' || activeSubCategory === 'brunch-sides' ? (
                  renderSection(categoryNames[activeSubCategory], filteredItems, 'compact', 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', true)
                ) : activeSubCategory === 'entrees' || activeSubCategory === 'seafood-grits' ? (
                  renderSection(categoryNames[activeSubCategory], filteredItems, 'default', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
                ) : (
                  renderSection(categoryNames[activeSubCategory], filteredItems)
                )}
              </>
            ) : (
              // Show all food categories
              <>
                {renderSection('Starters', itemsByCategory['starters'])}
                {renderSection('Sides', itemsByCategory['sides'], 'compact', 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', true)}
                {renderSection('Entrees', itemsByCategory['entrees'], 'default', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}
                {renderSection('Seafood & Grits', itemsByCategory['seafood-grits'], 'default', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}
                {renderSection('Sandwiches', itemsByCategory['sandwiches'])}
                {renderSection('Salads', itemsByCategory['salads'])}
                {renderSection('Brunch', itemsByCategory['brunch'])}
                {renderSection('Brunch Sides', itemsByCategory['brunch-sides'], 'compact', 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4', true)}
              </>
            )}
          </div>
        )}

        {/* COCKTAILS VIEW */}
        {activeCategory === 'cocktails' && (
          <div className="space-y-10">
            {renderSection('$5 Daily Specials',
              (itemsByCategory['daily-specials'] || []).filter(item => item.type === 'drink'),
              'compact',
              'grid-cols-1',
              true
            )}
            {renderSection('Signature Cocktails', [...(itemsByCategory['cocktails'] || []), ...(itemsByCategory['signature-cocktails'] || [])], 'compact', 'grid-cols-1', true)}
            {renderSection('Brunch Drinks', itemsByCategory['brunch-drinks'], 'compact', 'grid-cols-1', true)}
            {renderSection('Handcrafted Mocktails ($5.50)', itemsByCategory['mocktails'], 'compact', 'grid-cols-1', true)}
            {renderClassicRefreshments()}
            {renderSection('Custom Fruit Lemonades ($3.50)', itemsByCategory['custom-lemonades'], 'compact', 'grid-cols-1', true)}
          </div>
        )}

        {/* NON-ALCOHOLIC VIEW */}
        {activeCategory === 'non-alcoholic' && (
          <div className="space-y-10">
            {renderSection('Handcrafted Mocktails ($5.50)', itemsByCategory['mocktails'], 'compact', 'grid-cols-1', true)}
            {renderClassicRefreshments()}
            {renderSection('Custom Fruit Lemonades ($3.50)', itemsByCategory['custom-lemonades'], 'compact', 'grid-cols-1', true)}
          </div>
        )}

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No items in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
