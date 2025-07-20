import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, MessageSquare, Mail, Phone, Settings, Eye, Trash2, Plus, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface CommunicationSettings {
  smsSettings?: {
    id?: number;
    storeId: number;
    isEnabled: boolean;
    providerName: string;
    apiKey: string;
    senderId: string;
    templateId?: string;
  };
  emailSettings?: {
    id?: number;
    storeId: number;
    isEnabled: boolean;
    providerName: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail: string;
    fromName?: string;
  };
  whatsappSettings?: {
    id?: number;
    storeId: number;
    isEnabled: boolean;
    accessToken: string;
    instanceId: string;
    baseUrl: string;
  };
}

interface CommunicationTemplate {
  id: number;
  storeId: number;
  type: 'sms' | 'email' | 'whatsapp';
  category: string;
  name: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

interface CommunicationMessage {
  id: number;
  storeId: number;
  customerId?: number;
  type: 'sms' | 'email' | 'whatsapp';
  category: string;
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  providerId?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export default function CommunicationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(9); // Default store

  // Fetch settings for all communication channels
  const { data: smsSettings } = useQuery({
    queryKey: [`/api/sms-settings/${selectedStoreId}`],
    enabled: !!selectedStoreId,
  });

  const { data: emailSettings } = useQuery({
    queryKey: [`/api/email-settings/${selectedStoreId}`],
    enabled: !!selectedStoreId,
  });

