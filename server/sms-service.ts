import { SmsSettings, CommunicationTemplate, InsertCommunicationMessage } from "@shared/schema";

export interface SmsServiceAPI {
  sendSms(
    phoneNumber: string,
    message: string,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  sendTemplateSms(
    phoneNumber: string,
    templateId: string,
    parameters: Record<string, string>,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class MSG91Service implements SmsServiceAPI {
  private readonly baseUrl = "https://api.msg91.com/api/v5";

  async sendSms(
    phoneNumber: string,
    message: string,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.apiKey || !settings.senderId) {
      return { success: false, error: "SMS API not configured" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/sms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": settings.apiKey,
        },
        body: JSON.stringify({
          sender: settings.senderId,
          route: "4",
          country: "91",
          sms: [
            {
              message: message,
              to: [phoneNumber],
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === "success") {
        return {
          success: true,
          messageId: data.request_id,
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to send SMS",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`,
      };
    }
  }

  async sendTemplateSms(
    phoneNumber: string,
    templateId: string,
    parameters: Record<string, string>,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.apiKey || !settings.senderId || !templateId) {
      return { success: false, error: "SMS template API not configured" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/sms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": settings.apiKey,
        },
        body: JSON.stringify({
          sender: settings.senderId,
          route: "4",
          country: "91",
          template_id: templateId,
          sms: [
            {
              message: "", // Message will be from template
              to: [phoneNumber],
              ...parameters, // Template variables
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === "success") {
        return {
          success: true,
          messageId: data.request_id,
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to send template SMS",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`,
      };
    }
  }
}

export class SMSGatewayHubService implements SmsServiceAPI {
  private readonly baseUrl = "https://www.smsgatewayhub.com/api/mt/SendSMS";

  async sendSms(
    phoneNumber: string,
    message: string,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.apiKey || !settings.senderId) {
      return { success: false, error: "SMS API not configured" };
    }

    try {
      const params = new URLSearchParams({
        APIKey: settings.apiKey,
        senderid: settings.senderId,
        channel: "2",
        DCS: "0",
        flashsms: "0",
        number: phoneNumber,
        text: message,
        route: "1",
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: "GET",
      });

      const data = await response.text();

      // SMSGatewayHub returns simple text response
      if (response.ok && data.includes("1701")) {
        // 1701 indicates success
        return {
          success: true,
          messageId: data.split("|")[1] || data,
        };
      } else {
        return {
          success: false,
          error: data || "Failed to send SMS",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`,
      };
    }
  }

  async sendTemplateSms(
    phoneNumber: string,
    templateId: string,
    parameters: Record<string, string>,
    settings: SmsSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // SMSGatewayHub doesn't have dedicated template API, so we'll send as regular SMS
    return this.sendSms(phoneNumber, templateId, settings); // templateId would be the actual message
  }
}

// Factory for SMS services
export class SmsServiceFactory {
  static createService(providerName: string): SmsServiceAPI {
    switch (providerName.toLowerCase()) {
      case 'msg91':
        return new MSG91Service();
      case 'smsgatewayhub':
        return new SMSGatewayHubService();
      default:
        throw new Error(`Unsupported SMS provider: ${providerName}`);
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

// SMS service instance
export const smsService = new MSG91Service(); // Default to MSG91