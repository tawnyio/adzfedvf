import React, { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ path, children, adminOnly = false }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  
  // Check authentication
  const { isLoading, data: authData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      return await response.json();
    },
  });

  // Use a single useEffect for all redirects
  useEffect(() => {
    if (!isLoading) {
      if (!authData?.success || !authData?.user) {
        setLocation("/login");
      } else if (adminOnly && !authData.user.isAdmin) {
        setLocation("/");
      }
    }
  }, [isLoading, authData, adminOnly, setLocation]);

  // Show a loading spinner while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If not authenticated or not authorized, render an empty route
  if (!authData?.success || !authData?.user || (adminOnly && !authData.user.isAdmin)) {
    return <Route path={path}></Route>;
  }

  // If authenticated and has correct role, render the children
  return <Route path={path}>{children}</Route>;
}