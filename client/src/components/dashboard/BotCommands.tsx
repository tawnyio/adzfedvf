import { useQuery } from '@tanstack/react-query';
import { BotCommand } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, ShieldAlert, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BotCommands() {
  const { data: commands, isLoading } = useQuery<BotCommand[]>({
    queryKey: ['/api/commands'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center">
          <Terminal className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">
            <Skeleton className="h-6 w-48" />
          </h2>
        </div>
        <div className="p-5">
          <div className="space-y-3 h-[355px] overflow-y-auto scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-4 w-48 ml-3" />
                </div>
                <Skeleton className="h-4 w-64 mt-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center">
        <Terminal className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold gradient-text">Discord Bot Commands</h2>
      </div>
      <div className="p-5">
        <div className="space-y-3 h-[355px] overflow-y-auto scrollbar-hide">
          {commands?.map((command) => (
            <div 
              key={command.name} 
              className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-md dark:hover:shadow-black/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-md text-sm font-mono font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground">
                    !{command.name}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {command.description}
                  </div>
                </div>
                <div>
                  {command.permission === 'admin' ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <ShieldAlert className="h-3 w-3" />
                      Admin
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <User className="h-3 w-3" />
                      User
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "mt-3 text-sm font-mono p-2 rounded bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-700",
                "font-medium",
                command.permission === 'admin' ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"
              )}>
                {command.usage}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
