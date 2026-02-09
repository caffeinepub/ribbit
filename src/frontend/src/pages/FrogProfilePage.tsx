import { useParams, useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetUserProfileByUsername, useGetPostsByUsername, useGetRibbitsByUsername } from '@/hooks/useQueries';
import LilyCard from '@/components/LilyCard';
import ProfileRibbitItem from '@/components/ProfileRibbitItem';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatNumber } from '@/lib/formatNumber';

export default function FrogProfilePage() {
  const { username } = useParams({ from: '/f/$username' });
  const navigate = useNavigate();
  
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useGetUserProfileByUsername(username);
  const { data: posts = [], isLoading: postsLoading } = useGetPostsByUsername(username);
  const { data: ribbits = [], isLoading: ribbitsLoading } = useGetRibbitsByUsername(username);

  const isLoading = profileLoading || postsLoading || ribbitsLoading;

  const handleBackClick = () => {
    // Check if there's meaningful history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: navigate to home
      navigate({ to: '/' });
    }
  };

  // Not found state
  if (profileFetched && !profile && !profileLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground">
            The user f/{username} does not exist or has not set up their profile yet.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatar?.getDirectURL();
  const postCount = posts.length;
  const commentCount = ribbits.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Back button - leftmost element */}
          <button
            onClick={handleBackClick}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted flex-shrink-0 -ml-2 px-2 py-2"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <Avatar className="h-20 w-20 bg-primary/10 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="text-2xl">🐸</AvatarFallback>
            )}
          </Avatar>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">f/{username}</h1>
            {profile?.name && profile.name !== username && (
              <p className="text-muted-foreground mb-3">{profile.name}</p>
            )}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-foreground">{formatNumber(postCount)}</span>
                <span className="text-muted-foreground ml-1">
                  {postCount === 1 ? 'Post' : 'Posts'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{formatNumber(commentCount)}</span>
                <span className="text-muted-foreground ml-1">
                  {commentCount === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts yet
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden divide-y">
              {posts.map((post) => (
                <LilyCard key={post.id} lily={post} showUserAvatar={false} hideTags={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-0">
          {ribbits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No comments yet
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden divide-y">
              {ribbits.map((ribbit) => (
                <ProfileRibbitItem key={ribbit.id} ribbit={ribbit} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
