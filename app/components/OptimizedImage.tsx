import { useState, useEffect, useRef } from 'react';
import { cn } from '~/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Preload image
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      onError?.();
    };
  }, [src, isInView, onLoad, onError]);

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const sizes = [0.5, 1, 1.5, 2];
    return sizes
      .map((scale) => {
        const scaledWidth = Math.round(width * scale);
        // Assuming you have a image optimization service
        const optimizedSrc = getOptimizedImageUrl(src, scaledWidth);
        return `${optimizedSrc} ${scaledWidth}w`;
      })
      .join(', ');
  };

  // Get optimized image URL (placeholder - implement with your CDN/service)
  const getOptimizedImageUrl = (originalSrc: string, targetWidth: number) => {
    // If using a CDN like Cloudinary, Imgix, etc.
    // return `https://your-cdn.com/${originalSrc}?w=${targetWidth}&q=auto&f=webp`;
    return originalSrc;
  };

  const aspectRatio = width && height ? height / width : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        aspectRatio,
        maxWidth: width,
        maxHeight: height,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          srcSet={generateSrcSet()}
          sizes={width ? `(max-width: ${width}px) 100vw, ${width}px` : undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Fallback for broken images */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Hook for preloading images
export function useImagePreloader(imageSrcs: string[]) {
  useEffect(() => {
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };

    imageSrcs.forEach(preloadImage);
  }, [imageSrcs]);
}

// Utility to generate blur data URL (for build time)
export async function generateBlurDataURL(imagePath: string): Promise<string> {
  // This would be implemented at build time with a tool like plaiceholder
  // For now, return a simple placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMjAiLz48L2ZpbHRlcj48L2RlZnM+PHBhdGggZmlsbD0iI2YzZjRmNiIgZD0iTTAgMGg0MHY0MEgweiIvPjxnIGZpbHRlcj0idXJsKCNiKSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwKSBzY2FsZSgwLjE1NjI1KSIgZmlsbC1vcGFjaXR5PSIuNSI+PC9nPjwvc3ZnPg==';
}