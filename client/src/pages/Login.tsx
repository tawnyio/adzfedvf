import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Schéma de validation pour le formulaire
const loginSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté
  const { isLoading: isAuthChecking, data: authData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user");
      return await response.json();
    },
  });

  // Rediriger vers la page d'accueil si déjà connecté
  if (authData?.success && authData?.user) {
    setLocation("/");
    return null;
  }

  // Configuration du formulaire de connexion
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Mutation pour la connexion
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["/api/user"], data);
        toast({
          title: "Connexion réussie!",
          description: "Vous êtes maintenant connecté.",
        });
        setLocation("/");
      } else {
        toast({
          title: "Erreur de connexion",
          description: data.message || "Nom d'utilisateur ou mot de passe incorrect.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion.",
        variant: "destructive",
      });
    },
  });

  // Gestionnaire de soumission
  const handleLogin = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">FlowGen</h1>
          <p className="text-muted-foreground mt-2">Connexion à votre compte</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={form.handleSubmit(handleLogin)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Votre nom d'utilisateur"
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
              
              <div className="text-center text-sm">
                Vous n'avez pas de compte?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal"
                  onClick={() => setLocation("/register")}
                >
                  Créer un compte
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}