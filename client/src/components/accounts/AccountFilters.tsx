import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountFilters as FiltersType } from "@shared/types";
import { Search } from "lucide-react";

interface AccountFiltersProps {
  filters: FiltersType;
  setFilters: (filters: FiltersType) => void;
}

export default function AccountFilters({ filters, setFilters }: AccountFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilters({ ...filters, search: searchValue });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchValue, filters, setFilters]);
  
  // Fix filter logic for "all" values
  useEffect(() => {
    // Update filter logic for the new "all" values
    const updatedFilters = { ...filters };
    
    // If status or category changes, update handling for "all" value
    if (filters.category === "") {
      updatedFilters.category = "all";
      setFilters(updatedFilters);
    }
    
    if (filters.status === "") {
      updatedFilters.status = "all";
      setFilters(updatedFilters);
    }
  }, []);

  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-100">
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
        <div className="flex-1 flex">
          <div className="relative flex-grow focus-within:z-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search accounts..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex space-x-3">
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value })}
          >
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
