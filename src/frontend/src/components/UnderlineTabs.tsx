import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface UnderlineTabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function UnderlineTabsList({ children, className }: UnderlineTabsListProps) {
  return (
    <TabsList
      className={cn(
        'underline-tabs-list',
        className
      )}
    >
      {children}
    </TabsList>
  );
}

interface UnderlineTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function UnderlineTabsTrigger({ value, children, className }: UnderlineTabsTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'underline-tabs-trigger',
        className
      )}
    >
      {children}
    </TabsTrigger>
  );
}
