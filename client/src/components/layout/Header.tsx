import { Menu, Sun, Moon, BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className="navbar sticky top-0 z-40 h-16">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <h1 className="text-xl font-bold tracking-tight gradient-text">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none relative"
            >
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background dark:ring-gray-900"></span>
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
