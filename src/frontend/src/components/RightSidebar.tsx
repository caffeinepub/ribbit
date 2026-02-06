import { Link } from '@tanstack/react-router';
import { useGetAllPonds, useGetAllLilies } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/formatNumber';
import { useMemo } from 'react';

export default function RightSidebar() {
  const { data: allPonds, isLoading: isLoadingPonds } = useGetAllPonds();
  const { data: allLilies, isLoading: isLoadingLilies } = useGetAllLilies();

  // Calculate trending ponds (by member count)
  const trendingPonds = useMemo(() => {
    if (!allPonds) return [];
    return [...allPonds]
      .sort((a, b) => Number(b.memberCount) - Number(a.memberCount))
      .slice(0, 5);
  }, [allPonds]);

  // Calculate popular tags
  const popularTags = useMemo(() => {
    if (!allLilies) return [];
    const tagCounts = new Map<string, number>();
    
    allLilies.forEach((lily) => {
      if (lily.tag) {
        tagCounts.set(lily.tag, (tagCounts.get(lily.tag) || 0) + 1);
      }
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [allLilies]);

  // Calculate popular recent posts (by view count in last 7 days)
  const popularPosts = useMemo(() => {
    if (!allLilies) return [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    return [...allLilies]
      .filter((lily) => Number(lily.timestamp) / 1000000 > sevenDaysAgo)
      .sort((a, b) => Number(b.viewCount) - Number(a.viewCount))
      .slice(0, 5);
  }, [allLilies]);

  return (
    <div className="sticky top-20">
      <div className="bg-sidebar rounded-lg p-4 overflow-hidden space-y-0">
        {/* Trending Ponds Section */}
        <div className="pb-4 border-b border-sidebar-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            Trending Ponds
          </h3>
          {isLoadingPonds ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : trendingPonds.length > 0 ? (
            <div className="space-y-0.5">
              {trendingPonds.map((pond) => (
                <Link
                  key={pond.name}
                  to="/pond/$name"
                  params={{ name: pond.name }}
                  className="flex items-center gap-2.5 px-2 py-2 -mx-2 rounded hover:bg-sidebar-accent transition-colors"
                >
                  {pond.profileImage && (
                    <img
                      src={pond.profileImage.getDirectURL()}
                      alt={pond.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">{pond.name}</p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {formatNumber(Number(pond.memberCount))} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sidebar-foreground/60">No ponds yet</p>
          )}
        </div>

        {/* Popular Tags Section */}
        <div className="py-4 border-b border-sidebar-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            Popular Tags
          </h3>
          {isLoadingLilies ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : popularTags.length > 0 ? (
            <div className="space-y-0.5">
              {popularTags.map(([tag, count]) => (
                <Link
                  key={tag}
                  to="/tag/$tag"
                  params={{ tag }}
                  className="flex items-center justify-between px-2 py-1.5 -mx-2 rounded hover:bg-sidebar-accent transition-colors"
                >
                  <span className="text-sm text-accent font-medium">#{tag}</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sidebar-foreground/60">No tags yet</p>
          )}
        </div>

        {/* Hot This Week Section */}
        <div className="pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            Hot This Week
          </h3>
          {isLoadingLilies ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : popularPosts.length > 0 ? (
            <div className="space-y-0.5">
              {popularPosts.map((lily) => (
                <Link
                  key={lily.id}
                  to="/lily/$id"
                  params={{ id: lily.id }}
                  className="block px-2 py-2 -mx-2 rounded hover:bg-sidebar-accent transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 mb-1 text-sidebar-foreground">{lily.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                    <span>{formatNumber(Number(lily.viewCount))} views</span>
                    <span>•</span>
                    <span className="truncate">{lily.pond}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sidebar-foreground/60">No recent posts</p>
          )}
        </div>
      </div>
    </div>
  );
}
