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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Download, TrendingUp, TrendingDown, Users, Package, Crown, DollarSign, Percent, BarChart3, Clock, Calendar, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
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
    queryKey: [`/api/reports/sales`, selectedStoreId, dateRange.startDate, dateRange.endDate],
    queryFn: () => fetch(`/api/reports/sales?storeId=${selectedStoreId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`).then(res => res.json()),
    enabled: !!selectedStoreId && !!dateRange.startDate && !!dateRange.endDate,
    retry: false,
  });

  const { data: analytics = {}, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/reports/analytics`, selectedStoreId, dateRange.startDate, dateRange.endDate],
    queryFn: () => fetch(`/api/reports/analytics?storeId=${selectedStoreId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`).then(res => res.json()),
    enabled: !!selectedStoreId && !!dateRange.startDate && !!dateRange.endDate,
    retry: false,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: [`/api/transactions`, selectedStoreId],
    queryFn: () => fetch(`/api/transactions?storeId=${selectedStoreId}&limit=100`).then(res => res.json()),
    enabled: !!selectedStoreId,
    retry: false,
  });

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatPercentageChange = (value: number) => {
    const formatted = Math.abs(value).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  const exportToCSV = () => {
    try {
      const csvData = [];
      
      // Header row
      csvData.push(['Report Type', 'Period', `${dateRange.startDate} to ${dateRange.endDate}`]);
      csvData.push(['Generated Date', new Date().toLocaleDateString()]);
      csvData.push([]);
      
      // Summary data
      csvData.push(['Summary']);
      csvData.push(['Total Revenue', `Rs. ${salesReport.totalRevenue || '0'}`]);
      csvData.push(['Total Transactions', salesReport.totalTransactions || 0]);
      csvData.push(['Total Discounts', `Rs. ${salesReport.totalDiscount || '0'}`]);
      csvData.push(['Average Transaction', `Rs. ${salesReport.totalTransactions > 0 ? (parseFloat(salesReport.totalRevenue || '0') / salesReport.totalTransactions).toFixed(2) : '0'}`]);
      csvData.push([]);
      
      // Top Services
      csvData.push(['Top Services']);
      csvData.push(['Service Name', 'Count', 'Revenue']);
      (salesReport.topServices || []).forEach((service: any) => {
        csvData.push([service.name, service.count, `Rs. ${service.revenue}`]);
      });
      csvData.push([]);
      
      // Top Products
      csvData.push(['Top Products']);
      csvData.push(['Product Name', 'Count', 'Revenue']);
      (salesReport.topProducts || []).forEach((product: any) => {
        csvData.push([product.name, product.count, `Rs. ${product.revenue}`]);
      });
      csvData.push([]);
      
      // Analytics data if available
      if (analytics.productWiseReport) {
        csvData.push(['Product-wise Performance']);
        csvData.push(['Product Name', 'Quantity', 'Revenue', 'Discount']);
        analytics.productWiseReport.forEach((item: any) => {
          csvData.push([item.name, item.quantity, `Rs. ${item.revenue}`, `Rs. ${item.discount}`]);
        });
        csvData.push([]);
      }
      
      if (analytics.serviceWiseReport) {
        csvData.push(['Service-wise Performance']);
        csvData.push(['Service Name', 'Quantity', 'Revenue', 'Discount']);
        analytics.serviceWiseReport.forEach((item: any) => {
          csvData.push([item.name, item.quantity, `Rs. ${item.revenue}`, `Rs. ${item.discount}`]);
        });
      }
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `salon_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "CSV report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV report",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Salon Management Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Summary Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Revenue: Rs. ${salesReport.totalRevenue || '0'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Transactions: ${salesReport.totalTransactions || 0}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Discounts: Rs. ${salesReport.totalDiscount || '0'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Average Transaction: Rs. ${salesReport.totalTransactions > 0 ? (parseFloat(salesReport.totalRevenue || '0') / salesReport.totalTransactions).toFixed(2) : '0'}`, 20, yPosition);
      yPosition += 15;
      
      // Top Services
      if (salesReport.topServices && salesReport.topServices.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Services', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        salesReport.topServices.forEach((service: any, index: number) => {
          doc.text(`${index + 1}. ${service.name} - Count: ${service.count}, Revenue: Rs. ${service.revenue}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Top Products
      if (salesReport.topProducts && salesReport.topProducts.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Products', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        salesReport.topProducts.forEach((product: any, index: number) => {
          doc.text(`${index + 1}. ${product.name} - Count: ${product.count}, Revenue: Rs. ${product.revenue}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Analytics data
      if (analytics.weeklyComparison) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Week-on-Week Comparison', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Current Week Revenue: Rs. ${analytics.weeklyComparison.current?.revenue || '0'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Previous Week Revenue: Rs. ${analytics.weeklyComparison.previous?.revenue || '0'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Revenue Change: ${formatPercentageChange(analytics.weeklyComparison.change?.revenue || 0)}`, 25, yPosition);
        yPosition += 10;
      }
      
      if (analytics.monthlyComparison) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Month-on-Month Comparison', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Current Month Revenue: Rs. ${analytics.monthlyComparison.current?.revenue || '0'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Previous Month Revenue: Rs. ${analytics.monthlyComparison.previous?.revenue || '0'}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Revenue Change: ${formatPercentageChange(analytics.monthlyComparison.change?.revenue || 0)}`, 25, yPosition);
        yPosition += 10;
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
        doc.text('Generated by Salon Management System', 20, doc.internal.pageSize.height - 10);
      }
      
      // Save PDF
      doc.save(`salon_report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "PDF report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF report",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header selectedStoreId={selectedStoreId} onStoreChange={setSelectedStoreId} />
      <div className="flex">
        <Sidebar onOpenBilling={() => setShowBillingModal(true)} />
        <main className="flex-1 p-6 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Advanced Reports & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive business analytics with comparisons and insights</p>
            </div>

            {/* Date Range Selector */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Date Range Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="flex items-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateRange({
                          startDate: lastWeek.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0]
                        });
                      }}
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setDateRange({
                          startDate: lastMonth.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0]
                        });
                      }}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reportLoading ? <Skeleton className="h-8 w-20" /> : `Rs. ${salesReport.totalRevenue || '0'}`}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reportLoading ? <Skeleton className="h-8 w-16" /> : (salesReport.totalTransactions || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reportLoading ? <Skeleton className="h-8 w-20" /> : `Rs. ${salesReport.totalDiscount || '0'}`}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reportLoading ? <Skeleton className="h-8 w-20" /> : 
                          `Rs. ${salesReport.totalTransactions > 0 ? 
                            (parseFloat(salesReport.totalRevenue || '0') / salesReport.totalTransactions).toFixed(2) : 
                            '0'}`
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Services by Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={salesReport.topServices || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`Rs. ${value}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Products Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={salesReport.topProducts || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: Rs. ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                            >
                              {(salesReport.topProducts || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`Rs. ${value}`, 'Revenue']} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {analyticsLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-64 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Daily Analytics Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Daily Sales Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={analytics.dailyAnalytics || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [
                              name === 'revenue' ? `Rs. ${value}` : name === 'discount' ? `Rs. ${value}` : value,
                              name === 'revenue' ? 'Revenue' : name === 'discount' ? 'Discount' : 'Transactions'
                            ]} />
                            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="discount" stackId="1" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Week-on-Week & Month-on-Month Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Week-on-Week Comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Week Revenue</span>
                            <span className="font-bold">Rs. {analytics.weeklyComparison?.current?.revenue || '0'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Previous Week Revenue</span>
                            <span className="font-bold">Rs. {analytics.weeklyComparison?.previous?.revenue || '0'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Change</span>
                            <div className="flex items-center gap-1">
                              {getChangeIcon(analytics.weeklyComparison?.change?.revenue || 0)}
                              <span className={`font-bold ${getChangeColor(analytics.weeklyComparison?.change?.revenue || 0)}`}>
                                {formatPercentageChange(analytics.weeklyComparison?.change?.revenue || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Week Transactions</span>
                            <span className="font-bold">{analytics.weeklyComparison?.current?.transactions || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transaction Change</span>
                            <div className="flex items-center gap-1">
                              {getChangeIcon(analytics.weeklyComparison?.change?.transactions || 0)}
                              <span className={`font-bold ${getChangeColor(analytics.weeklyComparison?.change?.transactions || 0)}`}>
                                {formatPercentageChange(analytics.weeklyComparison?.change?.transactions || 0)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Month-on-Month Comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Month Revenue</span>
                            <span className="font-bold">Rs. {analytics.monthlyComparison?.current?.revenue || '0'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Previous Month Revenue</span>
                            <span className="font-bold">Rs. {analytics.monthlyComparison?.previous?.revenue || '0'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Change</span>
                            <div className="flex items-center gap-1">
                              {getChangeIcon(analytics.monthlyComparison?.change?.revenue || 0)}
                              <span className={`font-bold ${getChangeColor(analytics.monthlyComparison?.change?.revenue || 0)}`}>
                                {formatPercentageChange(analytics.monthlyComparison?.change?.revenue || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Month Transactions</span>
                            <span className="font-bold">{analytics.monthlyComparison?.current?.transactions || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transaction Change</span>
                            <div className="flex items-center gap-1">
                              {getChangeIcon(analytics.monthlyComparison?.change?.transactions || 0)}
                              <span className={`font-bold ${getChangeColor(analytics.monthlyComparison?.change?.transactions || 0)}`}>
                                {formatPercentageChange(analytics.monthlyComparison?.change?.transactions || 0)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product-Wise Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <div className="space-y-4">
                        {(analytics.productWiseReport || []).map((product: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs. {product.revenue}</p>
                              <p className="text-sm text-red-500">Discount: Rs. {product.discount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Service-Wise Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <div className="space-y-4">
                        {(analytics.serviceWiseReport || []).map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{service.name}</h3>
                              <p className="text-sm text-muted-foreground">Quantity: {service.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs. {service.revenue}</p>
                              <p className="text-sm text-red-500">Discount: Rs. {service.discount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comparisons Tab */}
              <TabsContent value="comparisons" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue vs Discount Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analytics.dailyAnalytics || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [
                              `Rs. ${value}`,
                              name === 'revenue' ? 'Revenue' : 'Discount'
                            ]} />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                            <Line type="monotone" dataKey="discount" stroke="#ff7300" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analytics.dailyAnalytics || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="transactions" fill="#00C49F" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={exportToCSV}>
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={exportToPDF}>
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Email reports feature will be available soon" })}>
                    Email Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {showBillingModal && (
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          storeId={selectedStoreId}
        />
      )}
    </div>
  );
}