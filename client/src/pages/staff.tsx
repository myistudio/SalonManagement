import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Bus, User, Settings, Mail, Phone } from "lucide-react";
import BillingModal from "@/components/billing/billing-modal";

export default function Staff() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBillingModal, setShowBillingModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
    retry: false,
  });

  // Mock staff data since we don't have a complete staff API yet
  const mockStaff = [
    {
      id: 1,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@salon.com",
      role: "store_manager",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612e2ce?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      firstName: "Emily",
      lastName: "Davis",
      email: "emily@salon.com",
      role: "cashier",
      profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      firstName: "Jessica",
      lastName: "Wilson",
      email: "jessica@salon.com",
      role: "cashier",
      profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face",
      createdAt: new Date().toISOString(),
    },
  ];

  const staffMembers = mockStaff.filter(staff =>
    staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'store_manager':
        return 'bg-blue-100 text-blue-800';
      case 'cashier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'store_manager':
        return 'Store Manager';
      case 'cashier':
        return 'Cashier';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedStoreId={selectedStoreId} onStoreChange={setSelectedStoreId} />
      
      <div className="flex">
        <Sidebar onOpenBilling={() => setShowBillingModal(true)} />
        
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Staff Management</h2>
                <p className="mt-1 text-gray-600">Manage your team members and their roles</p>
              </div>
              {user?.role === 'super_admin' || user?.role === 'store_manager' ? (
                <Button className="flex items-center space-x-2">
                  <Plus size={16} />
                  <span>Add Staff Member</span>
                </Button>
              ) : null}
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Current User Card */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <User className="mr-2" size={20} />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-1" />
                        {user?.email}
                      </div>
                      <Badge className={getRoleColor(user?.role || '')}>
                        {getRoleLabel(user?.role || '')}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bus className="mr-2" size={20} />
                  Team Members ({staffMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Bus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? "Try adjusting your search terms" : "Add team members to manage your salon"}
                    </p>
                    {user?.role === 'super_admin' || user?.role === 'store_manager' ? (
                      <Button>
                        <Plus size={16} className="mr-2" />
                        Add Staff Member
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {staffMembers.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <img
                            src={staff.profileImageUrl}
                            alt={`${staff.firstName} ${staff.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {staff.firstName} {staff.lastName}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail size={14} className="mr-1" />
                                {staff.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                Joined {new Date(staff.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getRoleColor(staff.role)}>
                            {getRoleLabel(staff.role)}
                          </Badge>
                          {(user?.role === 'super_admin' || user?.role === 'store_manager') && (
                            <Button variant="outline" size="sm">
                              <Settings size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            {user?.role === 'super_admin' || user?.role === 'store_manager' ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Team Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Performance analytics coming soon!</p>
                    <p className="text-sm mt-2">Track individual staff performance, sales, and customer satisfaction.</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </main>
      </div>

      <BillingModal 
        isOpen={showBillingModal} 
        onClose={() => setShowBillingModal(false)} 
        storeId={selectedStoreId}
      />
    </div>
  );
}
