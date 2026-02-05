import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarkButtonProps {
  lilyId: string;
  className?: string;
}

export default function BookmarkButton({ lilyId, className = '' }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(lilyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(lilyId);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 hover:text-foreground transition-colors ${
        bookmarked ? 'text-primary' : ''
      } ${className}`}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <Bookmark
        className={`action-icon ${bookmarked ? 'fill-current' : ''}`}
      />
    </button>
  );
}
