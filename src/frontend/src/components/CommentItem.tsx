import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    username: string;
    timestamp: bigint;
  };
  onReply?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  likeCount?: number;
}

export default function CommentItem({ comment, onReply, onLike, isLiked, likeCount = 0 }: CommentItemProps) {
  const timestamp = new Date(Number(comment.timestamp) / 1_000_000);

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.username}`} />
        <AvatarFallback>{comment.username[0]?.toUpperCase() || 'F'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.username}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm mb-2 whitespace-pre-wrap break-words">{comment.content}</p>
        
        <div className="flex items-center gap-2">
          {onLike && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`h-7 px-2 ${isLiked ? 'text-primary' : ''}`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
          )}
          
          {onReply && (
            <Button variant="ghost" size="sm" onClick={onReply} className="h-7 px-2">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
