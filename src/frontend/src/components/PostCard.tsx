import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Eye, ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Post } from '@/backend';

interface PostCardProps {
  post: Post;
  commentCount?: number;
  onUpvote?: () => void;
  onDownvote?: () => void;
  upvotes?: number;
  downvotes?: number;
}

export default function PostCard({ post, commentCount = 0, onUpvote, onDownvote, upvotes = 0, downvotes = 0 }: PostCardProps) {
  const timestamp = new Date(Number(post.timestamp) / 1_000_000);
  const imageUrl = post.image?.getDirectURL();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpvote}
              className="h-8 w-8 p-0"
            >
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">{upvotes - downvotes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownvote}
              className="h-8 w-8 p-0"
            >
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Link
                to="/pond/$name"
                params={{ name: post.pond }}
                className="font-medium hover:underline"
              >
                p/{post.pond}
              </Link>
              <span>•</span>
              <span>Posted by {post.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
            </div>

            <Link
              to="/lily/$id"
              params={{ id: post.id }}
              className="block group"
            >
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              
              {post.content && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                  {post.content}
                </p>
              )}

              {imageUrl && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden mb-2">
                  <img
                    src={imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {post.tag && (
                <Badge variant="secondary" className="mb-2">
                  #{post.tag}
                </Badge>
              )}
            </Link>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{commentCount} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{Number(post.viewCount)} views</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
