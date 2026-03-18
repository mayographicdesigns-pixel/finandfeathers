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

// Style Three: Compact row with small square image, title, description, star ratings, dotted line to price
export const MenuStyleThree = ({ item, isExpanded, onToggleExpand, onImageClick }) => {
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
  
  // Generate star rating (placeholder - could be dynamic)
  const rating = 4;

  return (
    <div 
      className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group border border-white/10"
      onClick={() => onToggleExpand && onToggleExpand(item)}
      data-testid={`menu-style-three-${item.id}`}
    >
      {/* Square Image with optional badge */}
      <div 
        className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden relative"
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
            <span className="text-slate-500 text-2xl">🍽️</span>
          </div>
        )}
        
        {/* Badge overlay */}
        {hasBadge && (
          <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
            {item.badges[0]}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-500 text-xs">■</span>
          <h3 className="text-white font-semibold uppercase tracking-wide text-xs md:text-sm truncate">
            {item.name}
          </h3>
        </div>
        
        <p className={`text-slate-400 text-xs leading-relaxed mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {item.description}
        </p>
        
        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-xs ${i < rating ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
          ))}
        </div>
      </div>
      
      {/* Price with dotted line */}
      <div className="flex items-center gap-2 flex-shrink-0 self-center">
        <span className="hidden sm:block w-16 border-b border-dotted border-slate-600" />
        <span className="text-amber-400 font-bold text-base md:text-lg">${item.price}</span>
      </div>
    </div>
  );
};

export default MenuStyleThree;
