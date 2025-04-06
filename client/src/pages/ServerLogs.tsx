import { useState } from "react";
import { useTitle } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { Log } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  RefreshCw
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ServerLogs() {
  useTitle("Server Logs - FlowGen Account Manager");
  const [logLimit, setLogLimit] = useState("50");
  const [searchTerm, setSearchTerm] = useState("");
  const [logType, setLogType] = useState("");

  const { data: logs, isLoading, refetch } = useQuery<Log[]>({
    queryKey: ['/api/logs', logLimit],
    queryFn: async () => {
      const response = await fetch(`/api/logs?limit=${logLimit}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    }
  });

  // Filter logs by search term and type
  const filteredLogs = logs?.filter((log) => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !logType || logType === 'all' || log.type.toLowerCase() === logType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const getLogTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
      case 'info':
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Server Logs</h1>
        <Button onClick={() => refetch()} className="inline-flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Log Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Log Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logLimit} onValueChange={setLogLimit}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Last 10</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex space-x-4 p-4 border rounded">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-12">
              <Info className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium">No logs found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-full">Message</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getLogTypeIcon(log.type)}
                          <span className="ml-2">{getLogTypeBadge(log.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell className="text-nowrap text-muted-foreground text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
