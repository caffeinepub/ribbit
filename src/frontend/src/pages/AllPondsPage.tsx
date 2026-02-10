import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useGetAllPonds, useGetJoinedPonds } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import PondCardJoinControl from '@/components/PondCardJoinControl';
import { computePondRanks } from '@/lib/pondRank';

export default function AllPondsPage() {
  const { data: ponds, isLoading } = useGetAllPonds();
  const { data: joinedPonds, isLoading: isLoadingJoined } = useGetJoinedPonds();

  // Compute ranks from the ponds list
  const rankMap = ponds ? computePondRanks(ponds) : new Map<string, number>();

  return (
    <div className="lg:container py-8">
      <div className="max-w-5xl lg:mx-auto px-4 lg:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Ponds</h1>
          <p className="text-muted-foreground">
            Discover and join communities around your interests
          </p>
        </div>

        <div className="mb-6">
          <Button asChild className="hover-darken-light rounded-full">
            <Link to="/start-pond">Start a Pond</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : ponds && ponds.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>No ponds yet. Be the first to create one!</p>
            </div>
          ) : (
            ponds?.map((pond) => {
              const isMember = joinedPonds?.includes(pond.name) || false;
              const rank = rankMap.get(pond.name);
              
              return (
                <Link key={pond.name} to="/pond/$name" params={{ name: pond.name }}>
                  <div className="relative h-full p-4 border border-border rounded-lg transition-shadow hover:shadow-lg">
                    {/* Rank indicator - top left */}
                    {rank !== undefined && (
                      <div className="absolute top-3 left-3 z-10 bg-primary/10 text-primary font-bold px-2 py-1 rounded-md text-sm">
                        #{rank}
                      </div>
                    )}
                    
                    {/* Join control - top right */}
                    {!isLoadingJoined && (
                      <div className="absolute top-3 right-3 z-10">
                        <PondCardJoinControl pondName={pond.name} isMember={isMember} />
                      </div>
                    )}
                    
                    <div className="pb-3 pr-20 pl-12">
                      <div className="flex items-center gap-3 mb-2">
                        {pond.profileImage && (
                          <img
                            src={pond.profileImage.getDirectURL()}
                            alt={pond.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold line-clamp-2">{pond.name}</h3>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground line-clamp-3 mb-3">
                        {pond.description}
                      </p>
                      <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                        <span>{Number(pond.lilyCount)} {Number(pond.lilyCount) === 1 ? 'lily' : 'lilies'}</span>
                        <span>•</span>
                        <span>{Number(pond.memberCount)} {Number(pond.memberCount) === 1 ? 'member' : 'members'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
