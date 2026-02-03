import { Link } from '@tanstack/react-router';
import { Home, Compass, PlusCircle, Settings, Clock } from 'lucide-react';
import { useGetAllRecentActivities, useGetLily } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useMatchRoute } from '@tanstack/react-router';

interface LeftSidebarProps {
  isMobileDrawer?: boolean;
}

function ActivityItem({ activity }: { activity: any }) {
  const { data: lily } = useGetLily(activity.targetId);

  if (!lily) return null;

  return (
    <Link
      to="/lily/$id"
      params={{ id: activity.targetId }}
      className="block px-3 py-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
    >
      <div className="text-sm truncate">{lily.title}</div>
      <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
        {formatDistanceToNow(Number(activity.timestamp) / 1_000_000, { addSuffix: true })}
      </div>
    </Link>
  );
}

export default function LeftSidebar({ isMobileDrawer = false }: LeftSidebarProps) {
  const { data: recentActivities, isLoading } = useGetAllRecentActivities(5);
  const matchRoute = useMatchRoute();

  const isHomeActive = !!matchRoute({ to: '/', fuzzy: false });
  const isPondsActive = !!matchRoute({ to: '/ponds' });
  const isCreateLilyActive = !!matchRoute({ to: '/create-lily' });
  const isSettingsActive = !!matchRoute({ to: '/settings' });

  return (
    <div className={`space-y-0 ${isMobileDrawer ? '' : 'sticky top-4 border-r border-border pr-4'}`}>
      <div className="pb-6 border-b border-border">
        <div className="space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isHomeActive
                ? 'bg-gray-200'
                : 'hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            {isHomeActive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
            ) : (
              <Home className="h-5 w-5" />
            )}
            <span>Home</span>
          </Link>
          <Link
            to="/ponds"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isPondsActive
                ? 'bg-gray-200'
                : 'hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            {isPondsActive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clipRule="evenodd" />
              </svg>
            ) : (
              <Compass className="h-5 w-5" />
            )}
            <span>All Ponds</span>
          </Link>
          <Link
            to="/create-lily"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isCreateLilyActive
                ? 'bg-gray-200'
                : 'hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            {isCreateLilyActive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
              </svg>
            ) : (
              <PlusCircle className="h-5 w-5" />
            )}
            <span>Create Lily</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isSettingsActive
                ? 'bg-gray-200'
                : 'hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            {isSettingsActive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <Settings className="h-5 w-5" />
            )}
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <div className="pt-6">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Clock className="h-5 w-5" />
          Recent Activity
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : recentActivities && recentActivities.length > 0 ? (
          <div className="space-y-1">
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground px-3 py-2" style={{ fontSize: '1rem' }}>
            No recent activity yet
          </p>
        )}
      </div>
    </div>
  );
}
