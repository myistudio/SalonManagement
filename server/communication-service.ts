import { WhatsAppService } from './whatsapp-service';
import { SmsServiceFactory } from './sms-service';
import { EmailServiceFactory } from './email-service';
import { 
  SmsSettings, 
  EmailSettings, 
  WhatsappSettings, 
  CommunicationTemplate,
  Appointment,
  Customer,
  Store,
  InsertCommunicationMessage 
} from "@shared/schema";

export interface CommunicationServiceAPI {
  sendAppointmentConfirmation(
    appointment: Appointment,
    customer: Customer,
    store: Store,
    staff?: any
  ): Promise<void>;
  
  sendAppointmentReminder(
    appointment: Appointment,
    customer: Customer,
    store: Store,
    staff?: any
  ): Promise<void>;
  
  sendPromotionalMessage(
    customers: Customer[],
    template: CommunicationTemplate,
    store: Store
  ): Promise<void>;
  
  sendRegistrationWelcome(
    customer: Customer,
    store: Store
  ): Promise<void>;
  
  sendBirthdayMessage(
    customer: Customer,
    store: Store
  ): Promise<void>;
}

export class UnifiedCommunicationService implements CommunicationServiceAPI {
  private whatsappService: WhatsAppService;
  
  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async sendAppointmentConfirmation(
    appointment: Appointment,
    customer: Customer,
    store: Store,
    staff?: any
  ): Promise<void> {
    const variables = {
      customer_name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      appointment_date: appointment.appointmentDate,
      appointment_time: appointment.appointmentTime,
      service_name: appointment.serviceName,
      store_name: store.name,
      store_address: store.address || '',
      store_phone: store.phone || '',
      total_amount: appointment.totalAmount,
      staff_name: staff ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Our team',
    };

    // Send via all enabled channels
    await Promise.all([
      this.sendViaSMS(customer, store, 'appointment_confirmation', variables),
      this.sendViaEmail(customer, store, 'appointment_confirmation', variables),
      this.sendViaWhatsApp(customer, store, 'appointment_confirmation', variables),
    ]);
  }

  async sendAppointmentReminder(
    appointment: Appointment,
    customer: Customer,
    store: Store,
    staff?: any
  ): Promise<void> {
    const variables = {
      customer_name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      appointment_date: appointment.appointmentDate,
      appointment_time: appointment.appointmentTime,
      service_name: appointment.serviceName,
      store_name: store.name,
      store_address: store.address || '',
      store_phone: store.phone || '',
      total_amount: appointment.totalAmount,
      staff_name: staff ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Our team',
    };

    await Promise.all([
      this.sendViaSMS(customer, store, 'reminder', variables),
      this.sendViaEmail(customer, store, 'reminder', variables),
      this.sendViaWhatsApp(customer, store, 'reminder', variables),
    ]);
  }

  async sendPromotionalMessage(
    customers: Customer[],
    template: CommunicationTemplate,
    store: Store
  ): Promise<void> {
    const promises = customers.map(async (customer) => {
      const variables = {
        customer_name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
        store_name: store.name,
        store_address: store.address || '',
        store_phone: store.phone || '',
      };

      await Promise.all([
        this.sendViaSMS(customer, store, 'promotion', variables, template),
        this.sendViaEmail(customer, store, 'promotion', variables, template),
        this.sendViaWhatsApp(customer, store, 'promotion', variables, template),
      ]);
    });

    await Promise.all(promises);
  }

  async sendRegistrationWelcome(
    customer: Customer,
    store: Store
  ): Promise<void> {
    const variables = {
      customer_name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      store_name: store.name,
      store_address: store.address || '',
      store_phone: store.phone || '',
    };

    await Promise.all([
      this.sendViaSMS(customer, store, 'registration', variables),
      this.sendViaEmail(customer, store, 'registration', variables),
      this.sendViaWhatsApp(customer, store, 'registration', variables),
    ]);
  }

