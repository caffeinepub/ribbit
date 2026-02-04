import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LilyCard from '@/components/LilyCard';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import { useGetAllLilies, useSearchLilies } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

type SortOption = 'trending' | 'new';

export default function HomePage() {
  const search = useSearch({ strict: false }) as { q?: string };
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  
  const { data: allLilies, isLoading: isLoadingAll } = useGetAllLilies();
  const { data: searchResults, isLoading: isSearching } = useSearchLilies(search.q || '');

  const lilies = search.q ? searchResults : allLilies;
  const isLoading = search.q ? isSearching : isLoadingAll;

  const sortedLilies = lilies ? [...lilies].sort((a, b) => {
    if (sortBy === 'new') {
      return Number(b.timestamp) - Number(a.timestamp);
    } else {
      // Trending: based on recency only (since float/sink removed)
      return Number(b.timestamp) - Number(a.timestamp);
    }
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:container lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, max-width 15.625rem (250px) */}
          <aside className="hidden lg:block lg:col-span-3" style={{ maxWidth: '15.625rem' }}>
            <LeftSidebar />
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6">
            <div className="py-4 px-4 lg:px-0 lg:py-0">
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="mb-0 lg:mb-4">
                <TabsList>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="bg-card lg:rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))}
                </div>
              ) : sortedLilies.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
                    {search.q ? 'No lilies found matching your search.' : 'No lilies yet. Be the first to create one!'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedLilies.map((lily) => (
                    <LilyCard key={lily.id} lily={lily} />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile, constrained to ~280px */}
          <aside className="hidden lg:block lg:col-span-3">
            <div style={{ maxWidth: '280px' }}>
              <RightSidebar />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
