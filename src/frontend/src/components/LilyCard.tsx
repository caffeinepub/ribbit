import { Link } from '@tanstack/react-router';
import { MessageCircle, ExternalLink, Eye, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Post } from '@/backend';
import { formatDistanceToNow } from 'date-fns';
import { 
  useGetRibbitCount, 
  useGetViewCount, 
  useGetPond, 
  useGetUserAvatarByUsername,
  useGetPostLikeCount,
  useHasUserLikedPost,
  useLikePost,
  useUnlikePost
} from '@/hooks/useQueries';
import { formatNumber } from '@/lib/formatNumber';
import { shareLily } from '@/lib/shareLily';
import BookmarkButton from '@/components/BookmarkButton';
import LilyImageFrame from '@/components/LilyImageFrame';

interface LilyCardProps {
  lily: Post;
  showUserAvatar?: boolean;
  hideTags?: boolean;
}

export default function LilyCard({ lily, showUserAvatar = false, hideTags = false }: LilyCardProps) {
  const { data: ribbitCount = 0 } = useGetRibbitCount(lily.id);
  const { data: viewCount = 0 } = useGetViewCount(lily.id);
  const { data: likeCount = 0 } = useGetPostLikeCount(lily.id);
  const { data: hasLiked = false } = useHasUserLikedPost(lily.id);
  const { data: pond } = useGetPond(lily.pond);
  
  const { mutate: likePost, isPending: isLiking } = useLikePost();
  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost();
  
  // Fetch user avatar by username when showUserAvatar is true
  const { data: userAvatar } = useGetUserAvatarByUsername(showUserAvatar ? lily.username : '');

  const timestamp = new Date(Number(lily.timestamp) / 1000000);

  // Determine which avatar to show
  const avatarUrl = showUserAvatar 
    ? userAvatar?.getDirectURL() 
    : pond?.profileImage?.getDirectURL();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking || isUnliking) return;
    
    if (hasLiked) {
      unlikePost(lily.id);
    } else {
      likePost(lily.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shareLily(lily.id);
  };

  return (
    <div className="bg-card py-4 px-4 relative group">
      {/* Inset hover background layer - positioned above card background but below content */}
      <div 
        className="absolute inset-2 rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"
        aria-hidden="true"
      />
      
      <div className="flex items-start gap-3 relative z-10">
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0 mt-0.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={showUserAvatar ? lily.username : (pond?.name || '')}
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFallback>🐸</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5" style={{ fontSize: '0.875rem' }}>
            {!hideTags && (
              <>
                <Link to="/pond/$name" params={{ name: lily.pond }} className="font-medium hover:text-primary transition-colors">
                  pond/{lily.pond}
                </Link>
                <span className="text-muted-foreground">•</span>
              </>
            )}
            <Link 
              to="/f/$username" 
              params={{ username: lily.username }}
              className="font-medium text-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {lily.username}
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
          </div>
          <Link to="/lily/$id" params={{ id: lily.id }} className="group">
            <h3 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors mb-2">
              {lily.title}
              {lily.tag && (
                <>
                  {' '}
                  <Link 
                    to="/tag/$tag" 
                    params={{ tag: lily.tag }}
                    className="text-accent hover:underline font-semibold text-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{lily.tag}
                  </Link>
                </>
              )}
            </h3>
          </Link>

          {lily.image && (
            <div className="mb-3">
              <LilyImageFrame
                imageUrl={lily.image.getDirectURL()}
                alt={lily.title}
                loading="lazy"
              />
            </div>
          )}

          {lily.content && (
            <p className="text-foreground/90 line-clamp-3 mb-3 leading-relaxed">{lily.content}</p>
          )}
          {lily.link && (
            <a
              href={lily.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mb-3"
            >
              <ExternalLink className="action-icon" />
              {new URL(lily.link).hostname}
            </a>
          )}

          <div className="flex items-center gap-4 text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            <button
              onClick={handleLikeClick}
              disabled={isLiking || isUnliking}
              className={`flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50 ${
                hasLiked ? 'text-primary' : ''
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`action-icon transition-colors`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={hasLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{formatNumber(likeCount)}</span>
            </button>
            <Link to="/lily/$id" params={{ id: lily.id }} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <MessageCircle className="action-icon" />
              <span>{formatNumber(ribbitCount)}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Eye className="action-icon" />
              <span>{formatNumber(viewCount)}</span>
            </div>
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Send className="action-icon" />
            </button>
            <BookmarkButton lilyId={lily.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
