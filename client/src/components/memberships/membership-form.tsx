import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface MembershipFormProps {
  storeId: number;
  membership?: any;
  onSuccess: () => void;
}

export default function MembershipForm({ storeId, membership, onSuccess }: MembershipFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    storeId,
    name: membership?.name || "",
    description: membership?.description || "",
    discountPercentage: membership?.discountPercentage?.toString() || "",
    pointsMultiplier: membership?.pointsMultiplier?.toString() || "1",
    durationMonths: membership?.durationMonths?.toString() || "12",
    price: membership?.price?.toString() || "",
  });

  const [benefits, setBenefits] = useState<string[]>(() => {
    if (membership?.benefits) {
      try {
        return JSON.parse(membership.benefits);
      } catch (e) {
        return [""];
      }
    }
    return [""];
  });

  const createMembership = useMutation({
    mutationFn: async (membershipData: any) => {
      const url = membership ? `/api/memberships/${membership.id}` : "/api/memberships";
      const method = membership ? "PUT" : "POST";
      return await apiRequest(method, url, membershipData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Membership plan ${membership ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/memberships?storeId=${storeId}`] });
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
        description: `Failed to ${membership ? 'update' : 'create'} membership plan`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const membershipData = {
      ...formData,
      discountPercentage: formData.discountPercentage || "0",
      pointsMultiplier: formData.pointsMultiplier || "1", 
      durationMonths: parseInt(formData.durationMonths) || 12,
      price: formData.price,
      benefits: JSON.stringify(benefits.filter(benefit => benefit.trim())),
      isActive: true,
    };

    createMembership.mutate(membershipData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBenefit = () => {
    setBenefits(prev => [...prev, ""]);
  };

  const updateBenefit = (index: number, value: string) => {
    setBenefits(prev => prev.map((benefit, i) => i === index ? value : benefit));
  };

  const removeBenefit = (index: number) => {
    setBenefits(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Gold, Silver, VIP"
                required
              />
            </div>
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
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter membership plan description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="pointsMultiplier">Points Multiplier</Label>
              <Input
                id="pointsMultiplier"
                type="number"
                step="0.1"
                min="1"
                value={formData.pointsMultiplier}
                onChange={(e) => handleInputChange("pointsMultiplier", e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="durationMonths">Duration (Months)</Label>
              <Input
                id="durationMonths"
                type="number"
                min="1"
                value={formData.durationMonths}
                onChange={(e) => handleInputChange("durationMonths", e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          {/* Benefits Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Benefits</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBenefit}
                className="flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Add Benefit</span>
              </Button>
            </div>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="Enter benefit description"
                  />
                  {benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Preview:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Plan:</span>
                <Badge variant="outline">{formData.name || "Plan Name"}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <span>₹{formData.price || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-green-600">{formData.discountPercentage || "0"}% off</span>
              </div>
              <div className="flex justify-between">
                <span>Points:</span>
                <span>{formData.pointsMultiplier || "1"}x multiplier</span>
              </div>
              <div className="flex justify-between">
                <span>Validity:</span>
                <span>{formData.validityDays || "365"} days</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createMembership.isPending}
            >
              {createMembership.isPending ? 
                (membership ? "Updating..." : "Creating...") : 
                (membership ? "Update Plan" : "Create Plan")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
