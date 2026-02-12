import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Tabs } from '@/components/ui/tabs';
import LilyCard from '@/components/LilyCard';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import { useGetLiliesByTag, useGetSubcategoriesForTag } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';

type SortOption = 'newest' | 'most_viewed' | 'most_replied';

export default function TagPage() {
  const { tag } = useParams({ strict: false }) as { tag: string };
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const { data: lilies, isLoading: isLoadingLilies } = useGetLiliesByTag(tag, sortBy);
  const { data: subcategories, isLoading: isLoadingSubcategories } = useGetSubcategoriesForTag(tag);

  const isLoading = isLoadingLilies;

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
                  <div className="flex items-center gap-4 mb-2">
                    {/* Tag Icon Avatar - circular background with light green tint */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full tag-icon-circle-bg flex-shrink-0">
                      <Tag className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Tag Name and Count */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold mb-0.5">
                        #{tag}
                      </h1>
                      <p className="text-muted-foreground">
                        {lilies ? `${lilies.length} ${lilies.length === 1 ? 'lily' : 'lilies'}` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategories Section */}
                <div className="mb-6 px-4 lg:px-0">
                  <h2 className="text-lg font-semibold mb-3">Subcategories</h2>
                  {isLoadingSubcategories ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-3/4" />
                    </div>
                  ) : !subcategories || subcategories.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No subcategories yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subcategories.map((subcategory) => (
                        <div
                          key={subcategory}
                          className="px-3 py-2 bg-muted rounded-md text-sm"
                        >
                          {subcategory}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="mb-0">
                  <div className="border-b border-border bg-background">
                    <div className="flex">
                      <button
                        onClick={() => setSortBy('newest')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          sortBy === 'newest'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => setSortBy('most_viewed')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          sortBy === 'most_viewed'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Most Viewed
                      </button>
                      <button
                        onClick={() => setSortBy('most_replied')}
                        className={`flex-1 pb-3 pt-3 px-0 md:px-4 border-b-2 font-medium transition-colors ${
                          sortBy === 'most_replied'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >
                        Most Replied
                      </button>
                    </div>
                  </div>
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
                ) : !lilies || lilies.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                      <span className="text-3xl">🐸</span>
                    </div>
                    <p className="text-muted-foreground mb-2" style={{ fontSize: '1rem' }}>No lilies found with this tag</p>
                    <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
                      Be the first to create a lily with the tag "#{tag}"
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {lilies.map((lily) => (
                      <LilyCard key={lily.id} lily={lily} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile, max-width 18rem */}
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
