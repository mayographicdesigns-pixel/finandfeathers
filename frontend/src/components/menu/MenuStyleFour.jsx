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

// Style Four: Horizontal row with rounded image, title + price, Buy Now button
export const MenuStyleFour = ({ item, isExpanded, onToggleExpand, onImageClick }) => {
  const rawImageUrl = item.image_url || item.image;
  const hasImage = rawImageUrl && rawImageUrl.trim() !== '';
  const hasBadge = item.badges && item.badges.length > 0;

  // Construct full image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api')) return `${process.env.REACT_APP_BACKEND_URL}${url}`;
    return url;
  };
  const imageUrl = getImageUrl(rawImageUrl);

  // Generate pastel background color based on item name
  const colors = ['bg-rose-100', 'bg-amber-100', 'bg-emerald-100', 'bg-sky-100', 'bg-violet-100', 'bg-pink-100'];
  const colorIndex = item.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div 
      className={`flex items-center gap-4 p-3 ${bgColor} rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group`}
      onClick={() => onToggleExpand && onToggleExpand(item)}
      data-testid={`menu-style-four-${item.id}`}
    >
      {/* Rounded Image */}
      <div 
        className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-2xl overflow-hidden relative shadow-md group-hover:scale-105 transition-transform duration-300"
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
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-400 text-3xl">🍽️</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-600 text-sm">■</span>
          <h3 className="text-slate-800 font-semibold uppercase tracking-wide text-sm truncate">
            {item.name}
          </h3>
          {hasBadge && (
            <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
              {item.badges[0]}
            </span>
          )}
        </div>
        
        <p className="text-slate-800 font-bold text-lg">${item.price}</p>
        
        {isExpanded && item.description && (
          <p className="text-slate-600 text-xs mt-1 line-clamp-2">{item.description}</p>
        )}
      </div>
      
      {/* Buy Now Button */}
      <button 
        className="bg-slate-800 hover:bg-red-600 text-white text-xs font-medium py-2 px-4 rounded-full transition-colors duration-300 uppercase tracking-wide flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand && onToggleExpand(item);
        }}
      >
        View
      </button>
    </div>
  );
};

export default MenuStyleFour;
