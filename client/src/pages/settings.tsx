import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Upload, Building, Users, Shield, ArrowLeft, CalendarDays, Clock, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface AppointmentSettingsFormProps {
  selectedStoreId: number;
}

function AppointmentSettingsForm({ selectedStoreId }: AppointmentSettingsFormProps) {
  const { toast } = useToast();

  // Fetch appointment settings for the selected store
  const { data: appointmentSettings, isLoading } = useQuery({
    queryKey: ['/api/appointment-settings', selectedStoreId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/appointment-settings/${selectedStoreId}`);
      return response.json();
    },
    enabled: !!selectedStoreId,
  });

  // Update appointment settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = appointmentSettings ? 'PUT' : 'POST';
      const url = appointmentSettings 
        ? `/api/appointment-settings/${selectedStoreId}` 
        : '/api/appointment-settings';
      
      const payload = appointmentSettings ? data : { ...data, storeId: selectedStoreId };
      
      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointment-settings'] });
      toast({
        title: "Settings Updated",
        description: "Appointment settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update appointment settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateSettingsMutation.mutate({
      openingTime: formData.get('openingTime'),
      closingTime: formData.get('closingTime'),
      slotDuration: parseInt(formData.get('slotDuration') as string),
      maxConcurrentAppointments: parseInt(formData.get('maxConcurrentAppointments') as string),
    });
  };

  if (isLoading) {
    return <div>Loading appointment settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openingTime">Opening Time</Label>
          <Input
            id="openingTime"
            name="openingTime"
            type="time"
            defaultValue={appointmentSettings?.openingTime || '09:00'}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closingTime">Closing Time</Label>
          <Input
            id="closingTime"
            name="closingTime"
            type="time"
            defaultValue={appointmentSettings?.closingTime || '18:00'}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slotDuration">Time Slot Duration (minutes)</Label>
          <Select 
            name="slotDuration" 
            defaultValue={appointmentSettings?.slotDuration?.toString() || '30'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxConcurrentAppointments">Maximum Concurrent Appointments</Label>
          <Select 
            name="maxConcurrentAppointments" 
            defaultValue={appointmentSettings?.maxConcurrentAppointments?.toString() || '3'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 appointment</SelectItem>
              <SelectItem value="2">2 appointments</SelectItem>
              <SelectItem value="3">3 appointments</SelectItem>
              <SelectItem value="4">4 appointments</SelectItem>
              <SelectItem value="5">5 appointments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Clock size={16} />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {appointmentSettings && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Current Settings Preview</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Operating Hours: {appointmentSettings.openingTime} - {appointmentSettings.closingTime}</p>
            <p>Time Slots: Every {appointmentSettings.slotDuration} minutes</p>
            <p>Maximum Concurrent: {appointmentSettings.maxConcurrentAppointments} appointments per slot</p>
          </div>
        </div>
      )}
    </form>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  // Fetch current store details
  const { data: store } = useQuery({
    queryKey: ["/api/stores", selectedStore],
    enabled: !!selectedStore,
  });

  // Store update mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/stores/${selectedStore}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update store");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores", selectedStore] });
      toast({
        title: "Store Updated",
        description: "Store settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update store settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    // Handle tax configuration checkbox
    const enableTaxCheckbox = formData.get('enableTax');
    formData.set('enableTax', enableTaxCheckbox ? 'true' : 'false');

    updateStoreMutation.mutate(formData);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { label: "Super Admin", variant: "destructive" as const },
      store_manager: { label: "Store Manager", variant: "default" as const },
      cashier: { label: "Cashier", variant: "secondary" as const },
    };
    
    return roleConfig[role as keyof typeof roleConfig] || { label: role, variant: "secondary" as const };
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Settings size={24} />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Building size={16} />
            Store Settings
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Users size={16} />
            Account
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield size={16} />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <CalendarDays size={16} />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Communication
          </TabsTrigger>
          {user?.role === "super_admin" && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings size={16} />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="store">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Store Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Store</CardTitle>
                <CardDescription>Choose a store to configure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stores.map((storeItem: any) => (
                  <div
                    key={storeItem.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStore === storeItem.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedStore(storeItem.id)}
                  >
                    <div className="flex items-center gap-3">
                      {storeItem.logoUrl ? (
                        <img
                          src={storeItem.logoUrl}
                          alt={storeItem.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Building size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{storeItem.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {storeItem.address || "No address"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Store Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Store Configuration</CardTitle>
                <CardDescription>
                  Update store details, logo, and branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                {store ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Store Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={store.name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          defaultValue={store.phone || ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        defaultValue={store.address || ""}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={store.email || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          name="gstNumber"
                          defaultValue={store.gstNumber || ""}
                        />
                      </div>
                    </div>

                    {/* Tax Configuration Section */}
                    <div className="border-t pt-6 space-y-4">
                      <h3 className="text-lg font-semibold">Tax Configuration</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableTax"
                          name="enableTax"
                          defaultChecked={store?.enableTax !== false}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="enableTax">Enable Tax/GST in Billing</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxName">Tax Name</Label>
                          <Input
                            id="taxName"
                            name="taxName"
                            defaultValue={store?.taxName || "GST"}
                            placeholder="Tax name (e.g., GST, VAT, Tax)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxRate">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            name="taxRate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={store?.taxRate || "18.00"}
                            placeholder="Tax percentage"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <Label>Store Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                          {logoPreview || store.logoUrl ? (
                            <img
                              src={logoPreview || store.logoUrl}
                              alt="Store logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload size={24} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Label
                            htmlFor="logo-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                          >
                            <Upload size={16} />
                            Choose Logo
                          </Label>
                          <p className="text-sm text-muted-foreground mt-2">
                            Upload a square logo (recommended: 200x200px or larger)
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateStoreMutation.isPending}
                      className="w-full"
                    >
                      {updateStoreMutation.isPending ? "Updating..." : "Update Store"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Select a store to configure</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <Badge {...getRoleBadge(user.role)} className="mt-1">
                    {getRoleBadge(user.role).label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Your current role and associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Current Role</h4>
                  <Badge {...getRoleBadge(user.role)}>
                    {getRoleBadge(user.role).label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Permissions</h4>
                  {user.role === "super_admin" && (
                    <div className="space-y-2">
                      <p className="text-sm">✓ Manage all stores and staff</p>
                      <p className="text-sm">✓ Access all reports and analytics</p>
                      <p className="text-sm">✓ Configure system settings</p>
                      <p className="text-sm">✓ Full inventory management</p>
                      <p className="text-sm">✓ Process transactions</p>
                    </div>
                  )}
                  {user.role === "store_manager" && (
                    <div className="space-y-2">
                      <p className="text-sm">✓ Manage assigned store</p>
                      <p className="text-sm">✓ View store reports</p>
                      <p className="text-sm">✓ Manage inventory</p>
                      <p className="text-sm">✓ Process transactions</p>
                      <p className="text-sm text-muted-foreground">✗ Access other stores</p>
                    </div>
                  )}
                  {user.role === "cashier" && (
                    <div className="space-y-2">
                      <p className="text-sm">✓ Process transactions</p>
                      <p className="text-sm">✓ View assigned store inventory</p>
                      <p className="text-sm">✓ Manage customers</p>
                      <p className="text-sm text-muted-foreground">✗ Edit inventory</p>
                      <p className="text-sm text-muted-foreground">✗ Access reports</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Store Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Store</CardTitle>
                <CardDescription>Choose a store for appointment settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stores.map((storeItem: any) => (
                  <div
                    key={storeItem.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStore === storeItem.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedStore(storeItem.id)}
                  >
                    <div className="flex items-center gap-3">
                      {storeItem.logoUrl ? (
                        <img
                          src={storeItem.logoUrl}
                          alt={storeItem.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Building size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{storeItem.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {storeItem.address || "No address"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Appointment Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays size={20} />
                  Appointment Settings
                </CardTitle>
                <CardDescription>
                  Configure opening hours, time slots, and appointment limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentSettingsForm selectedStoreId={selectedStore} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Communication Settings
              </CardTitle>
              <CardDescription>
                Configure SMS, Email, and WhatsApp notifications for your salon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set up automated notifications for appointments, reminders, and promotions
                  across multiple communication channels.
                </p>
                <Link href="/settings/communication">
                  <Button className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Communication Settings
                  </Button>
                </Link>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Send appointment reminders and confirmations via SMS using MSG91 or SMS Gateway Hub
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Email Marketing</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure SMTP, SendGrid, or Gmail for professional email communications
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">WhatsApp Business</h4>
                    <p className="text-sm text-muted-foreground">
                      Integrate with Ultramsg API for automated WhatsApp messaging and templates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "super_admin" && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>
                  Super admin controls for system configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Link href="/settings/login-page">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Login Page Customization
                    </Button>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    Customize the login page appearance, content, and branding
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}