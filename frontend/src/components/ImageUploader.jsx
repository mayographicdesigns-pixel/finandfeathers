import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Crop, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ImageUploader = ({ currentImage, onImageUpload, aspectRatio = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const processImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        // Calculate initial crop size (smallest dimension)
        const minDim = Math.min(img.width, img.height);
        setCropSize(minDim);
        setCropPosition({
          x: (img.width - minDim) / 2,
          y: (img.height - minDim) / 2
        });
        setPreviewImage(e.target.result);
        setShowCropper(true);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCropMove = (e) => {
    if (!originalImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;
    
    let x = (e.clientX - rect.left) * scaleX - cropSize / 2;
    let y = (e.clientY - rect.top) * scaleY - cropSize / 2;
    
    // Constrain to image bounds
    x = Math.max(0, Math.min(x, originalImage.width - cropSize));
    y = Math.max(0, Math.min(y, originalImage.height - cropSize));
    
    setCropPosition({ x, y });
  };

  const applyCrop = async () => {
    if (!originalImage || !canvasRef.current) return;
    
    setUploading(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to square output size (600x600 for good quality)
    const outputSize = 600;
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    // Draw cropped portion
    ctx.drawImage(
      originalImage,
      cropPosition.x,
      cropPosition.y,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize
    );
    
    // Convert to blob and upload
    canvas.toBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append('file', blob, 'cropped-image.jpg');
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/api/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        const fullUrl = `${API_URL}${data.url}`;
        
        onImageUpload(fullUrl);
        setShowCropper(false);
        setPreviewImage(null);
        setOriginalImage(null);
        toast({ title: 'Success', description: 'Image uploaded successfully!' });
      } catch (err) {
        console.error('Upload error:', err);
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setPreviewImage(null);
    setOriginalImage(null);
  };

  return (
    <div className="space-y-2">
      {/* Current Image Preview */}
      {currentImage && !showCropper && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-800">
          <img src={currentImage} alt="Current" className="w-full h-full object-cover" />
        </div>
      )}
      
      {/* Upload Area */}
      {!showCropper && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-slate-600 hover:border-red-500 hover:bg-slate-800/50'
          }`}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-400">
            Click or drag image to upload
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Will be cropped to square
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
      
      {/* Crop Modal */}
      {showCropper && previewImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-4 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crop className="w-5 h-5" />
                Crop Image to Square
              </h3>
              <Button variant="ghost" size="sm" onClick={cancelCrop} className="text-slate-400">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div 
              className="relative bg-slate-800 rounded-lg overflow-hidden mb-4 cursor-crosshair"
              onClick={handleCropMove}
              style={{ maxHeight: '60vh' }}
            >
              <img 
                ref={imageRef}
                src={previewImage} 
                alt="Preview" 
                className="w-full h-auto"
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
              {/* Crop overlay */}
              <div 
                className="absolute border-2 border-red-500 bg-transparent pointer-events-none"
                style={{
                  left: `${(cropPosition.x / originalImage.width) * 100}%`,
                  top: `${(cropPosition.y / originalImage.height) * 100}%`,
                  width: `${(cropSize / originalImage.width) * 100}%`,
                  height: `${(cropSize / originalImage.height) * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
                }}
              />
            </div>
            
            <p className="text-slate-400 text-sm mb-4 text-center">
              Click on the image to reposition the crop area
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={cancelCrop} 
                variant="outline" 
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={applyCrop} 
                disabled={uploading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply & Upload
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
