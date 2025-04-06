import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import BotCommands from "@/pages/BotCommands";
import ServerLogs from "@/pages/ServerLogs";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

// Import ProtectedRoute
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login">
        <Login />
      </Route>
      
      <Route path="/register">
        <Register />
      </Route>
      
      {/* Protected Routes - Require Login */}
      <ProtectedRoute path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/accounts" adminOnly>
        <Layout>
          <Accounts />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/bot-commands">
        <Layout>
          <BotCommands />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/server-logs" adminOnly>
        <Layout>
          <ServerLogs />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/settings" adminOnly>
        <Layout>
          <Settings />
        </Layout>
      </ProtectedRoute>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
