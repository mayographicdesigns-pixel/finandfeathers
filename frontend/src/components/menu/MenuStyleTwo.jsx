import React, { useState, useRef, useEffect } from 'react';

// Lazy loading image component
const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`} style={{ backgroundColor: '#1e293b' }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

// Style Two: Vertical card with centered image, price badge overlay, title below, description, button
export const MenuStyleTwo = ({ item, isExpanded, onToggleExpand, onImageClick }) => {
  const rawImageUrl = item.image;
  const hasImage = rawImageUrl && rawImageUrl.trim() !== '';
  const hasBadge = item.badges && item.badges.length > 0;

  // Construct full image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api')) return `${window.location.origin}${url}`;
    return url;
  };
  const imageUrl = getImageUrl(rawImageUrl);

  return (
    <div 
      className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer group border border-white/10 flex flex-col"
      onClick={() => onToggleExpand && onToggleExpand(item)}
      data-testid={`menu-style-two-${item.id}`}
    >
      {/* Badge ribbon */}
      {hasBadge && (
        <div className="absolute top-0 left-0 z-10">
          <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-br uppercase">
            {item.badges[0]}
          </span>
        </div>
      )}
      
      {/* Circular Image Container */}
      <div className="p-6 pb-4 flex justify-center relative">
        <div 
          className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden relative shadow-xl group-hover:scale-105 transition-transform duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick && onImageClick(item);
          }}
        >
          {hasImage ? (
            <LazyImage 
              src={imageUrl} 
              alt={item.name} 
              className="w-full h-full" 
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <span className="text-slate-500 text-4xl">🍽️</span>
            </div>
          )}
          
          {/* Price badge overlay */}
          <div className="absolute bottom-2 right-2 bg-amber-500 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center text-sm shadow-lg">
            ${item.price}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4 text-center flex-1 flex flex-col">
        <h3 className="text-white font-semibold uppercase tracking-wide text-sm md:text-base mb-2">
          {item.name}
        </h3>
        
        <p className={`text-slate-400 text-sm leading-relaxed flex-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {item.description}
        </p>
        
        {/* Order button */}
        <button className="mt-4 bg-slate-700 hover:bg-red-600 text-white text-sm font-medium py-2 px-6 rounded-full transition-colors duration-300 uppercase tracking-wide">
          View Details
        </button>
      </div>
    </div>
  );
};

export default MenuStyleTwo;
