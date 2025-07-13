import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Receipt, Download, Calendar, Filter, Eye, Printer } from "lucide-react";
import { format } from "date-fns";

export default function Bills() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", selectedStoreId],
    enabled: !!selectedStoreId,
    retry: false,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
    retry: false,
  });

  const filteredTransactions = (transactions as any[]).filter((transaction: any) => {
    const matchesSearch = searchTerm === "" || 
      transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer?.mobile || "").includes(searchTerm);
    
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBills(filteredTransactions.map((t: any) => t.id));
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

  const handleBulkPrint = () => {
    const selectedTransactions = filteredTransactions.filter((t: any) => selectedBills.includes(t.id));
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let printContent = `
      <html>
        <head>
          <title>Bulk Bill Print</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .bill { margin-bottom: 50px; page-break-after: always; }
            .bill:last-child { page-break-after: avoid; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .totals div { margin-bottom: 5px; }
            .total-amount { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
    `;

    selectedTransactions.forEach((transaction: any) => {
      printContent += `
        <div class="bill">
          <div class="header">
            <h2>VEEPRESS</h2>
            <p>Invoice: ${transaction.invoiceNumber}</p>
            <p>Date: ${new Date(transaction.createdAt).toLocaleString()}</p>
          </div>
          
          ${transaction.customer ? `
            <div class="details">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${transaction.customer.firstName} ${transaction.customer.lastName || ''}</p>
              <p><strong>Mobile:</strong> ${transaction.customer.mobile}</p>
            </div>
          ` : ''}
          
          <div class="items">
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${transaction.items ? transaction.items.map((item: any) => `
                  <tr>
                    <td>${item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>Rs. ${parseFloat(item.unitPrice).toLocaleString()}</td>
                    <td>Rs. ${parseFloat(item.totalPrice).toLocaleString()}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4">No items found</td></tr>'}
              </tbody>
            </table>
          </div>
          
          <div class="totals">
            <div>Subtotal: Rs. ${parseFloat(transaction.subtotal).toLocaleString()}</div>
            <div>Discount: Rs. ${parseFloat(transaction.discountAmount).toLocaleString()}</div>
            <div>GST: Rs. ${parseFloat(transaction.taxAmount).toLocaleString()}</div>
            <div class="total-amount">Total: Rs. ${parseFloat(transaction.totalAmount).toLocaleString()}</div>
            <div>Payment Method: ${transaction.paymentMethod}</div>
          </div>
        </div>
      `;
    });

    printContent += `
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleBulkExport = () => {
    const selectedTransactions = filteredTransactions.filter((t: any) => selectedBills.includes(t.id));
    
    // Create CSV content
    let csvContent = "Invoice Number,Date,Customer Name,Mobile,Total Amount,Payment Method,Items\n";
    
    selectedTransactions.forEach((transaction: any) => {
      const customerName = transaction.customer ? 
        `${transaction.customer.firstName} ${transaction.customer.lastName || ''}` : 
        'Walk-in Customer';
      const mobile = transaction.customer?.mobile || '';
      const items = transaction.items ? 
        transaction.items.map((item: any) => `${item.itemName}(${item.quantity})`).join('; ') : 
        'No items';
      
      csvContent += `"${transaction.invoiceNumber}","${new Date(transaction.createdAt).toLocaleDateString()}","${customerName}","${mobile}","${transaction.totalAmount}","${transaction.paymentMethod}","${items}"\n`;
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bills_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar onOpenBilling={() => {}} />
        <div className="flex-1 flex flex-col">
          <Header 
            selectedStoreId={selectedStoreId} 
            onStoreChange={setSelectedStoreId}
          />
          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          selectedStoreId={selectedStoreId} 
          onStoreChange={setSelectedStoreId} 
          stores={stores}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Bills Management</h1>
              <div className="flex space-x-2">
                {selectedBills.length > 0 && (
                  <>
                    <Button onClick={handleBulkPrint} className="flex items-center">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Selected ({selectedBills.length})
                    </Button>
                    <Button onClick={handleBulkExport} variant="outline" className="flex items-center">
                      <Download className="mr-2 h-4 w-4" />
                      Export Selected
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by invoice number, customer name, or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bills Table */}
            <Card>
              <CardHeader>
                <CardTitle>Bills List</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No bills found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedBills.length === filteredTransactions.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedBills.includes(transaction.id)}
                              onCheckedChange={(checked) => handleSelectBill(transaction.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {transaction.customer ? 
                              `${transaction.customer.firstName} ${transaction.customer.lastName || ''}` : 
                              'Walk-in Customer'
                            }
                          </TableCell>
                          <TableCell>
                            Rs. {parseFloat(transaction.totalAmount).toLocaleString()}
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
          </div>
        </main>
      </div>

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
                  onClick={() => {
                    setSelectedBills([selectedTransaction.id]);
                    handleBulkPrint();
                  }}
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
    </div>
  );
}