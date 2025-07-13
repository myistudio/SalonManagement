import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  selectedStoreId: number;
  onStoreChange: (storeId: number) => void;
  onToggleMobileMenu?: () => void;
}

export default function Header({ selectedStoreId, onStoreChange, onToggleMobileMenu }: HeaderProps) {
  const { user } = useAuth();
  
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu button - positioned before project title */}
            <div className="lg:hidden mr-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMobileMenu}
                className="p-2"
              >
                <Menu size={20} />
              </Button>
            </div>
            
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/80">SalonPro</h1>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Store Selector */}
            <div className="hidden md:block">
              <Select 
                value={selectedStoreId?.toString()} 
                onValueChange={(value) => onStoreChange(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {(stores as any[]).map((store: any) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <button className="text-gray-500 hover:text-gray-700 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </div>
                    <div className="text-gray-500 capitalize">{(user as any)?.role?.replace('_', ' ')}</div>
                  </div>
                  <img 
                    src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>{(user as any)?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await fetch('/api/logout', { method: 'POST' });
                      window.location.href = '/';
                    } catch (error) {
                      window.location.href = '/';
                    }
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}