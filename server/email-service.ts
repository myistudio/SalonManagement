import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { EmailSettings, CommunicationTemplate, InsertCommunicationMessage } from "@shared/schema";

export interface EmailServiceAPI {
  sendEmail(
    to: string,
    subject: string,
    content: string,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  sendTemplateEmail(
    to: string,
    template: CommunicationTemplate,
    parameters: Record<string, string>,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class SMTPEmailService implements EmailServiceAPI {
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword || !settings.fromEmail) {
      return { success: false, error: "SMTP settings not configured" };
    }

    try {
      const transporter = nodemailer.createTransporter({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      });

      const mailOptions = {
        from: `${settings.fromName || 'SalonPro'} <${settings.fromEmail}>`,
        to: to,
        subject: subject,
        html: content,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: `SMTP error: ${(error as Error).message}`,
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    template: CommunicationTemplate,
    parameters: Record<string, string>,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = replaceTemplateVariables(template.subject || 'Notification', parameters);
    const content = replaceTemplateVariables(template.content, parameters);
    
    return this.sendEmail(to, subject, content, settings);
  }
}

export class SendGridEmailService implements EmailServiceAPI {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!process.env.SENDGRID_API_KEY || !settings.fromEmail) {
      return { success: false, error: "SendGrid API key or from email not configured" };
    }

    try {
      const msg = {
        to: to,
        from: `${settings.fromName || 'SalonPro'} <${settings.fromEmail}>`,
        subject: subject,
        html: content,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const response = await this.mailService.send(msg);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id'] as string,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `SendGrid error: ${error.message || error}`,
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    template: CommunicationTemplate,
    parameters: Record<string, string>,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = replaceTemplateVariables(template.subject || 'Notification', parameters);
    const content = replaceTemplateVariables(template.content, parameters);
    
    return this.sendEmail(to, subject, content, settings);
  }
}

export class GmailEmailService implements EmailServiceAPI {
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.smtpUser || !settings.smtpPassword || !settings.fromEmail) {
      return { success: false, error: "Gmail settings not configured" };
    }

    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword, // App password for Gmail
        },
      });

      const mailOptions = {
        from: `${settings.fromName || 'SalonPro'} <${settings.fromEmail}>`,
        to: to,
        subject: subject,
        html: content,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Gmail error: ${(error as Error).message}`,
      };
    }
  }

  async sendTemplateEmail(
    to: string,
    template: CommunicationTemplate,
    parameters: Record<string, string>,
    settings: EmailSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = replaceTemplateVariables(template.subject || 'Notification', parameters);
    const content = replaceTemplateVariables(template.content, parameters);
    
    return this.sendEmail(to, subject, content, settings);
  }
}

// Factory for email services
export class EmailServiceFactory {
  static createService(providerName: string): EmailServiceAPI {
    switch (providerName.toLowerCase()) {
      case 'smtp':
        return new SMTPEmailService();
      case 'sendgrid':
        return new SendGridEmailService();
      case 'gmail':
        return new GmailEmailService();
      default:
        throw new Error(`Unsupported email provider: ${providerName}`);
    }
  }
}

// Template variable replacement utility
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

// Default email service instance
export const emailService = new SMTPEmailService();