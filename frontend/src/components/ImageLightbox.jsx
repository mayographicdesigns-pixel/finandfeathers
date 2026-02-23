import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const ImageLightbox = ({ image, onClose, onPrev, onNext, showNav = false }) => {
  if (!image) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        data-testid="lightbox-close"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Previous button */}
      {showNav && onPrev && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          data-testid="lightbox-prev"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* Image container */}
      <div className="max-w-4xl max-h-[90vh] relative">
        <img
          src={typeof image === 'string' ? image : image.url || image.image_url}
          alt={typeof image === 'object' ? (image.name || image.caption || 'Image') : 'Image'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          data-testid="lightbox-image"
        />
        
        {/* Caption */}
        {typeof image === 'object' && (image.name || image.caption) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
            <h3 className="text-white text-xl font-semibold">
              {image.name || image.caption}
            </h3>
            {image.description && (
              <p className="text-slate-300 text-sm mt-1">{image.description}</p>
            )}
            {image.price && (
              <p className="text-red-500 font-bold mt-1">${image.price}</p>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {showNav && onNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          data-testid="lightbox-next"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-sm">
        Press ESC to close {showNav && '• Use arrows to navigate'}
      </div>
    </div>
  );
};

export default ImageLightbox;
