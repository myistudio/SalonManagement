import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import CategoryManager from "./category-manager";

interface ProductFormProps {
  storeId: number;
  product?: any;
  onSuccess: () => void;
}

export default function ProductForm({ storeId, product, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    storeId,
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    cost: product?.cost || "",
    barcode: product?.barcode || "",
    category: product?.category || "",
    brand: product?.brand || "",
    stock: product?.stock || "",
    minStock: product?.minStock || "5",
    imageUrl: product?.imageUrl || "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || "");

  // Fetch categories for this store
  const { data: dynamicCategories = [] } = useQuery({
    queryKey: [`/api/product-categories?storeId=${storeId}`],
  });

  const createProduct = useMutation({
    mutationFn: async (productData: any) => {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const response = await apiRequest(method, url, productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products?storeId=${storeId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/low-stock/${storeId}`] });
      onSuccess();
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
        description: `Failed to ${product ? 'update' : 'create'} product`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let imageUrl = formData.imageUrl;

    // Upload image if a new file is selected
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (error) {
        toast({
          title: "Image Upload Failed",
          description: "Failed to upload image. Product will be saved without image.",
          variant: "destructive",
        });
      }
    }

    const productData = {
      ...formData,
      imageUrl,
      price: parseFloat(formData.price),
      cost: formData.cost ? parseFloat(formData.cost) : null,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 5,
    };

    createProduct.mutate(productData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  };

  const handleCategorySelect = (categoryName: string) => {
    handleInputChange("category", categoryName);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="flex items-center space-x-2">
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CategoryManager 
                  storeId={storeId} 
                  onCategorySelect={handleCategorySelect}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Enter or scan barcode"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          {/* Product Image Upload */}
          <div>
            <Label htmlFor="image">Product Image</Label>
            <div className="space-y-3">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="flex items-start space-x-3">
                  <img 
                    src={imagePreview} 
                    alt="Product preview" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Image preview</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                        setFormData(prev => ({ ...prev, imageUrl: "" }));
                      }}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Selling Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost Price</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", e.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? 
                (product ? "Updating..." : "Creating...") : 
                (product ? "Update Product" : "Create Product")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
