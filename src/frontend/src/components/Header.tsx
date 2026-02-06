import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetUserAvatarByUsername, useRecordSearchTerm } from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useDebounce } from '@/hooks/useDebounce';
import SearchDropdown from '@/components/search/SearchDropdown';
import MobileSearchModal from '@/components/search/MobileSearchModal';

interface HeaderProps {
  onMobileLeftSidebarToggle?: () => void;
}

export default function Header({ onMobileLeftSidebarToggle }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const username = getUsername();
  const { data: userAvatar } = useGetUserAvatarByUsername(username);
  const recordSearchMutation = useRecordSearchTerm();

  // Handle click outside for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setDesktopDropdownOpen(false);
      }
    };

    if (desktopDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [desktopDropdownOpen]);

  const executeSearch = (term: string) => {
    if (term.trim()) {
      // Record the search term
      recordSearchMutation.mutate(term.trim());
      
      // Navigate to search results
      navigate({ to: '/', search: { q: term.trim() } });
      
      // Close UI
      setMobileSearchOpen(false);
      setDesktopDropdownOpen(false);
      setSearchQuery('');
    }
  };

  const handleDesktopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleMobileSubmit = () => {
    executeSearch(searchQuery);
  };

  const handleSelectTerm = (term: string) => {
    setSearchQuery(term);
    executeSearch(term);
  };

  const handleDesktopFocus = () => {
    setDesktopDropdownOpen(true);
  };

  const handleMobileSearchOpen = () => {
    setMobileSearchOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:container">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={onMobileLeftSidebarToggle}
          >
            <Menu className="action-icon" />
            <span className="sr-only">Menu</span>
          </Button>

          <Link to="/" className="flex items-center gap-2">
            {/* Frog logo - visible on mobile/tablet, hidden on desktop (md+) */}
            <img src="/assets/frog-face_1f438.png" alt="ribbit" className="h-8 w-8 md:hidden" />
            <span className="text-2xl font-bold text-primary" style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.025rem' }}>ribbit</span>
          </Link>
        </div>

        {/* Desktop Search */}
        <form onSubmit={handleDesktopSubmit} className="hidden flex-1 max-w-md md:flex" style={{ marginBlockEnd: 0 }}>
          <div className="relative w-full" ref={searchContainerRef}>
            {/* Decorative frog badge inside search input - desktop only */}
            <div 
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center rounded-full"
              style={{ 
                width: '1.75rem', 
                height: '1.75rem',
                backgroundColor: 'oklch(0.67 0.17 130.09)'
              }}
              aria-hidden="true"
            >
              <img 
                src="/assets/frog-face_1f438.png" 
                alt="" 
                className="w-5 h-5"
              />
            </div>
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search ponds and lilies..."
              className="pl-12 rounded-full global-search-input header-desktop-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleDesktopFocus}
            />
            {desktopDropdownOpen && (
              <SearchDropdown
                query={searchQuery}
                debouncedQuery={debouncedQuery}
                onSelect={handleSelectTerm}
                onClose={() => setDesktopDropdownOpen(false)}
              />
            )}
          </div>
        </form>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={handleMobileSearchOpen}
          >
            <Search className="action-icon" />
            <span className="sr-only">Search</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="md:hidden rounded-full">
                <Plus className="action-icon" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/start-pond">Start a Pond</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create-lily">Create Lily</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/ponds">All Ponds</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tags">Tags</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/saved">Saved Lilies</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden md:inline-flex rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/create-lily">Create Lily</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/start-pond">Start a Pond</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar link - visible on both mobile and desktop */}
          <Link 
            to="/settings" 
            className="rounded-full p-0 transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background"
          >
            <span className="sr-only">Settings</span>
            <Avatar className="h-8 w-8 bg-primary/10">
              {userAvatar ? (
                <AvatarImage src={userAvatar.getDirectURL()} alt={username} />
              ) : (
                <AvatarFallback>🐸</AvatarFallback>
              )}
            </Avatar>
          </Link>
        </nav>
      </div>

      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={mobileSearchOpen}
        query={searchQuery}
        debouncedQuery={debouncedQuery}
        onQueryChange={setSearchQuery}
        onSelect={handleSelectTerm}
        onSubmit={handleMobileSubmit}
        onClose={() => {
          setMobileSearchOpen(false);
          setSearchQuery('');
        }}
      />
    </header>
  );
}
