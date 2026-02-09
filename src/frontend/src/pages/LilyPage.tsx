import { useParams, Link } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ExternalLink, Eye, X, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  useGetLily, 
  useGetRibbits, 
  useCreateRibbit, 
  useGetRibbitCount, 
  useGetViewCount,
  useGetPostLikeCount,
  useHasUserLikedPost,
  useLikePost,
  useUnlikePost,
  useIncrementLilyViewCount,
  useGetPond
} from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import RibbitItem from '@/components/RibbitItem';
import { getUsername } from '@/lib/user';
import { formatNumber } from '@/lib/formatNumber';
import { shareLily } from '@/lib/shareLily';
import BookmarkButton from '@/components/BookmarkButton';
import { isWithinCooldown, recordViewIncrement } from '@/lib/viewCountCooldown';
import { ViewIncrementResult } from '@/backend';

export default function LilyPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const [ribbitContent, setRibbitContent] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  
  // Track if we've already attempted to increment view for this lily ID
  const viewIncrementAttemptedRef = useRef<string | null>(null);

  const { data: lily, isLoading: lilyLoading } = useGetLily(id);
  const { data: pond } = useGetPond(lily?.pond || '');
  const { data: ribbits, isLoading: ribbitsLoading } = useGetRibbits(id);
  const { data: ribbitCount = 0 } = useGetRibbitCount(id);
  const { data: viewCount = 0 } = useGetViewCount(id);
  const { data: likeCount = 0 } = useGetPostLikeCount(id);
  const { data: hasLiked = false } = useHasUserLikedPost(id);
  const { mutate: createRibbit, isPending: isCreatingRibbit } = useCreateRibbit();
  const { mutate: likePost, isPending: isLiking } = useLikePost();
  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost();
  const { mutate: incrementViewCount } = useIncrementLilyViewCount();

  // Increment view count immediately on page open (with cooldown guard)
  useEffect(() => {
    // Only attempt once per lily ID to prevent duplicate calls from StrictMode/re-renders
    if (!id || viewIncrementAttemptedRef.current === id) {
      return;
    }

    // Check cooldown before attempting increment
    if (isWithinCooldown(id)) {
      // Still mark as attempted to prevent re-checking on every render
      viewIncrementAttemptedRef.current = id;
      return;
    }

    // Mark as attempted immediately to prevent duplicate calls
    viewIncrementAttemptedRef.current = id;

    // Attempt to increment view count
    incrementViewCount(id, {
      onSuccess: (result) => {
        if (result === ViewIncrementResult.success) {
          // Record the successful increment timestamp
          recordViewIncrement(id);
        }
        // On notFound or error, we don't record cooldown - allow retry on next visit
      },
      onError: (error) => {
        // Log error but don't break the page
        console.error('View count increment failed:', error);
      },
    });
  }, [id, incrementViewCount]);

  // Reset the attempted ref when navigating to a different lily
  useEffect(() => {
    if (viewIncrementAttemptedRef.current && viewIncrementAttemptedRef.current !== id) {
      viewIncrementAttemptedRef.current = null;
    }
  }, [id]);

  useEffect(() => {
    if (lily?.image) {
      const img = new Image();
      img.onload = () => {
        setImageAspectRatio(img.width / img.height);
      };
      img.src = lily.image.getDirectURL();
    }
  }, [lily?.image]);

  const handleSubmitRibbit = () => {
    if (!ribbitContent.trim() || !lily) return;

    createRibbit(
      {
        postId: lily.id,
        parentId: null,
        content: ribbitContent,
        username: getUsername(),
      },
      {
        onSuccess: () => {
          setRibbitContent('');
        },
      }
    );
  };

  const handleLikeClick = () => {
    if (isLiking || isUnliking || !lily) return;
    
    if (hasLiked) {
      unlikePost(lily.id);
    } else {
      likePost(lily.id);
    }
  };

  const handleShareClick = () => {
    if (!lily) return;
    shareLily(lily.id);
  };

  if (lilyLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:container py-8">
          <div className="max-w-4xl lg:mx-auto space-y-4 px-4 lg:px-0">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lily) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:container py-8">
          <div className="max-w-4xl lg:mx-auto text-center px-4 lg:px-0">
            <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>Lily not found</p>
          </div>
        </div>
      </div>
    );
  }

  const timestamp = new Date(Number(lily.timestamp) / 1000000);
  const shouldShowBlurredBackdrop = imageAspectRatio !== null && imageAspectRatio !== 4/3;

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:container py-8">
        <div className="max-w-4xl lg:mx-auto px-4 lg:px-0">
          <div className="overflow-hidden mb-4">
            {/* Single column layout - all elements left-aligned */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Header: Avatar and metadata */}
              <div className="flex items-start gap-3">
                {/* Pond Avatar */}
                <Avatar className="h-10 w-10 bg-primary/10 flex-shrink-0">
                  {pond?.profileImage ? (
                    <AvatarImage src={pond.profileImage.getDirectURL()} alt={pond.name} />
                  ) : null}
                  <AvatarFallback className="text-lg">🐸</AvatarFallback>
                </Avatar>

                {/* Metadata: Two lines */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {/* Line 1: Pond name (bold) • timestamp */}
                  <div className="flex flex-wrap items-center gap-2" style={{ fontSize: '0.875rem' }}>
                    <Link 
                      to="/pond/$name" 
                      params={{ name: lily.pond }} 
                      className="hover:text-primary font-bold"
                    >
                      pond/{lily.pond}
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                  </div>
                  {/* Line 2: Username (not bold) */}
                  <div style={{ fontSize: '0.875rem' }}>
                    <span className="text-foreground">{lily.username}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold leading-tight">
                {lily.title}
                {lily.tag && (
                  <>
                    {' '}
                    <Link 
                      to="/tag/$tag" 
                      params={{ tag: lily.tag }}
                      className="text-accent hover:underline text-2xl"
                    >
                      #{lily.tag}
                    </Link>
                  </>
                )}
              </h1>
              
              {/* Description */}
              {lily.content && (
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed" style={{ fontSize: '1rem' }}>{lily.content}</p>
              )}

              {/* Image block */}
              {lily.image && (
                <div>
                  {shouldShowBlurredBackdrop ? (
                    <div 
                      className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${lily.image.getDirectURL()})`,
                          filter: 'blur(30px)',
                          transform: 'scale(1.1)',
                        }}
                      />
                      <div className="relative flex items-center justify-center w-full h-full">
                        <img
                          src={lily.image.getDirectURL()}
                          alt={lily.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <img
                        src={lily.image.getDirectURL()}
                        alt={lily.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Link block */}
              {lily.link && (
                <div>
                  <a
                    href={lily.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="break-all">{lily.link}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Action buttons row - no top padding, no border, 2rem bottom padding */}
            <div className="flex items-center gap-4 pt-0 pb-8">
              <button
                onClick={handleLikeClick}
                disabled={isLiking || isUnliking}
                className={`flex items-center gap-2 transition-colors ${
                  hasLiked ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={hasLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="action-icon"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span style={{ fontSize: '0.875rem' }}>{formatNumber(likeCount)}</span>
              </button>

              <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                <MessageCircle className="action-icon" />
                <span style={{ fontSize: '0.875rem' }}>{formatNumber(ribbitCount)}</span>
              </button>

              <button className="flex items-center gap-2 text-muted-foreground">
                <Eye className="action-icon" />
                <span style={{ fontSize: '0.875rem' }}>{formatNumber(viewCount)}</span>
              </button>

              <button
                onClick={handleShareClick}
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors ml-auto"
              >
                <Send className="action-icon" />
                <span style={{ fontSize: '0.875rem' }}>Share</span>
              </button>

              <BookmarkButton 
                lilyId={lily.id}
                inactiveColor="text-muted-foreground"
                hoverColor="hover:text-accent"
                activeColor="text-accent"
              />
            </div>
          </div>

          {/* Ribbits Section - no heading, no border on form */}
          <div className="mt-6">
            {/* Ribbit creation form - no border */}
            <div className="mb-6 p-4 rounded-lg bg-card">
              <Textarea
                placeholder="Write a ribbit..."
                value={ribbitContent}
                onChange={(e) => setRibbitContent(e.target.value)}
                className="mb-3 resize-none"
                rows={3}
                style={{ fontSize: '1rem' }}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitRibbit}
                  disabled={!ribbitContent.trim() || isCreatingRibbit}
                  size="sm"
                  className="rounded-full"
                >
                  {isCreatingRibbit ? (
                    <>
                      <span className="mr-2">Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Ribbit
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Ribbits list */}
            {ribbitsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : ribbits && ribbits.length > 0 ? (
              <div className="space-y-4">
                {ribbits.map((ribbit) => (
                  <RibbitItem key={ribbit.id} ribbit={ribbit} postId={lily.id} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8" style={{ fontSize: '1rem' }}>
                No ribbits yet. Be the first to ribbit!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for full-size image */}
      {lightboxOpen && lily.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lily.image.getDirectURL()}
            alt={lily.title}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
