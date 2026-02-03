import { useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LilyCard from '@/components/LilyCard';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import { useGetPond, useGetAllLilies, useGetJoinedPonds, useJoinPond } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type SortOption = 'new';

export default function PondPage() {
  const { name } = useParams({ strict: false }) as { name: string };
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('new');

  const { data: pond, isLoading: isLoadingPond } = useGetPond(name);
  const { data: allLilies, isLoading: isLoadingLilies } = useGetAllLilies();
  const { data: joinedPonds, isLoading: isLoadingJoined } = useGetJoinedPonds();
  
  const joinPondMutation = useJoinPond();

  const pondLilies = allLilies?.filter((lily) => lily.pond === name) || [];

  const sortedLilies = [...pondLilies].sort((a, b) => {
    return Number(b.timestamp) - Number(a.timestamp);
  });

  const isMember = joinedPonds?.includes(name) || false;
  const isProcessing = joinPondMutation.isPending;

  const handleJoinPond = async () => {
    try {
      await joinPondMutation.mutateAsync(name);
      toast.success('Successfully joined the pond!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join pond');
    }
  };

  if (isLoadingPond) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:container lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6">
            <aside className="hidden lg:block lg:col-span-3" style={{ maxWidth: '15.625rem' }}>
              <LeftSidebar />
            </aside>
            <main className="lg:col-span-6">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-48 w-full" />
            </main>
            <aside className="hidden lg:block lg:col-span-3">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (!pond) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:container lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6">
            <aside className="hidden lg:block lg:col-span-3" style={{ maxWidth: '15.625rem' }}>
              <LeftSidebar />
            </aside>
            <main className="lg:col-span-6 text-center px-4">
              <h1 className="text-2xl font-bold mb-4">Pond not found</h1>
              <p className="text-muted-foreground mb-4" style={{ fontSize: '1rem' }}>This pond doesn't exist yet.</p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </main>
            <aside className="hidden lg:block lg:col-span-3">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width banner image with overlay - fixed height 12rem */}
      <div className="relative w-full overflow-hidden" style={{ height: '12rem' }}>
        {pond.bannerImage ? (
          <img
            src={pond.bannerImage.getDirectURL()}
            alt={`${pond.title} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Pond info overlay - bottom-left corner */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8">
          <div className="lg:container">
            <div className="flex items-center gap-3 md:gap-4">
              {pond.profileImage && (
                <img
                  src={pond.profileImage.getDirectURL()}
                  alt={pond.title}
                  className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-white/20 flex-shrink-0 shadow-lg"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                >
                  {pond.title}
                </h1>
                <p 
                  className="text-sm md:text-base lg:text-lg text-white/90 line-clamp-2"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                  {pond.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:container lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, max-width 15.625rem (250px) */}
          <aside className="hidden lg:block lg:col-span-3" style={{ maxWidth: '15.625rem' }}>
            <LeftSidebar />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-6">
            {/* Join button - only show if not a member */}
            <div className="py-4 px-4 lg:px-0 lg:py-0">
              {!isMember && (
                <div className="mb-4">
                  {isLoadingJoined ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleJoinPond}
                      disabled={isProcessing}
                    >
                      {joinPondMutation.isPending ? 'Joining...' : 'Join Pond'}
                    </Button>
                  )}
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="mb-4 border-b border-border">
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate({ to: '/pond/$name', params: { name } })}
                    className="pb-2 px-1 border-b-2 border-primary font-medium text-primary"
                  >
                    Feed
                  </button>
                  <button
                    onClick={() => navigate({ to: '/pond/$name/about', params: { name } })}
                    className="pb-2 px-1 border-b-2 border-transparent font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    About
                  </button>
                </div>
              </div>

              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="mb-4">
                <TabsList>
                  <TabsTrigger value="new">New</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="bg-card lg:rounded-lg overflow-hidden">
              {isLoadingLilies ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              ) : sortedLilies.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>No lilies in this pond yet. Be the first to create one!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedLilies.map((lily) => (
                    <LilyCard key={lily.id} lily={lily} showUserAvatar={true} hideTags={true} />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
