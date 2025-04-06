import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import Header from './Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [location, navigate] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    // Check if user is logged in
    if (!isLoading && !authData?.success) {
      navigate('/auth');
    }
  }, [authData, isLoading, navigate]);

  // Get current page title based on path
  const getPageTitle = () => {
    const path = location.split('/')[1] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-72 max-w-full">
          <Sidebar onNavigate={() => setShowMobileSidebar(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()}
          onMenuClick={() => setShowMobileSidebar(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
