import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Home, RefreshCw, Edit2, Save, X, Settings, LogOut, Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import CategoryFilter from '../components/CategoryFilter';
import MenuCard from '../components/MenuCard';
import MenuLineItem from '../components/MenuLineItem';
import ImageUploader from '../components/ImageUploader';
import ImageLightbox from '../components/ImageLightbox';
import { categories as defaultCategories, menuItems as mockMenuItems } from '../mockData';
import { getPublicMenuItems, verifyAdminToken, updateMenuItem, createMenuItem, deleteMenuItem } from '../services/api';
import { toast } from '../hooks/use-toast';

const MenuPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  
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

  // Category display names - moved to top
  const categoryNames = {
    'daily-specials': '$5 Daily Specials',
    'starters': 'Starters',
    'sides': 'Sides',
    'entrees': 'Entrees',
    'seafood-grits': 'Seafood & Grits',
    'sandwiches': 'Sandwiches',
    'salads': 'Salads',
    'cocktails': 'Signature Cocktails',
    'brunch': 'Brunch',
    'brunch-drinks': 'Brunch Drinks',
    'brunch-sides': 'Brunch Sides'
  };

  // Fetch menu items from API on mount
  useEffect(() => {
    // Check if admin is logged in
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
    
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const items = await getPublicMenuItems();
      if (items && items.length > 0) {
        setMenuItems(items);
        setUsingMockData(false);
      } else {
        // Fallback to mock data if no items in database
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

  // Build dynamic categories from menu items
  const categories = useMemo(() => {
    if (menuItems.length === 0) return defaultCategories;
    
    // Get unique categories from current menu items
    const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
    
    // Map to category objects with icons
    const categoryIcons = {
      'daily-specials': '⭐',
      'starters': '🍤',
      'sides': '🍟',
      'entrees': '🍖',
      'seafood-grits': '🦞',
      'sandwiches': '🥪',
      'salads': '🥗',
      'cocktails': '🍹',
      'brunch': '🥞',
      'brunch-drinks': '🥂',
      'brunch-sides': '🥓'
    };

    const dynamicCategories = uniqueCategories.map(cat => ({
      id: cat,
      name: categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
      icon: categoryIcons[cat] || '🍽️'
    }));

    return [{ id: 'all', name: 'All', icon: '✨' }, ...dynamicCategories];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  // Group items by category for "All" view
  const itemsByCategory = useMemo(() => {
    if (activeCategory !== 'all') {
      return null;
    }

    const grouped = {};
    
    // Initialize groups for known categories
    const knownCategories = [
      'daily-specials', 'starters', 'sides', 'entrees', 
      'seafood-grits', 'sandwiches', 'salads', 'cocktails',
      'brunch', 'brunch-drinks', 'brunch-sides'
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
  }, [activeCategory, menuItems]);

  // Separate large items (entrees & seafood-grits) from other items
  const largeItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'entrees' || item.category === 'seafood-grits'),
    [filteredItems]
  );

  // Line items (sides and brunch-sides)
  const lineItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'sides' || item.category === 'brunch-sides' || item.category === 'brunch-drinks'),
    [filteredItems]
  );

  const smallItems = useMemo(() => 
    filteredItems.filter(item => 
      item.category !== 'entrees' && 
      item.category !== 'seafood-grits' &&
      item.category !== 'sides' &&
      item.category !== 'brunch-sides' &&
      item.category !== 'brunch-drinks'
    ),
    [filteredItems]
  );

  const otherSmallItems = useMemo(() => 
    smallItems,
    [smallItems]
  );

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
                  <label className="text-sm text-slate-300 mb-1 block">Image URL</label>
                  <Input
                    value={editingItem.image_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="https://..."
                  />
                  {editingItem.image_url && (
                    <img src={editingItem.image_url} alt="Preview" className="mt-2 h-20 object-cover rounded" />
                  )}
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
                  <label className="text-sm text-slate-300 mb-1 block">Image URL</label>
                  <Input
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="https://..."
                  />
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

      {/* Header with logo and location */}
      <div className={`container mx-auto px-4 pt-8 pb-4 ${isAdmin ? 'mt-12' : ''}`}>
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers Restaurants"
              className="h-24 md:h-32 w-auto mx-auto cursor-pointer"
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
        <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Elevated dining meets Southern soul. Every dish crafted with fresh
          ingredients and genuine hospitality.
        </p>
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

      {/* Category Filter */}
      <div className="container mx-auto px-4">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 pb-16">
        {/* If "All" tab is selected, show items grouped by category with headers */}
        {activeCategory === 'all' && itemsByCategory && (
          <div className="space-y-12">
            {/* $5 Daily Specials - At the top */}
            {itemsByCategory['daily-specials']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 border-b border-slate-700 pb-3">
                  {categoryNames['daily-specials']}
                </h3>
                <p className="text-slate-400 text-sm mb-5">Monday-Friday 12pm-8pm • Saturday 5pm-8pm • Sunday 6pm-12am</p>
                
                {/* Food Items */}
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-300 mb-4">Food</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {itemsByCategory['daily-specials']
                      .filter(item => item.type === 'food')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                      ))}
                  </div>
                </div>
                
                {/* Drink Items */}
                <div>
                  <h4 className="text-xl font-semibold text-slate-300 mb-4">Drinks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {itemsByCategory['daily-specials']
                      .filter(item => item.type === 'drink')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Starters */}
            {itemsByCategory['starters']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['starters']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['starters'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Sides - Line items in 4 columns */}
            {itemsByCategory['sides']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['sides']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {itemsByCategory['sides'].map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Entrees */}
            {itemsByCategory['entrees']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['entrees']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsByCategory['entrees'].map((item) => (
                    <MenuCard key={item.id} item={item} editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Seafood & Grits */}
            {itemsByCategory['seafood-grits']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['seafood-grits']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsByCategory['seafood-grits'].map((item) => (
                    <MenuCard key={item.id} item={item} editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Sandwiches */}
            {itemsByCategory['sandwiches']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['sandwiches']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['sandwiches'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Salads */}
            {itemsByCategory['salads']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['salads']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['salads'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Signature Cocktails */}
            {itemsByCategory['cocktails']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['cocktails']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['cocktails'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Brunch */}
            {itemsByCategory['brunch']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['brunch']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['brunch'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Brunch Drinks - Line items in 4 columns */}
            {itemsByCategory['brunch-drinks']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['brunch-drinks']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {itemsByCategory['brunch-drinks'].map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Brunch Sides - Line items in 4 columns */}
            {itemsByCategory['brunch-sides']?.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['brunch-sides']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {itemsByCategory['brunch-sides'].map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic categories not in the predefined list */}
            {Object.entries(itemsByCategory)
              .filter(([cat]) => !Object.keys(categoryNames).includes(cat) && itemsByCategory[cat]?.length > 0)
              .map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                    {category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {items.map((item) => (
                      <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Single category view */}
        {activeCategory !== 'all' && (
          <>
            {/* Daily Specials Category - Split into Food and Drinks */}
            {activeCategory === 'daily-specials' && (
              <>
                <div className="mb-2">
                  <p className="text-slate-400 text-sm mb-6">Monday-Friday 12pm-8pm • Saturday 5pm-8pm • Sunday 6pm-12am</p>
                </div>
                
                {/* Food section */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Food</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredItems
                      .filter(item => item.type === 'food')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                      ))}
                  </div>
                </div>
                
                {/* Drinks section */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Drinks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredItems
                      .filter(item => item.type === 'drink')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                      ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Large items - Entrees & Seafood & Grits - 3 columns */}
            {activeCategory !== 'daily-specials' && largeItems.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {largeItems.map((item) => (
                    <MenuCard key={item.id} item={item} editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Other small items - 4 columns (smaller cards) */}
            {activeCategory !== 'daily-specials' && otherSmallItems.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {otherSmallItems.map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" editMode={editMode} onEdit={handleEditItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Line items - Sides - Simple list in 4 columns */}
            {activeCategory !== 'daily-specials' && lineItems.length > 0 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {lineItems.map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state for filtered category */}
        {activeCategory !== 'all' && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No items in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
