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

// Style One: Horizontal card with image on left, title + badge + price + dotted line on right
export const MenuStyleOne = ({ item, isExpanded, onToggleExpand, onImageClick }) => {
  const imageUrl = item.image_url || item.image;
  const hasImage = imageUrl && imageUrl.trim() !== '';
  const hasBadge = item.badges && item.badges.length > 0;

  return (
    <div 
      className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer group border border-white/10"
      onClick={() => onToggleExpand && onToggleExpand(item)}
      data-testid={`menu-style-one-${item.id}`}
    >
      <div className="flex items-stretch">
        {/* Image */}
        {hasImage && (
          <div 
            className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick && onImageClick(item);
            }}
          >
            <LazyImage 
              src={imageUrl} 
              alt={item.name} 
              className="w-full h-full" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-red-500 text-sm">■</span>
            <h3 className="text-white font-semibold uppercase tracking-wide text-sm md:text-base">
              {item.name}
            </h3>
            {hasBadge && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {item.badges[0]}
              </span>
            )}
            <span className="flex-1 border-b border-dotted border-slate-600 mx-2 hidden sm:block" />
            <span className="text-amber-400 font-bold text-lg">${item.price}</span>
          </div>
          
          <p className={`text-slate-400 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuStyleOne;
