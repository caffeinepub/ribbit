import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LilyCard from '@/components/LilyCard';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import PondAboutSidebar from '@/components/PondAboutSidebar';
import PondMobileHeader from '@/components/PondMobileHeader';
import { useGetPond, useGetAllLilies, useGetJoinedPonds, useJoinPond } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type SortOption = 'new';

export default function PondPage() {
  const { name } = useParams({ strict: false }) as { name: string };
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
            <aside className="hidden lg:block lg:col-span-3">
              <div style={{ maxWidth: '18rem' }}>
                <LeftSidebar />
              </div>
            </aside>
            <main className="lg:col-span-6">
              <div style={{ maxWidth: '44rem' }}>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-48 w-full" />
              </div>
            </main>
            <aside className="hidden lg:block lg:col-span-3">
              <div style={{ maxWidth: '18rem' }}>
                <RightSidebar />
              </div>
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
            <aside className="hidden lg:block lg:col-span-3">
              <div style={{ maxWidth: '18rem' }}>
                <LeftSidebar />
              </div>
            </aside>
            <main className="lg:col-span-6 text-center px-4">
              <div style={{ maxWidth: '44rem' }}>
                <h1 className="text-2xl font-bold mb-4">Pond not found</h1>
                <p className="text-muted-foreground mb-4" style={{ fontSize: '1rem' }}>This pond doesn't exist yet.</p>
                <Button asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </main>
            <aside className="hidden lg:block lg:col-span-3">
              <div style={{ maxWidth: '18rem' }}>
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Shared header with tabs */}
      {pond && <PondMobileHeader pond={pond} currentTab="feed" />}

      {/* Desktop: Full-width banner image with overlay - responsive height: 8rem mobile, 12rem md+ */}
      <div className="relative w-full overflow-hidden h-32 md:h-48 hidden lg:block">
        {pond.bannerImage ? (
          <img
            src={pond.bannerImage.getDirectURL()}
            alt={`${pond.name} banner`}
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
                  alt={pond.name}
                  className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-white/20 flex-shrink-0 shadow-lg"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                >
                  {pond.name}
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
          {/* Left Sidebar - Hidden on mobile, max-width 18rem */}
          <aside className="hidden lg:block lg:col-span-3">
            <div style={{ maxWidth: '18rem' }}>
              <LeftSidebar />
            </div>
          </aside>

          {/* Main Content - max-width 44rem */}
          <main className="lg:col-span-6">
            <div style={{ maxWidth: '44rem' }}>
              {/* Join button - only show on mobile if not a member */}
              {!isMember && !isLoadingJoined && (
                <div className="py-4 px-4 lg:hidden">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleJoinPond}
                    disabled={isProcessing}
                  >
                    {joinPondMutation.isPending ? 'Joining...' : 'Join Pond'}
                  </Button>
                </div>
              )}

              {/* Desktop: No tabs, just sorting */}
              <div className="py-4 px-4 lg:px-0 lg:py-0">
                <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
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
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile, max-width 18rem */}
          {/* Desktop: Show pond-specific About sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div style={{ maxWidth: '18rem' }}>
              <PondAboutSidebar pondName={name} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
