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
          ) : null}
          <AvatarFallback className="text-sm">
            {ribbit.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{ribbit.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap break-words">
            {ribbit.content}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLikeClick}
              disabled={isLiking || isUnliking}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
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
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                <MessageSquare className="action-icon" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isCreatingRibbit}
                  size="sm"
                >
                  {isCreatingRibbit ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
