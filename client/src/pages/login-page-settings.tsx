import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";

const loginPageSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  logoUrl: z.string().optional(),
  backgroundColor: z.string().min(1, "Background color is required"),
});

type LoginPageSettingsFormData = z.infer<typeof loginPageSettingsSchema>;

export default function LoginPageSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/login-settings"],
    enabled: !authLoading && user?.role === "super_admin",
  });

  const form = useForm<LoginPageSettingsFormData>({
    resolver: zodResolver(loginPageSettingsSchema),
    defaultValues: {
      companyName: settings?.companyName || "SalonPro",
      tagline: settings?.tagline || "Manage Your Beauty Business",
      description: settings?.description || "Complete salon management solution with billing, inventory, customer loyalty, and multi-store support.",
      logoUrl: settings?.logoUrl || "",
      backgroundColor: settings?.backgroundColor || "from-purple-600 via-pink-600 to-indigo-600",
    },
  });

  // Update form when settings are loaded
  useState(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName || "SalonPro",
        tagline: settings.tagline || "Manage Your Beauty Business",
        description: settings.description || "Complete salon management solution with billing, inventory, customer loyalty, and multi-store support.",
        logoUrl: settings.logoUrl || "",
        backgroundColor: settings.backgroundColor || "from-purple-600 via-pink-600 to-indigo-600",
      });
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings, form]);

  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("logoUrl", data.url);
      setLogoPreview(data.url);
      toast({
        title: "Logo uploaded",
        description: "Logo has been uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LoginPageSettingsFormData) => {
      const response = await apiRequest("PUT", "/api/admin/login-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/login-settings"] });
      toast({
        title: "Settings updated",
        description: "Login page settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
      logoUploadMutation.mutate(file);
    }
  };

  const onSubmit = (data: LoginPageSettingsFormData) => {
    updateMutation.mutate(data);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You need super admin access to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedStoreId={1} onStoreChange={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Login Page Customization</h1>
          <p className="text-gray-600 mt-2">
            Customize the appearance and content of the login page
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
              <CardDescription>
                Customize the text content and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter company name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter tagline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Gradient</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., from-purple-600 via-pink-600 to-indigo-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <Label>Company Logo</Label>
                    {logoPreview && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-16 w-16 object-contain rounded-lg border"
                        />
                        <div className="text-sm text-gray-600">
                          Current logo
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={logoUploadMutation.isPending}
                          asChild
                        >
                          <span>
                            {logoUploadMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <div className="text-sm text-gray-500">
                        Max 5MB, PNG/JPG/SVG
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Settings"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Preview of how the login page will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-lg overflow-hidden">
                <div className={`bg-gradient-to-br ${form.watch('backgroundColor')} p-8 text-white relative overflow-hidden min-h-[400px] flex flex-col justify-center items-center`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 text-center max-w-md">
                    <div className="flex items-center justify-center mb-6">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-12 w-12 mr-3 object-contain"
                        />
                      ) : (
                        <Image className="h-12 w-12 mr-3" />
                      )}
                      <h1 className="text-3xl font-bold">{form.watch('companyName')}</h1>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{form.watch('tagline')}</h2>
                    <p className="text-lg text-purple-100">
                      {form.watch('description')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}