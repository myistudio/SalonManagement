import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Download, TrendingUp, Users, Package, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import BillingModal from "@/components/billing/billing-modal";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

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

  const { data: salesReport = {}, isLoading: reportLoading } = useQuery({
    queryKey: [`/api/reports/sales?storeId=${selectedStoreId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`],
    enabled: !!selectedStoreId && !!dateRange.startDate && !!dateRange.endDate,
    retry: false,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: [`/api/transactions?storeId=${selectedStoreId}&limit=100`],
    enabled: !!selectedStoreId,
    retry: false,
  });

  const { data: dashboardStats = {} } = useQuery({
    queryKey: [`/api/dashboard/stats/${selectedStoreId}`],
    enabled: !!selectedStoreId,
    retry: false,
  });

  // Process transaction data for charts
  const processTransactionData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyRevenue = last7Days.map(date => {
      const dayTransactions = Array.isArray(transactions) ? transactions.filter((t: any) => 
        new Date(t.createdAt).toISOString().split('T')[0] === date
      ) : [];
      const revenue = dayTransactions.reduce((sum: number, t: any) => 
        sum + parseFloat(t.totalAmount || '0'), 0
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: revenue,
        transactions: dayTransactions.length,
      };
    });

    return dailyRevenue;
  };

  const chartData = processTransactionData();

  const COLORS = ['hsl(262, 83%, 58%)', 'hsl(187, 100%, 42%)', 'hsl(37, 95%, 47%)', 'hsl(142, 71%, 45%)', 'hsl(346, 87%, 54%)'];

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
                <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="mt-1 text-gray-600">Track your business performance and insights</p>
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download size={16} />
                <span>Export Report</span>
              </Button>
            </div>

            {/* Date Range Selector */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="mr-2" size={20} />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">Apply Filter</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportLoading ? (
                          <Skeleton className="h-8 w-20" />
                        ) : (
                          `Rs. ${parseFloat((salesReport as any)?.totalRevenue || '0').toLocaleString()}`
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          (salesReport as any)?.totalTransactions || 0
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportLoading ? (
                          <Skeleton className="h-8 w-20" />
                        ) : (
                          `Rs. ${(parseFloat((salesReport as any)?.totalRevenue || '0') / Math.max((salesReport as any)?.totalTransactions || 1, 1)).toLocaleString()}`
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Crown className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {(dashboardStats as any)?.activeMembers || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="hsl(262, 83%, 58%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Services Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {reportLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-40 w-40 rounded-full" />
                      </div>
                    ) : (salesReport as any)?.topServices?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(salesReport as any).topServices}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: Rs. ${parseFloat(value).toLocaleString()}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                          >
                            {(salesReport as any).topServices.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`₹${parseFloat(value).toLocaleString()}`, 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No service data available for the selected period
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Services and Products Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Services by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (salesReport as any)?.topServices?.length > 0 ? (
                    <div className="space-y-3">
                      {(salesReport as any).topServices.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.count} times</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">Rs. {parseFloat(service.revenue).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No service data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (salesReport as any)?.topProducts?.length > 0 ? (
                    <div className="space-y-3">
                      {(salesReport as any).topProducts.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.count} sold</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">Rs. {parseFloat(product.revenue).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No product data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
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
