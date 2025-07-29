import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Waves, Edit, Clock } from "lucide-react";
import ServiceForm from "@/components/services/service-form";
import BillingModal from "@/components/billing/billing-modal";

interface ServicesProps {
  selectedStoreId?: number;
}

export default function Services({ selectedStoreId = 1 }: ServicesProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

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

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/services?storeId=${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  const typedServices = services as any[] || [];
  const filteredServices = typedServices.filter((service: any) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce((acc: any, service: any) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
                <h2 className="text-3xl font-bold text-gray-900">Services</h2>
                <p className="mt-1 text-gray-600">Manage your salon services and pricing</p>
              </div>
              <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Add Service</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
                  </DialogHeader>
                  <ServiceForm 
                    storeId={selectedStoreId}
                    service={editingService}
                    onSuccess={() => {
                      setShowServiceForm(false);
                      setEditingService(null);
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search services by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Services by Category */}
            <div className="space-y-8">
              {servicesLoading ? (
                <Card>
                  <CardContent className="p-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 py-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/3 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : Object.keys(groupedServices).length === 0 ? (
                <div className="text-center py-12">
                  <Waves className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first service"}
                  </p>
                  <Button onClick={() => setShowServiceForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Service
                  </Button>
                </div>
              ) : (
                Object.entries(groupedServices).map(([category, categoryServices]: [string, any]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Waves className="mr-2" size={20} />
                        {category} ({categoryServices.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryServices.map((service: any) => (
                          <Card key={service.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                                  {service.description && (
                                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                                  )}
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <Clock size={14} className="mr-1" />
                                    {service.duration ? `${service.duration} minutes` : 'Duration not set'}
                                  </div>
                                  <div className="text-2xl font-bold text-primary">
                                    ₹{parseFloat(service.price).toLocaleString()}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingService(service);
                                    setShowServiceForm(true);
                                  }}
                                >
                                  <Edit size={16} />
                                </Button>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  View Details
                                </Button>
                                <Button size="sm" className="flex-1">
                                  Add to Bill
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
        </div>

      <BillingModal 
        isOpen={showBillingModal} 
        onClose={() => setShowBillingModal(false)} 
        storeId={selectedStoreId}
      />
    </>
  );
}
