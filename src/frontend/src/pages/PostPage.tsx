import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, MessageSquare, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGetPost, useGetThreadedRibbits, useCreateRibbit } from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';
import { toast } from 'sonner';
import CommentItem from '@/components/CommentItem';

export default function PostPage() {
  const { id } = useParams({ from: '/lily/$id' });
  const [commentContent, setCommentContent] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  const { data: post, isLoading: isLoadingPost } = useGetPost(id);
  const { data: ribbits, isLoading: isLoadingRibbits } = useGetThreadedRibbits(id, sortBy);
  const createRibbit = useCreateRibbit();
  const username = getUsername();

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await createRibbit.mutateAsync({
        postId: id,
        parentId: null,
        content: commentContent,
        username,
      });

      setCommentContent('');
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error('Error creating comment:', error);
      toast.error(error.message || 'Failed to post comment');
    }
  };

  if (isLoadingPost) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-center text-muted-foreground">Post not found</p>
      </div>
    );
  }

  const timestamp = new Date(Number(post.timestamp) / 1_000_000);
  const imageUrl = post.image?.getDirectURL();

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
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

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        {post.tag && (
          <Badge variant="secondary" className="mb-4">
            #{post.tag}
          </Badge>
        )}

        {post.content && (
          <p className="text-base mb-4 whitespace-pre-wrap">{post.content}</p>
        )}

        {imageUrl && (
          <div className="relative w-full rounded-md overflow-hidden mb-4">
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {post.link}
          </a>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{ribbits?.length || 0} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{Number(post.viewCount)} views</span>
          </div>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add a Comment</h2>
        <Textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="What are your thoughts?"
          rows={4}
          className="mb-2"
        />
        <Button onClick={handleSubmitComment} disabled={createRibbit.isPending}>
          {createRibbit.isPending ? 'Posting...' : 'Comment'}
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Comments ({ribbits?.length || 0})
          </h2>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'top' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('top')}
            >
              Top
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              Newest
            </Button>
          </div>
        </div>

        {isLoadingRibbits ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : ribbits && ribbits.length > 0 ? (
          <div className="divide-y">
            {ribbits.map((ribbit) => (
              <CommentItem
                key={ribbit.id}
                comment={ribbit}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
