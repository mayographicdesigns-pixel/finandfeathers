import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, RefreshCw, Image, Grid3X3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  uploadImage,
  adminGetMenuCategoryStyles,
  adminUpdateMenuCategoryStyles
} from '../../services/api';
import MenuImageEditor from './MenuImageEditor';

const MenuItemsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [imageEditorItem, setImageEditorItem] = useState(null);
  const [categoryStyles, setCategoryStyles] = useState({});
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', image: '', badges: ''
  });

  // Menu display styles
  const MENU_STYLES = {
    default: { name: 'Default Cards', icon: '▣', description: 'Standard grid cards' },
    style_one: { name: 'Horizontal', icon: '▭', description: 'Image left, info right' },
    style_two: { name: 'Circular', icon: '○', description: 'Circular image, centered' },
    style_three: { name: 'Compact', icon: '☰', description: 'Small image, row layout' },
    style_four: { name: 'Pastel', icon: '⬜', description: 'Colorful backgrounds' }
  };

  // All menu categories
  const allCategories = [
    { id: 'daily-specials', name: '$5 Daily Specials' },
    { id: 'starters', name: 'Starters' },
    { id: 'sides', name: 'Sides' },
    { id: 'entrees', name: 'Entrees' },
    { id: 'seafood-grits', name: 'Seafood & Grits' },
    { id: 'sandwiches', name: 'Sandwiches' },
    { id: 'salads', name: 'Salads' },
    { id: 'beer-wine', name: 'Beer & Wine' },
    { id: 'cocktails', name: 'Cocktails' },
    { id: 'signature-cocktails', name: 'Signature Cocktails' },
    { id: 'mocktails', name: 'Mocktails' },
    { id: 'sodas-spritzers', name: 'Sodas & Spritzers' },
    { id: 'teas-lemonades', name: 'Teas & Lemonades' },
    { id: 'chilled-juices', name: 'Chilled Juices' },
    { id: 'custom-lemonades', name: 'Custom Lemonades' },
    { id: 'hookah', name: 'Hookah' },
    { id: 'brunch', name: 'Brunch' },
    { id: 'brunch-drinks', name: 'Brunch Drinks' },
    { id: 'brunch-sides', name: 'Brunch Sides' }
  ];

  useEffect(() => {
    fetchItems();
    fetchCategoryStyles();
  }, []);

  const fetchCategoryStyles = async () => {
    try {
      const styles = await adminGetMenuCategoryStyles();
      setCategoryStyles(styles);
    } catch (err) {
      console.error('Error fetching category styles:', err);
    }
  };

  const saveCategoryStyles = async () => {
    try {
      await adminUpdateMenuCategoryStyles(categoryStyles);
      toast({ title: 'Success', description: 'Category display styles saved' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const updateCategoryStyle = (categoryId, styleId) => {
    setCategoryStyles(prev => ({ ...prev, [categoryId]: styleId }));
  };

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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image (JPG, PNG, GIF, or WebP)', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      // Store relative path so images work across deployments
      setFormData({ ...formData, image: result.url });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Handle different image formats
  const getImageSrc = (img) => {
    if (!img) return '/placeholder-food.jpg';
    if (img.startsWith('data:')) return img;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/api/')) return `${process.env.REACT_APP_BACKEND_URL}${img}`;
    return img;
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === '' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Menu Items ({items.length})</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowStyleEditor(!showStyleEditor)} 
            variant="outline"
            className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
            data-testid="display-styles-btn"
          >
            <Grid3X3 className="w-4 h-4 mr-2" /> Display Styles
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Display Styles Editor */}
      {showStyleEditor && (
        <Card className="bg-slate-800/80 border-amber-600/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" /> Category Display Styles
              <span className="text-slate-400 text-xs font-normal ml-2">Choose how each menu category appears on the menu page</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Style Legend */}
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-700">
              {Object.entries(MENU_STYLES).map(([styleId, style]) => (
                <div key={styleId} className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                  <span className="text-lg">{style.icon}</span>
                  <span>{style.name}</span>
                </div>
              ))}
            </div>
            
            {/* Category Style Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
                  <span className="text-slate-300 text-sm truncate mr-2">{cat.name}</span>
                  <select
                    value={categoryStyles[cat.id] || 'default'}
                    onChange={(e) => updateCategoryStyle(cat.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 min-w-[100px]"
                    data-testid={`style-select-${cat.id}`}
                  >
                    {Object.entries(MENU_STYLES).map(([styleId, style]) => (
                      <option key={styleId} value={styleId}>{style.icon} {style.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end mt-4">
              <Button onClick={saveCategoryStyles} className="bg-amber-600 hover:bg-amber-700">
                Save Display Styles
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white flex-1"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 min-w-[180px]"
        >
          <option value="">All Categories</option>
          <optgroup label="Food">
            <option value="starters">Starters</option>
            <option value="sides">Sides</option>
            <option value="entrees">Entrees</option>
            <option value="seafood-grits">Seafood & Grits</option>
            <option value="sandwiches">Sandwiches</option>
            <option value="salads">Salads</option>
            <option value="brunch">Brunch</option>
            <option value="brunch-sides">Brunch Sides</option>
          </optgroup>
          <optgroup label="Drinks - Beer & Wine">
            <option value="beer-wine">Beer & Wine</option>
          </optgroup>
          <optgroup label="Drinks - Cocktails">
            <option value="cocktails">Cocktails</option>
            <option value="signature-cocktails">Signature Cocktails</option>
            <option value="brunch-drinks">Brunch Drinks</option>
          </optgroup>
          <optgroup label="Drinks - Non-Alcoholic">
            <option value="mocktails">Mocktails</option>
            <option value="sodas-spritzers">Sodas & Spritzers</option>
            <option value="teas-lemonades">Teas & Lemonades</option>
            <option value="chilled-juices">Chilled Juices</option>
            <option value="custom-lemonades">Custom Lemonades</option>
          </optgroup>
          <optgroup label="Other">
            <option value="daily-specials">$5 Daily Specials</option>
            <option value="hookah">Hookah</option>
          </optgroup>
        </select>
      </div>

      {searchQuery || filterCategory ? (
        <p className="text-slate-400 text-sm">
          Showing {filteredItems.length} of {items.length} items
        </p>
      ) : null}

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
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  <optgroup label="Food">
                    <option value="starters">Starters</option>
                    <option value="sides">Sides</option>
                    <option value="entrees">Entrees</option>
                    <option value="seafood-grits">Seafood & Grits</option>
                    <option value="sandwiches">Sandwiches</option>
                    <option value="salads">Salads</option>
                    <option value="brunch">Brunch</option>
                    <option value="brunch-sides">Brunch Sides</option>
                  </optgroup>
                  <optgroup label="Drinks - Beer & Wine">
                    <option value="beer-wine">Beer & Wine</option>
                  </optgroup>
                  <optgroup label="Drinks - Cocktails">
                    <option value="cocktails">Cocktails</option>
                    <option value="signature-cocktails">Signature Cocktails</option>
                    <option value="brunch-drinks">Brunch Drinks</option>
                  </optgroup>
                  <optgroup label="Drinks - Non-Alcoholic">
                    <option value="mocktails">Mocktails</option>
                    <option value="sodas-spritzers">Sodas & Spritzers</option>
                    <option value="teas-lemonades">Teas & Lemonades</option>
                    <option value="chilled-juices">Chilled Juices</option>
                    <option value="custom-lemonades">Custom Lemonades</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="daily-specials">$5 Daily Specials</option>
                    <option value="hookah">Hookah</option>
                  </optgroup>
                </select>
                <Input
                  placeholder="Badges (comma separated)"
                  value={formData.badges}
                  onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm block">Menu Item Image (optional for drinks)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL (or upload below)"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
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
                      onError={(e) => { e.target.style.display = 'none'; }}
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

      {filteredItems.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            {items.length === 0 
              ? "No menu items in database yet. Add items or they will be loaded from mock data."
              : "No items match your search or filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-slate-700">
                  {item.image ? (
                    <img 
                      src={getImageSrc(item.image)} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No Image
                    </div>
                  )}
                  {/* Price badge */}
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    ${item.price}
                  </span>
                </div>
                {/* Content */}
                <div className="p-3">
                  <p className="text-white font-medium text-sm truncate" title={item.name}>{item.name}</p>
                  <p className="text-slate-400 text-xs">{item.category}</p>
                  {/* Action buttons */}
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageEditorItem(item)}
                      className="text-green-400 hover:bg-green-900/30 h-7 w-7 p-0"
                      title="Edit Image"
                      data-testid={`edit-image-${item.id}`}
                    >
                      <Image className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="text-blue-400 hover:bg-blue-900/30 h-7 w-7 p-0"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:bg-red-900/30 h-7 w-7 p-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Menu Image Editor Modal */}
      <MenuImageEditor
        isOpen={!!imageEditorItem}
        onClose={() => setImageEditorItem(null)}
        menuItem={imageEditorItem}
        onSave={(itemId, newImageUrl) => {
          setItems(items.map(i => i.id === itemId ? { ...i, image: newImageUrl } : i));
          toast({ title: 'Success', description: 'Menu item image updated' });
        }}
        apiUrl={process.env.REACT_APP_BACKEND_URL}
        authToken={localStorage.getItem('adminToken')}
      />
    </div>
  );
};

export default MenuItemsTab;
