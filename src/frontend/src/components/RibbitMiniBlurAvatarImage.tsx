import { useState, useEffect } from 'react';
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface RibbitMiniBlurAvatarImageProps {
  avatarUrl: string;
  username: string;
  renderMode?: 'avatar' | 'img';
}

// Tiny 1x1 blurred placeholder data URL (gray)
const MINI_BLUR_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3Crect width="1" height="1" fill="%23d1d5db"/%3E%3C/svg%3E';

export default function RibbitMiniBlurAvatarImage({ 
  avatarUrl, 
  username,
  renderMode = 'avatar'
}: RibbitMiniBlurAvatarImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [finalUrl, setFinalUrl] = useState(MINI_BLUR_PLACEHOLDER);

  useEffect(() => {
    // Reset state when avatarUrl changes
    setIsLoaded(false);
    setFinalUrl(MINI_BLUR_PLACEHOLDER);

    // Preload the real avatar
    const img = new Image();
    img.onload = () => {
      setFinalUrl(avatarUrl);
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoaded(true), 10);
    };
    img.onerror = () => {
      // On error, keep placeholder and mark as loaded to remove blur
      setIsLoaded(true);
    };
    img.src = avatarUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [avatarUrl]);

  // Inline styles for smooth transition without affecting layout
  const imageStyle: React.CSSProperties = {
    transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0.7,
    filter: isLoaded ? 'blur(0px)' : 'blur(4px)',
  };

  if (renderMode === 'img') {
    // Plain img mode for ProfileRibbitItem
    return (
      <img
        src={finalUrl}
        alt={username}
        className="w-full h-full object-cover"
        style={imageStyle}
      />
    );
  }

  // AvatarImage mode for RibbitItem
  return (
    <AvatarImage 
      src={finalUrl} 
      alt={username}
      style={imageStyle}
    />
  );
}
