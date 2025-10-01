import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
}

/**
 * OptimizedImage component that wraps Next.js Image with fallback handling
 * For product images and other dynamic content in 2025
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  style,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  // Fallback image for broken images
  const handleError = () => {
    setImgSrc('/images/placeholder.jpg');
  };

  // For external images, we need to use unoptimized or configure domains
  const isExternal = imgSrc.startsWith('http://') || imgSrc.startsWith('https://');

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes || '100vw'}
        className={className}
        priority={priority}
        style={style}
        onError={handleError}
        {...(isExternal && { unoptimized: true })}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 500}
      height={height || 500}
      className={className}
      priority={priority}
      style={style}
      onError={handleError}
      {...(isExternal && { unoptimized: true })}
    />
  );
}
