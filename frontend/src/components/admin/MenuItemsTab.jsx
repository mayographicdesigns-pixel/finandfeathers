import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, RefreshCw, Image, Grid3X3, MapPin, Globe, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
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
import { MENU_STYLES, DEFAULT_CATEGORY_STYLES } from '../menu';
import MenuImageEditor from './MenuImageEditor';

const LOCATIONS = [
  { slug: '', name: 'Global (All Locations)' },
  { slug: 'edgewood-atlanta', name: 'Edgewood' },
  { slug: 'midtown-atlanta', name: 'Midtown' },
  { slug: 'douglasville', name: 'Douglasville' },
  { slug: 'riverdale', name: 'Riverdale' },
  { slug: 'valdosta', name: 'Valdosta' },
  { slug: 'albany', name: 'Albany' },
  { slug: 'stone-mountain', name: 'Stone Mountain' },
  { slug: 'las-vegas', name: 'Las Vegas' },
  { slug: 'hibachi-food-truck', name: 'Hibachi Food Truck' }
];

const MenuItemsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [syncAllLocations, setSyncAllLocations] = useState(true);
  const [imageEditorItem, setImageEditorItem] = useState(null);
  const [categoryStyles, setCategoryStyles] = useState({});
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [letterPdfBusy, setLetterPdfBusy] = useState(false);
  const [cocktailsPdfBusy, setCocktailsPdfBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const fileInputRef = useRef(null);
  const quickFileRef = useRef(null);
  const [quickUploadItemId, setQuickUploadItemId] = useState(null);
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
  }, [filterLocation]);

  const fetchCategoryStyles = async () => {
    try {
      const dbStyles = await adminGetMenuCategoryStyles();
      // Merge: DB styles override defaults, but all categories are present
      const merged = { ...DEFAULT_CATEGORY_STYLES, ...dbStyles };
      setCategoryStyles(merged);
      // Persist merged styles to DB if new categories were added from defaults
      const hasNew = Object.keys(DEFAULT_CATEGORY_STYLES).some(k => !(k in dbStyles));
      if (hasNew) {
        await adminUpdateMenuCategoryStyles(merged);
      }
    } catch (err) {
      console.error('Error fetching category styles:', err);
      setCategoryStyles({ ...DEFAULT_CATEGORY_STYLES });
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
    setLoading(true);
    try {
      const data = await getAdminMenuItems(filterLocation);
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

  // Quick image upload for a specific item (click photo to replace)
  const handleQuickImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !quickUploadItemId) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image', variant: 'destructive' });
      return;
    }
    try {
      const result = await uploadImage(file);
      await updateMenuItem(quickUploadItemId, { image: result.url });
      setItems(items.map(i => i.id === quickUploadItemId ? { ...i, image: result.url, image_url: result.url } : i));
      toast({ title: 'Image updated', description: 'Synced to all locations automatically' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    if (quickFileRef.current) quickFileRef.current.value = '';
    setQuickUploadItemId(null);
  };

  // Sync master images to all locations
  const syncImagesToLocations = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${window.location.origin}/api/admin/menu-items/sync-images-to-locations`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      toast({ title: 'Images Synced', description: `${data.synced} items updated across all locations` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSyncing(false);
  };

  // Convert all external URLs to local storage
  const convertExternalImages = async () => {
    setConverting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${window.location.origin}/api/admin/menu-items/convert-external-images`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      toast({ title: 'Images Converted', description: `${data.converted} images stored locally, ${data.failed} failed` });
      fetchItems(); // Reload to show new URLs
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setConverting(false);
  };

  const adminHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const downloadAsBlob = async (path, filename, label) => {
    const res = await fetch(`${window.location.origin}${path}`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    if (!res.ok) {
      let msg = `${label} failed (${res.status})`;
      try {
        const j = await res.json();
        if (j.detail) msg = j.detail;
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const generateLetterPdf = async () => {
    setLetterPdfBusy(true);
    try {
      await downloadAsBlob('/api/admin/menu/generate-letter-pdf', 'Fin-and-Feathers-Menu-Letter.pdf', 'Letter PDF');
      toast({ title: 'Letter PDF downloaded', description: '8.5×11 double-sided menu' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLetterPdfBusy(false);
    }
  };

  const generateLargePdf = async () => {
    setPdfBusy(true);
    try {
      await downloadAsBlob('/api/admin/menu/generate-pdf', 'Fin-and-Feathers-Menu.pdf', 'Large PDF');
      toast({ title: 'Large PDF downloaded', description: '11×17 printable menu' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setPdfBusy(false);
    }
  };

  const generateCocktailsPdf = async () => {
    setCocktailsPdfBusy(true);
    try {
      await downloadAsBlob('/api/admin/menu/generate-cocktails-pdf', 'Fin-and-Feathers-Signature-Cocktails.pdf', 'Cocktails PDF');
      toast({ title: 'Signature Cocktails PDF downloaded', description: '8.5×11 — 9 image cards per page' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCocktailsPdfBusy(false);
    }
  };

  const exportCsv = async () => {
    setCsvBusy(true);
    try {
      const qs = filterLocation ? `?location_slug=${encodeURIComponent(filterLocation)}` : '';
      const res = await fetch(`${window.location.origin}/api/admin/menu/export-csv${qs}`, {
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error('CSV export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-items-${filterLocation || 'all'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCsvBusy(false);
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
        const result = await updateMenuItem(editingItem.id, { ...itemData, sync_all_locations: syncAllLocations });
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        const syncMsg = result?.synced_locations > 0 ? ` (synced to ${result.synced_locations} other locations)` : '';
        toast({ title: 'Success', description: `Menu item updated${syncMsg}` });
      } else {
        itemData.location_slug = filterLocation;
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
    if (img.startsWith('/api/')) return `${window.location.origin}${img}`;
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
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-lg font-semibold text-white">Menu Items ({items.length})</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={syncImagesToLocations}
            disabled={syncing}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/30 text-xs"
            data-testid="sync-images-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Images to All Locations'}
          </Button>
          <Button
            onClick={convertExternalImages}
            disabled={converting}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-900/30 text-xs"
            data-testid="convert-images-btn"
          >
            <Upload className={`w-3.5 h-3.5 mr-1.5 ${converting ? 'animate-spin' : ''}`} />
            {converting ? 'Converting...' : 'Store All Images Locally'}
          </Button>
          <Button 
            onClick={() => setShowStyleEditor(!showStyleEditor)} 
            variant="outline"
            className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
            data-testid="display-styles-btn"
          >
            <Grid3X3 className="w-4 h-4 mr-2" /> Display Styles
          </Button>
          <Button
            onClick={generateLetterPdf}
            disabled={letterPdfBusy}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-900/30 text-xs"
            data-testid="generate-letter-pdf-btn"
          >
            {letterPdfBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
            {letterPdfBusy ? 'Generating...' : 'Download Letter PDF (8.5×11)'}
          </Button>
          <Button
            onClick={generateLargePdf}
            disabled={pdfBusy}
            variant="outline"
            className="border-pink-600 text-pink-400 hover:bg-pink-900/30 text-xs"
            data-testid="generate-large-pdf-btn"
          >
            {pdfBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
            {pdfBusy ? 'Generating...' : 'Download Large PDF (11×17)'}
          </Button>
          <Button
            onClick={generateCocktailsPdf}
            disabled={cocktailsPdfBusy}
            variant="outline"
            className="border-rose-600 text-rose-400 hover:bg-rose-900/30 text-xs"
            data-testid="generate-cocktails-pdf-btn"
          >
            {cocktailsPdfBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
            {cocktailsPdfBusy ? 'Generating...' : 'Signature Cocktails PDF (8.5×11)'}
          </Button>
          <Button
            onClick={exportCsv}
            disabled={csvBusy}
            variant="outline"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 text-xs"
            data-testid="export-csv-btn"
          >
            {csvBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />}
            {csvBusy ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Location Filter */}
      <div className="flex items-center gap-3 p-3 bg-slate-800/70 border border-slate-700 rounded-lg">
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-slate-300 text-sm font-medium shrink-0">Location:</span>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-1.5 text-sm flex-1"
          data-testid="menu-location-filter"
        >
          {LOCATIONS.map(loc => (
            <option key={loc.slug} value={loc.slug}>{loc.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncAllLocations}
              onChange={(e) => setSyncAllLocations(e.target.checked)}
              className="rounded border-slate-600"
              data-testid="sync-all-toggle"
            />
            <span className="text-sm text-slate-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-green-400" />
              Apply edits to all locations
            </span>
          </label>
        </div>
      </div>

      {/* Hidden quick-upload file input */}
      <input
        ref={quickFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickImageUpload}
      />

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
                {/* Clickable Image — click to replace photo */}
                <div
                  className="relative aspect-[4/3] bg-slate-700 cursor-pointer group"
                  onClick={() => { setQuickUploadItemId(item.id); quickFileRef.current?.click(); }}
                  title="Click to replace image"
                  data-testid={`menu-item-image-${item.id}`}
                >
                  {item.image ? (
                    <img 
                      src={getImageSrc(item.image)} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No Image
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-white mx-auto mb-1" />
                      <span className="text-white text-xs font-medium">Replace Photo</span>
                    </div>
                  </div>
                  {/* Image type indicator */}
                  {item.image && (
                    <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.image.startsWith('/images/') || item.image.startsWith('/api/media/') ? 'bg-green-600/80 text-white' : 'bg-amber-600/80 text-white'
                    }`}>
                      {item.image.startsWith('/images/') || item.image.startsWith('/api/media/') ? 'LOCAL' : 'EXTERNAL'}
                    </span>
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
        apiUrl={window.location.origin}
        authToken={localStorage.getItem('adminToken')}
      />
    </div>
  );
};

export default MenuItemsTab;
