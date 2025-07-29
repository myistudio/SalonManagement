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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, User, Phone, Calendar, Award, Receipt, Eye, Download, Users, Gift, Edit } from "lucide-react";
import CustomerForm from "@/components/customers/customer-form";
import CustomerEditForm from "@/components/customers/customer-edit-form";
import BillingModal from "@/components/billing/billing-modal";

interface CustomersProps {
  selectedStoreId?: number;
}

export default function Customers({ selectedStoreId = 1 }: CustomersProps) {
  console.log("Customers page - selectedStoreId:", selectedStoreId);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showMembershipAssignment, setShowMembershipAssignment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showEditForm, setShowEditForm] = useState(false);

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

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/customers?storeId=${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  // Fetch customers with spending data
  const { data: customersWithSpending = [], isLoading: spendingLoading } = useQuery({
    queryKey: [`/api/customers/spending/${selectedStoreId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/customers/export/${selectedStoreId}`);
      return response.json();
    },
    enabled: !!selectedStoreId && viewMode === 'table',
    retry: false,
  });

  // Fetch membership plans for assignment
  const { data: membershipPlans = [] } = useQuery({
    queryKey: [`/api/membership-plans`, selectedStoreId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/membership-plans?storeId=${selectedStoreId}`);
      return response.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  // Customer transaction history
  const { data: customerTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/customers", selectedCustomer?.id, "transactions"],
    enabled: !!selectedCustomer?.id,
    retry: false,
  });

  const dataToUse = viewMode === 'table' ? (customersWithSpending.length > 0 ? customersWithSpending : customers) : customers;
  const filteredCustomers = (dataToUse as any[]).filter((customer: any) =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      const response = await fetch(`/api/customers/export/${selectedStoreId}?format=excel`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Successful",
        description: "Customer data has been exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export customer data",
        variant: "destructive",
      });
    }
  };

  // Assign membership mutation
  const assignMembership = useMutation({
    mutationFn: async ({ customerId, membershipPlanId }: { customerId: number; membershipPlanId: number }) => {
      const response = await apiRequest('POST', `/api/customers/${customerId}/membership`, { membershipPlanId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Membership Assigned",
        description: "Membership plan has been assigned successfully",
      });
      setShowMembershipAssignment(false);
      queryClient.invalidateQueries({ queryKey: [`/api/customers/spending/${selectedStoreId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
                <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
                <p className="mt-1 text-gray-600">Manage your customer database and build relationships</p>
        </div>
        <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export Excel</span>
                </Button>
                <Select value={viewMode} onValueChange={(value: 'table' | 'grid') => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table View</SelectItem>
                    <SelectItem value="grid">Grid View</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus size={16} />
                      <span>Add Customer</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <CustomerForm 
                      selectedStoreId={selectedStoreId}
                      onSuccess={() => setShowCustomerForm(false)} 
                    />
                  </DialogContent>
                </Dialog>
        </div>
      </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search customers by name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Customer Content */}
            {viewMode === 'table' ? (
              <>
                {/* Table View */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Visits</TableHead>
                          <TableHead>Current Year</TableHead>
                          <TableHead>Lifetime</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Membership</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(customersLoading || spendingLoading) ? (
                          Array.from({ length: itemsPerPage }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                            </TableRow>
                          ))
                        ) : paginatedCustomers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                              <p className="text-gray-600 mb-4">
                                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first customer"}
                              </p>
                              <Button onClick={() => setShowCustomerForm(true)}>
                                <Plus size={16} className="mr-2" />
                                Add Customer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedCustomers.map((customer: any) => (
                            <TableRow key={customer.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{customer.firstName} {customer.lastName || ''}</div>
                                    <div className="text-sm text-gray-500">{customer.email || '-'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{customer.mobile}</TableCell>
                              <TableCell>{customer.totalVisits}</TableCell>
                              <TableCell>Rs. {parseFloat(customer.currentYearSpending || '0').toLocaleString()}</TableCell>
                              <TableCell>Rs. {parseFloat(customer.lifetimeSpending || customer.totalSpent || '0').toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{customer.loyaltyPoints}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={customer.membershipPlan ? "default" : "outline"}>
                                  {customer.membershipPlan || 'None'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setShowCustomerProfile(true);
                                    }}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setShowEditForm(true);
                                    }}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setShowMembershipAssignment(true);
                                    }}
                                  >
                                    <Gift size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setShowBillingModal(true);
                                    }}
                                  >
                                    <Receipt size={14} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-16 w-16 rounded-full mb-4" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-4" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first customer"}
                    </p>
                    <Button onClick={() => setShowCustomerForm(true)}>
                      <Plus size={16} className="mr-2" />
                      Add Customer
                    </Button>
                  </div>
                ) : (
                  filteredCustomers.map((customer: any) => (
                    <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {customer.firstName} {customer.lastName || ''}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Phone size={14} className="mr-1" />
                              {customer.mobile}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Visits:</span>
                            <span className="font-medium">{customer.totalVisits}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Spent:</span>
                            <span className="font-medium">Rs. {parseFloat(customer.totalSpent || '0').toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Points:</span>
                            <Badge variant="secondary">{customer.loyaltyPoints}</Badge>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerProfile(true);
                            }}
                            className="flex-1"
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowEditForm(true);
                            }}
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowBillingModal(true);
                            }}
                            className="flex-1"
                          >
                            <Receipt size={14} className="mr-1" />
                            Bill
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
        </div>

      {showBillingModal && (
        <BillingModal 
          isOpen={showBillingModal} 
          onClose={() => setShowBillingModal(false)} 
          storeId={selectedStoreId}
        />
      )}

      {/* Customer Profile Modal */}
      <Dialog open={showCustomerProfile} onOpenChange={setShowCustomerProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Basic Info */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.firstName} {selectedCustomer.lastName || ''}
                  </h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Phone size={16} className="mr-2" />
                    {selectedCustomer.mobile}
                  </div>
                  {selectedCustomer.email && (
                    <div className="text-gray-600 mt-1">
                      {selectedCustomer.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCustomer.dateOfBirth && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium">
                          {new Date(selectedCustomer.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.gender && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium capitalize">{selectedCustomer.gender}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Customer Since:</span>
                      <span className="font-medium">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Visit Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Visits:</span>
                      <span className="font-medium">{selectedCustomer.totalVisits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium">Rs. {parseFloat(selectedCustomer.totalSpent || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Loyalty Points:</span>
                      <span className="font-medium text-primary">{selectedCustomer.loyaltyPoints}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Membership Info */}
              {selectedCustomer.membership && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Membership Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedCustomer.membership.membershipPlan.name}</h4>
                        <p className="text-sm text-gray-600">{selectedCustomer.membership.membershipPlan.description}</p>
                      </div>
                      <Badge variant="secondary" className="flex items-center">
                        <Award size={12} className="mr-1" />
                        Active Member
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : customerTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No transactions found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerTransactions.slice(0, 10).map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              Rs. {transaction.totalAmount ? parseFloat(transaction.totalAmount).toLocaleString() : "0"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {transaction.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowBillDetails(true);
                                }}
                              >
                                <Eye size={16} className="mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowCustomerProfile(false);
                    setShowBillingModal(true);
                  }}
                >
                  Create New Bill
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCustomerProfile(false);
                    setShowEditForm(true);
                  }}
                >
                  <Edit size={16} className="mr-2" />
                  Edit Info
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCustomerProfile(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Details Modal */}
      <Dialog open={showBillDetails} onOpenChange={setShowBillDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b">
                <h2 className="text-xl font-bold">VEEPRESS</h2>
                <p className="text-sm text-gray-600">Invoice: {selectedTransaction.invoiceNumber}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
              </div>
              
              {selectedTransaction.customer && (
                <div className="pb-4 border-b">
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <p>{selectedTransaction.customer.firstName} {selectedTransaction.customer.lastName}</p>
                  <p>Mobile: {selectedTransaction.customer.mobile}</p>
                </div>
              )}
              
              <div className="pb-4 border-b">
                <h3 className="font-semibold mb-2">Items</h3>
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransaction.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rs. {parseFloat(item.unitPrice).toLocaleString()}</TableCell>
                          <TableCell>Rs. {parseFloat(item.totalPrice).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {parseFloat(selectedTransaction.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>Rs. {parseFloat(selectedTransaction.discountAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>Rs. {parseFloat(selectedTransaction.taxAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>Rs. {parseFloat(selectedTransaction.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{selectedTransaction.paymentMethod}</span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowBillDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Membership Assignment Modal */}
      <Dialog open={showMembershipAssignment} onOpenChange={setShowMembershipAssignment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Membership</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Assign a membership plan to <span className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
              </div>
              
              {membershipPlans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Loading membership plans...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {membershipPlans.map((plan: any) => (
                    <Card key={plan.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      assignMembership.mutate({ customerId: selectedCustomer.id, membershipPlanId: plan.id });
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{plan.name}</h4>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Valid for {plan.validityDays} days • Rs. {parseFloat(plan.price).toLocaleString()}
                            </p>
                          </div>
                          <Button size="sm" disabled={assignMembership.isPending}>
                            {assignMembership.isPending ? "Assigning..." : "Assign"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowMembershipAssignment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Edit Form Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerEditForm
              customer={selectedCustomer}
              selectedStoreId={selectedStoreId}
              onSuccess={() => setShowEditForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
