import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ExternalLink, Eye, X, Send, ArrowLeft, Image } from 'lucide-react';
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
  useIncrementViewCount,
  useGetPond
} from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import RibbitItem from '@/components/RibbitItem';
import { getUsername } from '@/lib/user';
import { formatNumber } from '@/lib/formatNumber';
import { shareLily } from '@/lib/shareLily';
import BookmarkButton from '@/components/BookmarkButton';
import { isWithinCooldown, recordViewIncrement } from '@/lib/viewCountCooldown';
import { ViewIncrementResult, ExternalBlob } from '@/backend';
import LilyImageFrame from '@/components/LilyImageFrame';
import { compressImageFile } from '@/lib/imageCompression';
import { toast } from 'sonner';

export default function LilyPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [ribbitContent, setRibbitContent] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('newest');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track if we've already attempted to increment view for this lily ID
  const viewIncrementAttemptedRef = useRef<string | null>(null);

  const { data: lily, isLoading: lilyLoading } = useGetLily(id);
  const { data: pond } = useGetPond(lily?.pond || '');
  const { data: ribbits, isLoading: ribbitsLoading } = useGetRibbits(id, sortBy);
  const { data: ribbitCount = 0 } = useGetRibbitCount(id);
  const { data: viewCount = 0 } = useGetViewCount(id);
  const { data: likeCount = 0 } = useGetPostLikeCount(id);
  const { data: hasLiked = false } = useHasUserLikedPost(id);
  const { mutate: createRibbit, isPending: isCreatingRibbit } = useCreateRibbit();
  const { mutate: likePost, isPending: isLiking } = useLikePost();
  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost();
  const { mutate: incrementViewCount } = useIncrementViewCount();

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

  const handleSubmitRibbit = async () => {
    if (!ribbitContent.trim() || !lily) return;

    let imageBlob: ExternalBlob | null = null;

    if (selectedImage) {
      try {
        const result = await compressImageFile(selectedImage);
        imageBlob = ExternalBlob.fromBytes(result.bytes);
      } catch (error) {
        console.error('Image compression failed:', error);
        toast.error('Failed to process image');
        return;
      }
    }

    createRibbit(
      {
        postId: lily.id,
        parentId: null,
        content: ribbitContent,
        username: getUsername(),
        image: imageBlob,
      },
      {
        onSuccess: () => {
          setRibbitContent('');
          setSelectedImage(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
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

  const handleBackClick = () => {
    // Check if there's meaningful history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else if (lily?.pond) {
      // Fallback: navigate to the lily's pond
      navigate({ to: '/pond/$name', params: { name: lily.pond } });
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:container py-8">
        <div className="max-w-4xl lg:mx-auto px-4 lg:px-0">
          {/* Reddit-style Back button */}
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-2 px-2 py-1 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium" style={{ fontSize: '0.875rem' }}>Back</span>
          </button>

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
                  <LilyImageFrame
                    imageUrl={lily.image.getDirectURL()}
                    alt={lily.title}
                    onClick={() => setLightboxOpen(true)}
                    loading="eager"
                  />
                </div>
              )}

              {/* Link */}
              {lily.link && (
                <a
                  href={lily.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="action-icon" />
                  {new URL(lily.link).hostname}
                </a>
              )}
            </div>

            {/* Action buttons row - no top padding/border, 2rem bottom padding */}
            <div className="flex items-center gap-4 text-muted-foreground pb-8" style={{ fontSize: '0.875rem' }}>
              <button
                onClick={handleLikeClick}
                disabled={isLiking || isUnliking}
                className={`flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50 ${
                  hasLiked ? 'text-accent' : ''
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
              <div className="flex items-center gap-1.5">
                <MessageCircle className="action-icon" />
                <span>{formatNumber(ribbitCount)}</span>
              </div>
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

          {/* Ribbits Section */}
          <div>
            {/* Ribbit creation form - no border on top */}
            <div className="mb-6">
              <div className="relative">
                <Textarea
                  placeholder="What are your thoughts?"
                  value={ribbitContent}
                  onChange={(e) => setRibbitContent(e.target.value)}
                  className="resize-none pr-12 pb-12"
                  rows={3}
                />
                {/* Image upload button - bottom left */}
                <button
                  onClick={handleImageClick}
                  className="absolute bottom-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Upload image"
                >
                  <Image className="h-5 w-5" />
                </button>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {/* Submit button - bottom right */}
                <Button
                  onClick={handleSubmitRibbit}
                  disabled={!ribbitContent.trim() || isCreatingRibbit}
                  size="sm"
                  className="absolute bottom-3 right-3"
                >
                  {isCreatingRibbit ? 'Posting...' : 'Ribbit'}
                </Button>
              </div>
              {/* Image preview */}
              {selectedImage && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="max-h-32 rounded-md border"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sorting toggle buttons directly below text entry */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'top'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Top
              </button>
            </div>

            {/* Ribbits list */}
            {ribbitsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : ribbits && ribbits.length > 0 ? (
              <div className="space-y-0">
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
            aria-label="Close lightbox"
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
