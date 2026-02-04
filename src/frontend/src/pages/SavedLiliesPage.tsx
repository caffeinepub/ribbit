import { useBookmarks } from '@/hooks/useBookmarks';
import { useGetLily } from '@/hooks/useQueries';
import LilyCard from '@/components/LilyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SavedLilyItem({ lilyId, onRemove }: { lilyId: string; onRemove: () => void }) {
  const { data: lily, isLoading, isError } = useGetLily(lilyId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (isError || !lily) {
    return (
      <div className="bg-card py-4 px-4 border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
            This post is no longer available
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="ml-1">Remove</span>
          </Button>
        </div>
      </div>
    );
  }

  return <LilyCard lily={lily} showUserAvatar={false} hideTags={false} />;
}

export default function SavedLiliesPage() {
  const { getBookmarkedLilyIds, removeBookmark } = useBookmarks();
  const bookmarkedIds = getBookmarkedLilyIds();

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:container py-8">
        <div className="max-w-4xl lg:mx-auto lg:px-0">
          <div className="mb-6 px-4 lg:px-0">
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Saved Lilies</h1>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
              Your bookmarked lilies are saved locally in your browser
            </p>
          </div>

          {bookmarkedIds.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">No saved lilies yet</h2>
              <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
                Bookmark lilies to save them for later. Your bookmarks are stored locally in your browser.
              </p>
            </div>
          ) : (
            <div className="space-y-0 border-0 lg:border lg:border-border lg:rounded-lg overflow-hidden">
              {bookmarkedIds.map((lilyId) => (
                <SavedLilyItem
                  key={lilyId}
                  lilyId={lilyId}
                  onRemove={() => removeBookmark(lilyId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
