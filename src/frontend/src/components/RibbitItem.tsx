import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Ribbit } from '@/backend';
import { formatDistanceToNow } from 'date-fns';
import { 
  useCreateRibbit,
  useGetUserAvatarByUsername,
  useGetRibbitLikeCount,
  useHasUserLikedRibbit,
  useLikeRibbit,
  useUnlikeRibbit
} from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/formatNumber';

interface RibbitItemProps {
  ribbit: Ribbit;
  depth?: number;
  postId: string;
}

export default function RibbitItem({ ribbit, depth = 0, postId }: RibbitItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const username = getUsername();
  const { mutate: createReply, isPending: isCreatingReply } = useCreateRibbit();
  const { data: ribbitUserAvatar } = useGetUserAvatarByUsername(ribbit.username);
  const { data: likeCount = 0 } = useGetRibbitLikeCount(ribbit.id);
  const { data: hasLiked = false } = useHasUserLikedRibbit(ribbit.id);
  const { mutate: likeRibbit, isPending: isLiking } = useLikeRibbit();
  const { mutate: unlikeRibbit, isPending: isUnliking } = useUnlikeRibbit();

  const timestamp = new Date(Number(ribbit.timestamp) / 1000000);
  const indentLevel = Math.min(depth, 5);

  const handleSubmitReply = () => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    createReply(
      { postId, parentId: ribbit.id, content: replyContent, username },
      {
        onSuccess: () => {
          setReplyContent('');
          setShowReplyForm(false);
          toast.success('Reply posted!');
        },
        onError: () => {
          toast.error('Failed to post reply');
        },
      }
    );
  };

  const handleLikeClick = () => {
    if (isLiking || isUnliking) return;
    
    if (hasLiked) {
      unlikeRibbit(ribbit.id);
    } else {
      likeRibbit(ribbit.id);
    }
  };

  return (
    <div 
      className="py-3"
      style={{ 
        marginLeft: `${indentLevel * 1.5}rem`,
        borderLeft: depth > 0 ? '2px solid hsl(var(--border))' : 'none',
        paddingLeft: depth > 0 ? '1rem' : '0'
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
          {ribbitUserAvatar ? (
            <AvatarImage src={ribbitUserAvatar.getDirectURL()} alt={ribbit.username} />
          ) : (
            <AvatarFallback className="text-sm">🐸</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-medium">{ribbit.username}</span>
            <span>•</span>
            <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-2">{ribbit.content}</p>
          
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleLikeClick}
              disabled={isLiking || isUnliking}
              className="flex items-center gap-1 h-7 px-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
              style={{ fontSize: '0.875rem' }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`action-icon transition-colors ${
                  hasLiked 
                    ? 'fill-primary stroke-primary' 
                    : 'fill-none stroke-current'
                }`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="text-muted-foreground">{formatNumber(likeCount)}</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              style={{ fontSize: '0.875rem' }}
            >
              <MessageSquare className="action-icon mr-1" />
              Reply
            </Button>
          </div>

          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Replying as {username}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={isCreatingReply}
                  >
                    {isCreatingReply ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
