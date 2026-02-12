import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Calendar, Users, Tag, ArrowLeft } from 'lucide-react';
import PondMobileHeader from '@/components/PondMobileHeader';
import { useGetPond, useGetPondAboutInfo, useGetUserProfiles, useGetUserAvatarByUsername, useGetJoinedPonds, useLeavePond, useJoinPond } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Visibility } from '@/backend';
import { toast } from 'sonner';

export default function PondAboutPage() {
  const { name } = useParams({ strict: false }) as { name: string };
  const navigate = useNavigate();
  const { data: pond, isLoading: isLoadingPond } = useGetPond(name);
  const { data: pondInfo, isLoading } = useGetPondAboutInfo(name);
  const { data: moderatorProfiles, isLoading: isLoadingModerators } = useGetUserProfiles(pondInfo?.moderators || []);
  const { data: joinedPonds, isLoading: isLoadingJoined } = useGetJoinedPonds();
  const leavePondMutation = useLeavePond();
  const joinPondMutation = useJoinPond();

  const isMember = joinedPonds?.includes(name) || false;

  const handleLeavePond = async () => {
    try {
      await leavePondMutation.mutateAsync(name);
      toast.success('Successfully left the pond');
    } catch (error: any) {
      console.error('Leave pond error:', error);
      toast.error('Failed to leave pond. Please try again.');
    }
  };

  const handleJoinPond = async () => {
    try {
      await joinPondMutation.mutateAsync(name);
      toast.success('Successfully joined the pond!');
    } catch (error: any) {
      console.error('Join pond error:', error);
      toast.error('Failed to join pond. Please try again.');
    }
  };

  if (isLoading || isLoadingPond) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!pondInfo || !pond) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Pond not found</h1>
            <p className="text-muted-foreground mb-4">This pond doesn't exist yet.</p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const createdDate = new Date(Number(pondInfo.createdAt) / 1_000_000);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const visibilityText = pondInfo.visibility === Visibility.publicVisibility ? 'Public' : 'Private';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Shared header with tabs */}
      <PondMobileHeader pond={pond} currentTab="about" />

      {/* Desktop: Show back to feed button */}
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="hidden lg:block mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/pond/$name', params: { name } })}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </div>

          {/* Pond Header - Desktop only */}
          <Card className="mb-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hidden lg:block">
            <CardHeader>
              <div className="flex items-center gap-4">
                {pondInfo.profileImage && (
                  <img
                    src={pondInfo.profileImage.getDirectURL()}
                    alt={pondInfo.title}
                    className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-3xl mb-2">{pondInfo.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pondInfo.description}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4 px-4 lg:px-0">
            {/* About This Pond */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">About This Pond</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">pond/{pondInfo.name}</p>
                </div>

                <Separator />

                {/* Pond Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Created {formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {Number(pondInfo.memberCount)} {Number(pondInfo.memberCount) === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{visibilityText}</span>
                  </div>
                </div>

                <Separator />

                {/* Join/Leave Pond Button - Mobile only (lg:hidden) */}
                {isLoadingJoined ? (
                  <Skeleton className="h-9 w-full lg:hidden" />
                ) : isMember ? (
                  <Button 
                    variant="outline" 
                    className="w-full lg:hidden"
                    onClick={handleLeavePond}
                    disabled={leavePondMutation.isPending}
                  >
                    {leavePondMutation.isPending ? 'Leaving...' : 'Leave Pond'}
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="w-full lg:hidden"
                    onClick={handleJoinPond}
                    disabled={joinPondMutation.isPending}
                  >
                    {joinPondMutation.isPending ? 'Joining...' : 'Join Pond'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pond Tags */}
            {pondInfo.associatedTags && pondInfo.associatedTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Pond Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pondInfo.associatedTags.map((tag) => (
                      <Link
                        key={tag}
                        to="/tag/$tag"
                        params={{ tag }}
                        className="inline-block"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pond Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Pond Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {pondInfo.rules.length > 0 ? (
                  <ol className="space-y-2 list-decimal list-inside">
                    {pondInfo.rules.map((rule, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {rule}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No rules have been set for this pond yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Moderators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Moderators</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingModerators ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : moderatorProfiles && moderatorProfiles.length > 0 ? (
                  <div className="space-y-3">
                    {moderatorProfiles.map((profile, index) => {
                      const modUsername = profile?.name || 'Moderator';
                      return (
                        <ModeratorItem key={index} username={modUsername} />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No moderators listed.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeratorItem({ username }: { username: string }) {
  const { data: avatar } = useGetUserAvatarByUsername(username);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 bg-primary/10">
        {avatar ? (
          <AvatarImage src={avatar.getDirectURL()} alt={username} />
        ) : (
          <AvatarFallback>
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-sm font-medium">
        {username}
      </span>
    </div>
  );
}
