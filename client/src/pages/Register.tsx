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
const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
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

  // Configuration du formulaire d'inscription
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Mutation pour l'inscription
  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormValues, "confirmPassword">) => {
      const { confirmPassword, ...registerData } = data as any;
      const response = await apiRequest("POST", "/api/register", registerData);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["/api/user"], data);
        toast({
          title: "Inscription réussie!",
          description: "Votre compte a été créé avec succès.",
        });
        setLocation("/");
      } else {
        toast({
          title: "Erreur d'inscription",
          description: data.message || "Impossible de créer le compte.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur d'inscription",
        description: "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      });
    },
  });

  // Gestionnaire de soumission
  const handleRegister = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
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
          <p className="text-muted-foreground mt-2">Créer un nouveau compte</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Créez un nouveau compte pour accéder à la plateforme.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={form.handleSubmit(handleRegister)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choisissez un nom d'utilisateur"
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
                    placeholder="Choisissez un mot de passe"
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
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </Button>
              
              <div className="text-center text-sm">
                Vous avez déjà un compte?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal"
                  onClick={() => setLocation("/login")}
                >
                  Se connecter
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}