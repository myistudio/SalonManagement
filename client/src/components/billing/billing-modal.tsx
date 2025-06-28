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
import { Search, QrCode, Trash2, X, Edit2, UserPlus, Scissors, Package, User } from "lucide-react";
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
  totalVisits: number;
  membership?: {
    membershipPlan: {
      name: string;
      discountPercentage: number;
    };
  };
}

// Receipt Dialog Component
interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  setShowReceiptDialog: (show: boolean) => void;
}

const ReceiptDialog = ({ isOpen, onClose, transaction, setShowReceiptDialog }: ReceiptDialogProps) => {
  const printReceiptFromTransaction = async (transaction: any) => {
    if (!transaction) return;
    
    try {
      const receiptData = {
        invoiceNumber: transaction.invoiceNumber || `INV-${transaction.id}`,
        storeName: "VEEPRESS",
        storeAddress: "",
        storePhone: "",
        customer: transaction.customer ? {
          firstName: transaction.customer.firstName,
          lastName: transaction.customer.lastName || "",
          mobile: transaction.customer.mobile || ""
        } : undefined,
        items: (transaction.items || []).map((item: any) => ({
          name: item.name || item.product?.name || item.service?.name || "",
          quantity: item.quantity || 1,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price || "0")
        })),
        subtotal: parseFloat(transaction.subtotal || "0"),
        discount: parseFloat(transaction.discountAmount || "0"),
        gst: parseFloat(transaction.taxAmount || "0"),
        total: parseFloat(transaction.totalAmount || "0"),
        pointsEarned: parseInt(transaction.pointsEarned || "0"),
        pointsRedeemed: parseInt(transaction.pointsRedeemed || "0"),
        paymentMethod: transaction.paymentMethod || "cash",
        cashier: "Staff",
        timestamp: new Date()
      };

      await printToThermalPrinter(receiptData);
      await openCashDrawer();
    } catch (error) {
      console.error("Receipt printing failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setShowReceiptDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Successful!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-center text-lg text-green-600 font-semibold">
            Transaction completed successfully
          </p>
          
          {transaction && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Transaction ID: {transaction.id}</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              onClick={() => printReceiptFromTransaction(transaction)}
              variant="outline"
              className="flex-1"
            >
              Print Receipt
            </Button>
            <Button
              onClick={() => {
                setShowReceiptDialog(false);
                onClose();
              }}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function BillingModal({ isOpen, onClose, storeId }: BillingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [productScan, setProductScan] = useState("");
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [editingPrice, setEditingPrice] = useState<{ id: number; type: string } | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    gender: "",
    dateOfBirth: "",
  });
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState(0);

  // Queries
  const { data: services = [] } = useQuery({
    queryKey: [`/api/services?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  const { data: products = [] } = useQuery({
    queryKey: [`/api/products?storeId=${storeId}`],
    enabled: isOpen && !!storeId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isOpen,
  });

  const { data: store } = useQuery({
    queryKey: [`/api/stores/${storeId}`],
    enabled: isOpen && !!storeId,
  });

  // Type the data
  const typedServices = services as any[];
  const typedProducts = products as any[];
  const typedCustomers = customers as any[];

  // Filtered customers for search
  const filteredCustomers = typedCustomers.filter((customer: any) =>
    customer.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.mobile.includes(customerSearch)
  ).slice(0, 6);

  // Mutations
  const createTransaction = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: (transaction) => {
      toast({
        title: "Payment Successful",
        description: "Transaction completed successfully",
      });
      
      setCompletedTransaction(transaction);
      setShowReceiptDialog(true);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to process payment",
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
      setShowWalkInForm(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        mobile: "",
        gender: "",
        dateOfBirth: "",
      });
      toast({
        title: "Customer Created",
        description: `${customer.firstName} ${customer.lastName || ''} added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scanProduct = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest("GET", `/api/products/scan/${barcode}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      return data;
    },
    onSuccess: (product) => {
      console.log("Scanned product:", product);
      if (product && product.id) {
        addProductToBill(product);
        setProductScan("");
        toast({
          title: "Product Scanned",
          description: `${product.name} added to bill`,
        });
      } else {
        console.log("Product data structure:", product);
        toast({
          title: "Invalid Product",
          description: "Product data is incomplete",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Scan error:", error);
      setProductScan("");
      toast({
        title: "Product Not Found",
        description: error.message || "No product found with this barcode",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const addServiceToBill = (service: any) => {
    const existingItemIndex = billItems.findIndex(
      item => item.id === service.id && item.type === 'service'
    );

    if (existingItemIndex >= 0) {
      // Increase quantity if item already exists
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += 1;
      setBillItems(updatedItems);
    } else {
      // Add new item
      const newItem: BillItem = {
        id: service.id,
        type: 'service',
        name: service.name,
        price: service.price,
        originalPrice: service.price,
        quantity: 1,
        duration: service.duration,
        imageUrl: service.imageUrl,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const addProductToBill = (product: any) => {
    const existingItemIndex = billItems.findIndex(
      item => item.id === product.id && item.type === 'product'
    );

    if (existingItemIndex >= 0) {
      // Increase quantity if item already exists
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += 1;
      setBillItems(updatedItems);
    } else {
      // Add new item
      const newItem: BillItem = {
        id: product.id,
        type: 'product',
        name: product.name,
        price: product.price,
        originalPrice: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const removeItem = (id: number, type: string) => {
    setBillItems(billItems.filter(item => !(item.id === id && item.type === type)));
  };

  const updateItemQuantity = (id: number, type: string, change: number) => {
    setBillItems(billItems.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handlePriceEdit = (item: BillItem) => {
    setEditingPrice({ id: item.id, type: item.type });
    setCustomPrice(item.price.toString());
  };

  const updateItemPrice = (id: number, type: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setBillItems(billItems.map(item => {
      if (item.id === id && item.type === type) {
        return { 
          ...item, 
          price: newPrice,
          isCustomPrice: newPrice !== item.originalPrice 
        };
      }
      return item;
    }));
    
    setEditingPrice(null);
    setCustomPrice("");
  };

  const getSubtotal = () => {
    return billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getDiscount = () => {
    let discount = 0;
    const subtotal = getSubtotal();
    
    // Manual discount
    if (discountType === 'percentage') {
      discount += (subtotal * discountValue) / 100;
    } else if (discountType === 'amount') {
      discount += discountValue;
    }
    
    // Membership discount
    if (selectedCustomer?.membership) {
      const membershipDiscount = getSubtotal() * (selectedCustomer.membership.membershipPlan.discountPercentage / 100);
      discount += membershipDiscount;
    }
    
    // Points redemption discount
    discount += pointsToRedeem;
    
    return discount;
  };

  const getGST = () => {
    return (getSubtotal() - getDiscount()) * 0.18;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getGST();
  };

  const getPointsEarned = () => {
    return Math.floor(getTotal() * 0.01); // 1% of total as points
  };

  const resetForm = () => {
    setBillItems([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setPointsToRedeem(0);
    setProductScan("");
    setShowWalkInForm(false);
    setEditingPrice(null);
    setCustomPrice("");
    setDiscountType('none');
    setDiscountValue(0);
    setNewCustomer({
      firstName: "",
      lastName: "",
      mobile: "",
      gender: "",
      dateOfBirth: "",
    });
  };

  const handlePayment = () => {
    if (billItems.length === 0) {
      toast({
        title: "No Items",
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
        unitPrice: Number(item.price || 0).toFixed(2),
        totalPrice: (Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2),
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
      <DialogContent className="max-w-7xl max-h-[98vh] w-[98vw] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-xl sm:text-2xl font-bold">
            New Bill
            <Button variant="ghost" size="lg" onClick={onClose} className="h-12 w-12 rounded-full">
              <X size={24} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Customer Selection Bar - Top */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Label className="text-base font-semibold text-gray-800 whitespace-nowrap">Customer:</Label>
            
            {/* Customer Search */}
            <div className="flex-1 relative">
              <Input
                placeholder="Search by name or mobile..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="h-10 text-sm border-2 focus:border-blue-500"
              />
              
              {/* Customer Dropdown */}
              {customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute top-12 left-0 right-0 max-h-48 overflow-y-auto border-2 border-blue-300 rounded-lg bg-white shadow-lg z-20">
                  {filteredCustomers.map((customer: any) => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch(`${customer.firstName} ${customer.lastName || ''} - ${customer.mobile}`);
                      }}
                    >
                      <div className="font-medium text-sm">{customer.firstName} {customer.lastName}</div>
                      <div className="text-xs text-gray-600">{customer.mobile} • {customer.loyaltyPoints} pts</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Walk-in Customer Button */}
            <Button
              onClick={() => setShowWalkInForm(true)}
              className="h-10 px-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
            >
              <UserPlus size={14} className="mr-1" />
              Walk-in
            </Button>

            {/* Clear Customer Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerSearch("");
                setShowWalkInForm(false);
              }}
              className="h-10 px-3 text-sm border-2 border-green-300 hover:bg-green-50"
            >
              Clear
            </Button>

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded-lg px-3 py-2">
                <div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </span>
                  <span className="text-xs text-gray-600 ml-2">
                    Points: {selectedCustomer.loyaltyPoints}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          {/* Left Column - Services & Products Side by Side */}
          <div className="lg:col-span-8 space-y-4">
            {/* Services and Products in Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Services Section */}
              <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Services</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                  {typedServices.map((service: any) => (
                    <div 
                      key={service.id}
                      className="w-full aspect-square min-h-[120px] border-2 border-gray-200 rounded-xl p-3 hover:border-green-400 hover:bg-green-50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center touch-manipulation active:scale-95"
                      onClick={() => addServiceToBill(service)}
                    >
                      {service.imageUrl ? (
                        <img 
                          src={service.imageUrl} 
                          alt={service.name}
                          className="w-12 h-12 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-green-200 rounded-lg mb-2 flex items-center justify-center">
                          <Scissors size={16} className="text-green-600" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                        {service.name}
                      </span>
                      <span className="text-sm text-green-600 font-bold">
                        Rs. {service.price.toLocaleString()}
                      </span>
                      {service.duration && (
                        <span className="text-xs text-gray-500 mt-1">
                          {service.duration} min
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-white border-2 border-orange-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Products</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                  {typedProducts.map((product: any) => (
                    <div 
                      key={product.id}
                      className="w-full aspect-square min-h-[120px] border-2 border-gray-200 rounded-xl p-3 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center touch-manipulation active:scale-95"
                      onClick={() => addProductToBill(product)}
                    >
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-orange-200 rounded-lg mb-2 flex items-center justify-center">
                          <Package size={16} className="text-orange-600" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                        {product.name}
                      </span>
                      <span className="text-sm text-orange-600 font-bold">
                        Rs. {product.price.toLocaleString()}
                      </span>
                      {product.stockQuantity !== undefined && (
                        <span className="text-xs text-gray-500 mt-1">
                          Stock: {product.stockQuantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Scanner */}
            <div className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-sm">
              <Label className="text-lg font-semibold text-gray-800 mb-3 block">Scan Product</Label>
              <div className="flex space-x-3">
                <Input
                  placeholder="Scan or enter barcode..."
                  value={productScan}
                  onChange={(e) => setProductScan(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && productScan.trim()) {
                      scanProduct.mutate(productScan.trim());
                    }
                  }}
                  className="flex-1 h-12 text-base border-2 focus:border-purple-500 touch-manipulation"
                />
                <Button
                  onClick={() => {
                    if (productScan.trim()) {
                      scanProduct.mutate(productScan.trim());
                    }
                  }}
                  disabled={!productScan.trim() || scanProduct.isPending}
                  className="h-12 px-6 bg-purple-500 hover:bg-purple-600 touch-manipulation active:scale-95"
                >
                  <QrCode size={20} />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Wider Bill Summary & Checkout */}
          <div className="lg:col-span-4 space-y-4">
            {/* Walk-in Form */}
            {showWalkInForm && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">Walk-in Customer</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWalkInForm(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                        placeholder="Enter first name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                        placeholder="Enter last name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        value={newCustomer.mobile}
                        onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value.replace(/\D/g, '')})}
                        placeholder="10-digit mobile"
                        className="h-8 text-sm"
                        maxLength={10}
                      />
                      {newCustomer.mobile && (
                        newCustomer.mobile.length !== 10 || 
                        newCustomer.mobile.startsWith('0') || 
                        newCustomer.mobile.startsWith('+')
                      ) && (
                        <p className="text-red-500 text-xs mt-1">
                          10 digits, no 0 or + prefix
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={newCustomer.gender}
                        onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newCustomer.dateOfBirth}
                        onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
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
                      className="flex-1 h-8 text-sm"
                    >
                      {createCustomer.isPending ? "Creating..." : "Create"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowWalkInForm(false)}
                      className="flex-1 h-8 text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Bill */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Current Bill</h3>
              
              {billItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {billItems.map((item, index) => (
                    <div key={`${item.type}-${item.id}-${index}`} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <div className="flex items-center justify-between gap-2">
                        {/* Item Name - Compact */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>Rs. {item.price.toLocaleString()}</span>
                            {item.duration && <span>• {item.duration}min</span>}
                          </div>
                        </div>

                        {/* Quantity Controls - Compact */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, item.type, -1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 rounded text-xs p-0 touch-manipulation"
                          >
                            -
                          </Button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, item.type, 1)}
                            className="h-6 w-6 rounded text-xs p-0 touch-manipulation"
                          >
                            +
                          </Button>
                        </div>

                        {/* Price and Actions - Compact */}
                        <div className="flex items-center gap-1">
                          {editingPrice?.id === item.id && editingPrice?.type === item.type ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                className="w-16 h-6 text-xs p-1"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateItemPrice(item.id, item.type, parseFloat(customPrice));
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => updateItemPrice(item.id, item.type, parseFloat(customPrice))}
                                className="h-6 w-6 p-0 text-xs"
                              >
                                ✓
                              </Button>
                            </div>
                          ) : (
                            <div className="text-right min-w-[50px]">
                              <div className="text-xs font-bold text-blue-600">
                                Rs. {(item.price * item.quantity).toLocaleString()}
                              </div>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePriceEdit(item)}
                            className="h-6 w-6 p-0 touch-manipulation"
                            title="Edit Price"
                          >
                            <Edit2 size={10} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id, item.type)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 touch-manipulation"
                            title="Remove"
                          >
                            <Trash2 size={10} />
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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-5 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bill Summary</h3>
                
                {/* Totals */}
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center text-base">
                    <span className="font-semibold text-gray-700">Subtotal:</span>
                    <span className="font-bold text-gray-900">Rs. {getSubtotal().toLocaleString()}</span>
                  </div>
                  
                  {getDiscount() > 0 && (
                    <div className="flex justify-between items-center text-base text-green-600">
                      <span className="font-semibold">Discount:</span>
                      <span className="font-bold">- Rs. {getDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-base">
                    <span className="font-semibold text-gray-700">GST (18%):</span>
                    <span className="font-bold text-gray-900">Rs. {getGST().toLocaleString()}</span>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between items-center text-xl font-bold text-blue-600">
                    <span>Total:</span>
                    <span>Rs. {getTotal().toLocaleString()}</span>
                  </div>
                  
                  {getPointsEarned() > 0 && (
                    <div className="text-center text-base text-orange-600 font-semibold bg-orange-50 rounded-lg p-2">
                      Points to earn: {getPointsEarned()}
                    </div>
                  )}
                </div>

                {/* Loyalty Points */}
                {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                  <div className="mb-5 p-4 bg-white rounded-xl border-2 border-orange-200 shadow-sm">
                    <Label className="text-base font-semibold text-gray-800 mb-3 block">
                      Redeem Points ({selectedCustomer.loyaltyPoints} available)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, selectedCustomer.loyaltyPoints, getSubtotal()))}
                        max={Math.min(selectedCustomer.loyaltyPoints, getSubtotal())}
                        placeholder="Points to redeem"
                        className="flex-1 h-12 text-base border-2 touch-manipulation"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setPointsToRedeem(Math.min(selectedCustomer.loyaltyPoints, getSubtotal()))}
                        className="h-12 px-6 text-base font-semibold touch-manipulation active:scale-95"
                      >
                        Use Max
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Max redemption: Rs. {Math.min(selectedCustomer.loyaltyPoints, getSubtotal()).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Discount Section */}
                <div className="mb-5 p-4 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                  <Label className="text-base font-semibold text-gray-800 mb-3 block">
                    Apply Discount
                  </Label>
                  
                  <div className="space-y-3">
                    {/* Discount Type Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={discountType === 'none' ? "default" : "outline"}
                        onClick={() => {
                          setDiscountType('none');
                          setDiscountValue(0);
                        }}
                        className="h-10 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        No Discount
                      </Button>
                      <Button
                        type="button"
                        variant={discountType === 'percentage' ? "default" : "outline"}
                        onClick={() => setDiscountType('percentage')}
                        className="h-10 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        Percentage %
                      </Button>
                      <Button
                        type="button"
                        variant={discountType === 'amount' ? "default" : "outline"}
                        onClick={() => setDiscountType('amount')}
                        className="h-10 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        Fixed Amount
                      </Button>
                    </div>

                    {/* Discount Value Input */}
                    {discountType !== 'none' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={discountValue}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (discountType === 'percentage') {
                                setDiscountValue(Math.min(value, 100));
                              } else {
                                setDiscountValue(Math.min(value, getSubtotal()));
                              }
                            }}
                            max={discountType === 'percentage' ? 100 : getSubtotal()}
                            placeholder={discountType === 'percentage' ? "Enter %" : "Enter amount"}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 touch-manipulation pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-semibold text-gray-600">
                            {discountType === 'percentage' ? '%' : 'Rs.'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 min-w-[80px] sm:min-w-[100px]">
                          Max: {discountType === 'percentage' ? '100%' : `Rs. ${getSubtotal().toLocaleString()}`}
                        </div>
                      </div>
                    )}

                    {/* Discount Preview */}
                    {discountType !== 'none' && discountValue > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-purple-700">
                            Discount Applied:
                          </span>
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-purple-600">
                              Rs. {(discountType === 'percentage' 
                                ? (getSubtotal() * discountValue) / 100 
                                : discountValue
                              ).toLocaleString()}
                            </div>
                            {discountType === 'percentage' && (
                              <div className="text-xs text-purple-500">
                                ({discountValue}% of subtotal)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={createTransaction.isPending}
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg rounded-xl touch-manipulation active:scale-95 transition-all duration-200"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-semibold">
                      {createTransaction.isPending ? "Processing Payment..." : "Complete Payment"}
                    </span>
                    {!createTransaction.isPending && (
                      <span className="text-xl font-bold mt-1">
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
    <ReceiptDialog 
      isOpen={showReceiptDialog} 
      onClose={() => setShowReceiptDialog(false)}
      transaction={completedTransaction}
      setShowReceiptDialog={setShowReceiptDialog}
    />
    </>
  );
}