  const { data: whatsappSettings } = useQuery({
    queryKey: [`/api/whatsapp/settings/${selectedStoreId}`],
    enabled: !!selectedStoreId,
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<CommunicationTemplate[]>({
    queryKey: [`/api/communication-templates/${selectedStoreId}`],
    enabled: !!selectedStoreId,
  });

  // Fetch message history
  const { data: messages = [] } = useQuery<CommunicationMessage[]>({
    queryKey: [`/api/communication-messages/${selectedStoreId}`],
    enabled: !!selectedStoreId,
  });

  // Mutations for updating settings
  const updateSmsSettings = useMutation({
    mutationFn: (data: any) =>
      smsSettings?.id
        ? apiRequest(`/api/sms-settings/${selectedStoreId}`, { method: "PUT", body: data })
        : apiRequest("/api/sms-settings", { method: "POST", body: { ...data, storeId: selectedStoreId } }),
    onSuccess: () => {
      toast({ title: "SMS settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/sms-settings/${selectedStoreId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update SMS settings", variant: "destructive" });
    },
  });

  const updateEmailSettings = useMutation({
    mutationFn: (data: any) =>
      emailSettings?.id
        ? apiRequest(`/api/email-settings/${selectedStoreId}`, { method: "PUT", body: data })
        : apiRequest("/api/email-settings", { method: "POST", body: { ...data, storeId: selectedStoreId } }),
    onSuccess: () => {
      toast({ title: "Email settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/email-settings/${selectedStoreId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update email settings", variant: "destructive" });
    },
  });

  const updateWhatsappSettings = useMutation({
    mutationFn: (data: any) =>
      whatsappSettings?.id
        ? apiRequest(`/api/whatsapp/settings/${selectedStoreId}`, { method: "PUT", body: data })
        : apiRequest("/api/whatsapp/settings", { method: "POST", body: { ...data, storeId: selectedStoreId } }),
    onSuccess: () => {
      toast({ title: "WhatsApp settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/settings/${selectedStoreId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update WhatsApp settings", variant: "destructive" });
    },
  });

  // SMS Settings Form
  const SmsSettingsForm = () => {
    const [settings, setSettings] = useState({
      isEnabled: false,
      providerName: 'msg91',
      apiKey: '',
      senderId: '',
      templateId: '',
      ...smsSettings,
    });

    useEffect(() => {
      if (smsSettings) {
        setSettings({ ...settings, ...smsSettings });
      }
    }, [smsSettings]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateSmsSettings.mutate(settings);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SMS Settings
          </CardTitle>
          <CardDescription>
            Configure SMS notifications using MSG91 or SMS Gateway Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
              />
              <Label>Enable SMS notifications</Label>
            </div>

            <div className="space-y-2">
              <Label>SMS Provider</Label>
              <Select
                value={settings.providerName}
                onValueChange={(value) => setSettings({ ...settings, providerName: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="msg91">MSG91</SelectItem>
                  <SelectItem value="smsgatewayhub">SMS Gateway Hub</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Enter your SMS API key"
              />
            </div>

            <div className="space-y-2">
              <Label>Sender ID</Label>
              <Input
                value={settings.senderId}
                onChange={(e) => setSettings({ ...settings, senderId: e.target.value })}
                placeholder="Enter sender ID (6 characters)"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Template ID (Optional)</Label>
              <Input
                value={settings.templateId}
                onChange={(e) => setSettings({ ...settings, templateId: e.target.value })}
                placeholder="DLT Template ID for promotional messages"
              />
            </div>

            <Button type="submit" disabled={updateSmsSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSmsSettings.isPending ? "Saving..." : "Save SMS Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Email Settings Form
  const EmailSettingsForm = () => {
    const [settings, setSettings] = useState({
      isEnabled: false,
      providerName: 'smtp',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      ...emailSettings,
    });

    useEffect(() => {
      if (emailSettings) {
        setSettings({ ...settings, ...emailSettings });
      }
    }, [emailSettings]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateEmailSettings.mutate(settings);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure email notifications using SMTP, SendGrid, or Gmail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
              />
              <Label>Enable email notifications</Label>
            </div>

            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select
                value={settings.providerName}
                onValueChange={(value) => setSettings({ ...settings, providerName: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.providerName === 'smtp' && (
              <>
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                    placeholder="587"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.smtpSecure}
                    onCheckedChange={(checked) => setSettings({ ...settings, smtpSecure: checked })}
                  />
                  <Label>Use SSL/TLS</Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Email Username</Label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Password</Label>
              <Input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                placeholder="App password or regular password"
              />
            </div>

            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="notifications@yoursalon.com"
              />
            </div>

            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                placeholder="Your Salon Name"
              />
            </div>

            <Button type="submit" disabled={updateEmailSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateEmailSettings.isPending ? "Saving..." : "Save Email Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  // WhatsApp Settings Form
  const WhatsAppSettingsForm = () => {
    const [settings, setSettings] = useState({
      isEnabled: false,
      accessToken: '',
      instanceId: '',
      baseUrl: 'https://api.ultramsg.com/',
      ...whatsappSettings,
    });

    useEffect(() => {
      if (whatsappSettings) {
        setSettings({ ...settings, ...whatsappSettings });
      }
    }, [whatsappSettings]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateWhatsappSettings.mutate(settings);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Settings
          </CardTitle>
          <CardDescription>
            Configure WhatsApp notifications using Ultramsg API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
              />
              <Label>Enable WhatsApp notifications</Label>
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                type="password"
                value={settings.accessToken}
                onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                placeholder="Enter your Ultramsg access token"
              />
            </div>

            <div className="space-y-2">
              <Label>Instance ID</Label>
              <Input
                value={settings.instanceId}
                onChange={(e) => setSettings({ ...settings, instanceId: e.target.value })}
                placeholder="Enter your WhatsApp instance ID"
              />
            </div>

            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="https://api.ultramsg.com/"
              />
            </div>

            <Button type="submit" disabled={updateWhatsappSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateWhatsappSettings.isPending ? "Saving..." : "Save WhatsApp Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Templates Management
  const TemplatesSection = () => {
    const templateCategories = [
      { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
      { value: 'reminder', label: 'Appointment Reminder' },
      { value: 'promotion', label: 'Promotional Message' },
      { value: 'registration', label: 'Registration Welcome' },
      { value: 'birthday', label: 'Birthday Wishes' },
    ];

    const availableVariables = [
      'customer_name', 'appointment_date', 'appointment_time', 'service_name',
      'store_name', 'store_address', 'store_phone', 'total_amount', 'staff_name'
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>
            Create and manage message templates for different communication types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Available Variables:</h4>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <Badge key={variable} variant="outline">
                  {`{${variable}}`}
                </Badge>
              ))}
            </div>

            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.type.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{template.name}</span>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      {template.subject && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                      )}
                      <p className="text-sm text-gray-800">{template.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Message History
  const MessageHistory = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            View recently sent communication messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.slice(0, 10).map((message) => (
              <div key={message.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={message.status === 'sent' ? "default" : "destructive"}>
                        {message.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{message.category}</Badge>
                      <span className="text-sm text-gray-500">
                        to {message.recipient}
                      </span>
                    </div>
                    {message.subject && (
                      <p className="text-sm font-medium mb-1">{message.subject}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Status: {message.status}</span>
                      <span>Sent: {message.sentAt ? new Date(message.sentAt).toLocaleString() : 'Not sent'}</span>
                      {message.errorMessage && (
                        <span className="text-red-600">Error: {message.errorMessage}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communication Settings</h1>
        <Badge variant="outline">Store ID: {selectedStoreId}</Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Channel Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="test">Test Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            <SmsSettingsForm />
            <EmailSettingsForm />
            <WhatsAppSettingsForm />
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesSection />
        </TabsContent>

        <TabsContent value="history">
          <MessageHistory />
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Messages</CardTitle>
              <CardDescription>
                Send test messages to verify your communication setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Phone className="h-6 w-6 mb-2" />
                    Test SMS
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Mail className="h-6 w-6 mb-2" />
                    Test Email
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Test WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}