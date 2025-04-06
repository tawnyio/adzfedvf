import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Terminal,
  Database,
  Settings,
  LogOut,
  Flame,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      return await response.json();
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté avec succès',
      });
      
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Erreur de déconnexion',
        description: 'Une erreur est survenue lors de la déconnexion',
        variant: 'destructive',
      });
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  // Définir les éléments de navigation en fonction du rôle de l'utilisateur
  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: Home },
    { path: '/bot-commands', label: 'Commandes Bot', icon: Terminal }
  ];

  // Ajouter les éléments réservés aux administrateurs
  if (userData?.success && userData.user?.isAdmin) {
    navItems.push(
      { path: '/accounts', label: 'Comptes', icon: FileText },
      { path: '/server-logs', label: 'Logs Serveur', icon: Database },
      { path: '/settings', label: 'Paramètres', icon: Settings }
    );
  }

  return (
    <aside className="sidebar w-64 h-full flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <Flame className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">FlowGen</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3",
                  isActive(item.path) 
                    ? "text-primary dark:text-primary-foreground"
                    : "text-gray-500 dark:text-gray-400"
                )} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User dropdown */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-lg font-semibold text-primary dark:text-primary-foreground shadow-inner">
                {userData?.user?.username ? userData.user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {userData?.user?.username || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userData?.user?.isAdmin ? 'Administrateur' : 'Utilisateur'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
