import { Link } from '@tanstack/react-router';
import { TrendingUp, Hash, Flame } from 'lucide-react';
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
    <div className="space-y-0 sticky top-4 bg-muted/40 p-4 rounded-xl">
      <div className="pb-4 border-b border-border">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <TrendingUp className="h-5 w-5" />
          Trending Ponds
        </h3>
        {isLoadingPonds ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : trendingPonds.length > 0 ? (
          <div className="space-y-2">
            {trendingPonds.map((pond) => (
              <Link
                key={pond.name}
                to="/pond/$name"
                params={{ name: pond.name }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors"
              >
                {pond.profileImage && (
                  <img
                    src={pond.profileImage.getDirectURL()}
                    alt={pond.title}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pond.title}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                    {formatNumber(Number(pond.memberCount))} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>No ponds yet</p>
        )}
      </div>

      <div className="py-4 border-b border-border">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Hash className="h-5 w-5" />
          Popular Tags
        </h3>
        {isLoadingLilies ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : popularTags.length > 0 ? (
          <div className="space-y-1">
            {popularTags.map(([tag, count]) => (
              <Link
                key={tag}
                to="/tag/$tag"
                params={{ tag }}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/60 transition-colors"
              >
                <span className="text-accent font-medium">#{tag}</span>
                <span className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  {count} {count === 1 ? 'lily' : 'lilies'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>No tags yet</p>
        )}
      </div>

      <div className="pt-4">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Flame className="h-5 w-5" />
          Hot This Week
        </h3>
        {isLoadingLilies ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : popularPosts.length > 0 ? (
          <div className="space-y-2">
            {popularPosts.map((lily) => (
              <Link
                key={lily.id}
                to="/lily/$id"
                params={{ id: lily.id }}
                className="block p-2 rounded-md hover:bg-muted/60 transition-colors"
              >
                <p className="font-medium line-clamp-2 mb-1">{lily.title}</p>
                <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  <span>{formatNumber(Number(lily.viewCount))} views</span>
                  <span>•</span>
                  <span className="truncate">{lily.pond}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>No recent posts</p>
        )}
      </div>
    </div>
  );
}
