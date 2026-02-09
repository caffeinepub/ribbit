import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Ribbit } from '@/backend';
import { useGetUserAvatarByUsername } from '@/hooks/useQueries';
import RibbitMiniBlurAvatarImage from './RibbitMiniBlurAvatarImage';
import LilyImageFrame from './LilyImageFrame';

interface ProfileRibbitItemProps {
  ribbit: Ribbit;
}

export default function ProfileRibbitItem({ ribbit }: ProfileRibbitItemProps) {
  const timestamp = new Date(Number(ribbit.timestamp) / 1000000);
  const { data: avatarBlob } = useGetUserAvatarByUsername(ribbit.username);
  const avatarUrl = avatarBlob?.getDirectURL();

  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
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
          <div className="flex items-center gap-2 mb-1" style={{ fontSize: '0.875rem' }}>
            <span className="font-medium text-foreground">{ribbit.username}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          <p className="text-foreground/90 mb-2 whitespace-pre-wrap" style={{ fontSize: '0.9375rem' }}>
            {ribbit.content}
          </p>

          {/* Ribbit image with blurred backdrop */}
          {ribbit.image && (
            <div className="mb-2">
              <LilyImageFrame
                imageUrl={ribbit.image.getDirectURL()}
                alt={`Image from ${ribbit.username}`}
                loading="lazy"
              />
            </div>
          )}

          <Link
            to="/lily/$id"
            params={{ id: ribbit.postId }}
            className="text-primary hover:underline text-sm"
          >
            View conversation →
          </Link>
        </div>
      </div>
    </div>
  );
}
