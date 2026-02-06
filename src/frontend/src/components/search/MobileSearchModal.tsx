import { X, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetTrendingSearches, useGetSearchSuggestions } from '@/hooks/useQueries';

interface MobileSearchModalProps {
  isOpen: boolean;
  query: string;
  debouncedQuery: string;
  onQueryChange: (query: string) => void;
  onSelect: (term: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function MobileSearchModal({
  isOpen,
  query,
  debouncedQuery,
  onQueryChange,
  onSelect,
  onSubmit,
  onClose,
}: MobileSearchModalProps) {
  const { data: trendingSearches = [] } = useGetTrendingSearches(10);
  const { data: suggestions = [] } = useGetSearchSuggestions(debouncedQuery, 10);

  const showTrending = !query.trim();
  const showSuggestions = query.trim() && suggestions.length > 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full shrink-0"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ponds and lilies..."
                className="pl-10 rounded-full"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                autoFocus
                style={{ fontSize: '1rem' }}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4">
          {showTrending && trendingSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Trending Searches</span>
              </div>
              <div className="space-y-1">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(term)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && (
            <div>
              <div className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-muted-foreground">
                <Search className="h-4 w-4" />
                <span>Suggestions</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(term)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!showTrending && !showSuggestions && query.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No suggestions found</p>
              <p className="text-sm mt-2">Press Enter to search</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
