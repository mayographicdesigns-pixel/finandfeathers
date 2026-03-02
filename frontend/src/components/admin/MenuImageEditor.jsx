import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Upload, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

/**
 * Creates a cropped image from the source
 */
const createCroppedImage = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
};

/**
 * Menu Image Editor Component
 * Allows zoom, crop, and upload of menu item images
 */
const MenuImageEditor = ({ 
  isOpen, 
  onClose, 
  menuItem, 
  onSave,
  apiUrl,
  authToken
}) => {
  const [imageSrc, setImageSrc] = useState(menuItem?.image_url || menuItem?.image || '');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setPreviewUrl(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input
  const handleUrlInput = (url) => {
    if (url) {
      setImageSrc(url);
      setPreviewUrl(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    }
  };

  // Generate preview of cropped image
  const handlePreview = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    try {
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(previewUrl);
    } catch (e) {
      console.error('Error creating preview:', e);
    }
  };

  // Save cropped image
  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !menuItem) return;
    
    setIsUploading(true);
    
    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', croppedBlob, `${menuItem.id}_cropped.jpg`);
      
      // Upload to server
      const uploadResponse = await fetch(`${apiUrl}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      // Construct full URL for the uploaded image
      const newImageUrl = `${apiUrl}${uploadResult.url}`;
      
      // Update menu item with new image
      const updateResponse = await fetch(`${apiUrl}/api/admin/menu-items/${menuItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...menuItem,
          image: newImageUrl
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update menu item');
      }
      
      // Call onSave callback with new URL
      onSave && onSave(menuItem.id, newImageUrl);
      onClose();
      
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  // Get the full image URL
  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api')) return `${apiUrl}${url}`;
    return url;
  };

  const displayImageSrc = imageSrc.startsWith('data:') ? imageSrc : getFullImageUrl(imageSrc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="menu-image-editor">
      <div className="bg-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-500" />
              Edit Image: {menuItem?.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Zoom, crop, and save the image</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-image-editor">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Cropper Area */}
            <div className="lg:col-span-2 relative bg-slate-800 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              {displayImageSrc ? (
                <Cropper
                  image={displayImageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: { background: '#1e293b' }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No image selected</p>
                    <p className="text-sm">Upload an image or enter a URL</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              {/* Upload Section */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Upload Image</h3>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-slate-400 text-sm">Click to upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                    data-testid="image-file-input"
                  />
                </label>
              </div>

              {/* URL Input */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Or Enter URL</h3>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  onBlur={(e) => handleUrlInput(e.target.value)}
                  data-testid="image-url-input"
                />
              </div>

              {/* Zoom Control */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Zoom</h3>
                  <span className="text-slate-400 text-sm">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                    className="flex-1"
                    data-testid="zoom-slider"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Rotation Control */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Rotation</h3>
                  <span className="text-slate-400 text-sm">{rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  <Slider
                    value={[rotation]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(value) => setRotation(value[0])}
                    className="flex-1"
                    data-testid="rotation-slider"
                  />
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Preview</h3>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full rounded-lg"
                    data-testid="crop-preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
          <Button variant="outline" onClick={handlePreview} disabled={!imageSrc} data-testid="preview-btn">
            Preview Crop
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="cancel-btn">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!imageSrc || isUploading}
              className="bg-red-600 hover:bg-red-700"
              data-testid="save-image-btn"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Image
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuImageEditor;
