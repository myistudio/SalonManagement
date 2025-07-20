import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Bus, User, Settings, Mail, Phone, Edit, Trash2, Shield, Building2, Key } from "lucide-react";
import BillingModal from "@/components/billing/billing-modal";

export default function Staff() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState("");
  const [editingStoreId, setEditingStoreId] = useState<number>(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<any>(null);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffMobile, setNewStaffMobile] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffFirstName, setNewStaffFirstName] = useState("");
  const [newStaffLastName, setNewStaffLastName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("cashier");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["/api/staff", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/staff?storeId=${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    enabled: !!selectedStoreId,
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ userId, role, storeId }: { userId: string; role: string; storeId: number }) => {
      return await apiRequest("PATCH", `/api/staff/${userId}/role`, { 
        role, 
        storeId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", editingStoreId] });
      toast({
        title: "Staff Updated",
        description: "Staff role and store assignment have been updated successfully.",
      });
      setShowEditDialog(false);
      setEditingStaff(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Update Failed",
        description: "Failed to update staff role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/staff/${userId}/${selectedStoreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStoreId] });
      toast({
        title: "Staff Removed",
        description: "Staff member has been removed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Remove Failed",
        description: "Failed to remove staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: { 
      email: string; 
      mobile?: string;
      password: string;
      firstName: string;
      lastName?: string;
      role: string;
      storeId: number;
    }) => {
      return await apiRequest("POST", "/api/staff/create", staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStoreId] });
      setShowAddDialog(false);
      setNewStaffEmail("");
      setNewStaffMobile("");
      setNewStaffPassword("");
      setNewStaffFirstName("");
      setNewStaffLastName("");
      setNewStaffRole("cashier");
      setNewStaffEmail("");
      setNewStaffRole("cashier");
      toast({
        title: "Staff Added",
        description: "Staff member has been added successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Add Failed",
        description: "Failed to add staff member. Please check the email address and try again.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return await apiRequest("PATCH", `/api/staff/${userId}/password`, {
        password: newPassword,
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setPasswordChangeUser(null);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Staff password has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Password Update Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentStore = stores.find((store: any) => store.id === selectedStoreId);

  const filteredStaff = staff.filter((member: any) =>
    member.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
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

  const getRoleDisplayName = (role: string) => {
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

  const handleEditRole = (member: any) => {
    setEditingStaff(member);
    setEditingRole(member.user.role);
    setEditingStoreId(member.storeId);
    setShowEditDialog(true);
  };

  const handleUpdateStaff = () => {
    if (editingStaff) {
      updateStaffMutation.mutate({
        userId: editingStaff.user.id,
        role: editingRole,
        storeId: editingStoreId,
      });
    }
  };

  const handleRemoveStaff = (userId: string) => {
    removeStaffMutation.mutate(userId);
  };

  if (!user) return null;

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bus size={24} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600">Manage store staff and their roles</p>
                </div>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus size={16} className="mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Add a new staff member to {currentStore?.name}. If they don't have an account yet, we'll create one for them.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name *</label>
                        <Input
                          placeholder="First name"
                          value={newStaffFirstName}
                          onChange={(e) => setNewStaffFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          placeholder="Last name"
                          value={newStaffLastName}
                          onChange={(e) => setNewStaffLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="Enter staff member's email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mobile Number</label>
                      <Input
                        type="tel"
                        placeholder="Enter mobile number"
                        value={newStaffMobile}
                        onChange={(e) => setNewStaffMobile(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <Input
                        type="password"
                        placeholder="Create password (min 6 characters)"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="store_manager">Store Manager</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Assign to Store</label>
                      <Select value={selectedStoreId.toString()} onValueChange={(value) => setSelectedStoreId(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(stores) && stores.map((store: any) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                      disabled={addStaffMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => addStaffMutation.mutate({ 
                        email: newStaffEmail,
                        mobile: newStaffMobile || undefined,
                        password: newStaffPassword,
                        firstName: newStaffFirstName,
                        lastName: newStaffLastName || undefined,
                        role: newStaffRole,
                        storeId: selectedStoreId
                      })}
                      disabled={!newStaffEmail || !newStaffPassword || !newStaffFirstName || addStaffMutation.isPending}
                    >
                      {addStaffMutation.isPending ? "Adding..." : "Add Staff"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Store Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentStore?.name}</h3>
                    <p className="text-sm text-gray-600">{currentStore?.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Search staff by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Staff Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Staff Members ({filteredStaff.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <User size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                    <p className="text-gray-600">No staff members match your search criteria.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Store Assignment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((member: any) => (
                        <TableRow key={member.user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {member.user.profileImageUrl ? (
                                <img
                                  src={member.user.profileImageUrl}
                                  alt={`${member.user.firstName} ${member.user.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User size={20} className="text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{member.user.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(member.user.role)}>
                              {getRoleDisplayName(member.user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium">
                                {currentStore?.name || `Store ${selectedStoreId}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRole(member)}
                                className="h-8 px-2"
                                title="Edit Role"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPasswordChangeUser(member.user);
                                  setShowPasswordDialog(true);
                                }}
                                className="h-8 px-2 text-blue-600 hover:text-blue-700"
                                title="Change Password"
                              >
                                <Key size={16} />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {member.user.firstName} {member.user.lastName} from this store? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveStaff(member.user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Change the role and store assignment for {editingStaff?.user.firstName} {editingStaff?.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={editingRole}
                onValueChange={setEditingRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="store_manager">Store Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Store Assignment</label>
              <Select
                value={editingStoreId.toString()}
                onValueChange={(value) => setEditingStoreId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {(stores as any[]).map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStaff}
              disabled={updateStaffMutation.isPending}
            >
              {updateStaffMutation.isPending ? "Updating..." : "Update Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordChangeUser?.firstName} {passwordChangeUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newPassword !== confirmPassword) {
                  toast({
                    title: "Password Mismatch",
                    description: "Passwords do not match. Please try again.",
                    variant: "destructive",
                  });
                  return;
                }
                if (newPassword.length < 6) {
                  toast({
                    title: "Password Too Short",
                    description: "Password must be at least 6 characters long.",
                    variant: "destructive",
                  });
                  return;
                }
                changePasswordMutation.mutate({
                  userId: passwordChangeUser?.id,
                  newPassword: newPassword,
                });
              }}
              disabled={!newPassword || !confirmPassword || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showBillingModal && (
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          storeId={selectedStoreId}
        />
      )}
    </>
  );
}