  async sendBirthdayMessage(
    customer: Customer,
    store: Store
  ): Promise<void> {
    const variables = {
      customer_name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      store_name: store.name,
      store_address: store.address || '',
      store_phone: store.phone || '',
    };

    await Promise.all([
      this.sendViaSMS(customer, store, 'birthday', variables),
      this.sendViaEmail(customer, store, 'birthday', variables),
      this.sendViaWhatsApp(customer, store, 'birthday', variables),
    ]);
  }

  private async sendViaSMS(
    customer: Customer,
    store: Store,
    category: string,
    variables: Record<string, string>,
    customTemplate?: CommunicationTemplate
  ): Promise<void> {
    try {
      const { storage } = await import('./storage');
      
      // Get SMS settings
      const smsSettings = await storage.getSmsSettings(store.id);
      if (!smsSettings?.isEnabled) return;

      // Check customer preferences
      const preferences = await storage.getCustomerCommunicationPreferences(customer.id);
      if (preferences && !preferences.smsEnabled) return;

      // Get template
      const template = customTemplate || await storage.getCommunicationTemplate(store.id, 'sms', category);
      if (!template) return;

      // Replace variables in template
      const message = this.replaceVariables(template.content, variables);
      
      // Send SMS
      const smsService = SmsServiceFactory.createService(smsSettings.providerName);
      const result = await smsService.sendSms(customer.mobile, message, smsSettings);

      // Log the message
      await storage.createCommunicationMessage({
        storeId: store.id,
        customerId: customer.id,
        type: 'sms',
        category,
        recipient: customer.mobile,
        content: message,
        status: result.success ? 'sent' : 'failed',
        providerId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : undefined,
      });
    } catch (error) {
      console.error('SMS sending error:', error);
    }
  }

  private async sendViaEmail(
    customer: Customer,
    store: Store,
    category: string,
    variables: Record<string, string>,
    customTemplate?: CommunicationTemplate
  ): Promise<void> {
    try {
      if (!customer.email) return;

      const { storage } = await import('./storage');
      
      // Get email settings
      const emailSettings = await storage.getEmailSettings(store.id);
      if (!emailSettings?.isEnabled) return;

      // Check customer preferences
      const preferences = await storage.getCustomerCommunicationPreferences(customer.id);
      if (preferences && !preferences.emailEnabled) return;

      // Get template
      const template = customTemplate || await storage.getCommunicationTemplate(store.id, 'email', category);
      if (!template) return;

      // Replace variables in template
      const subject = this.replaceVariables(template.subject || 'Notification', variables);
      const content = this.replaceVariables(template.content, variables);
      
      // Send email
      const emailService = EmailServiceFactory.createService(emailSettings.providerName);
      const result = await emailService.sendEmail(customer.email, subject, content, emailSettings);

      // Log the message
      await storage.createCommunicationMessage({
        storeId: store.id,
        customerId: customer.id,
        type: 'email',
        category,
        recipient: customer.email,
        subject,
        content,
        status: result.success ? 'sent' : 'failed',
        providerId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : undefined,
      });
    } catch (error) {
      console.error('Email sending error:', error);
    }
  }

  private async sendViaWhatsApp(
    customer: Customer,
    store: Store,
    category: string,
    variables: Record<string, string>,
    customTemplate?: CommunicationTemplate
  ): Promise<void> {
    try {
      const { storage } = await import('./storage');
      
      // Get WhatsApp settings
      const whatsappSettings = await storage.getWhatsappSettings(store.id);
      if (!whatsappSettings?.isEnabled) return;

      // Check customer preferences
      const preferences = await storage.getCustomerCommunicationPreferences(customer.id);
      if (preferences && !preferences.whatsappEnabled) return;

      // Get WhatsApp template
      const template = await storage.getWhatsappTemplate(store.id, category);
      if (!template) return;

      // Replace variables in template
      const message = this.replaceVariables(template.content, variables);
      
      // Send WhatsApp message
      const result = await this.whatsappService.sendTextMessage(customer.mobile, message, whatsappSettings);

      // Log the message
      await storage.createWhatsappMessage({
        storeId: store.id,
        customerId: customer.id,
        phoneNumber: customer.mobile,
        messageType: category,
        templateId: template.id,
        content: message,
        status: result.success ? 'sent' : 'failed',
        whatsappMessageId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : undefined,
      });
    } catch (error) {
      console.error('WhatsApp sending error:', error);
    }
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }
}

