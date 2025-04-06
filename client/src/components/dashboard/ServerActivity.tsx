import { useQuery } from '@tanstack/react-query';
import { ServerActivityItem } from '@shared/types';
import { formatRelativeTime } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Clock,
  ActivityIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ServerActivity() {
  const { data: activities, isLoading } = useQuery<ServerActivityItem[]>({
    queryKey: ['/api/dashboard/activity'],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
          <ActivityIcon className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">
            <Skeleton className="h-6 w-36" />
          </h2>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-4 h-[355px] overflow-y-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getActivityStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-300'
        };
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300'
        };
      case 'warning':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-300'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300'
        };
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center">
        <ActivityIcon className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold gradient-text">Server Activity</h2>
      </div>
      <div className="p-5">
        <div className="space-y-4 h-[355px] overflow-y-auto scrollbar-hide">
          {activities && activities.length > 0 ? (
            activities.map((activity) => {
              const styles = getActivityStyles(activity.type);
              return (
                <div 
                  key={activity.id} 
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border",
                    styles.bg,
                    styles.border,
                    "transition-all duration-200 hover:shadow-md dark:hover:shadow-black/30"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    styles.bg,
                    "border-2",
                    styles.border
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", styles.text)}>{activity.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {activity.message}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center pt-12">
              <Clock className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400">No activity recorded yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Server events will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
