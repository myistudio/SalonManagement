import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/contexts/store-context";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Search, Calendar, User, CreditCard, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface Transaction {
  id: number;
  storeId: number;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  invoiceNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
  createdAt: string;
}

interface TransactionItem {
  id: number;
  transactionId: number;
  itemType: 'product' | 'service';
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

function BillDetailsDialog({ transaction }: { transaction: Transaction }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/transactions", transaction.id, "items"],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/transactions/${transaction.id}/items`);
      return response.json();
    },
  });

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Bill Details - {transaction.invoiceNumber}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Bill Header */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Customer</p>
            <p className="text-gray-600">{transaction.customerName || "Walk-in Customer"}</p>
            {transaction.customerPhone && (
              <p className="text-gray-600">{transaction.customerPhone}</p>
            )}
          </div>
          <div>
            <p className="font-medium">Date & Time</p>
            <p className="text-gray-600">{format(new Date(transaction.createdAt), "PPP p")}</p>
          </div>
          <div>
            <p className="font-medium">Payment Method</p>
            <Badge variant="outline">{transaction.paymentMethod}</Badge>
          </div>
          <div>
            <p className="font-medium">Staff</p>
            <p className="text-gray-600">{transaction.staffName || "N/A"}</p>
          </div>
        </div>

        <Separator />

        {/* Bill Items */}
        <div>
          <h4 className="font-medium mb-3">Items</h4>
          {isLoading ? (
            <div className="text-center py-4">Loading items...</div>
          ) : (
            <div className="space-y-2">
              {items?.map((item: TransactionItem) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-600">
                      {item.itemType === 'product' ? 'Product' : 'Service'} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rs. {item.totalPrice}</p>
                    <p className="text-sm text-gray-600">@ Rs. {item.unitPrice} each</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Bill Summary */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {transaction.totalAmount}</span>
          </div>
          {transaction.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>- Rs. {transaction.discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>Rs. {transaction.finalAmount}</span>
          </div>
        </div>

        {transaction.notes && (
          <>
            <Separator />
            <div>
              <p className="font-medium">Notes</p>
              <p className="text-gray-600">{transaction.notes}</p>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  );
}

export default function Bills() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedStoreId } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading: transactionsLoading, refetch } = useQuery({
    queryKey: ["/api/transactions", selectedStoreId],
    queryFn: async ({ queryKey }) => {
      const [, storeId] = queryKey;
      if (!storeId) return [];
      
      console.log("=== BILLS: Fetching transactions for store:", storeId);
      const response = await apiRequest('GET', `/api/transactions?storeId=${storeId}&limit=25`);
      const data = await response.json();
      console.log("=== BILLS: Received", data.length, "transactions");
      return data;
    },
    enabled: !!selectedStoreId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  // Filter transactions based on search
  const filteredTransactions = transactions?.filter((transaction: Transaction) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
      transaction.customerName?.toLowerCase().includes(searchLower) ||
      transaction.customerPhone?.includes(searchTerm) ||
      transaction.staffName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Latest Bills</h2>
        <p className="mt-1 text-gray-600">View recent transactions and bill details</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by invoice number, customer name, phone, or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <Receipt className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Bills ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading bills...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No bills found matching your search." : "No bills found for this store."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {transaction.invoiceNumber}
                      </Badge>
                      <Badge variant="secondary">
                        {transaction.paymentMethod}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {transaction.customerName || "Walk-in Customer"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Staff: {transaction.staffName || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">Rs. {transaction.finalAmount}</p>
                      {transaction.discountAmount > 0 && (
                        <p className="text-sm text-green-600">
                          Save Rs. {transaction.discountAmount}
                        </p>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <BillDetailsDialog transaction={transaction} />
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}