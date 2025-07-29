import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: ""
  });
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

  const { data: stores = [] } = useQuery<any[]>({
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

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, profileData }: { userId: string; profileData: any }) => {
      return await apiRequest("PATCH", `/api/staff/${userId}/profile`, profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStoreId] });
      setShowEditProfileDialog(false);
      setEditingStaff(null);
      toast({
        title: "Profile Updated",
        description: "Staff profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Profile Update Failed",
        description: "Failed to update staff profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveStaff = (userId: string) => {
    removeStaffMutation.mutate(userId);
  };

  const handleEditProfile = (member: any) => {
    setEditingStaff(member);
    setEditProfileData({
      firstName: member.user.firstName || "",
      lastName: member.user.lastName || "",
      email: member.user.email || "",
      mobile: member.user.mobile || ""
    });
    setShowEditProfileDialog(true);
  };

  const handleUpdateProfile = () => {
    if (editingStaff) {
      updateProfileMutation.mutate({
        userId: editingStaff.user.id,
        profileData: editProfileData
      });
    }
  };

  if (!user) return null;

  return (
    <div className="p-6">
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
        <Button className="bg-primary hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          Add Staff
        </Button>
      </div>
      
      {/* Store Selector */}
      <div className="mb-4">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Store
        </label>
        <Select
          value={selectedStoreId.toString()}
          onValueChange={(value) => setSelectedStoreId(parseInt(value))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store: any) => (
              <SelectItem key={store.id} value={store.id.toString()}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Staff Members</span>
            <div className="flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Create a new staff account for this store
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newStaffFirstName}
                          onChange={(e) => setNewStaffFirstName(e.target.value)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newStaffLastName}
                          onChange={(e) => setNewStaffLastName(e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        value={newStaffMobile}
                        onChange={(e) => setNewStaffMobile(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="store_manager">Store Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        // Add staff member logic here
                        setShowAddDialog(false);
                      }}
                      disabled={!newStaffEmail || !newStaffPassword || !newStaffFirstName}
                    >
                      Add Staff
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {staffLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.user.role)}>
                        {getRoleDisplayName(member.user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <Mail size={14} />
                          {member.user.email}
                        </p>
                        <p className="flex items-center gap-1 text-gray-500">
                          <Phone size={14} />
                          {member.user.mobile || 'Not provided'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} />
                        <span className="text-sm">{currentStore?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(member)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit Role
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProfile(member)}
                        >
                          <User size={14} className="mr-1" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPasswordChangeUser(member.user);
                            setShowPasswordDialog(true);
                          }}
                        >
                          <Key size={14} className="mr-1" />
                          Password
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 size={14} className="mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.user.firstName} {member.user.lastName} from this store?
                                This action cannot be undone.
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

          {filteredStaff.length === 0 && !staffLoading && (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No staff members match your search.' : 'Add staff members to get started.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update role and store assignment for {editingStaff?.user.firstName} {editingStaff?.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select value={editingRole} onValueChange={setEditingRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="store_manager">Store Manager</SelectItem>
                  <SelectItem value="senior_nail_artist">Senior Nail Artist</SelectItem>
                  <SelectItem value="junior_nail_artist">Junior Nail Artist</SelectItem>
                  <SelectItem value="beginner_nail_artist">Beginner Nail Artist</SelectItem>
                  {user?.role === 'super_admin' && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editStore">Store Assignment</Label>
              <Select value={editingStoreId.toString()} onValueChange={(value) => setEditingStoreId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={updateStaffMutation.isPending}>
              {updateStaffMutation.isPending ? 'Updating...' : 'Update'}
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
              Update password for {passwordChangeUser?.firstName} {passwordChangeUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newPassword === confirmPassword && passwordChangeUser) {
                  changePasswordMutation.mutate({
                    userId: passwordChangeUser.id,
                    newPassword: newPassword
                  });
                }
              }}
              disabled={!newPassword || newPassword !== confirmPassword || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>
              Update profile information for {editingStaff?.user.firstName} {editingStaff?.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editProfileData.firstName}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editProfileData.lastName}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editProfileData.email}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="editMobile">Mobile Number</Label>
              <Input
                id="editMobile"
                value={editProfileData.mobile}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
