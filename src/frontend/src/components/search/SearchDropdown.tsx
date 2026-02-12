import { Search, TrendingUp } from 'lucide-react';
import { useGetTrendingSearches, useGetSearchSuggestions } from '@/hooks/useQueries';

interface SearchDropdownProps {
  query: string;
  debouncedQuery: string;
  onSelect: (term: string) => void;
  onClose: () => void;
}

export default function SearchDropdown({
  query,
  debouncedQuery,
  onSelect,
  onClose,
}: SearchDropdownProps) {
  const { data: trendingSearches = [] } = useGetTrendingSearches();
  const { data: suggestions = [] } = useGetSearchSuggestions();

  const showTrending = !query.trim();
  const showSuggestions = query.trim() && suggestions.length > 0;

  if (!showTrending && !showSuggestions) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
      {showTrending && trendingSearches.length > 0 && (
        <div className="p-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Trending Searches</span>
          </div>
          <div className="space-y-1">
            {trendingSearches.map((term, index) => (
              <button
                key={index}
                onClick={() => onSelect(term)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="p-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Suggestions</span>
          </div>
          <div className="space-y-1">
            {suggestions.map((term, index) => (
              <button
                key={index}
                onClick={() => onSelect(term)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