// Singleton instance
export const communicationService = new UnifiedCommunicationService();

// Helper function to ensure default communication templates exist
export async function ensureDefaultTemplates(storeId: number): Promise<void> {
  try {
    const { storage } = await import('./storage');
    
    // Default appointment confirmation templates
    const defaultTemplates = [
      {
        storeId,
        type: 'sms',
        category: 'appointment_confirmation',
        name: 'Appointment Confirmation SMS',
        content: 'Hi {customer_name}! Your appointment at {store_name} is confirmed for {appointment_date} at {appointment_time}. Service: {service_name}. Thank you!',
        variables: ['customer_name', 'store_name', 'appointment_date', 'appointment_time', 'service_name'],
        isActive: true
      },
      {
        storeId,
        type: 'email',
        category: 'appointment_confirmation',
        name: 'Appointment Confirmation Email',
        subject: 'Appointment Confirmed - {store_name}',
        content: `Dear {customer_name},

Your appointment has been confirmed!

📅 Date: {appointment_date}
🕐 Time: {appointment_time}
💅 Service: {service_name}
🏪 Location: {store_name}
📍 Address: {store_address}
📞 Contact: {store_phone}

We look forward to seeing you!

Best regards,
{store_name} Team`,
        variables: ['customer_name', 'store_name', 'appointment_date', 'appointment_time', 'service_name', 'store_address', 'store_phone'],
        isActive: true
      },
      {
        storeId,
        type: 'whatsapp',
        category: 'appointment_confirmation',
        name: 'Appointment Confirmation WhatsApp',
        content: '✨ Hello {customer_name}!\n\nYour appointment is confirmed:\n📅 {appointment_date} at {appointment_time}\n💅 Service: {service_name}\n📍 {store_name}\n\nSee you soon! 😊',
        variables: ['customer_name', 'appointment_date', 'appointment_time', 'service_name', 'store_name'],
        isActive: true
      }
    ];

    // Check if templates already exist, if not create them
    for (const template of defaultTemplates) {
      const existing = await storage.getCommunicationTemplate(storeId, template.type, template.category);
      if (!existing) {
        await storage.createCommunicationTemplate(storeId, template);
        console.log(`Created default ${template.type} template for ${template.category}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring default templates:', error);
  }
}

// Helper function to send appointment-related communications
export async function sendAppointmentNotification(
  appointmentId: number,
  type: 'confirmation' | 'reminder',
  storeId: number
): Promise<void> {
  try {
    const { storage } = await import('./storage');
    
    // Ensure default templates exist
    await ensureDefaultTemplates(storeId);
    
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) return;

    // Get customer by phone number since appointments don't link to customer ID directly
    const customers = await storage.getCustomers(storeId);
    const customer = customers.find(c => c.mobile === appointment.customerPhone);
    if (!customer) {
      console.log(`No customer found with mobile ${appointment.customerPhone} for store ${storeId}`);
      return;
    }

    const store = await storage.getStore(storeId);
    if (!store) return;

    // Get assigned staff if any
    const assignedStaff = await storage.getAppointmentStaff(appointmentId);
    let staff = null;
    if (assignedStaff.length > 0) {
      staff = await storage.getUser(assignedStaff[0].staffId);
    }

    if (type === 'confirmation') {
      await communicationService.sendAppointmentConfirmation(appointment, customer, store, staff);
    } else {
      await communicationService.sendAppointmentReminder(appointment, customer, store, staff);
    }
  } catch (error) {
    console.error('Error sending appointment notification:', error);
  }
}