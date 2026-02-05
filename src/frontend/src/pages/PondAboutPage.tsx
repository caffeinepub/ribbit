import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Calendar, Users, Tag, ArrowLeft } from 'lucide-react';
import { useGetPondAboutInfo, useGetUserProfiles, useGetUserAvatarByUsername, useGetJoinedPonds, useLeavePond } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Visibility } from '@/backend';
import { toast } from 'sonner';

export default function PondAboutPage() {
  const { name } = useParams({ strict: false }) as { name: string };
  const navigate = useNavigate();
  const { data: pondInfo, isLoading } = useGetPondAboutInfo(name);
  const { data: moderatorProfiles, isLoading: isLoadingModerators } = useGetUserProfiles(pondInfo?.moderators || []);
  const { data: joinedPonds, isLoading: isLoadingJoined } = useGetJoinedPonds();
  const leavePondMutation = useLeavePond();

  const isMember = joinedPonds?.includes(name) || false;

  const handleLeavePond = async () => {
    try {
      await leavePondMutation.mutateAsync(name);
      toast.success('Successfully left the pond');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave pond');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!pondInfo) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Pond not found</h1>
          <p className="text-muted-foreground mb-4">This pond doesn't exist yet.</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
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
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        {/* Desktop: Show back to feed button */}
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

        {/* Pond Header */}
        <Card className="mb-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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

        {/* Navigation Tabs - Mobile only */}
        <div className="mb-4 border-b border-border lg:hidden">
          <div className="flex gap-4">
            <button
              onClick={() => navigate({ to: '/pond/$name', params: { name } })}
              className="pb-3 px-1 border-b-2 border-transparent font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Feed
            </button>
            <button
              onClick={() => navigate({ to: '/pond/$name/about', params: { name } })}
              className="pb-3 px-1 border-b-2 border-primary font-medium text-primary"
            >
              About
            </button>
          </div>
        </div>

        <div className="space-y-4">
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

              {/* Leave Pond Button */}
              {isLoadingJoined ? (
                <Skeleton className="h-9 w-full" />
              ) : isMember ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLeavePond}
                  disabled={leavePondMutation.isPending}
                >
                  {leavePondMutation.isPending ? 'Leaving...' : 'Leave Pond'}
                </Button>
              ) : null}
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
                <p className="text-muted-foreground mt-3" style={{ fontSize: '0.875rem' }}>
                  Tags from all Lilies posted in this pond
                </p>
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
                <ol className="space-y-3 list-decimal list-inside">
                  {pondInfo.rules.map((rule, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {rule}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground italic">No rules have been set for this pond yet.</p>
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
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : moderatorProfiles && moderatorProfiles.length > 0 ? (
                <div className="space-y-3">
                  {moderatorProfiles.slice(0, 3).map((profile, index) => {
                    const modUsername = profile?.name || 'Moderator';
                    return (
                      <ModeratorItem key={index} username={modUsername} />
                    );
                  })}
                  {moderatorProfiles.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View all moderators ({moderatorProfiles.length})
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No moderators listed.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ModeratorItem({ username }: { username: string }) {
  const { data: avatar } = useGetUserAvatarByUsername(username);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 bg-primary/10">
        {avatar ? (
          <AvatarImage src={avatar.getDirectURL()} alt={username} />
        ) : (
          <AvatarFallback className="text-sm">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="text-sm font-medium">{username}</span>
    </div>
  );
}
