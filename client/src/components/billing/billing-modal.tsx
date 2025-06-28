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
    const existingItem = billItems.find(item => item.id === service.id && item.type === 'service');
    if (existingItem) {
      setBillItems(prev => prev.map(item => 
        item.id === service.id && item.type === 'service'
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
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
    }
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

  const updateItemQuantity = (id: number, type: string, change: number) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[98vh] w-[98vw] overflow-y-auto p-2 sm:p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-xl sm:text-2xl font-bold">
            New Bill
            <Button variant="ghost" size="lg" onClick={onClose} className="h-12 w-12 rounded-full">
              <X size={24} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6">
          {/* Left Column - Customer & Quick Actions */}
          <div className="lg:col-span-3 space-y-4">
            {/* Customer Selection */}
            <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
              <Label className="text-lg font-semibold text-gray-800 mb-3 block">Customer</Label>
              <div className="space-y-3">
                <Input
                  placeholder="Search by name or mobile..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="h-12 text-lg border-2 focus:border-blue-500"
                />
                
                {/* Customer Dropdown */}
                {customerSearch && (
                  <div className="max-h-64 overflow-y-auto border-2 border-blue-300 rounded-xl bg-white shadow-lg">
                    {typedCustomers
                      .filter((customer: any) => 
                        customer.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.mobile.includes(customerSearch)
                      )
                      .slice(0, 8)
                      .map((customer: any) => (
                        <div
                          key={customer.id}
                          className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 touch-manipulation transition-colors"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch(`${customer.firstName} ${customer.lastName || ''} - ${customer.mobile}`);
                          }}
                        >
                          <div className="font-semibold text-lg">{customer.firstName} {customer.lastName}</div>
                          <div className="text-base text-gray-600">{customer.mobile}</div>
                          {customer.loyaltyPoints > 0 && (
                            <div className="text-sm text-blue-600 font-medium">{customer.loyaltyPoints} loyalty points</div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setShowNewCustomerForm(false);
                    }}
                    className="h-14 text-lg font-semibold border-2 border-green-300 hover:bg-green-50 touch-manipulation"
                  >
                    Walk-in Customer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                    className="h-14 text-lg font-semibold border-2 border-blue-300 hover:bg-blue-50 touch-manipulation"
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

          </div>

          {/* Middle Column - Services & Products */}
          <div className="lg:col-span-6 space-y-4">
            {/* Services Section */}
            <div className="bg-white border-2 border-green-200 rounded-xl p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Services</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {typedServices.map((service: any) => (
                  <div 
                    key={service.id}
                    className="aspect-square border-2 border-gray-200 rounded-xl p-3 hover:border-green-400 hover:bg-green-50 transition-all touch-manipulation cursor-pointer flex flex-col"
                    onClick={() => addServiceToBill(service)}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      {service.imageUrl ? (
                        <img 
                          src={service.imageUrl} 
                          alt={service.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-green-100 rounded-lg mb-2 flex items-center justify-center">
                          <span className="text-green-600 text-2xl font-bold">{service.name.charAt(0)}</span>
                        </div>
                      )}
                      <p className="font-semibold text-sm text-center leading-tight mb-1">{service.name}</p>
                      <p className="text-xs text-gray-600 mb-2">{service.duration} min</p>
                      <span className="text-lg font-bold text-green-600">Rs. {parseFloat(service.price).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex justify-center">
                      <Button 
                        size="sm" 
                        className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 touch-manipulation"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Products</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {typedProducts.map((product: any) => (
                  <div 
                    key={product.id}
                    className="aspect-square border-2 border-gray-200 rounded-xl p-3 hover:border-orange-400 hover:bg-orange-50 transition-all touch-manipulation cursor-pointer flex flex-col"
                    onClick={() => addProductToBill(product)}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-orange-100 rounded-lg mb-2 flex items-center justify-center">
                          <span className="text-orange-600 text-2xl font-bold">{product.name.charAt(0)}</span>
                        </div>
                      )}
                      <p className="font-semibold text-sm text-center leading-tight mb-1">{product.name}</p>
                      <p className="text-xs text-gray-600 mb-1">Stock: {product.stockQuantity}</p>
                      <span className="text-lg font-bold text-orange-600">Rs. {parseFloat(product.price).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex justify-center gap-1">
                      <Button 
                        size="sm" 
                        disabled={product.stockQuantity <= 0}
                        className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 touch-manipulation"
                      >
                        <Plus size={16} />
                      </Button>
                      {product.barcode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            printBarcode(product.barcode, product.name);
                          }}
                          className="h-8 w-8 rounded-full border-2 touch-manipulation"
                        >
                          <Printer size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Scanner */}
            <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
              <Label className="text-lg font-semibold text-gray-800 mb-3 block">Scan Product</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Scan or enter barcode..."
                  value={productScan}
                  onChange={(e) => setProductScan(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && productScan.trim()) {
                      scanProduct.mutate(productScan.trim());
                    }
                  }}
                  className="flex-1 h-12 text-lg border-2 focus:border-purple-500"
                />
                <Button
                  onClick={() => {
                    if (productScan.trim()) {
                      scanProduct.mutate(productScan.trim());
                    }
                  }}
                  disabled={!productScan.trim() || scanProduct.isPending}
                  className="h-12 px-6 bg-purple-500 hover:bg-purple-600 touch-manipulation"
                >
                  <QrCode size={20} />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Bill Summary & Checkout */}
          <div className="lg:col-span-3 space-y-4">
            {/* Bill Items */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Current Bill</h3>
              
              {billItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No items added yet</p>
                  <p className="text-base">Add services or products to start billing</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {billItems.map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="border-2 border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-base">{item.name}</p>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateItemQuantity(item.id, item.type, -1)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 rounded-full touch-manipulation"
                                >
                                  -
                                </Button>
                                <span className="text-lg font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateItemQuantity(item.id, item.type, 1)}
                                  className="h-8 w-8 rounded-full touch-manipulation"
                                >
                                  +
                                </Button>
                              </div>
                              {editingPrice?.id === item.id && editingPrice?.type === item.type ? (
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm">Rs.</span>
                                  <Input
                                    type="number"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="w-20 h-8 text-sm"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateItemPrice(item.id, item.type, parseFloat(customPrice));
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateItemPrice(item.id, item.type, parseFloat(customPrice))}
                                    className="h-8 px-2"
                                  >
                                    ✓
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="text-lg font-bold text-blue-600">
                                    Rs. {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                  {item.isCustomPrice && <span className="text-xs text-orange-500 block">(Custom)</span>}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Unit Price: Rs. {item.price.toLocaleString()} 
                              {item.duration && ` • ${item.duration} min`}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePriceEdit(item)}
                            className="h-10 w-10 rounded-full touch-manipulation"
                            title="Edit Price"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(item.id, item.type)}
                            className="h-10 w-10 rounded-full touch-manipulation"
                            title="Remove Item"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bill Summary & Checkout */}
            {billItems.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Bill Summary</h3>
                
                {/* Totals */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-bold">Rs. {getSubtotal().toLocaleString()}</span>
                  </div>
                  
                  {getDiscount() > 0 && (
                    <div className="flex justify-between items-center text-lg text-green-600">
                      <span className="font-medium">Discount:</span>
                      <span className="font-bold">- Rs. {getDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">GST (18%):</span>
                    <span className="font-bold">Rs. {getGST().toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-2xl font-bold text-blue-600">
                    <span>Total:</span>
                    <span>Rs. {getTotal().toLocaleString()}</span>
                  </div>
                  
                  {getPointsEarned() > 0 && (
                    <div className="text-center text-lg text-orange-600 font-medium">
                      Points to earn: {getPointsEarned()}
                    </div>
                  )}
                </div>

                {/* Loyalty Points */}
                {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                  <div className="mb-6 p-4 bg-white rounded-xl border-2 border-orange-200">
                    <Label className="text-lg font-semibold text-gray-800 mb-3 block">
                      Redeem Loyalty Points
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, selectedCustomer.loyaltyPoints, getSubtotal()))}
                        max={Math.min(selectedCustomer.loyaltyPoints, getSubtotal())}
                        placeholder="Points to redeem"
                        className="flex-1 h-12 text-lg border-2"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setPointsToRedeem(Math.min(selectedCustomer.loyaltyPoints, getSubtotal()))}
                        className="h-12 px-6 text-lg touch-manipulation"
                      >
                        Use All
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Available: {selectedCustomer.loyaltyPoints} points (Max: Rs. {Math.min(selectedCustomer.loyaltyPoints, getSubtotal())})
                    </p>
                  </div>
                )}

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={createTransaction.isPending}
                  className="w-full h-16 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg touch-manipulation"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-sm sm:text-base lg:text-lg">
                      {createTransaction.isPending ? "Processing..." : "Complete Payment"}
                    </span>
                    {!createTransaction.isPending && (
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                        Rs. {getTotal().toLocaleString()}
                      </span>
                    )}
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Receipt Print Dialog */}
    <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt Printed</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {lastTransaction && (
            <div className="text-center">
              <p className="text-lg">Payment completed successfully!</p>
              <p className="text-2xl font-bold text-green-600">Rs. {parseFloat(lastTransaction.totalAmount).toLocaleString()}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={() => lastTransaction && printReceiptFromTransaction(lastTransaction)}
              variant="outline"
              className="flex-1"
            >
              Print Again
            </Button>
            <Button
              onClick={() => lastTransaction && printReceiptFromTransaction(lastTransaction)}
              className="flex-1"
            >
              Print Receipt
            </Button>
          </div>
          <Button
            onClick={() => {
              setShowReceiptDialog(false);
              onClose();
            }}
            className="w-full"
            variant="outline"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
