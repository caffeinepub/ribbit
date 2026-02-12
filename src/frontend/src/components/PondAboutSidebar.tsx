import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Calendar, Users, Tag } from 'lucide-react';
import { useGetPondAboutInfo, useGetUserProfiles, useGetUserAvatarByUsername, useGetJoinedPonds, useJoinPond, useLeavePond } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Visibility } from '@/backend';
import { toast } from 'sonner';

interface PondAboutSidebarProps {
  pondName: string;
}

export default function PondAboutSidebar({ pondName }: PondAboutSidebarProps) {
  const { data: pondInfo, isLoading } = useGetPondAboutInfo(pondName);
  const { data: moderatorProfiles, isLoading: isLoadingModerators } = useGetUserProfiles(pondInfo?.moderators || []);
  const { data: joinedPonds, isLoading: isLoadingJoined } = useGetJoinedPonds();
  const joinPondMutation = useJoinPond();
  const leavePondMutation = useLeavePond();

  const isMember = joinedPonds?.includes(pondName) || false;

  const handleJoinPond = async () => {
    try {
      await joinPondMutation.mutateAsync(pondName);
      toast.success('Successfully joined the pond!');
    } catch (error: any) {
      console.error('Join pond error:', error);
      toast.error('Failed to join pond. Please try again.');
    }
  };

  const handleLeavePond = async () => {
    try {
      await leavePondMutation.mutateAsync(pondName);
      toast.success('Successfully left the pond');
    } catch (error: any) {
      console.error('Leave pond error:', error);
      toast.error('Failed to leave pond. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="sticky top-20">
        <div className="bg-sidebar rounded-lg p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!pondInfo) {
    return null;
  }

  const createdDate = new Date(Number(pondInfo.createdAt) / 1_000_000);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const visibilityText = pondInfo.visibility === Visibility.publicVisibility ? 'Public' : 'Private';

  return (
    <div className="sticky top-20">
      <div className="bg-sidebar rounded-lg p-4 overflow-hidden space-y-0">
        {/* About This Pond Section */}
        <div className="pb-4 border-b border-sidebar-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            About This Pond
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-sidebar-foreground/80" style={{ fontSize: '0.875rem' }}>
              pond/{pondInfo.name}
            </p>

            {/* Pond Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sidebar-foreground/80" style={{ fontSize: '0.875rem' }}>Created {formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sidebar-foreground/80" style={{ fontSize: '0.875rem' }}>
                  {Number(pondInfo.memberCount)} {Number(pondInfo.memberCount) === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sidebar-foreground/80" style={{ fontSize: '0.875rem' }}>{visibilityText}</span>
              </div>
            </div>

            {/* Join/Leave Button */}
            {isLoadingJoined ? (
              <Skeleton className="h-9 w-full" />
            ) : isMember ? (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={handleLeavePond}
                disabled={leavePondMutation.isPending}
              >
                {leavePondMutation.isPending ? 'Leaving...' : 'Leave Pond'}
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm"
                className="w-full"
                onClick={handleJoinPond}
                disabled={joinPondMutation.isPending}
              >
                {joinPondMutation.isPending ? 'Joining...' : 'Join Pond'}
              </Button>
            )}
          </div>
        </div>

        {/* Pond Tags Section */}
        {pondInfo.associatedTags && pondInfo.associatedTags.length > 0 && (
          <div className="py-4 border-b border-sidebar-border">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              Pond Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {pondInfo.associatedTags.slice(0, 8).map((tag) => (
                <Link
                  key={tag}
                  to="/tag/$tag"
                  params={{ tag }}
                  className="inline-block"
                >
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors cursor-pointer text-xs"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
            {pondInfo.associatedTags.length > 8 && (
              <p className="text-xs text-sidebar-foreground/60 mt-2">
                +{pondInfo.associatedTags.length - 8} more
              </p>
            )}
          </div>
        )}

        {/* Pond Rules Section */}
        <div className="py-4 border-b border-sidebar-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            Pond Rules
          </h3>
          {pondInfo.rules.length > 0 ? (
            <ol className="space-y-2 list-decimal list-inside">
              {pondInfo.rules.map((rule, index) => (
                <li key={index} className="text-sm text-sidebar-foreground/80" style={{ fontSize: '0.875rem' }}>
                  {rule}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-sidebar-foreground/60 italic" style={{ fontSize: '0.875rem' }}>
              No rules have been set for this pond yet.
            </p>
          )}
        </div>

        {/* Moderators Section */}
        <div className="pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60 mb-3">
            Moderators
          </h3>
          {isLoadingModerators ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : moderatorProfiles && moderatorProfiles.length > 0 ? (
            <div className="space-y-2">
              {moderatorProfiles.slice(0, 3).map((profile, index) => {
                const modUsername = profile?.name || 'Moderator';
                return (
                  <ModeratorItem key={index} username={modUsername} />
                );
              })}
              {moderatorProfiles.length > 3 && (
                <p className="text-xs text-sidebar-foreground/60 mt-2">
                  +{moderatorProfiles.length - 3} more moderators
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-sidebar-foreground/60 italic" style={{ fontSize: '0.875rem' }}>
              No moderators listed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeratorItem({ username }: { username: string }) {
  const { data: avatar } = useGetUserAvatarByUsername(username);

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6 bg-primary/10">
        {avatar ? (
          <AvatarImage src={avatar.getDirectURL()} alt={username} />
        ) : (
          <AvatarFallback className="text-xs">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-sm font-medium text-sidebar-foreground" style={{ fontSize: '0.875rem' }}>
        {username}
      </span>
    </div>
  );
}
