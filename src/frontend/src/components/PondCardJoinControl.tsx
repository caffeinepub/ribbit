import { Button } from '@/components/ui/button';
import { useJoinPond } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface PondCardJoinControlProps {
  pondName: string;
  isMember: boolean;
}

export default function PondCardJoinControl({ pondName, isMember }: PondCardJoinControlProps) {
  const joinPondMutation = useJoinPond();

  const handleJoin = (e: React.MouseEvent) => {
    // Prevent card navigation
    e.preventDefault();
    e.stopPropagation();

    joinPondMutation.mutate(pondName, {
      onSuccess: () => {
        toast.success(`Joined ${pondName}!`);
      },
      onError: (error) => {
        toast.error(`Failed to join pond: ${error.message}`);
      },
    });
  };

  if (isMember) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 cursor-default"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Joined
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={joinPondMutation.isPending}
      onClick={handleJoin}
      className="rounded-full"
    >
      {joinPondMutation.isPending ? 'Joining…' : 'Join'}
    </Button>
  );
}
