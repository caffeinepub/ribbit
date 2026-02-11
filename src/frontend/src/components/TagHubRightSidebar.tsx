import { Link } from '@tanstack/react-router';
import { useGetTopTags, useGetTrendingTags, useGetNewestTags } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, TrendingUp, Sparkles } from 'lucide-react';
import type { TagStats } from '@/lib/types';

function TagStatItem({ tag, stats }: { tag: string; stats: TagStats }) {
  const totalActivity = Number(stats.postsTotal) + Number(stats.repliesTotal);

  return (
    <Link
      to="/tag/$tag"
      params={{ tag }}
      className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-accent font-medium">#{tag}</span>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-xs text-sidebar-foreground/60">{totalActivity}</span>
      </div>
    </Link>
  );
}

function TagStatsModule({
  title,
  icon: Icon,
  tags,
  isLoading,
  emptyMessage,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: Array<[string, TagStats]> | undefined;
  isLoading: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="pb-4 border-b border-sidebar-border last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-sidebar-foreground/60" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
          {title}
        </h3>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="space-y-0.5">
          {tags.map(([tag, stats]) => (
            <TagStatItem key={tag} tag={tag} stats={stats} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-sidebar-foreground/60">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function TagHubRightSidebar() {
  const { data: topTags, isLoading: isLoadingTop } = useGetTopTags(5);
  const { data: trendingTags, isLoading: isLoadingTrending } = useGetTrendingTags(5);
  const { data: newestTags, isLoading: isLoadingNewest } = useGetNewestTags(5);

  return (
    <div className="sticky top-20">
      <div className="bg-sidebar rounded-lg p-4 overflow-hidden space-y-0">
        <TagStatsModule
          title="Top Tags"
          icon={Hash}
          tags={topTags}
          isLoading={isLoadingTop}
          emptyMessage="No tags yet"
        />
        <div className="py-4">
          <TagStatsModule
            title="Trending Tags"
            icon={TrendingUp}
            tags={trendingTags}
            isLoading={isLoadingTrending}
            emptyMessage="No trending tags"
          />
        </div>
        <TagStatsModule
          title="Newest Tags"
          icon={Sparkles}
          tags={newestTags}
          isLoading={isLoadingNewest}
          emptyMessage="No new tags"
        />
      </div>
    </div>
  );
}
