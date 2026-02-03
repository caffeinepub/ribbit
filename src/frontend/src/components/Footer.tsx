import { Heart } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-4">
          <nav className="flex items-center gap-4">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/ponds" className="text-muted-foreground hover:text-primary transition-colors">
              All Ponds
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/settings" className="text-muted-foreground hover:text-primary transition-colors">
              Settings
            </Link>
          </nav>
          <p className="text-center text-muted-foreground">
            © 2025. Built with <Heart className="inline h-4 w-4 text-primary fill-primary" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
