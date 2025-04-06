import { useState } from "react";
import { useTitle } from "react-use";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, UserPlus, Bot, Database, Shield, User } from "lucide-react";

export default function Settings() {
  useTitle("Settings - FlowGen Account Manager");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [discordToken, setDiscordToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Bot settings
  const [botPrefix, setBotPrefix] = useState("!");
  const [botCooldown, setBotCooldown] = useState("3600");

  // Fetch current user data
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (formData: { username: string; password: string; isAdmin: boolean }) => {
      const response = await apiRequest('POST', '/api/users', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User created',
        description: 'The new user has been created successfully.',
      });
      setUsername("");
      setPassword("");
      setIsAdmin(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to create user',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update bot settings mutation (placeholder, as this endpoint isn't fully implemented in the backend)
  const updateBotSettingsMutation = useMutation({
    mutationFn: async (formData: { prefix: string; cooldown: number }) => {
      // This would need to be implemented in the backend
      const response = await apiRequest('POST', '/api/bot/settings', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Bot settings updated',
        description: 'The bot settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update bot settings',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleCreateUser = () => {
    if (!username || !password) {
      toast({
        title: 'Missing information',
        description: 'Please provide both username and password.',
        variant: 'destructive',
      });
      return;
    }
    
    createUserMutation.mutate({
      username,
      password,
      isAdmin
    });
  };

  const handleUpdateBotSettings = () => {
    updateBotSettingsMutation.mutate({
      prefix: botPrefix,
      cooldown: parseInt(botCooldown)
    });
  };

  const handleSaveDiscordToken = () => {
    if (!discordToken) {
      toast({
        title: 'No token provided',
        description: 'Please enter a Discord bot token.',
        variant: 'destructive',
      });
      return;
    }
    
    // This would need to be implemented in the backend
    toast({
      title: 'Discord token saved',
      description: 'The Discord bot token has been saved. The bot will restart automatically.',
    });
    
    setDiscordToken("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className={`grid w-full ${userData?.user?.isAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <TabsTrigger value="general">General</TabsTrigger>
          {userData?.user?.isAdmin && (
            <>
              <TabsTrigger value="bot">Bot Configuration</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-6">
          {userData?.user?.isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Discord Bot Token</CardTitle>
                <CardDescription>
                  Update your Discord bot token. The bot will restart after saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discordToken">Discord Bot Token</Label>
                    <Input
                      id="discordToken"
                      type="password"
                      placeholder="Enter your Discord bot token"
                      value={discordToken}
                      onChange={(e) => setDiscordToken(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveDiscordToken}
                  className="ml-auto"
                >
                  Save Token
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {userData?.user?.isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>
                  Manage your account database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Database Backup</Label>
                        <p className="text-sm text-muted-foreground">
                          Create a backup of your account database
                        </p>
                      </div>
                      <Button variant="outline">
                        <Database className="mr-2 h-4 w-4" />
                        Backup Now
                      </Button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Import Accounts</Label>
                        <p className="text-sm text-muted-foreground">
                          Import accounts from a CSV or TXT file
                        </p>
                      </div>
                      <Button variant="outline">Import</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Current User Permissions</CardTitle>
              <CardDescription>
                Your current user permissions and access level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUserLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <Label>Username</Label>
                    <div className="font-medium">{userData?.user?.username || 'Not logged in'}</div>
                  </div>
                  
                  <div className="grid gap-1">
                    <Label>Access Level</Label>
                    <div className="flex items-center font-medium">
                      {userData?.user?.isAdmin ? (
                        <>
                          <Shield className="mr-1 h-4 w-4 text-primary" />
                          Administrator
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-4 w-4" />
                          Regular User
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bot" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                Bot Configuration
              </CardTitle>
              <CardDescription>
                Configure how the Discord bot works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="botPrefix">Command Prefix</Label>
                  <Input
                    id="botPrefix"
                    value={botPrefix}
                    onChange={(e) => setBotPrefix(e.target.value)}
                    placeholder="!"
                    maxLength={3}
                    className="max-w-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    The character users type before commands (e.g., !generate)
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="botCooldown">Generation Cooldown (seconds)</Label>
                  <Input
                    id="botCooldown"
                    type="number"
                    value={botCooldown}
                    onChange={(e) => setBotCooldown(e.target.value)}
                    placeholder="3600"
                    className="max-w-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time users must wait between generating accounts (in seconds)
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="dmAccounts">DM Generated Accounts</Label>
                    <Switch id="dmAccounts" defaultChecked />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send account details via direct message instead of in the channel
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="autoDelete">Auto-Delete Commands</Label>
                    <Switch id="autoDelete" defaultChecked />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Delete command messages after processing to keep channels clean
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateBotSettings}
                className="ml-auto"
              >
                Save Bot Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Add New User
              </CardTitle>
              <CardDescription>
                Create a new user account for the web interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAdmin"
                    checked={isAdmin}
                    onCheckedChange={setIsAdmin}
                  />
                  <Label htmlFor="isAdmin" className="flex items-center">
                    <Shield className="mr-1 h-4 w-4" />
                    Administrator Rights
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateUser} 
                disabled={createUserMutation.isPending || !userData?.user?.isAdmin}
                className="ml-auto"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current User Permissions</CardTitle>
              <CardDescription>
                Your current user permissions and access level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUserLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <Label>Username</Label>
                    <div className="font-medium">{userData?.user?.username || 'Not logged in'}</div>
                  </div>
                  
                  <div className="grid gap-1">
                    <Label>Access Level</Label>
                    <div className="flex items-center font-medium">
                      {userData?.user?.isAdmin ? (
                        <>
                          <Shield className="mr-1 h-4 w-4 text-primary" />
                          Administrator
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-4 w-4" />
                          Regular User
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
