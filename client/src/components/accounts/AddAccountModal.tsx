import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [accounts, setAccounts] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [verifyAccounts, setVerifyAccounts] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Add accounts mutation
  const addAccountsMutation = useMutation({
    mutationFn: async (formData: {
      accounts: string;
      categoryId: number;
      expiresAt?: string;
      verify: boolean;
    }) => {
      // Parse accounts from textarea (email:password format)
      const accountLines = formData.accounts.trim().split('\n');
      const accountsData = accountLines.map(line => {
        const [email, password] = line.split(':');
        if (!email || !password) {
          throw new Error(`Invalid format in line: ${line}. Expected email:password`);
        }
        
        return {
          email: email.trim(),
          password: password.trim(),
          categoryId: formData.categoryId,
          status: 'available',
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
        };
      });
      
      const response = await apiRequest('POST', '/api/accounts/bulk', {
        accounts: accountsData,
        categoryId: formData.categoryId
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Accounts added',
        description: 'The accounts have been added to your stock.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset form fields
      setAccounts("");
      setCategoryId("");
      setExpiresAt("");
      setVerifyAccounts(false);
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Failed to add accounts',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!accounts.trim()) {
      toast({
        title: 'No accounts provided',
        description: 'Please enter at least one account in email:password format.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!categoryId) {
      toast({
        title: 'No category selected',
        description: 'Please select a category for the accounts.',
        variant: 'destructive',
      });
      return;
    }
    
    addAccountsMutation.mutate({
      accounts,
      categoryId: parseInt(categoryId),
      expiresAt: expiresAt || undefined,
      verify: verifyAccounts
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Accounts</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="service">Service</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service" />
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
            <Label htmlFor="accounts">Accounts (email:password format)</Label>
            <Textarea
              id="accounts"
              rows={5}
              value={accounts}
              onChange={(e) => setAccounts(e.target.value)}
              placeholder="email1@example.com:password1&#10;email2@example.com:password2"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter one account per line in email:password format
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              type="date"
              id="expiry"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verify"
              checked={verifyAccounts}
              onCheckedChange={(checked) => setVerifyAccounts(checked as boolean)}
            />
            <Label htmlFor="verify" className="cursor-pointer">Verify accounts before adding</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={addAccountsMutation.isPending}
          >
            {addAccountsMutation.isPending ? 'Adding...' : 'Add Accounts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
