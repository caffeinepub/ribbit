import { useState, useEffect } from 'react';

interface LilyImageFrameProps {
  imageUrl: string;
  alt: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
}

export default function LilyImageFrame({ imageUrl, alt, onClick, loading = 'lazy' }: LilyImageFrameProps) {
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageAspectRatio(img.width / img.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const targetRatio = 4 / 3;
  const tolerance = 0.05;
  const shouldShowBlurredBackdrop = 
    imageAspectRatio !== null && 
    Math.abs(imageAspectRatio - targetRatio) > tolerance;

  if (shouldShowBlurredBackdrop) {
    // Blurred backdrop mode for non-4:3 images (portrait/landscape)
    return (
      <div 
        className="relative w-full aspect-[4/3] rounded-lg overflow-hidden"
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            filter: 'blur(30px)',
            transform: 'scale(1.1)',
          }}
        />
        {/* Centered image container with flex */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={alt}
            className="block max-h-full max-w-full object-contain"
            loading={loading}
            style={{ display: 'block' }}
          />
        </div>
      </div>
    );
  }

  // Normal mode for 4:3 images
  return (
    <div 
      className="w-full aspect-[4/3] rounded-lg overflow-hidden"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="block w-full h-full object-cover"
        loading={loading}
        style={{ display: 'block', objectPosition: 'center' }}
      />
    </div>
  );
}
