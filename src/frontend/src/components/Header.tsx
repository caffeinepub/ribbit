import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetUserAvatarByUsername } from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';

interface HeaderProps {
  onMobileLeftSidebarToggle?: () => void;
}

export default function Header({ onMobileLeftSidebarToggle }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const username = getUsername();
  const { data: userAvatar } = useGetUserAvatarByUsername(username);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/', search: { q: searchQuery } });
      setMobileSearchOpen(false);
    }
  };

  const handleMobileSearchOpen = () => {
    setMobileSearchOpen(true);
    setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:container">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileLeftSidebarToggle}
          >
            <Menu className="h-5 w-5" style={{ width: '1.25rem', height: '1.25rem', minWidth: '1.25rem', minHeight: '1.25rem' }} />
            <span className="sr-only">Menu</span>
          </Button>

          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/frog-face_1f438.png" alt="ribbit" className="h-8 w-8" />
            <span className="text-2xl font-bold text-primary" style={{ fontSize: '1.55rem', letterSpacing: '-0.025rem' }}>ribbit</span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:flex" style={{ marginBlockEnd: 0 }}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search ponds and lilies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '1rem' }}
            />
          </div>
        </form>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link to="/ponds">All Ponds</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleMobileSearchOpen}
          >
            <Search className="h-5 w-5" style={{ width: '1.25rem', height: '1.25rem', minWidth: '1.25rem', minHeight: '1.25rem' }} />
            <span className="sr-only">Search</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="md:hidden">
                <Plus className="h-5 w-5" style={{ width: '1.25rem', height: '1.25rem', minWidth: '1.25rem', minHeight: '1.25rem' }} />
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
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" asChild className="hidden md:inline-flex hover-darken-light">
            <Link to="/start-pond">Start a Pond</Link>
          </Button>

          <Button asChild className="hidden md:inline-flex">
            <Link to="/create-lily">Create Lily</Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
            <Link to="/settings">
              <span className="sr-only">Settings</span>
              <Avatar className="h-8 w-8 bg-primary/10">
                {userAvatar ? (
                  <AvatarImage src={userAvatar.getDirectURL()} alt={username} />
                ) : (
                  <AvatarFallback>🐸</AvatarFallback>
                )}
              </Avatar>
            </Link>
          </Button>
        </nav>
      </div>

      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={mobileSearchInputRef}
                type="search"
                placeholder="Search ponds and lilies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '1rem' }}
              />
            </div>
            <Button type="submit" className="mt-4 w-full">
              Search
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
