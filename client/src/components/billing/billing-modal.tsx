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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, QrCode, Plus, Trash2, X, Printer, Edit2, Receipt } from "lucide-react";
import { printBarcode } from "@/lib/barcode-utils";
import { printToThermalPrinter, openCashDrawer } from "@/lib/thermal-printer";

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
  originalPrice?: number;
  quantity: number;
  duration?: number;
  imageUrl?: string;
  isCustomPrice?: boolean;
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
  const [editingPrice, setEditingPrice] = useState<{id: number, type: string} | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    dateOfBirth: "",
    gender: "",
  });

  const { data: services = [] } = useQuery({
    queryKey: [`/api/services?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  const { data: products = [] } = useQuery({
    queryKey: [`/api/products?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  const { data: store } = useQuery({
    queryKey: [`/api/stores/${storeId}`],
    enabled: isOpen && !!storeId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: [`/api/customers?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  // Type the arrays properly
  const typedServices = services as any[];
  const typedProducts = products as any[];
  const typedCustomers = customers as any[];

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

  const createCustomer = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: (customer) => {
      setSelectedCustomer(customer);
      setShowNewCustomerForm(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        mobile: "",
        dateOfBirth: "",
        gender: "",
      });
      toast({
        title: "Customer Created",
        description: `${customer.firstName} ${customer.lastName || ''} added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/customers`] });
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
        title: "Error",
        description: "Failed to create customer",
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
      
      // Store transaction data for receipt printing
      setLastTransaction({
        transaction,
        billData,
        customer: selectedCustomer,
        items: billItems,
        store: store as any,
      });
      
      // Reset form first
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${storeId}`] });
      
      // Show receipt dialog
      setShowReceiptDialog(true);
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
    setEditingPrice(null);
    setCustomPrice("");
    setShowReceiptDialog(false);
    setLastTransaction(null);
    setShowNewCustomerForm(false);
    setNewCustomer({
      firstName: "",
      lastName: "",
      mobile: "",
      dateOfBirth: "",
      gender: "",
    });
  };

  const printReceiptFromTransaction = (printThermal = false) => {
    if (!lastTransaction) return;

    const receiptData = {
      invoiceNumber: lastTransaction.transaction.invoiceNumber,
      storeName: lastTransaction.store?.name || "Salon",
      storeAddress: lastTransaction.store?.address || "",
      storePhone: lastTransaction.store?.phone || "",
      customer: lastTransaction.customer ? {
        firstName: lastTransaction.customer.firstName,
        lastName: lastTransaction.customer.lastName,
        mobile: lastTransaction.customer.mobile,
      } : undefined,
      items: lastTransaction.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price * item.quantity,
      })),
      subtotal: lastTransaction.billData.subtotal,
      discount: lastTransaction.billData.discount,
      gst: lastTransaction.billData.gst,
      total: lastTransaction.billData.total,
      pointsEarned: lastTransaction.billData.pointsEarned,
      pointsRedeemed: lastTransaction.billData.pointsRedeemed,
      paymentMethod: "Cash",
      cashier: "Cashier",
      timestamp: new Date(),
    };

    try {
      if (printThermal) {
        printToThermalPrinter(receiptData);
        openCashDrawer();
        toast({
          title: "Receipt Sent",
          description: "Thermal receipt sent to printer",
        });
      } else {
        // Just open cash drawer for regular receipt
        try {
          openCashDrawer();
        } catch (error) {
          console.log("Cash drawer not available");
        }
      }
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Failed to print thermal receipt",
        variant: "destructive",
      });
    }

    setShowReceiptDialog(false);
    onClose();
  };

  const addServiceToBill = (service: any, customPrice?: number) => {
    setBillItems(prev => [...prev, {
      id: service.id,
      type: 'service',
      name: service.name,
      price: customPrice || parseFloat(service.price),
      originalPrice: parseFloat(service.price),
      quantity: 1,
      duration: service.duration,
      imageUrl: service.imageUrl,
      isCustomPrice: !!customPrice,
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
        imageUrl: product.imageUrl,
      }]);
    }
  };

  const removeItem = (id: number, type: string) => {
    setBillItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const updateItemPrice = (id: number, type: string, newPrice: number) => {
    setBillItems(prev => prev.map(item => 
      item.id === id && item.type === type
        ? { ...item, price: newPrice, isCustomPrice: true }
        : item
    ));
    setEditingPrice(null);
    setCustomPrice("");
  };



  const handlePriceEdit = (item: BillItem) => {
    setEditingPrice({ id: item.id, type: item.type });
    setCustomPrice(item.price.toString());
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
        membershipDiscount: ((selectedCustomer?.membership?.membershipPlan?.discountPercentage || 0) / 100 * getSubtotal()).toFixed(2),
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
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] sm:w-full overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg sm:text-xl">
            New Bill
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Customer & Services */}
          <div className="space-y-4">
            {/* Customer Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Customer</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search customers by name or mobile..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                
                {/* Customer Dropdown */}
                {customerSearch && (
                  <div className="max-h-32 overflow-y-auto border rounded-md bg-white shadow-sm">
                    {typedCustomers
                      .filter((customer: any) => 
                        customer.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.mobile.includes(customerSearch)
                      )
                      .slice(0, 5)
                      .map((customer: any) => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch(`${customer.firstName} ${customer.lastName || ''} - ${customer.mobile}`);
                          }}
                        >
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-sm text-gray-600">{customer.mobile}</div>
                          {customer.loyaltyPoints > 0 && (
                            <div className="text-xs text-blue-600">{customer.loyaltyPoints} loyalty points</div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setShowNewCustomerForm(false);
                    }}
                    className="flex-1"
                  >
                    Walk-in Customer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                    className="flex-1"
                  >
                    + New Customer
                  </Button>
                </div>
              </div>
            </div>

            {/* New Customer Form */}
            {showNewCustomerForm && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        value={newCustomer.mobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 10) {
                            setNewCustomer({...newCustomer, mobile: value});
                          }
                        }}
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                      />
                      {newCustomer.mobile && (
                        newCustomer.mobile.length !== 10 || 
                        newCustomer.mobile.startsWith('0') || 
                        newCustomer.mobile.startsWith('+')
                      ) && (
                        <p className="text-red-500 text-xs mt-1">
                          Mobile number must be 10 digits and cannot start with 0 or +
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={newCustomer.gender}
                        onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newCustomer.dateOfBirth}
                        onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      onClick={() => {
                        if (!newCustomer.firstName || !newCustomer.mobile) {
                          toast({
                            title: "Missing Information",
                            description: "Please fill in required fields",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Validate mobile number
                        if (newCustomer.mobile.length !== 10 || 
                            newCustomer.mobile.startsWith('0') || 
                            newCustomer.mobile.startsWith('+')) {
                          toast({
                            title: "Invalid Mobile Number",
                            description: "Mobile number must be 10 digits and cannot start with 0 or +",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        createCustomer.mutate({
                          ...newCustomer,
                          storeId: storeId,
                        });
                      }}
                      disabled={createCustomer.isPending}
                      className="flex-1"
                    >
                      {createCustomer.isPending ? "Creating..." : "Create Customer"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewCustomerForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {service.imageUrl && (
                        <img 
                          src={service.imageUrl} 
                          alt={service.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.duration} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Rs. {parseFloat(service.price).toLocaleString()}</span>
                      <Button 
                        size="sm" 
                        onClick={() => addServiceToBill(service)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Products</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {typedProducts.map((product: any) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Stock: {product.stockQuantity}</p>
                        {product.barcode && (
                          <p className="text-xs text-gray-500">{product.barcode}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Rs. {parseFloat(product.price).toLocaleString()}</span>
                      <Button 
                        size="sm" 
                        onClick={() => addProductToBill(product)}
                        disabled={product.stockQuantity <= 0}
                      >
                        <Plus size={14} />
                      </Button>
                      {product.barcode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => printBarcode(product.barcode, product.name)}
                        >
                          <Printer size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

            {/* Bill Items */}
            {billItems.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Bill Items</h3>
                <div className="space-y-2">
                  {billItems.map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            {editingPrice?.id === item.id && editingPrice?.type === item.type ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm">₹</span>
                                <Input
                                  type="number"
                                  value={customPrice}
                                  onChange={(e) => setCustomPrice(e.target.value)}
                                  className="w-16 h-6 text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && customPrice) {
                                      updateItemPrice(item.id, item.type, parseFloat(customPrice));
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (customPrice) {
                                      updateItemPrice(item.id, item.type, parseFloat(customPrice));
                                    }
                                  }}
                                >
                                  ✓
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm">× ₹{item.price}</span>
                                {item.type === 'service' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePriceEdit(item)}
                                    className="p-1 h-auto"
                                  >
                                    <Edit2 size={12} />
                                  </Button>
                                )}
                              </div>
                            )}
                            {item.isCustomPrice && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          {item.duration && (
                            <p className="text-xs text-gray-500">{item.duration} minutes</p>
                          )}
                        </div>
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

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Payment Successful!</DialogTitle>
            <DialogDescription className="text-sm">
              Invoice {lastTransaction?.transaction?.invoiceNumber} has been created.
              Would you like to print a receipt?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => printReceiptFromTransaction(true)} 
                className="flex items-center justify-center space-x-2 btn-touch py-3"
              >
                <Receipt className="h-4 w-4" />
                <span>Print Thermal Receipt</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => printReceiptFromTransaction(false)}
                className="flex items-center justify-center space-x-2 btn-touch py-3"
              >
                <Printer className="h-4 w-4" />
                <span>No Receipt (Open Drawer Only)</span>
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowReceiptDialog(false);
                  onClose();
                }}
                className="btn-touch py-3"
              >
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
