import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
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
  const [selectedStoreId, setSelectedStoreId] = useState<number>(7);
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
        stores={stores}
      />
      
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

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare size={16} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Send size={16} />
              Messages
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <MessageSquare size={16} />
              Incoming
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Users size={16} />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  WhatsApp Business API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your WhatsApp Business API settings for {currentStore?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input
                        id="accessToken"
                        type="password"
                        placeholder="Enter your WhatsApp Business API access token"
                        defaultValue={whatsappSettings?.accessToken || ""}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            accessToken: e.target.value
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                      <Input
                        id="phoneNumberId"
                        placeholder="Enter your phone number ID"
                        defaultValue={whatsappSettings?.phoneNumberId || ""}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            phoneNumberId: e.target.value
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessAccountId">Business Account ID</Label>
                      <Input
                        id="businessAccountId"
                        placeholder="Enter your business account ID"
                        defaultValue={whatsappSettings?.businessAccountId || ""}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            businessAccountId: e.target.value
                          });
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isEnabled">Enable WhatsApp Messaging</Label>
                      <Switch
                        id="isEnabled"
                        checked={whatsappSettings?.isEnabled || false}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            isEnabled: checked
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableSaleNotifications">Sale Notifications</Label>
                      <Switch
                        id="enableSaleNotifications"
                        checked={whatsappSettings?.enableSaleNotifications || false}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            enableSaleNotifications: checked
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableBirthdayMessages">Birthday Messages</Label>
                      <Switch
                        id="enableBirthdayMessages"
                        checked={whatsappSettings?.enableBirthdayMessages || false}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            enableBirthdayMessages: checked
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableAnniversaryMessages">Anniversary Messages</Label>
                      <Switch
                        id="enableAnniversaryMessages"
                        checked={whatsappSettings?.enableAnniversaryMessages || false}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            enableAnniversaryMessages: checked
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthdayTime">Birthday Message Time</Label>
                      <Input
                        id="birthdayTime"
                        type="time"
                        defaultValue={whatsappSettings?.birthdayTime || "10:00"}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            birthdayTime: e.target.value
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle size={16} />
                    <span>Get your WhatsApp Business API credentials from Facebook Developer Console</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare size={20} />
                    Message Templates
                  </CardTitle>
                  <CardDescription>
                    Create and manage WhatsApp message templates for automated messaging
                  </CardDescription>
                </div>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">Send Test Message</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="testPhone">Phone Number</Label>
                      <Input
                        id="testPhone"
                        placeholder="+917415850508"
                        defaultValue="+917415850508"
                      />
                    </div>
                    <div>
                      <Label htmlFor="testMessage">Message</Label>
                      <Input
                        id="testMessage"
                        placeholder="Hello! This is a test message from our salon system."
                        defaultValue="Hello! This is a test message from our salon system."
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSendTestMessage} className="w-full">
                        Send Test Message
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template: any) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <span className="capitalize">{template.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{template.content}</TableCell>
                        <TableCell>
                          <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send size={20} />
                  Message History
                </CardTitle>
                <CardDescription>
                  View recent WhatsApp messages sent to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message: any) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.phoneNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(message.messageType)}
                            <span className="capitalize">{message.messageType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{message.content}</TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell>
                          {message.sentAt ? new Date(message.sentAt).toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  Incoming Messages (Customer Replies)
                </CardTitle>
                <CardDescription>
                  View messages received from customers who replied to your WhatsApp messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How to Receive Customer Replies:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Set up webhook URL in Facebook Developer Console: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/whatsapp/webhook</code></li>
                    <li>Add verify token in your WhatsApp settings (below)</li>
                    <li>Customer replies will automatically appear here</li>
                    <li>You can link replies to existing customers by phone number</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhookToken">Webhook Verify Token</Label>
                    <Input
                      id="webhookToken"
                      placeholder="Enter webhook verify token (must match Facebook settings)"
                      defaultValue={whatsappSettings?.webhookVerifyToken || ""}
                      onChange={(e) => {
                        updateSettingsMutation.mutate({
                          webhookVerifyToken: e.target.value
                        });
                      }}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This token must match what you configure in Facebook Developer Console
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Recent Customer Replies</h4>
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">No customer replies yet</span>
                        <Button variant="outline" size="sm">
                          <RefreshCw size={16} className="mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>Customer replies will appear here once webhook is configured</p>
                      <p className="text-sm mt-1">Send a test message and ask customer to reply to see it here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Customer Campaigns
                </CardTitle>
                <CardDescription>
                  Create and manage WhatsApp marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Management</h3>
                  <p className="text-gray-600 mb-4">Create targeted WhatsApp campaigns for your customers</p>
                  <Button>Create Campaign</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
            <DialogDescription>
              Create a new WhatsApp message template for automated messaging
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Sale Confirmation"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale Notification</SelectItem>
                    <SelectItem value="birthday">Birthday Message</SelectItem>
                    <SelectItem value="anniversary">Anniversary Message</SelectItem>
                    <SelectItem value="campaign">Campaign Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="templateContent">Message Content</Label>
              <Textarea
                id="templateContent"
                placeholder="Hello {{customer_name}}, thank you for visiting {{store_name}}! Your bill amount is Rs.{{amount}}."
                rows={4}
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="templateVariables">Template Variables (comma-separated)</Label>
              <Input
                id="templateVariables"
                placeholder="customer_name, store_name, amount"
                value={templateVariables}
                onChange={(e) => setTemplateVariables(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Available variables: customer_name, store_name, amount, date, time, points_earned
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!templateName || !templateContent || createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}