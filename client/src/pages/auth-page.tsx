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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schémas de validation pour les formulaires
const loginSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

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
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Configuration du formulaire d'inscription
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
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

  // Gestionnaires de soumission
  const handleLogin = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

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
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Section héro */}
      <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-primary/20 to-background">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">FlowGen Manager</h1>
          <p className="text-xl text-muted-foreground">
            Une plateforme complète pour la gestion de vos comptes et l'intégration avec Discord.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 3a6 6 0 0 0-6 6c0 7 6 12 6 12s6-5 6-12a6 6 0 0 0-6-6z" />
                  <circle cx="12" cy="9" r="2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Service Premium</h3>
                <p className="text-muted-foreground">
                  Accédez à tous vos services préférés en un seul endroit.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Bot Discord Intégré</h3>
                <p className="text-muted-foreground">
                  Générez des comptes directement depuis votre serveur Discord avec des commandes simples.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Statistiques en Temps Réel</h3>
                <p className="text-muted-foreground">
                  Suivez l'utilisation de vos comptes et l'activité de votre serveur avec des tableaux de bord détaillés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaires d'authentification */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center md:hidden">
            <h1 className="text-3xl font-bold">FlowGen Manager</h1>
            <p className="text-muted-foreground">Connectez-vous pour accéder à la plateforme</p>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            {/* Formulaire de connexion */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Connexion</CardTitle>
                  <CardDescription>
                    Entrez vos identifiants pour accéder à votre compte.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
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
                          {...loginForm.register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
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
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Formulaire d'inscription */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Inscription</CardTitle>
                  <CardDescription>
                    Créez un nouveau compte pour accéder à la plateforme.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Nom d'utilisateur</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choisissez un nom d'utilisateur"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Choisissez un mot de passe"
                          {...registerForm.register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
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
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}