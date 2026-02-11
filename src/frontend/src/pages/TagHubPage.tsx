import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import LeftSidebar from '@/components/LeftSidebar';
import TagHubRightSidebar from '@/components/TagHubRightSidebar';
import { useGetTopTags, useGetTrendingTags, useGetNewestTags } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Tag, ChevronRight } from 'lucide-react';
import type { TagStats } from '@/lib/types';

function TagItem({ tag, stats, rank }: { tag: string; stats: TagStats; rank: number }) {
  return (
    <Link
      to="/tag/$tag"
      params={{ tag }}
      className="block px-4 py-3 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-3">
        {/* Rank Number - 1.125rem font size */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
          <span className="font-bold text-primary" style={{ fontSize: '1.125rem' }}>
            {rank}
          </span>
        </div>
        
        {/* Tag Icon Avatar - 1.25rem x 1.25rem */}
        <div className="flex items-center justify-center rounded-full tag-icon-circle-bg flex-shrink-0" style={{ width: '1.25rem', height: '1.25rem' }}>
          <Tag style={{ width: '1.25rem', height: '1.25rem' }} className="text-primary" />
        </div>
        
        {/* Tag Name and Stats - smaller typography */}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold mb-0.5">
            #{tag}
          </div>
          <div className="text-sm text-muted-foreground">
            {Number(stats.postsTotal)} {Number(stats.postsTotal) === 1 ? 'lily' : 'lilies'} · {Number(stats.repliesTotal)} {Number(stats.repliesTotal) === 1 ? 'ribbit' : 'ribbits'}
          </div>
        </div>
        
        {/* Chevron Right Icon - 1.25rem x 1.25rem */}
        <div className="flex-shrink-0">
          <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} className="text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function TagList({ tags, isLoading, emptyMessage }: { tags: Array<[string, TagStats]> | undefined; isLoading: boolean; emptyMessage: string }) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
          <Hash className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {tags.map(([tag, stats], index) => (
        <TagItem key={tag} tag={tag} stats={stats} rank={index + 1} />
      ))}
    </div>
  );
}

export default function TagHubPage() {
  const [activeTab, setActiveTab] = useState<'top' | 'trending' | 'newest'>('trending');

  const { data: topTags, isLoading: isLoadingTop } = useGetTopTags(20);
  const { data: trendingTags, isLoading: isLoadingTrending } = useGetTrendingTags(20);
  const { data: newestTags, isLoading: isLoadingNewest } = useGetNewestTags(20);

  return (
    <div className="min-h-screen bg-background">
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
              <div className="py-4 px-4 lg:px-0 lg:py-0">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">Tags</h1>
                  <p className="text-muted-foreground">
                    Explore popular topics and discover new conversations
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                  <div className="border-b border-border bg-background">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab('trending')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          activeTab === 'trending'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Trending
                      </button>
                      <button
                        onClick={() => setActiveTab('top')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          activeTab === 'top'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Top
                      </button>
                      <button
                        onClick={() => setActiveTab('newest')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          activeTab === 'newest'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Newest
                      </button>
                    </div>
                  </div>

                  <div className="bg-card lg:rounded-lg overflow-hidden">
                    <TabsContent value="trending" className="mt-0">
                      <TagList
                        tags={trendingTags}
                        isLoading={isLoadingTrending}
                        emptyMessage="No trending tags yet. Start creating lilies with tags!"
                      />
                    </TabsContent>

                    <TabsContent value="top" className="mt-0">
                      <TagList
                        tags={topTags}
                        isLoading={isLoadingTop}
                        emptyMessage="No tags yet. Be the first to create a lily with a tag!"
                      />
                    </TabsContent>

                    <TabsContent value="newest" className="mt-0">
                      <TagList
                        tags={newestTags}
                        isLoading={isLoadingNewest}
                        emptyMessage="No new tags yet. Start creating lilies with tags!"
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile, max-width 18rem */}
          <aside className="hidden lg:block lg:col-span-3">
            <div style={{ maxWidth: '18rem' }}>
              <TagHubRightSidebar />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
