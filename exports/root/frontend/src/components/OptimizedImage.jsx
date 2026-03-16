import React, { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage - Lazy loading image component with blur placeholder
 * Improves page load performance by only loading images when visible
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  quality = 80,
  placeholder = 'blur'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Generate optimized URL using image proxy/CDN parameters if available
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    // For Unsplash images - add optimization params
    if (originalSrc.includes('unsplash.com')) {
      const separator = originalSrc.includes('?') ? '&' : '?';
      return `${originalSrc}${separator}w=800&q=${quality}&fm=webp&auto=format`;
    }
    
    // For Pexels images - already optimized via params
    if (originalSrc.includes('pexels.com')) {
      return originalSrc.replace(/w=\d+/, 'w=800').replace(/h=\d+/, 'h=600');
    }
    
    // For finandfeathersrestaurants.com - use WordPress sizing
    if (originalSrc.includes('finandfeathersrestaurants.com')) {
      // Replace -scaled with smaller size if present
      return originalSrc
        .replace('-scaled.jpg', '-1024x683.jpg')
        .replace('-scaled.jpeg', '-1024x683.jpeg')
        .replace('-scaled.png', '-1024x683.png');
    }

    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        backgroundColor: '#1e293b',
        minHeight: height || '200px'
      }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse"
          style={{ filter: 'blur(10px)' }}
        />
      )}
      
      {/* Actual image - only render when in view */}
      {isInView && !error && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500">
          <span className="text-4xl">📷</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
