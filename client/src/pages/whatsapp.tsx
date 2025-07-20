import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Settings, Send, Calendar, Users, AlertCircle, CheckCircle, Clock, X, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function WhatsApp() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("sale");
  const [templateContent, setTemplateContent] = useState("");
  const [templateVariables, setTemplateVariables] = useState("");

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

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
    retry: false,
  });

  const { data: whatsappSettings } = useQuery({
    queryKey: ["/api/whatsapp/settings", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/settings/${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    enabled: !!selectedStoreId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/whatsapp/templates", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/templates?storeId=${selectedStoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    enabled: !!selectedStoreId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/whatsapp/messages", selectedStoreId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/messages?storeId=${selectedStoreId}&limit=50`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    enabled: !!selectedStoreId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest("PUT", `/api/whatsapp/settings/${selectedStoreId}`, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/settings", selectedStoreId] });
      toast({
        title: "Settings Updated",
        description: "WhatsApp settings have been updated successfully.",
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
        title: "Update Failed",
        description: "Failed to update WhatsApp settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      return await apiRequest("POST", "/api/whatsapp/templates", {
        ...template,
        storeId: selectedStoreId,
        variables: templateVariables.split(',').map(v => v.trim()).filter(v => v),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/templates", selectedStoreId] });
      toast({
        title: "Template Created",
        description: "WhatsApp template has been created successfully.",
      });
      setShowTemplateDialog(false);
      resetTemplateForm();
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
        title: "Creation Failed",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendTestMessageMutation = useMutation({
    mutationFn: async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
      return await apiRequest("POST", "/api/whatsapp/send-test-message", {
        storeId: selectedStoreId,
        phoneNumber,
        message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Message Sent",
        description: "Test WhatsApp message has been sent successfully.",
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
        title: "Send Failed",
        description: "Failed to send test message. Please check your WhatsApp settings.",
        variant: "destructive",
      });
    },
  });

  const currentStore = stores.find((store: any) => store.id === selectedStoreId);

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateType("sale");
    setTemplateContent("");
    setTemplateVariables("");
    setEditingTemplate(null);
  };

  const handleCreateTemplate = () => {
    setShowTemplateDialog(true);
    resetTemplateForm();
  };

  const handleSaveTemplate = () => {
    createTemplateMutation.mutate({
      storeId: selectedStoreId,
      name: templateName,
      type: templateType,
      content: templateContent,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Sent</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle size={12} className="mr-1" />Delivered</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><X size={12} className="mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <MessageSquare size={16} className="text-green-600" />;
      case 'birthday':
        return <Calendar size={16} className="text-blue-600" />;
      case 'anniversary':
        return <Calendar size={16} className="text-purple-600" />;
      case 'campaign':
        return <Users size={16} className="text-orange-600" />;
      default:
        return <MessageSquare size={16} className="text-gray-600" />;
    }
  };

  const handleSendTestMessage = async () => {
    const phoneElement = document.getElementById('testPhone') as HTMLInputElement;
    const messageElement = document.getElementById('testMessage') as HTMLInputElement;
    
    if (!phoneElement?.value || !messageElement?.value) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message.",
        variant: "destructive",
      });
      return;
    }

    sendTestMessageMutation.mutate({
      phoneNumber: phoneElement.value,
      message: messageElement.value,
    });
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare size={32} className="text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
            <p className="text-gray-600">Manage automated messaging and customer communication</p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Settings
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-600">WhatsApp functionality temporarily simplified for debugging.</p>
        </CardContent>
      </Card>
    </div>
  );
}
