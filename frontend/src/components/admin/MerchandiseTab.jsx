import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, X, Package, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { toast } from '../../hooks/use-toast';

const API_URL = window.location.origin;

const adminHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const adminJsonHeaders = () => ({ ...adminHeaders(), 'Content-Type': 'application/json' });

const emptyProduct = {
  name: '',
  price: '',
  description: '',
  image: '',
  categories: [],
  in_stock: true,
  is_active: true,
  display_order: 999,
};

const MerchandiseTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product id or 'new'
  const [draft, setDraft] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/merchandise`, { headers: adminHeaders() });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const startNew = () => {
    setDraft(emptyProduct);
    setEditing('new');
  };

  const startEdit = (p) => {
    setDraft({
      name: p.name || '',
      price: p.price ?? '',
      description: p.description || '',
      image: p.image || '',
      categories: p.categories || [],
      in_stock: p.in_stock !== false,
      is_active: p.is_active !== false,
      display_order: p.display_order ?? 999,
    });
    setEditing(p.id);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(emptyProduct);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/admin/merchandise/upload-image`, {
        method: 'POST',
        headers: adminHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setDraft(d => ({ ...d, image: data.image_url }));
      toast({ title: 'Image uploaded' });
    } catch (e) {
      toast({ title: 'Upload error', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (!draft.price && draft.price !== 0) {
      toast({ title: 'Price required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        price: String(draft.price),
        categories: typeof draft.categories === 'string'
          ? draft.categories.split(',').map(c => c.trim()).filter(Boolean)
          : draft.categories,
      };
      let res;
      if (editing === 'new') {
        res = await fetch(`${API_URL}/api/admin/merchandise`, {
          method: 'POST',
          headers: adminJsonHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/admin/merchandise/${editing}`, {
          method: 'PUT',
          headers: adminJsonHeaders(),
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error('Save failed');
      toast({ title: editing === 'new' ? 'Product created' : 'Product saved' });
      cancelEdit();
      fetchProducts();
    } catch (e) {
      toast({ title: 'Save error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/merchandise/${p.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Product deleted' });
      fetchProducts();
    } catch (e) {
      toast({ title: 'Delete error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (p) => {
    try {
      await fetch(`${API_URL}/api/admin/merchandise/${p.id}`, {
        method: 'PUT',
        headers: adminJsonHeaders(),
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4" data-testid="merchandise-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" /> Merchandise Store
          </h2>
          <p className="text-slate-400 text-sm">Manage products sold via local Stripe checkout (bypasses WooCommerce).</p>
        </div>
        {editing === null && (
          <Button onClick={startNew} className="bg-red-600 hover:bg-red-700" data-testid="new-product-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        )}
      </div>

      {/* Editor */}
      {editing !== null && (
        <Card className="bg-slate-900 border-red-600/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing === 'new' ? 'New Product' : 'Edit Product'}
              </h3>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-white" data-testid="cancel-edit-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Name *</label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="F&F Logo Tee"
                  data-testid="product-name-input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Price (USD) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="29.99"
                  data-testid="product-price-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-400 block mb-1">Description</label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                  placeholder="Soft cotton tee with embroidered F&F logo."
                  data-testid="product-description-input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Categories (comma-separated)</label>
                <Input
                  value={Array.isArray(draft.categories) ? draft.categories.join(', ') : draft.categories}
                  onChange={(e) => setDraft(d => ({ ...d, categories: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Apparel, Hats"
                  data-testid="product-categories-input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Display Order</label>
                <Input
                  type="number"
                  value={draft.display_order}
                  onChange={(e) => setDraft(d => ({ ...d, display_order: parseInt(e.target.value, 10) || 999 }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="product-order-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-400 block mb-1">Product Image</label>
                <div className="flex items-start gap-3">
                  <div className="w-24 h-24 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700">
                    {draft.image ? (
                      <img src={draft.image} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={draft.image}
                      onChange={(e) => setDraft(d => ({ ...d, image: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                      placeholder="/api/uploads/... or https://..."
                      data-testid="product-image-url-input"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      className="hidden"
                      data-testid="product-image-file-input"
                    />
                    <Button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      data-testid="upload-image-btn"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-sm text-white">In Stock</span>
                <Switch
                  checked={draft.in_stock}
                  onCheckedChange={(v) => setDraft(d => ({ ...d, in_stock: v }))}
                  data-testid="product-in-stock-toggle"
                />
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-sm text-white">Active (visible on storefront)</span>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft(d => ({ ...d, is_active: v }))}
                  data-testid="product-is-active-toggle"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700" data-testid="save-product-btn">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Product
              </Button>
              <Button onClick={cancelEdit} variant="outline" className="border-slate-700 text-slate-300">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No products yet. Click <span className="text-white font-medium">Add Product</span> to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <Card key={p.id} className="bg-slate-900 border-slate-800" data-testid={`admin-product-${p.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{p.name}</h3>
                    <p className="text-amber-500 font-bold">${p.price}</p>
                    <p className="text-slate-500 text-xs">
                      {p.is_active ? <span className="text-green-400">● Active</span> : <span className="text-slate-500">○ Hidden</span>}
                      {' • '}
                      {p.in_stock ? 'In stock' : <span className="text-red-400">Out of stock</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(p)} variant="outline" size="sm" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" data-testid={`edit-product-${p.id}`}>
                    Edit
                  </Button>
                  <Button onClick={() => toggleActive(p)} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" data-testid={`toggle-active-${p.id}`}>
                    {p.is_active ? 'Hide' : 'Show'}
                  </Button>
                  <Button onClick={() => handleDelete(p)} variant="outline" size="sm" className="border-red-700/40 text-red-400 hover:bg-red-600/10" data-testid={`delete-product-${p.id}`}>
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

export default MerchandiseTab;
