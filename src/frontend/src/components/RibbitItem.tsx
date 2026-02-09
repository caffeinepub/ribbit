import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCreateRibbit, useGetUserAvatarByUsername, useLikeRibbit, useUnlikeRibbit, useHasUserLikedRibbit, useGetRibbitLikeCount } from '@/hooks/useQueries';
import { Ribbit } from '@/backend';
import { getUsername } from '@/lib/user';
import RibbitMiniBlurAvatarImage from './RibbitMiniBlurAvatarImage';
import LilyImageFrame from './LilyImageFrame';

interface RibbitItemProps {
  ribbit: Ribbit;
  postId: string;
  depth?: number;
}

export default function RibbitItem({ ribbit, postId, depth = 0 }: RibbitItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { mutate: createRibbit, isPending: isCreatingRibbit } = useCreateRibbit();
  const { mutate: likeRibbit, isPending: isLiking } = useLikeRibbit();
  const { mutate: unlikeRibbit, isPending: isUnliking } = useUnlikeRibbit();
  const { data: hasLiked = false } = useHasUserLikedRibbit(ribbit.id);
  const { data: likeCount = 0 } = useGetRibbitLikeCount(ribbit.id);
  const { data: avatarBlob } = useGetUserAvatarByUsername(ribbit.username);

  const timestamp = new Date(Number(ribbit.timestamp) / 1000000);
  const maxDepth = 5;
  const indentLevel = Math.min(depth, maxDepth);

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;

    createRibbit(
      {
        postId,
        parentId: ribbit.id,
        content: replyContent,
        username: getUsername(),
      },
      {
        onSuccess: () => {
          setReplyContent('');
          setShowReplyForm(false);
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

  const avatarUrl = avatarBlob?.getDirectURL();

  return (
    <div
      className="py-3"
      style={{
        marginLeft: `${indentLevel * 1.5}rem`,
      }}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
          {avatarUrl ? (
            <RibbitMiniBlurAvatarImage 
              avatarUrl={avatarUrl}
              username={ribbit.username}
              renderMode="avatar"
            />
          ) : (
            <AvatarFallback className="text-sm">
              {ribbit.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1" style={{ fontSize: '0.875rem' }}>
            <span className="font-medium text-foreground">{ribbit.username}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          <p className="text-foreground/90 mb-2 whitespace-pre-wrap" style={{ fontSize: '0.9375rem' }}>
            {ribbit.content}
          </p>

          {/* Ribbit image with blurred backdrop */}
          {ribbit.image && (
            <div className="mb-2">
              <LilyImageFrame
                imageUrl={ribbit.image.getDirectURL()}
                alt={`Image from ${ribbit.username}`}
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            <button
              onClick={handleLikeClick}
              disabled={isLiking || isUnliking}
              className={`flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50 ${
                hasLiked ? 'text-accent' : ''
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="action-icon"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={hasLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageSquare className="action-icon" />
              <span>Reply</span>
            </button>
          </div>

          {showReplyForm && (
            <div className="mt-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-2 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isCreatingRibbit}
                  size="sm"
                >
                  {isCreatingRibbit ? 'Posting...' : 'Reply'}
                </Button>
                <Button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
