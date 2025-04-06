import { useState } from "react";
import { useTitle } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { AccountWithCategory } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpToLine } from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import AccountFilters from "@/components/accounts/AccountFilters";
import AddAccountModal from "@/components/accounts/AddAccountModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Accounts() {
  useTitle("Accounts - FlowGen Account Manager");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: ''
  });
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Fetch current user to check admin status
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });
  


  // Fetch accounts based on filters
  const { data: accounts, isLoading, refetch } = useQuery<AccountWithCategory[]>({
    queryKey: ['/api/accounts', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      
      const response = await fetch(`/api/accounts?${queryParams.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    }
  });

  // Fetch categories for tabs
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const handleExportAccounts = () => {
    if (!accounts || accounts.length === 0) {
      toast({
        title: 'No accounts to export',
        description: 'There are no accounts matching your current filters.',
        variant: 'destructive'
      });
      return;
    }

    // Format accounts for export
    const exportData = accounts.map(acc => {
      return `${acc.email}:${acc.password} | Category: ${acc.category.name} | Status: ${acc.status} | Expires: ${acc.expiresAt ? new Date(acc.expiresAt).toLocaleDateString() : 'N/A'}`;
    }).join('\n');

    // Create a download link
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Accounts exported',
      description: `${accounts.length} accounts have been exported to a text file.`
    });
  };

  // Filter accounts based on active tab
  const filteredAccounts = accounts?.filter(account => {
    if (activeTab === 'all') return true;
    return account.category.name.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Account Management</h1>
        
        {userData?.success && userData.user?.isAdmin ? (
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Accounts
            </Button>
            <Button
              variant="outline"
              onClick={handleExportAccounts}
              className="inline-flex items-center"
            >
              <ArrowUpToLine className="w-4 h-4 mr-2" />
              Export Accounts
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Mode lecture uniquement</div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-200 rounded-lg shadow overflow-hidden">
        <AccountFilters filters={filters} setFilters={setFilters} />

        <div className="px-6 py-4">
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4 overflow-x-auto flex w-full border-b border-gray-200 dark:border-dark-100">
              <TabsTrigger value="all" className="border-b-2 border-transparent px-4 py-2 text-sm font-medium">
                All Accounts
              </TabsTrigger>
              {categories?.map((category: any) => (
                <TabsTrigger 
                  key={category.id}
                  value={category.name.toLowerCase()}
                  className="border-b-2 border-transparent px-4 py-2 text-sm font-medium"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-dark-200 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-dark-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded" />
                          <div className="ml-4">
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAccounts?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No accounts found matching your filters.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFilters({ search: '', category: '', status: '' });
                      setActiveTab('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAccounts?.map((account) => (
                    <AccountCard key={account.id} account={account} onUpdate={refetch} />
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{filteredAccounts?.length || 0}</span> of{" "}
                  <span className="font-medium">{accounts?.length || 0}</span> results
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <Button variant="outline">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddAccountModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
