import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { generatePDF } from "@/lib/pdf-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, QrCode, Plus, Trash2, X } from "lucide-react";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
}

interface BillItem {
  id: number;
  type: 'service' | 'product';
  name: string;
  price: number;
  quantity: number;
  duration?: number;
}

interface Customer {
  id: number;
  firstName: string;
  lastName?: string;
  mobile: string;
  loyaltyPoints: number;
  membership?: {
    membershipPlan: {
      name: string;
      discountPercentage: number;
    };
  };
}

export default function BillingModal({ isOpen, onClose, storeId }: BillingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productScan, setProductScan] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const { data: services = [] } = useQuery({
    queryKey: [`/api/services?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  // Type the services array properly
  const typedServices = services as any[];

  const searchCustomer = useMutation({
    mutationFn: async (mobile: string) => {
      const response = await apiRequest("GET", `/api/customers/search?mobile=${mobile}`);
      return response.json();
    },
    onSuccess: (customer) => {
      setSelectedCustomer(customer);
      toast({
        title: "Customer Found",
        description: `${customer.firstName} ${customer.lastName || ''}`,
      });
    },
    onError: (error) => {
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
        title: "Customer Not Found",
        description: "Would you like to create a new customer?",
        variant: "destructive",
      });
    },
  });

  const scanProduct = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest("GET", `/api/products/scan/${barcode}`);
      return response.json();
    },
    onSuccess: (product) => {
      addProductToBill(product);
      setProductScan("");
    },
    onError: (error) => {
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
        title: "Product Not Found",
        description: "Please check the barcode and try again",
        variant: "destructive",
      });
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: (transaction) => {
      toast({
        title: "Payment Successful",
        description: `Invoice ${transaction.invoiceNumber} created`,
      });
      
      // Generate PDF
      const billData = {
        invoiceNumber: transaction.invoiceNumber,
        customer: selectedCustomer || undefined,
        items: billItems,
        subtotal: getSubtotal(),
        discount: getDiscount(),
        gst: getGST(),
        total: getTotal(),
        pointsEarned: getPointsEarned(),
        pointsRedeemed: pointsToRedeem,
      };
      generatePDF(billData);
      
      // Reset form
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${storeId}`] });
      onClose();
    },
    onError: (error) => {
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
        title: "Payment Failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerSearch("");
    setSelectedCustomer(null);
    setProductScan("");
    setBillItems([]);
    setPointsToRedeem(0);
  };

  const addServiceToBill = (service: any) => {
    setBillItems(prev => [...prev, {
      id: service.id,
      type: 'service',
      name: service.name,
      price: parseFloat(service.price),
      quantity: 1,
      duration: service.duration,
    }]);
  };

  const addProductToBill = (product: any) => {
    const existingItem = billItems.find(item => item.id === product.id && item.type === 'product');
    if (existingItem) {
      setBillItems(prev => prev.map(item => 
        item.id === product.id && item.type === 'product'
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setBillItems(prev => [...prev, {
        id: product.id,
        type: 'product',
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
      }]);
    }
  };

  const removeItem = (id: number, type: string) => {
    setBillItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const getSubtotal = () => {
    return billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    const membershipDiscount = selectedCustomer?.membership?.membershipPlan?.discountPercentage || 0;
    const pointsDiscount = pointsToRedeem;
    return (subtotal * membershipDiscount / 100) + pointsDiscount;
  };

  const getGST = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    return (subtotal - discount) * 0.18; // 18% GST
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getGST();
  };

  const getPointsEarned = () => {
    return Math.floor(getTotal() * 0.01); // 1 point per 100 rupees
  };

  const handlePayment = () => {
    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the bill",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      transaction: {
        storeId,
        customerId: selectedCustomer?.id || null,
        subtotal: getSubtotal().toFixed(2),
        discountAmount: getDiscount().toFixed(2),
        taxAmount: getGST().toFixed(2),
        totalAmount: getTotal().toFixed(2),
        pointsEarned: getPointsEarned(),
        pointsRedeemed: pointsToRedeem,
        membershipDiscount: selectedCustomer?.membership?.membershipPlan?.discountPercentage || 0,
        paymentMethod: "cash",
      },
      items: billItems.map(item => ({
        itemType: item.type,
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toFixed(2),
        totalPrice: (item.price * item.quantity).toFixed(2),
      })),
    };

    createTransaction.mutate(transactionData);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            New Bill
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Customer & Services */}
          <div className="space-y-4">
            {/* Customer Search */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Customer</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by mobile number"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customerSearch) {
                      searchCustomer.mutate(customerSearch);
                    }
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() => customerSearch && searchCustomer.mutate(customerSearch)}
                  disabled={searchCustomer.isPending}
                >
                  <Search size={16} />
                </Button>
              </div>
            </div>

            {/* Customer Info */}
            {selectedCustomer && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.firstName} {selectedCustomer.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-600">{selectedCustomer.mobile}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        {selectedCustomer.membership && (
                          <Badge variant="secondary">
                            {selectedCustomer.membership.membershipPlan.name} Member
                          </Badge>
                        )}
                        <span className="text-sm text-gray-600">
                          Points: {selectedCustomer.loyaltyPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Services</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {typedServices.map((service: any) => (
                  <div 
                    key={service.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addServiceToBill(service)}
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.duration} minutes</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">₹{parseFloat(service.price).toLocaleString()}</span>
                      <Plus size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Added Services */}
            {billItems.filter(item => item.type === 'service').length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Added Services</h4>
                <div className="space-y-2">
                  {billItems.filter(item => item.type === 'service').map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.duration && <p className="text-sm text-gray-600">{item.duration} minutes</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id, item.type)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Products & Summary */}
          <div className="space-y-4">
            {/* Product Scanner */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Scan Product</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Scan QR code or enter barcode"
                  value={productScan}
                  onChange={(e) => setProductScan(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && productScan) {
                      scanProduct.mutate(productScan);
                    }
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() => productScan && scanProduct.mutate(productScan)}
                  disabled={scanProduct.isPending}
                >
                  <QrCode size={16} />
                </Button>
              </div>
            </div>

            {/* Added Products */}
            {billItems.filter(item => item.type === 'product').length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Products</h3>
                <div className="space-y-2">
                  {billItems.filter(item => item.type === 'product').map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id, item.type)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{getSubtotal().toLocaleString()}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{getDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{getGST().toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₹{getTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Loyalty Points */}
                {selectedCustomer && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Available Points: {selectedCustomer.loyaltyPoints}</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={pointsToRedeem}
                          onChange={(e) => {
                            const points = parseInt(e.target.value) || 0;
                            const maxPoints = Math.min(selectedCustomer.loyaltyPoints, Math.floor(getSubtotal()));
                            setPointsToRedeem(Math.min(points, maxPoints));
                          }}
                          className="w-20 h-8 text-xs"
                          max={Math.min(selectedCustomer.loyaltyPoints, Math.floor(getSubtotal()))}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const maxPoints = Math.min(selectedCustomer.loyaltyPoints, Math.floor(getSubtotal()));
                            setPointsToRedeem(maxPoints);
                          }}
                        >
                          Use Max
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">This bill will earn {getPointsEarned()} points</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Actions */}
            <div className="flex space-x-3">
              <Button 
                className="flex-1" 
                onClick={handlePayment}
                disabled={createTransaction.isPending || billItems.length === 0}
              >
                {createTransaction.isPending ? "Processing..." : "Complete Payment"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
