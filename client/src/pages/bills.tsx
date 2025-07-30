import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/contexts/store-context";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Search, Plus, Eye, Trash2, Download, Filter, Clock, User, CreditCard, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import BillingModal from "@/components/billing-modal";

interface Transaction {
  id: number;
  storeId: number;
  customerId?: number;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  pointsEarned: number;
  pointsRedeemed: number;
  membershipDiscount: number;
  staffId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
  items?: {
    id: number;
    itemType: 'product' | 'service';
    itemName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export default function Bills() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedStoreId } = useStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showBillingModal, setShowBillingModal] = useState(false);

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

  // Fetch bills/transactions with real-time data
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["/api/transactions", selectedStoreId, startDate, endDate],
    queryFn: async ({ queryKey }) => {
      const [, storeId] = queryKey;
      if (!storeId) return [];
      
      console.log("=== BILLS: Fetching transactions for store:", storeId);
      let url = `/api/transactions?storeId=${storeId}&limit=100`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log("=== BILLS: Received", data.length, "transactions for store", storeId);
      return data as Transaction[];
    },
    enabled: !!selectedStoreId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest('DELETE', `/api/transactions/${transactionId}`);
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    }
  });

  // Filter transactions based on search
  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = searchTerm === "" || 
      transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.mobile || "").includes(searchTerm);
    
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(filteredTransactions.map((t: Transaction) => t.id));
    } else {
      setSelectedBills([]);
    }
  };

  const handleSelectBill = (billId: number, checked: boolean) => {
    if (checked) {
      setSelectedBills([...selectedBills, billId]);
    } else {
      setSelectedBills(selectedBills.filter(id => id !== billId));
    }
  };

  const handleViewDetails = async (transaction: Transaction) => {
    try {
      // Fetch transaction items
      const response = await apiRequest('GET', `/api/transactions/${transaction.id}/items`);
      const items = await response.json();
      
      setSelectedTransaction({
        ...transaction,
        items
      });
      setShowBillDetails(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      default: return '💰';
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : 
                   status === 'pending' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-64">Redirecting to login...</div>;
  }

  if (!selectedStoreId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please select a store to view bills</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bills Management</h1>
          <p className="text-muted-foreground">
            View and manage all transaction records for your store
          </p>
        </div>
        <Button onClick={() => setShowBillingModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Bill
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, customer name, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearchTerm("");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0))}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Bill</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(filteredTransactions.length > 0 
                    ? filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0) / filteredTransactions.length 
                    : 0
                  )}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Bills</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.filter(t => 
                    new Date(t.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Records</CardTitle>
            <div className="flex gap-2">
              {selectedBills.length > 0 && (
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedBills.length})
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading transactions...</p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bills Found</h3>
              <p className="text-muted-foreground mb-4">
                {transactions.length === 0 
                  ? "No transactions have been created yet."
                  : "No bills match your current filters."
                }
              </p>
              <Button onClick={() => setShowBillingModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Bill
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  checked={selectedBills.length === filteredTransactions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {/* Transaction List */}
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedBills.includes(transaction.id)}
                          onCheckedChange={(checked) => handleSelectBill(transaction.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{transaction.invoiceNumber}</h3>
                            {getStatusBadge(transaction.paymentStatus)}
                            <span className="text-sm text-muted-foreground">
                              {getPaymentMethodIcon(transaction.paymentMethod)} {transaction.paymentMethod}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Customer: {transaction.customer 
                                ? `${transaction.customer.firstName} ${transaction.customer.lastName}` 
                                : 'Walk-in Customer'
                              }
                            </span>
                            <span>
                              {format(new Date(transaction.createdAt), 'PPp')}
                            </span>
                            {transaction.customer?.mobile && (
                              <span>📞 {transaction.customer.mobile}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(transaction.totalAmount)}</div>
                          {transaction.discountAmount > 0 && (
                            <div className="text-sm text-green-600">
                              -{formatCurrency(transaction.discountAmount)} discount
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <Dialog open={showBillDetails} onOpenChange={setShowBillDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedTransaction?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedTransaction.customer 
                      ? `${selectedTransaction.customer.firstName} ${selectedTransaction.customer.lastName}`
                      : 'Walk-in Customer'
                    }</p>
                    {selectedTransaction.customer?.mobile && (
                      <p><strong>Mobile:</strong> {selectedTransaction.customer.mobile}</p>
                    )}
                    {selectedTransaction.customer?.email && (
                      <p><strong>Email:</strong> {selectedTransaction.customer.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Transaction Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Date:</strong> {format(new Date(selectedTransaction.createdAt), 'PPp')}</p>
                    <p><strong>Payment Method:</strong> {selectedTransaction.paymentMethod}</p>
                    <p><strong>Status:</strong> {selectedTransaction.paymentStatus}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.itemType} • Qty: {item.quantity} • {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items found</p>
                )}
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedTransaction.discountAmount)}</span>
                  </div>
                )}
                {selectedTransaction.membershipDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Membership Discount:</span>
                    <span>-{formatCurrency(selectedTransaction.membershipDiscount)}</span>
                  </div>
                )}
                {selectedTransaction.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedTransaction.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
                {selectedTransaction.pointsEarned > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Points Earned:</span>
                    <span>{selectedTransaction.pointsEarned}</span>
                  </div>
                )}
                {selectedTransaction.pointsRedeemed > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Points Redeemed:</span>
                    <span>{selectedTransaction.pointsRedeemed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing Modal */}
      {showBillingModal && (
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          onSuccess={() => {
            setShowBillingModal(false);
            refetchTransactions();
          }}
        />
      )}
    </div>
  );
}