import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Settings } from "lucide-react";

interface CategoryManagerProps {
  storeId: number;
  onCategorySelect?: (categoryName: string) => void;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  storeId: number;
}

export default function CategoryManager({ storeId, onCategorySelect }: CategoryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    storeId: storeId,
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/product-categories?storeId=${storeId}`],
    enabled: isManagerOpen,
  });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest("POST", "/api/product-categories", categoryData);
      return response.json();
    },
    onSuccess: (newCategory) => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/product-categories?storeId=${storeId}`] });
      setIsAddingCategory(false);
      resetForm();
      if (onCategorySelect) {
        onCategorySelect(newCategory.name);
      }
    },
    onError: handleError,
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/product-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/product-categories?storeId=${storeId}`] });
      setEditingCategory(null);
      resetForm();
    },
    onError: handleError,
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/product-categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/product-categories?storeId=${storeId}`] });
    },
    onError: handleError,
  });

  function handleError(error: any) {
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
      description: "Operation failed. Please try again.",
      variant: "destructive",
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        data: formData,
      });
    } else {
      createCategory.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      storeId: category.storeId,
    });
    setIsAddingCategory(true);
  };

  const handleDelete = (id: number) => {
    deleteCategory.mutate(id);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      storeId: storeId,
    });
    setEditingCategory(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsAddingCategory(true);
  };

  return (
    <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Settings className="h-4 w-4" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Product Categories</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Categories</h3>
              <Button onClick={handleAddNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No categories found. Add your first category to get started.
                  </div>
                ) : (
                  categories.map((category: Category) => (
                    <Card key={category.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          {isAddingCategory && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name *</Label>
                    <Input
                      id="category-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter category description (optional)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createCategory.isPending || updateCategory.isPending}
                    >
                      {(createCategory.isPending || updateCategory.isPending) ? 
                        (editingCategory ? "Updating..." : "Creating...") : 
                        (editingCategory ? "Update Category" : "Create Category")
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCategory(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}