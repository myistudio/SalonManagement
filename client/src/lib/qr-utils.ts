// QR Code utilities for product management
export function generateQRCode(data: string): string {
  // For MVP, we'll generate a simple QR code data string
  // In production, you might want to use a proper QR code library
  return `QR-${Date.now()}-${data.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
}

export function parseQRCode(qrData: string): { type: string; id: string } | null {
  // Parse QR code data to extract product information
  try {
    if (qrData.startsWith('QR-')) {
      const parts = qrData.split('-');
      return {
        type: 'product',
        id: parts[parts.length - 1]
      };
    }
    
    // Handle barcode format
    if (/^\d+$/.test(qrData)) {
      return {
        type: 'barcode',
        id: qrData
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
}

export function formatBarcode(barcode: string): string {
  // Format barcode for display
  return barcode.replace(/(\d{4})(?=\d)/g, '$1-');
}
