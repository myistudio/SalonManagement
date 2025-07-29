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
import ServiceCategoryManager from "./service-category-manager";

interface ServiceFormProps {
  storeId: number;
  service?: any;
  onSuccess: () => void;
}

export default function ServiceForm({ storeId, service, onSuccess }: ServiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    storeId,
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || "",
    duration: service?.duration || "",
    category: service?.category || "",
    imageUrl: service?.imageUrl || "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(service?.imageUrl || "");

  // Fetch service categories for this store
  const { data: serviceCategories = [] } = useQuery<any[]>({
    queryKey: [`/api/service-categories?storeId=${storeId}`],
  });

  const createService = useMutation({
    mutationFn: async (serviceData: any) => {
      const url = service ? `/api/services/${service.id}` : "/api/services";
      const method = service ? "PUT" : "POST";
      const response = await apiRequest(method, url, serviceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Service ${service ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/services?storeId=${storeId}`] });
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
        description: `Failed to ${service ? 'update' : 'create'} service`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !String(formData.price).trim()) {
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
          description: "Failed to upload image. Service will be saved without image.",
          variant: "destructive",
        });
      }
    }

    const serviceData = {
      ...formData,
      imageUrl,
      price: parseFloat(formData.price),
      duration: formData.duration ? parseInt(formData.duration) : null,
    };

    createService.mutate(serviceData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryName: string) => {
    handleInputChange("category", categoryName);
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



  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter service name"
                required
              />
            </div>
            <div>
              <div className="flex items-center">
                <Label htmlFor="category">Category</Label>
                <ServiceCategoryManager 
                  storeId={storeId} 
                  onCategorySelect={handleCategorySelect}
                />
              </div>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.length === 0 ? (
                    <SelectItem value="no-categories" disabled>
                      No categories available. Create one first.
                    </SelectItem>
                  ) : (
                    serviceCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter service description"
              rows={3}
            />
          </div>

          {/* Service Image Upload */}
          <div>
            <Label htmlFor="image">Service Image</Label>
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
                    alt="Service preview" 
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
              <Label htmlFor="price">Price *</Label>
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
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="60"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createService.isPending}
            >
              {createService.isPending ? 
                (service ? "Updating..." : "Creating...") : 
                (service ? "Update Service" : "Create Service")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
