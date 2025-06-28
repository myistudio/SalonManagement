import jsPDF from 'jspdf';

interface BillData {
  invoiceNumber: string;
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
}

export function generatePDF(billData: BillData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('SalonPro', 20, 20);
  doc.setFontSize(16);
  doc.text('Invoice', 20, 30);
  
  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${billData.invoiceNumber}`, 20, 45);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // Customer details
  if (billData.customer) {
    doc.text('Bill To:', 20, 70);
    doc.text(`${billData.customer.firstName} ${billData.customer.lastName || ''}`, 20, 80);
    doc.text(`Mobile: ${billData.customer.mobile}`, 20, 90);
  }
  
  // Items table
  let yPos = 110;
  doc.text('Items:', 20, yPos);
  yPos += 10;
  
  doc.text('Description', 20, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 150, yPos);
  doc.text('Total', 180, yPos);
  yPos += 5;
  
  // Draw line
  doc.line(20, yPos, 200, yPos);
  yPos += 10;
  
  billData.items.forEach((item) => {
    doc.text(item.name, 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`Rs. ${item.price.toFixed(2)}`, 150, yPos);
    doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 180, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.line(120, yPos, 200, yPos);
  yPos += 10;
  
  doc.text(`Subtotal: Rs. ${billData.subtotal.toFixed(2)}`, 120, yPos);
  yPos += 10;
  
  if (billData.discount > 0) {
    doc.text(`Discount: -Rs. ${billData.discount.toFixed(2)}`, 120, yPos);
    yPos += 10;
  }
  
  doc.text(`GST (18%): Rs. ${billData.gst.toFixed(2)}`, 120, yPos);
  yPos += 10;
  
  doc.setFontSize(14);
  doc.text(`Total: Rs. ${billData.total.toFixed(2)}`, 120, yPos);
  
  // Loyalty points
  if (billData.pointsEarned > 0 || billData.pointsRedeemed > 0) {
    yPos += 20;
    doc.setFontSize(12);
    if (billData.pointsRedeemed > 0) {
      doc.text(`Points Redeemed: ${billData.pointsRedeemed}`, 20, yPos);
      yPos += 10;
    }
    doc.text(`Points Earned: ${billData.pointsEarned}`, 20, yPos);
  }
  
  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 20, 280);
  
  // Download the PDF
  doc.save(`invoice-${billData.invoiceNumber}.pdf`);
}
