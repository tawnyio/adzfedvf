import { useState } from 'react';
import { AccountWithCategory } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, Plus } from 'lucide-react';
import { cn, formatDate, maskEmail, getCategoryColor, getStatusColor } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AccountCardProps {
  account: AccountWithCategory;
  onUpdate: () => void;
}

export default function AccountCard({ account, onUpdate }: AccountCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedAccount, setEditedAccount] = useState({
    email: account.email,
    password: account.password,
    status: account.status,
    expiresAt: account.expiresAt ? new Date(account.expiresAt).toISOString().split('T')[0] : '',
    categoryId: account.categoryId.toString(),
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user to check admin status
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedAccount: typeof editedAccount) => {
      const response = await apiRequest(
        'PATCH',
        `/api/accounts/${account.id}`,
        {
          ...updatedAccount,
          categoryId: parseInt(updatedAccount.categoryId),
          expiresAt: updatedAccount.expiresAt ? new Date(updatedAccount.expiresAt) : null,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account updated',
        description: 'The account has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setIsEditModalOpen(false);
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Generate account mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'PATCH',
        `/api/accounts/${account.id}`,
        {
          status: 'generated',
          generatedAt: new Date(),
          generatedBy: 'web-admin',
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account generated',
        description: 'The account has been marked as generated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Restock account mutation (set status back to available)
  const restockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'PATCH',
        `/api/accounts/${account.id}`,
        {
          status: 'available',
          generatedAt: null,
          generatedBy: null,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account restocked',
        description: 'The account has been marked as available.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Restock failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateAccount = () => {
    updateMutation.mutate(editedAccount);
  };

  const handleGenerateAccount = () => {
    generateMutation.mutate();
  };

  const handleRestockAccount = () => {
    restockMutation.mutate();
  };

  const { bg: statusBgColor, text: statusTextColor } = getStatusColor(account.status);
  const categoryColorClass = getCategoryColor(account.category.name);

  return (
    <>
      <div className="bg-white dark:bg-dark-200 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-dark-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={cn("h-10 w-10 rounded flex items-center justify-center", categoryColorClass)}>
                  {account.category.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Added {formatDate(account.createdAt)}
                </p>
              </div>
            </div>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusBgColor, statusTextColor)}>
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">{maskEmail(account.email)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Password:</span>
              <span className="font-medium text-gray-900 dark:text-white">••••••••••</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Expires:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(account.expiresAt)}</span>
            </div>
          </div>
          {userData?.success && userData.user?.isAdmin && (
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {account.status === 'available' ? (
                <Button
                  size="sm"
                  onClick={handleGenerateAccount}
                  className="inline-flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Generate
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRestockAccount}
                  className="inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Restock
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Account Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editedAccount.email}
                onChange={(e) => setEditedAccount({ ...editedAccount, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={editedAccount.password}
                onChange={(e) => setEditedAccount({ ...editedAccount, password: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editedAccount.categoryId}
                onValueChange={(value) => setEditedAccount({ ...editedAccount, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editedAccount.status}
                onValueChange={(value) => setEditedAccount({ ...editedAccount, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expiration Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={editedAccount.expiresAt}
                onChange={(e) => setEditedAccount({ ...editedAccount, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
