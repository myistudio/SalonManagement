import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Star,
  Award
} from "lucide-react";

export default function StaffPerformance() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch staff performance data
  const { data: staffPerformance = [], isLoading: performanceLoading } = useQuery({
    queryKey: [`/api/staff/performance`, selectedStoreId, selectedPeriod, startDate, endDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/staff/performance?storeId=${selectedStoreId}&startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  // Fetch staff list
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: [`/api/staff`, selectedStoreId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/staff?storeId=${selectedStoreId}`);
      return response.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily': return "Today's Performance";
      case 'weekly': return "This Week's Performance";
      case 'monthly': return "This Month's Performance";
      default: return "Performance";
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Staff Performance</h2>
        <p className="mt-1 text-gray-600">Track and analyze your staff performance metrics.</p>
      </div>

      {/* Period Selection */}
      <div className="mb-6">
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'daily' | 'weekly' | 'monthly')}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(staffPerformance.reduce((sum: number, staff: any) => sum + (staff.totalRevenue || 0), 0))}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Services Completed</p>
                <p className="text-2xl font-bold">
                  {staffPerformance.reduce((sum: number, staff: any) => sum + (staff.servicesCompleted || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Star size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold">{staff.filter((s: any) => s.isActive !== false).length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. per Staff</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(staffPerformance.length > 0 ? 
                    staffPerformance.reduce((sum: number, staff: any) => sum + (staff.totalRevenue || 0), 0) / staffPerformance.length : 0
                  )}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Award size={20} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{getPeriodLabel()}</span>
            <Badge variant="outline">
              {selectedPeriod === 'daily' ? 'Today' : 
               selectedPeriod === 'weekly' ? 'Last 7 days' : 
               'Last 30 days'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceLoading || staffLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : staffPerformance.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data</h3>
              <p className="text-gray-600">
                No staff performance data available for the selected period.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Avg. per Service</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffPerformance
                  .sort((a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                  .map((staffMember: any, index: number) => {
                    const avgPerService = staffMember.servicesCompleted > 0 ? 
                      (staffMember.totalRevenue || 0) / staffMember.servicesCompleted : 0;
                    
                    return (
                      <TableRow key={staffMember.staffId}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {staffMember.staffName ? staffMember.staffName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'ST'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{staffMember.staffName || 'Unknown Staff'}</p>
                              <p className="text-sm text-gray-600">{staffMember.staffEmail || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {staffMember.role || 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(staffMember.totalRevenue || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {staffMember.servicesCompleted || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(avgPerService)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {index === 0 && staffPerformance.length > 1 && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Award size={12} className="mr-1" />
                                Top Performer
                              </Badge>
                            )}
                            {(staffMember.totalRevenue || 0) > 0 ? (
                              <div className="flex items-center text-green-600">
                                <TrendingUp size={14} className="mr-1" />
                                <span className="text-xs">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <TrendingDown size={14} className="mr-1" />
                                <span className="text-xs">Inactive</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}