import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGetUserAvatarByUsername, useGetLily } from '@/hooks/useQueries';
import type { Ribbit } from '@/backend';
import RibbitMiniBlurAvatarImage from './RibbitMiniBlurAvatarImage';

interface ProfileRibbitItemProps {
  ribbit: Ribbit;
}

export default function ProfileRibbitItem({ ribbit }: ProfileRibbitItemProps) {
  const { data: avatarBlob } = useGetUserAvatarByUsername(ribbit.username);
  const { data: lily } = useGetLily(ribbit.postId);
  
  const timestamp = new Date(Number(ribbit.timestamp) / 1000000);
  const avatarUrl = avatarBlob?.getDirectURL();

  return (
    <div className="bg-card py-4 px-4 transition-colors hover:bg-gray-100">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0 mt-0.5">
          {avatarUrl ? (
            <RibbitMiniBlurAvatarImage 
              avatarUrl={avatarUrl}
              username={ribbit.username}
              renderMode="img"
            />
          ) : (
            <AvatarFallback className="text-sm">
              {ribbit.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5" style={{ fontSize: '0.875rem' }}>
            <span className="font-medium text-foreground">{ribbit.username}</span>
            <span className="text-muted-foreground">commented on</span>
            {lily && (
              <Link 
                to="/lily/$id" 
                params={{ id: lily.id }} 
                className="font-medium hover:text-primary transition-colors truncate"
              >
                {lily.title}
              </Link>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
          </div>

          <p className="text-foreground/90 mb-3 leading-relaxed whitespace-pre-wrap break-words">
            {ribbit.content}
          </p>

          <Link 
            to="/lily/$id" 
            params={{ id: ribbit.postId }}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: '0.875rem' }}
          >
            <MessageCircle className="action-icon" />
            <span>View conversation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
