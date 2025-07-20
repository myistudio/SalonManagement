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
      
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-600">Staff management functionality temporarily simplified.</p>
        </CardContent>
      </Card>
    </div>
  );
}
