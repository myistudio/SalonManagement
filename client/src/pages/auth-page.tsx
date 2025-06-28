import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scissors, Sparkles, Image } from "lucide-react";

const loginSchema = z.object({
  login: z.string().min(1, "Email or mobile number is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Valid email is required").or(z.literal("")),
  mobile: z.string().min(10, "Valid mobile number is required").or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
}).refine((data) => data.email || data.mobile, {
  message: "Either email or mobile number is required",
  path: ["email"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Fetch login page settings
  const { data: loginSettings } = useQuery({
    queryKey: ["/api/login-settings"],
    retry: false,
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      mobile: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  // Redirect if already logged in - moved after all hooks
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">
      {/* Left side - Hero */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${loginSettings?.backgroundColor || 'from-purple-600 via-pink-600 to-indigo-600'} p-12 flex-col justify-center items-center text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center mb-8">
            {loginSettings?.logoUrl ? (
              <img
                src={loginSettings.logoUrl}
                alt="Company logo"
                className="h-12 w-12 mr-3 object-contain"
              />
            ) : (
              <Scissors className="h-12 w-12 mr-3" />
            )}
            <h1 className="text-4xl font-bold">{loginSettings?.companyName || "SalonPro"}</h1>
            <Sparkles className="h-8 w-8 ml-3" />
          </div>
          <h2 className="text-3xl font-bold mb-6">{loginSettings?.tagline || "Manage Your Beauty Business"}</h2>
          <p className="text-xl mb-8 text-purple-100">
            {loginSettings?.description || "Complete salon management solution with billing, inventory, customer loyalty, and multi-store support."}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Point of Sale</h3>
              <p className="text-purple-100">Quick billing with barcode scanning</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Customer Loyalty</h3>
              <p className="text-purple-100">Build lasting relationships</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Inventory Management</h3>
              <p className="text-purple-100">Track products and supplies</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Multi-Store</h3>
              <p className="text-purple-100">Manage multiple locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center mb-4">
              {loginSettings?.logoUrl ? (
                <img
                  src={loginSettings.logoUrl}
                  alt="Company logo"
                  className="h-8 w-8 mr-2 object-contain"
                />
              ) : (
                <Scissors className="h-8 w-8 mr-2 text-purple-600" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{loginSettings?.companyName || "SalonPro"}</h1>
            </div>
          </div>

          <div className="w-full">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="login"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email or Mobile Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email or mobile number"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter password"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          
            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Designed by - My Internet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}