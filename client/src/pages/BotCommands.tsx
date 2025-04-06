import { useTitle } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { BotCommand } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Terminal, Shield, User } from "lucide-react";

export default function BotCommandsPage() {
  useTitle("Bot Commands - FlowGen Account Manager");
  
  const { data: commands, isLoading } = useQuery<BotCommand[]>({
    queryKey: ['/api/commands'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discord Bot Commands</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Terminal className="mr-2 h-5 w-5" />
            Available Commands
          </CardTitle>
          <CardDescription>
            These commands can be used in Discord servers where the bot is installed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-md p-4 border">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Permission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commands?.map((command) => (
                  <TableRow key={command.name}>
                    <TableCell className="font-mono font-medium">!{command.name}</TableCell>
                    <TableCell>{command.description}</TableCell>
                    <TableCell className="font-mono text-sm">{command.usage}</TableCell>
                    <TableCell>
                      <Badge
                        variant={command.permission === 'admin' ? 'destructive' : 'default'}
                        className="flex items-center gap-1"
                      >
                        {command.permission === 'admin' ? (
                          <><Shield className="h-3 w-3" /> Admin</>
                        ) : (
                          <><User className="h-3 w-3" /> User</>
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Command Syntax</CardTitle>
            <CardDescription>How to properly format commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Prefix</h3>
                <p className="text-sm text-muted-foreground">All commands start with the <code className="bg-muted p-1 rounded">!</code> prefix</p>
              </div>
              <div>
                <h3 className="font-medium">Parameters</h3>
                <p className="text-sm text-muted-foreground">Parameters in [brackets] are required</p>
                <p className="text-sm text-muted-foreground">Parameters in (parentheses) are optional</p>
              </div>
              <div>
                <h3 className="font-medium">Examples</h3>
                <p className="text-sm font-mono bg-muted p-2 rounded my-1">!generate netflix</p>
                <p className="text-sm font-mono bg-muted p-2 rounded my-1">!stock vpn</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Command Cooldowns</CardTitle>
            <CardDescription>Time limits between command usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Generation Commands</h3>
                <p className="text-sm text-muted-foreground">
                  The <code className="bg-muted p-1 rounded">!generate</code> command has a 1-hour cooldown per user, per service
                </p>
              </div>
              <div>
                <h3 className="font-medium">Status Commands</h3>
                <p className="text-sm text-muted-foreground">
                  The <code className="bg-muted p-1 rounded">!stock</code> and <code className="bg-muted p-1 rounded">!status</code> commands 
                  have a 1-minute cooldown to prevent spam
                </p>
              </div>
              <div>
                <h3 className="font-medium">Admin Commands</h3>
                <p className="text-sm text-muted-foreground">
                  Admin commands don't have cooldowns but should be used responsibly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
