import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock, Activity, Users, RefreshCw, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Stats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stats-card animate-pulse">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-20 mt-2 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const totalChangePercent = stats ? Math.round((stats.availableAccounts / stats.totalAccounts) * 100) : 0;
  const isPositiveChange = totalChangePercent > 70;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="stats-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Accounts</h3>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            +12% ↑
          </span>
        </div>
        <div className="mt-3 mb-2">
          <span className="text-3xl font-bold gradient-text">{stats?.totalAccounts || 0}</span>
        </div>
        <div className="mt-auto pt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>Across {Object.keys(stats?.categoryCounts || {}).length} categories</span>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Accounts</h3>
          </div>
          {isPositiveChange ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              <TrendingUp className="w-3 h-3 mr-1" />{totalChangePercent}%
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
              <TrendingDown className="w-3 h-3 mr-1" />{totalChangePercent}%
            </span>
          )}
        </div>
        <div className="mt-3 mb-2">
          <span className="text-3xl font-bold gradient-text">{stats?.availableAccounts || 0}</span>
        </div>
        <div className="mt-auto pt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{totalChangePercent}% of total</span>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Generated Today</h3>
          </div>
        </div>
        <div className="mt-3 mb-2">
          <span className="text-3xl font-bold gradient-text">{stats?.generatedToday || 0}</span>
        </div>
        <div className="mt-auto pt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          {stats?.lastGeneration ? (
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-gray-400" />
              Last: {formatRelativeTime(stats.lastGeneration)}
            </span>
          ) : (
            <span>No recent generations</span>
          )}
        </div>
      </div>
      
      <div className="stats-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bot Status</h3>
          </div>
        </div>
        <div className="mt-3 mb-2">
          <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
            "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
          )}>
            <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="mt-auto pt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{stats?.connectedServers || 0} servers connected</span>
        </div>
      </div>
    </div>
  );
}
