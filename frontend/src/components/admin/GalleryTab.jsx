import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid3X3, ImagePlus, GripVertical, Edit2, Trash2, 
  ToggleLeft, ToggleRight, Upload, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminGallery, 
  createGalleryItem, 
  updateGalleryItem, 
  deleteGalleryItem,
  uploadImage
} from '../../services/api';
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

// Sortable Gallery Card Component
const SortableGalleryCard = ({ item, categoryLabels, categoryColors, onEdit, onToggleActive, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden ${item.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'} ${isDragging ? 'shadow-2xl ring-2 ring-red-500' : ''}`}
      data-testid={`gallery-item-${item.id}`}
    >
      <div className="relative aspect-square">
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 z-10 bg-black/50 rounded p-1.5 cursor-grab active:cursor-grabbing hover:bg-black/70 transition-colors"
          data-testid={`drag-handle-${item.id}`}
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>
        
        <img 
          src={item.image_url} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs border ${categoryColors[item.category]}`}>
          {categoryLabels[item.category]}
        </div>
        {!item.is_active && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium">Hidden</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-white font-medium text-sm truncate">{item.title}</p>
        <div className="flex items-center justify-end gap-1 mt-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="text-slate-400 hover:text-white h-8 w-8 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggleActive(item)} className="text-slate-400 h-8 w-8 p-0">
            {item.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const GalleryTab = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    category: 'food',
    display_order: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await getAdminGallery();
      const sorted = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setGalleryItems(sorted);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = galleryItems.findIndex(item => item.id === active.id);
    const newIndex = galleryItems.findIndex(item => item.id === over.id);
    
    const newItems = arrayMove(galleryItems, oldIndex, newIndex);
    setGalleryItems(newItems);

    setSaving(true);
    try {
      const updates = newItems.map((item, index) => 
        updateGalleryItem(item.id, { display_order: index })
      );
      await Promise.all(updates);
      toast({ title: 'Success', description: 'Gallery order saved' });
    } catch (err) {
      fetchGallery();
      toast({ title: 'Error', description: 'Failed to save order', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image (JPG, PNG, GIF, WEBP)', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      const backendUrl = window.location.origin;
      const fullUrl = `${backendUrl}${result.url}`;
      setFormData({ ...formData, image_url: fullUrl });
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
    if (!formData.title || !formData.image_url) {
      toast({ title: 'Error', description: 'Title and image are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingItem) {
        await updateGalleryItem(editingItem.id, formData);
        setGalleryItems(galleryItems.map(item => 
          item.id === editingItem.id ? { ...item, ...formData } : item
        ));
        toast({ title: 'Success', description: 'Gallery item updated' });
      } else {
        const newItemData = { ...formData, display_order: galleryItems.length };
        const newItem = await createGalleryItem(newItemData);
        setGalleryItems([...galleryItems, newItem]);
        toast({ title: 'Success', description: 'Gallery item added' });
      }
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      image_url: item.image_url,
      category: item.category,
      display_order: item.display_order || 0
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item) => {
    try {
      await updateGalleryItem(item.id, { is_active: !item.is_active });
      setGalleryItems(galleryItems.map(i => 
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ));
      toast({ title: 'Success', description: `Item ${item.is_active ? 'hidden' : 'shown'}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      await deleteGalleryItem(id);
      setGalleryItems(galleryItems.filter(i => i.id !== id));
      toast({ title: 'Success', description: 'Gallery item deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', image_url: '', category: 'food', display_order: 0 });
  };

  const categoryLabels = {
    food: 'Food',
    ambiance: 'Ambiance',
    drinks: 'Drinks',
    promo: 'Promotional'
  };

  const categoryColors = {
    food: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    ambiance: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    drinks: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    promo: 'bg-red-500/20 text-red-400 border-red-500/50'
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-red-500" />
            Gallery Management
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Manage images displayed on the Gallery page ({galleryItems.length} items)
            {saving && <span className="ml-2 text-yellow-500">(Saving order...)</span>}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700" data-testid="add-gallery-item-btn">
          <ImagePlus className="w-4 h-4 mr-2" /> Add Image
        </Button>
      </div>

      {galleryItems.length > 1 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400 text-sm">Drag images to reorder. Changes are saved automatically.</span>
        </div>
      )}

      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h4 className="text-white font-semibold mb-4">
              {editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Title</label>
                  <Input
                    placeholder="e.g., Signature Wings"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="gallery-title-input"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                    data-testid="gallery-category-select"
                  >
                    <option value="food">Food</option>
                    <option value="ambiance">Ambiance</option>
                    <option value="drinks">Drinks</option>
                    <option value="promo">Promotional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm block mb-2">Image</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL or upload below"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white flex-1"
                    data-testid="gallery-image-url-input"
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-slate-700 hover:bg-slate-600"
                    data-testid="gallery-upload-btn"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.image_url && (
                  <div className="mt-3">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="gallery-save-btn">
                  {editingItem ? 'Update' : 'Add to Gallery'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {galleryItems.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-12 text-center">
            <Grid3X3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No gallery items yet</p>
            <p className="text-slate-500 text-sm">Upload images to display on your Gallery page</p>
          </div>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={galleryItems.map(item => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <SortableGalleryCard
                  key={item.id}
                  item={item}
                  categoryLabels={categoryLabels}
                  categoryColors={categoryColors}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default GalleryTab;
