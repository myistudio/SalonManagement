import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Crown, Star, Gift, Users, BarChart3, TrendingUp, Calendar } from "lucide-react";
import MembershipForm from "@/components/memberships/membership-form";
import BillingModal from "@/components/billing/billing-modal";

export default function Memberships() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [reportStartDate, setReportStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

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

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: [`/api/membership-plans?storeId=${selectedStoreId}`],
    enabled: !!selectedStoreId,
    retry: false,
  });

  // Membership reports query
  const { data: membershipReports, isLoading: reportsLoading } = useQuery({
    queryKey: [`/api/reports/memberships?storeId=${selectedStoreId}&startDate=${reportStartDate}&endDate=${reportEndDate}`],
    enabled: !!selectedStoreId && activeTab === 'reports',
    retry: false,
  });

  const deleteMembership = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/memberships/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/memberships?storeId=${selectedStoreId}`] });
    },
    onError: (error: any) => {
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
        title: "Error",
        description: error.message || "Failed to delete membership plan",
        variant: "destructive",
      });
    },
  });

  const filteredMemberships = memberships.filter((membership: any) =>
    membership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMembershipIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vip') || lowerName.includes('platinum')) return Crown;
    if (lowerName.includes('gold')) return Star;
    return Gift;
  };

  const getMembershipColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vip') || lowerName.includes('platinum')) return 'bg-purple-100 text-purple-600';
    if (lowerName.includes('gold')) return 'bg-amber-100 text-amber-600';
    if (lowerName.includes('silver')) return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-600';
  };

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
            <h2 className="text-3xl font-bold text-gray-900">Memberships</h2>
            <p className="mt-1 text-gray-600">Manage membership plans and view analytics</p>
          </div>
          <Button
            onClick={() => {
              setEditingMembership(null);
              setShowMembershipForm(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Plus size={20} />
            <span>Add Membership Plan</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans" className="flex items-center space-x-2">
              <Crown size={16} />
              <span>Membership Plans</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 size={16} />
              <span>Monthly Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <div>
              <Dialog open={showMembershipForm} onOpenChange={setShowMembershipForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Add Membership Plan</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingMembership ? "Edit Membership Plan" : "Add New Membership Plan"}</DialogTitle>
                  </DialogHeader>
                  <MembershipForm 
                    storeId={selectedStoreId}
                    membership={editingMembership}
                    onSuccess={() => {
                      setShowMembershipForm(false);
                      setEditingMembership(null);
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
                  placeholder="Search membership plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Membership Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membershipsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-16 w-16 rounded-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-8 w-1/2 mb-4" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredMemberships.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Crown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No membership plans found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Create your first membership plan to start building customer loyalty"}
                  </p>
                  <Button onClick={() => setShowMembershipForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Membership Plan
                  </Button>
                </div>
              ) : (
                filteredMemberships.map((membership: any) => {
                  const IconComponent = getMembershipIcon(membership.name);
                  const colorClass = getMembershipColor(membership.name);
                  
                  return (
                    <Card key={membership.id} className="hover:shadow-lg transition-shadow relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass.split(' ')[0]} opacity-10 rounded-full transform translate-x-8 -translate-y-8`}></div>
                      
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                            <IconComponent size={20} />
                          </div>
                          <Badge variant="outline">
                            ₹{parseFloat(membership.price).toLocaleString()}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{membership.name}</CardTitle>
                        {membership.description && (
                          <p className="text-sm text-gray-600">{membership.description}</p>
                        )}
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium text-green-600">
                              {membership.discountPercentage}% off
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Points Multiplier:</span>
                            <span className="font-medium">
                              {membership.pointsMultiplier}x
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Validity:</span>
                            <span className="font-medium">
                              {membership.validityDays} days
                            </span>
                          </div>
                        </div>

                        {(() => {
                          try {
                            const parsedBenefits = membership.benefits ? JSON.parse(membership.benefits) : [];
                            if (parsedBenefits.length > 0) {
                              return (
                                <div className="mb-6">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {parsedBenefits.slice(0, 3).map((benefit: string, index: number) => (
                                      <li key={index} className="flex items-center">
                                        <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                                        {benefit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                            return null;
                          } catch (e) {
                            return null;
                          }
                        })()}

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setEditingMembership(membership);
                              setShowMembershipForm(true);
                            }}
                          >
                            Edit Plan
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => deleteMembership.mutate(membership.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            {/* Reports Content */}
            {reportsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-4" />
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : membershipReports ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Memberships</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {membershipReports.summary?.totalActiveMemberships || 0}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Plans</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {membershipReports.summary?.totalPlans || 0}
                          </p>
                        </div>
                        <Crown className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            Rs. {parseFloat(membershipReports.summary?.totalMembershipRevenue || '0').toLocaleString()}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Membership Sales Report */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Sales</CardTitle>
                    <CardDescription>Memberships sold during the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membershipReports.membershipSales?.length > 0 ? (
                      <div className="space-y-4">
                        {membershipReports.membershipSales.map((sale: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{sale.planName}</h4>
                              <p className="text-sm text-gray-600">Quantity Sold: {sale.quantitySold}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">Rs. {parseFloat(sale.revenue).toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Avg: Rs. {parseFloat(sale.averagePrice).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No membership sales in the selected period</p>
                    )}
                  </CardContent>
                </Card>

                {/* Active Memberships by Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Memberships by Plan</CardTitle>
                    <CardDescription>Current active memberships breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membershipReports.activeMemberships?.length > 0 ? (
                      <div className="space-y-4">
                        {membershipReports.activeMemberships.map((membership: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{membership.planName}</h4>
                              <p className="text-sm text-gray-600">Active Members: {membership.activeCount}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">Rs. {parseFloat(membership.totalValue).toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Total Value</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No active memberships found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Assignment Trends</CardTitle>
                    <CardDescription>Membership assignments over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membershipReports.monthlyTrends?.length > 0 ? (
                      <div className="space-y-4">
                        {membershipReports.monthlyTrends.map((trend: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {new Date(trend.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h4>
                              <p className="text-sm text-gray-600">Assignments: {trend.assignmentsCount}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">Rs. {parseFloat(trend.revenue).toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Revenue</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No monthly trend data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports available</h3>
                <p className="text-gray-600">Reports will appear here once membership data is available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showMembershipForm} onOpenChange={setShowMembershipForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMembership ? "Edit Membership Plan" : "Add New Membership Plan"}</DialogTitle>
          </DialogHeader>
          <MembershipForm 
            storeId={selectedStoreId}
            membership={editingMembership}
            onSuccess={() => {
              setShowMembershipForm(false);
              setEditingMembership(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      <BillingModal 
        isOpen={showBillingModal} 
        onClose={() => setShowBillingModal(false)} 
        storeId={selectedStoreId}
      />
    </>
  );
}
