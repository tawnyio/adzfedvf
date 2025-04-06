import { useTitle } from "react-use";
import Stats from "@/components/dashboard/Stats";
import ServerActivity from "@/components/dashboard/ServerActivity";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, UserCheck } from "lucide-react";

export default function Dashboard() {
  useTitle("FlowGen - Tableau de bord");
  
  // Récupérer les informations de l'utilisateur connecté
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      return await response.json();
    }
  });

  // Récupérer les commandes du bot
  const { data: commands, isLoading: isCommandsLoading } = useQuery({
    queryKey: ['/api/commands'],
    queryFn: async () => {
      const response = await fetch('/api/commands', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch commands');
      return response.json();
    }
  });

  // Filtrer les commandes utilisateur uniquement (pas les commandes admin)
  const userCommands = commands?.filter((cmd: any) => cmd.permission === 'user') || [];

  return (
    <div className="space-y-8">
      {/* Titre et bienvenue */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenue sur FlowGen</h1>
        <p className="text-muted-foreground">
          Consultez les statistiques et l'activité récente
        </p>
      </div>

      {/* Overview Stats */}
      <Stats />
      
      {/* Section avec les commandes et l'activité */}
      <div className={`grid grid-cols-1 ${userData?.user?.isAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Commandes du bot - visible pour tous */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Commandes disponibles
            </CardTitle>
            <CardDescription>
              Commandes que vous pouvez utiliser sur Discord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCommandsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {userCommands.map((command: any) => (
                  <div key={command.name} className="p-3 bg-accent/50 rounded-lg">
                    <div className="font-medium">!{command.name}</div>
                    <div className="text-sm text-muted-foreground">{command.description}</div>
                    <div className="text-xs mt-1 text-primary">Usage: {command.usage}</div>
                  </div>
                ))}
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link to="/bot-commands" className="flex items-center">
                      Voir toutes les commandes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité récente - visible uniquement pour les admins */}
        {userData?.user?.isAdmin && <ServerActivity />}
      </div>
    </div>
  );
}
