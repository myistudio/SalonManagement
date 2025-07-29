import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useStore } from "@/contexts/store-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, QrCode, Edit, Printer, Tag } from "lucide-react";
import ProductForm from "@/components/products/product-form";
import BillingModal from "@/components/billing/billing-modal";
import { printBarcode, printQRCode, printBarcodeWithPrice, printGridBarcodes, printGridQRCodes } from "@/lib/barcode-utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inventory() {
  const { selectedStoreId } = useStore();
  console.log("Inventory page - selectedStoreId:", selectedStoreId);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

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

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/products?storeId=${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["/api/products/low-stock", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/products/low-stock/${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedStoreId,
    retry: false,
  });

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (product: any) => {
    if (product.stock <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (product.stock <= product.minStock) return { label: "Low Stock", variant: "destructive" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  // Fetch current store details for logo
  const { data: currentStore } = useQuery({
    queryKey: ["/api/stores", selectedStoreId],
    enabled: !!selectedStoreId,
  });

  const handlePrintBarcode = (product: any) => {
    if (product.barcode) {
      printBarcodeWithPrice(product.barcode, product.name, parseFloat(product.price).toLocaleString());
    } else {
      toast({
        title: "No Barcode",
        description: "This product doesn't have a barcode to print.",
        variant: "destructive",
      });
    }
  };

  const handlePrintQRCode = async (product: any) => {
    try {
      // Create QR code data with product information
      const qrData = JSON.stringify({
        id: product.id,
        name: product.name,
        price: product.price,
        barcode: product.barcode || '',
        category: product.category || ''
      });
      
      await printQRCode(qrData, product.name, parseFloat(product.price).toLocaleString());
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Failed to print QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
                <p className="mt-1 text-gray-600">Manage your product inventory and stock levels</p>
              </div>
              <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Add Product</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  </DialogHeader>
                  <ProductForm 
                    storeId={selectedStoreId}
                    product={editingProduct}
                    onSuccess={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertTriangle className="mr-2" size={20} />
                    Low Stock Alerts ({lowStockProducts.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lowStockProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">Only {product.stock} left</p>
                        </div>
                        <Badge variant="destructive">Low</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search products by name, category, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                {productsLoading ? (
                  <div className="p-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 py-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/3 mb-2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first product"}
                    </p>
                    <Button onClick={() => setShowProductForm(true)}>
                      <Plus size={16} className="mr-2" />
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Print Labels</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: any) => {
                        const stockStatus = getStockStatus(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                {product.brand && (
                                  <p className="text-sm text-gray-600">{product.brand}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                            </TableCell>
                            <TableCell>₹{parseFloat(product.price).toLocaleString()}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.stock}</p>
                                <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono">{product.barcode || 'N/A'}</span>
                                {product.qrCode && (
                                  <QrCode size={16} className="text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Printer size={16} className="mr-1" />
                                      Print
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handlePrintBarcode(product)}>
                                      <Tag size={16} className="mr-2" />
                                      Single Barcode Label
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePrintQRCode(product)}>
                                      <QrCode size={16} className="mr-2" />
                                      Single QR Code Label
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <Tag size={16} className="mr-2" />
                                        Multiple Barcode Labels
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => printGridBarcodes(product, 4, currentStore)}>
                                          4 Labels (1 row)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridBarcodes(product, 8, currentStore)}>
                                          8 Labels (2 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridBarcodes(product, 12, currentStore)}>
                                          12 Labels (3 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridBarcodes(product, 16, currentStore)}>
                                          16 Labels (4 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridBarcodes(product, 20, currentStore)}>
                                          20 Labels (5 rows)
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <QrCode size={16} className="mr-2" />
                                        Multiple QR Code Labels
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => printGridQRCodes(product, 4, currentStore)}>
                                          4 Labels (1 row)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridQRCodes(product, 8, currentStore)}>
                                          8 Labels (2 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridQRCodes(product, 12, currentStore)}>
                                          12 Labels (3 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridQRCodes(product, 16, currentStore)}>
                                          16 Labels (4 rows)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => printGridQRCodes(product, 20, currentStore)}>
                                          20 Labels (5 rows)
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductForm(true);
                                  }}
                                >
                                  <Edit size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        </div>

      <BillingModal 
        isOpen={showBillingModal} 
        onClose={() => setShowBillingModal(false)} 
        storeId={selectedStoreId}
      />
    </>
  );
}
