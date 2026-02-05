import { useNavigate } from '@tanstack/react-router';
import type { Pond } from '@/backend';

interface PondMobileHeaderProps {
  pond: Pond;
  currentTab: 'feed' | 'about';
}

export default function PondMobileHeader({ pond, currentTab }: PondMobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:hidden">
      {/* Full-width banner image with overlay */}
      <div className="relative w-full overflow-hidden h-32">
        {pond.bannerImage ? (
          <img
            src={pond.bannerImage.getDirectURL()}
            alt={`${pond.title} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Pond info overlay - bottom-left corner */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-3">
            {pond.profileImage && (
              <img
                src={pond.profileImage.getDirectURL()}
                alt={pond.title}
                className="w-16 h-16 rounded-full object-cover border-4 border-white/20 flex-shrink-0 shadow-lg"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 
                className="text-2xl font-bold text-white mb-1"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {pond.title}
              </h1>
              <p 
                className="text-sm text-white/90 line-clamp-2"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {pond.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background">
        <div className="flex">
          <button
            onClick={() => navigate({ to: '/pond/$name', params: { name: pond.name } })}
            className={`flex-1 pb-3 pt-3 px-4 border-b-2 font-medium transition-colors ${
              currentTab === 'feed'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => navigate({ to: '/pond/$name/about', params: { name: pond.name } })}
            className={`flex-1 pb-3 pt-3 px-4 border-b-2 font-medium transition-colors ${
              currentTab === 'about'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            About
          </button>
        </div>
      </div>
    </div>
  );
}
