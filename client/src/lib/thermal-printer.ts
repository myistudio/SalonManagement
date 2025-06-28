// Thermal printer utility for receipt printing
// This works with ESC/POS compatible thermal printers

interface ReceiptData {
  invoiceNumber: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customer?: {
    firstName: string;
    lastName?: string;
    mobile: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  pointsEarned: number;
  pointsRedeemed: number;
  paymentMethod: string;
  cashier: string;
  timestamp: Date;
}

// ESC/POS commands for thermal printer
const ESC = '\x1b';
const commands = {
  init: ESC + '@',              // Initialize printer
  reset: ESC + '@',             // Reset printer
  centerAlign: ESC + 'a' + '1', // Center text alignment
  leftAlign: ESC + 'a' + '0',   // Left text alignment
  rightAlign: ESC + 'a' + '2',  // Right text alignment
  bold: ESC + 'E' + '1',        // Bold text on
  boldOff: ESC + 'E' + '0',     // Bold text off
  underline: ESC + '-' + '1',   // Underline on
  underlineOff: ESC + '-' + '0', // Underline off
  largeFontOn: ESC + '!' + '1',  // Large font on
  largeFontOff: ESC + '!' + '0', // Large font off
  doubleHeight: ESC + '!' + '\x10', // Double height
  doubleWidth: ESC + '!' + '\x20',  // Double width
  cutPaper: ESC + 'm',          // Cut paper
  openDrawer: ESC + 'p' + '0' + '\x19' + '\xfa', // Open cash drawer
  newLine: '\n',
  tab: '\t',
  feed: ESC + 'd' + '3',        // Feed 3 lines
};

export function generateThermalReceipt(data: ReceiptData): string {
  const receipt = [];
  
  // Initialize printer
  receipt.push(commands.init);
  receipt.push(commands.centerAlign);
  
  // Store header
  receipt.push(commands.bold);
  receipt.push(commands.doubleHeight);
  receipt.push(data.storeName.toUpperCase());
  receipt.push(commands.newLine);
  receipt.push(commands.boldOff);
  receipt.push(commands.largeFontOff);
  
  if (data.storeAddress) {
    receipt.push(data.storeAddress);
    receipt.push(commands.newLine);
  }
  
  if (data.storePhone) {
    receipt.push(`Tel: ${data.storePhone}`);
    receipt.push(commands.newLine);
  }
  
  // Separator line
  receipt.push(commands.leftAlign);
  receipt.push('='.repeat(32));
  receipt.push(commands.newLine);
  
  // Invoice details
  receipt.push(commands.bold);
  receipt.push(`Invoice: ${data.invoiceNumber}`);
  receipt.push(commands.newLine);
  receipt.push(commands.boldOff);
  
  receipt.push(`Date: ${data.timestamp.toLocaleDateString()}`);
  receipt.push(commands.newLine);
  receipt.push(`Time: ${data.timestamp.toLocaleTimeString()}`);
  receipt.push(commands.newLine);
  
  if (data.customer) {
    receipt.push(`Customer: ${data.customer.firstName} ${data.customer.lastName || ''}`);
    receipt.push(commands.newLine);
    receipt.push(`Mobile: ${data.customer.mobile}`);
    receipt.push(commands.newLine);
  }
  
  receipt.push(`Cashier: ${data.cashier}`);
  receipt.push(commands.newLine);
  
  // Items separator
  receipt.push('='.repeat(32));
  receipt.push(commands.newLine);
  
  // Items header
  receipt.push(commands.bold);
  receipt.push(formatLine('Item', 'Qty', 'Price'));
  receipt.push(commands.newLine);
  receipt.push(commands.boldOff);
  receipt.push('-'.repeat(32));
  receipt.push(commands.newLine);
  
  // Items list
  data.items.forEach(item => {
    receipt.push(item.name);
    receipt.push(commands.newLine);
    receipt.push(formatLine(
      '', 
      item.quantity.toString(), 
      `Rs. ${item.price.toFixed(2)}`
    ));
    receipt.push(commands.newLine);
  });
  
  // Totals separator
  receipt.push('-'.repeat(32));
  receipt.push(commands.newLine);
  
  // Totals
  receipt.push(formatLine('Subtotal:', '', `Rs. ${data.subtotal.toFixed(2)}`));
  receipt.push(commands.newLine);
  
  if (data.discount > 0) {
    receipt.push(formatLine('Discount:', '', `-Rs. ${data.discount.toFixed(2)}`));
    receipt.push(commands.newLine);
  }
  
  if (data.gst > 0) {
    receipt.push(formatLine('GST:', '', `Rs. ${data.gst.toFixed(2)}`));
    receipt.push(commands.newLine);
  }
  
  receipt.push('='.repeat(32));
  receipt.push(commands.newLine);
  
  // Final total
  receipt.push(commands.bold);
  receipt.push(commands.doubleWidth);
  receipt.push(formatLine('TOTAL:', '', `Rs. ${data.total.toFixed(2)}`));
  receipt.push(commands.newLine);
  receipt.push(commands.boldOff);
  receipt.push(commands.largeFontOff);
  
  receipt.push('='.repeat(32));
  receipt.push(commands.newLine);
  
  // Payment method
  receipt.push(`Payment: ${data.paymentMethod}`);
  receipt.push(commands.newLine);
  
  // Loyalty points
  if (data.pointsEarned > 0) {
    receipt.push(`Points Earned: ${data.pointsEarned}`);
    receipt.push(commands.newLine);
  }
  
  if (data.pointsRedeemed > 0) {
    receipt.push(`Points Redeemed: ${data.pointsRedeemed}`);
    receipt.push(commands.newLine);
  }
  
  // Footer
  receipt.push(commands.centerAlign);
  receipt.push(commands.newLine);
  receipt.push('Thank you for visiting!');
  receipt.push(commands.newLine);
  receipt.push('Visit us again soon');
  receipt.push(commands.newLine);
  receipt.push(commands.newLine);
  
  // Cut paper and open drawer
  receipt.push(commands.feed);
  receipt.push(commands.cutPaper);
  
  return receipt.join('');
}

function formatLine(left: string, middle: string, right: string): string {
  const width = 32;
  const leftWidth = 12;
  const middleWidth = 8;
  const rightWidth = 12;
  
  const leftPadded = left.padEnd(leftWidth).substring(0, leftWidth);
  const middlePadded = middle.padStart(middleWidth).substring(0, middleWidth);
  const rightPadded = right.padStart(rightWidth).substring(0, rightWidth);
  
  return leftPadded + middlePadded + rightPadded;
}

export function printToThermalPrinter(receiptData: ReceiptData) {
  try {
    const thermalReceipt = generateThermalReceipt(receiptData);
    
    // For web browsers, we'll use the Web Serial API or print dialog
    if ('serial' in navigator) {
      // Use Web Serial API for direct printer communication
      printViaSerial(thermalReceipt);
    } else {
      // Fallback to print dialog with monospace formatting
      printViaDialog(receiptData);
    }
  } catch (error) {
    console.error('Thermal printer error:', error);
    // Fallback to regular print
    printViaDialog(receiptData);
  }
}

async function printViaSerial(thermalData: string) {
  try {
    // Request access to serial port
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    
    await writer.write(encoder.encode(thermalData));
    
    writer.releaseLock();
    await port.close();
  } catch (error) {
    console.error('Serial printing failed:', error);
    throw error;
  }
}

function printViaDialog(receiptData: ReceiptData) {
  // Create a formatted receipt for regular printing
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) return;
  
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${receiptData.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 300px;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .line { border-bottom: 1px solid #000; margin: 5px 0; }
        .dashed { border-bottom: 1px dashed #000; margin: 2px 0; }
        .row { display: flex; justify-content: space-between; }
        .no-margin { margin: 0; }
        @media print {
          body { width: auto; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="bold large">${receiptData.storeName.toUpperCase()}</div>
        ${receiptData.storeAddress ? `<div>${receiptData.storeAddress}</div>` : ''}
        ${receiptData.storePhone ? `<div>Tel: ${receiptData.storePhone}</div>` : ''}
      </div>
      
      <div class="line"></div>
      
      <div class="bold">Invoice: ${receiptData.invoiceNumber}</div>
      <div>Date: ${receiptData.timestamp.toLocaleDateString()}</div>
      <div>Time: ${receiptData.timestamp.toLocaleTimeString()}</div>
      ${receiptData.customer ? `
        <div>Customer: ${receiptData.customer.firstName} ${receiptData.customer.lastName || ''}</div>
        <div>Mobile: ${receiptData.customer.mobile}</div>
      ` : ''}
      <div>Cashier: ${receiptData.cashier}</div>
      
      <div class="line"></div>
      
      <div class="bold row">
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
      </div>
      <div class="dashed"></div>
      
      ${receiptData.items.map(item => `
        <div>${item.name}</div>
        <div class="row no-margin">
          <span></span>
          <span>${item.quantity}</span>
          <span>₹${item.price.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <div class="dashed"></div>
      
      <div class="row">
        <span>Subtotal:</span>
        <span>₹${receiptData.subtotal.toFixed(2)}</span>
      </div>
      ${receiptData.discount > 0 ? `
        <div class="row">
          <span>Discount:</span>
          <span>-₹${receiptData.discount.toFixed(2)}</span>
        </div>
      ` : ''}
      ${receiptData.gst > 0 ? `
        <div class="row">
          <span>GST:</span>
          <span>₹${receiptData.gst.toFixed(2)}</span>
        </div>
      ` : ''}
      
      <div class="line"></div>
      
      <div class="row bold large">
        <span>TOTAL:</span>
        <span>₹${receiptData.total.toFixed(2)}</span>
      </div>
      
      <div class="line"></div>
      
      <div>Payment: ${receiptData.paymentMethod}</div>
      ${receiptData.pointsEarned > 0 ? `<div>Points Earned: ${receiptData.pointsEarned}</div>` : ''}
      ${receiptData.pointsRedeemed > 0 ? `<div>Points Redeemed: ${receiptData.pointsRedeemed}</div>` : ''}
      
      <div class="center" style="margin-top: 20px;">
        <div>Thank you for visiting!</div>
        <div>Visit us again soon</div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 1000);
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}

export function openCashDrawer() {
  try {
    if ('serial' in navigator) {
      openDrawerViaSerial();
    } else {
      console.log('Cash drawer command sent (requires thermal printer)');
    }
  } catch (error) {
    console.error('Failed to open cash drawer:', error);
  }
}

async function openDrawerViaSerial() {
  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    
    await writer.write(encoder.encode(commands.openDrawer));
    
    writer.releaseLock();
    await port.close();
  } catch (error) {
    console.error('Serial drawer opening failed:', error);
  }
}