import { WhatsappSettings, WhatsappTemplate, InsertWhatsappMessage } from "@shared/schema";

export interface WhatsAppBusinessAPI {
  sendMessage(
    phoneNumber: string, 
    templateName: string, 
    parameters: string[], 
    settings: WhatsappSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  sendTextMessage(
    phoneNumber: string, 
    message: string, 
    settings: WhatsappSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class WhatsAppService implements WhatsAppBusinessAPI {
  private readonly baseUrl = "https://graph.facebook.com/v18.0";

  async sendMessage(
    phoneNumber: string,
    templateName: string,
    parameters: string[],
    settings: WhatsappSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.accessToken || !settings.phoneNumberId) {
      return { success: false, error: "WhatsApp API not configured" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${settings.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${settings.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: templateName,
              language: {
                code: "en_US"
              },
              components: parameters.length > 0 ? [{
                type: "body",
                parameters: parameters.map(param => ({
                  type: "text",
                  text: param
                }))
              }] : []
            }
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.messages) {
        return {
          success: true,
          messageId: data.messages[0].id
        };
      } else {
        return {
          success: false,
          error: data.error?.message || "Failed to send message"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`
      };
    }
  }

  async sendTextMessage(
    phoneNumber: string,
    message: string,
    settings: WhatsappSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!settings.accessToken || !settings.phoneNumberId) {
      return { success: false, error: "WhatsApp API not configured" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${settings.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${settings.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: {
              body: message
            }
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.messages) {
        return {
          success: true,
          messageId: data.messages[0].id
        };
      } else {
        return {
          success: false,
          error: data.error?.message || "Failed to send message"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${(error as Error).message}`
      };
    }
  }

  // Template variable replacement utility
  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  // Format phone number to WhatsApp format (remove + and spaces)
  formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d]/g, '');
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted.length >= 10 && formatted.length <= 15;
  }
}

export const whatsappService = new WhatsAppService();