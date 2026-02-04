import { useState, useEffect } from 'react';

const BOOKMARKS_KEY = 'ribbit_bookmarks';

interface BookmarksState {
  lilyIds: string[];
}

function loadBookmarks(): string[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // Validate and normalize
    if (!Array.isArray(parsed)) return [];
    
    // Filter out invalid entries (non-strings, duplicates)
    const normalized = parsed
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
    
    return normalized;
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

function saveBookmarks(lilyIds: string[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(lilyIds));
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
}

export function useBookmarks() {
  const [bookmarkedLilyIds, setBookmarkedLilyIds] = useState<string[]>(() => loadBookmarks());

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveBookmarks(bookmarkedLilyIds);
  }, [bookmarkedLilyIds]);

  const isBookmarked = (lilyId: string): boolean => {
    return bookmarkedLilyIds.includes(lilyId);
  };

  const toggleBookmark = (lilyId: string): void => {
    setBookmarkedLilyIds((prev) => {
      if (prev.includes(lilyId)) {
        return prev.filter((id) => id !== lilyId);
      } else {
        return [...prev, lilyId];
      }
    });
  };

  const addBookmark = (lilyId: string): void => {
    setBookmarkedLilyIds((prev) => {
      if (prev.includes(lilyId)) return prev;
      return [...prev, lilyId];
    });
  };

  const removeBookmark = (lilyId: string): void => {
    setBookmarkedLilyIds((prev) => prev.filter((id) => id !== lilyId));
  };

  const clearBookmarks = (): void => {
    setBookmarkedLilyIds([]);
  };

  const getBookmarkedLilyIds = (): string[] => {
    return [...bookmarkedLilyIds];
  };

  return {
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    getBookmarkedLilyIds,
  };
}
