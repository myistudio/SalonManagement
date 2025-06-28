import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export function generateBarcode(code: string, format: string = 'CODE128'): string {
  const canvas = document.createElement('canvas');
  
  try {
    JsBarcode(canvas, code, {
      format: format,
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 12,
      margin: 10,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
}

export function printBarcode(code: string, productName: string): void {
  const barcodeDataUrl = generateBarcode(code);
  
  if (!barcodeDataUrl) {
    console.error('Failed to generate barcode');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Barcode</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        .barcode-container {
          border: 1px solid #ccc;
          padding: 15px;
          margin: 10px;
          display: inline-block;
          background: white;
        }
        .product-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        .barcode-image {
          display: block;
          margin: 0 auto;
        }
        .barcode-text {
          font-size: 12px;
          margin-top: 5px;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .barcode-container { 
            border: 1px solid #000; 
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-container">
        <div class="product-name">${productName}</div>
        <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" />
        <div class="barcode-text">${code}</div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

export async function printQRCode(data: string, productName: string, price?: string): Promise<void> {
  try {
    const qrCodeDataUrl = await generateQRCode(data);
    
    if (!qrCodeDataUrl) {
      console.error('Failed to generate QR code');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5mm;
            width: 100%;
          }
          .qr-grid-item {
            border: 1px solid #ccc;
            padding: 2mm;
            text-align: center;
            background: white;
            width: 1in;
            height: 1in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            page-break-inside: avoid;
          }
          .product-name {
            font-size: 6pt;
            font-weight: bold;
            margin-bottom: 1mm;
            color: #333;
            word-wrap: break-word;
            line-height: 1.1;
            max-height: 10pt;
            overflow: hidden;
          }
          .product-price {
            font-size: 7pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 2mm;
          }
          .qr-image {
            max-width: 15mm;
            max-height: 15mm;
            object-fit: contain;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .qr-grid-item { 
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="qr-grid">
          <div class="qr-grid-item">
            <div class="product-name">${productName}</div>
            ${price ? `<div class="product-price">₹${price}</div>` : ''}
            <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-image" />
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing QR code:', error);
  }
}

export function printBarcodeWithPrice(code: string, productName: string, price: string): void {
  const barcodeDataUrl = generateBarcode(code);
  
  if (!barcodeDataUrl) {
    console.error('Failed to generate barcode');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Barcode with Price</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .barcode-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5mm;
          width: 100%;
        }
        .barcode-grid-item {
          border: 1px solid #ccc;
          padding: 2mm;
          text-align: center;
          background: white;
          width: 1in;
          height: 1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
        }
        .product-name {
          font-size: 6pt;
          font-weight: bold;
          margin-bottom: 1mm;
          color: #333;
          word-wrap: break-word;
          line-height: 1.1;
          max-height: 10pt;
          overflow: hidden;
        }
        .product-price {
          font-size: 7pt;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 1mm;
        }
        .barcode-image {
          max-width: 20mm;
          max-height: 10mm;
          object-fit: contain;
        }
        .barcode-text {
          font-size: 5pt;
          margin-top: 1mm;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .barcode-grid-item { 
            border: 1px solid #000;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-grid">
        <div class="barcode-grid-item">
          <div class="product-name">${productName}</div>
          <div class="product-price">₹${price}</div>
          <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" />
          <div class="barcode-text">${code}</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

export function printMultipleBarcodes(products: Array<{code: string, name: string, quantity?: number}>): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  let barcodeHTML = '';
  
  products.forEach(product => {
    const quantity = product.quantity || 1;
    for (let i = 0; i < quantity; i++) {
      const barcodeDataUrl = generateBarcode(product.code);
      if (barcodeDataUrl) {
        barcodeHTML += `
          <div class="barcode-grid-item">
            <div class="product-name">${product.name}</div>
            <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" />
            <div class="barcode-text">${product.code}</div>
          </div>
        `;
      }
    }
  });

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Multiple Barcodes</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .barcode-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5mm;
          width: 100%;
        }
        .barcode-grid-item {
          border: 1px solid #ccc;
          padding: 2mm;
          text-align: center;
          background: white;
          width: 1in;
          height: 1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
        }
        .product-name {
          font-size: 6pt;
          font-weight: bold;
          margin-bottom: 1mm;
          color: #333;
          word-wrap: break-word;
          line-height: 1.1;
          max-height: 12pt;
          overflow: hidden;
        }
        .barcode-image {
          max-width: 20mm;
          max-height: 12mm;
          object-fit: contain;
        }
        .barcode-text {
          font-size: 5pt;
          margin-top: 1mm;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .barcode-grid-item { 
            border: 1px solid #000;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-grid">
        ${barcodeHTML}
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

export function printGridBarcodes(product: any, quantity: number = 1): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  let barcodeHTML = '';
  
  for (let i = 0; i < quantity; i++) {
    const barcodeDataUrl = generateBarcode(product.barcode);
    if (barcodeDataUrl) {
      barcodeHTML += `
        <div class="barcode-grid-item">
          <div class="product-name">${product.name}</div>
          <div class="product-price">₹${parseFloat(product.price).toLocaleString()}</div>
          <img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" />
          <div class="barcode-text">${product.barcode}</div>
        </div>
      `;
    }
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Grid Barcodes</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .barcode-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5mm;
          width: 100%;
        }
        .barcode-grid-item {
          border: 1px solid #ccc;
          padding: 2mm;
          text-align: center;
          background: white;
          width: 1in;
          height: 1in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
        }
        .product-name {
          font-size: 6pt;
          font-weight: bold;
          margin-bottom: 1mm;
          color: #333;
          word-wrap: break-word;
          line-height: 1.1;
          max-height: 10pt;
          overflow: hidden;
        }
        .product-price {
          font-size: 7pt;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 1mm;
        }
        .barcode-image {
          max-width: 20mm;
          max-height: 10mm;
          object-fit: contain;
        }
        .barcode-text {
          font-size: 5pt;
          margin-top: 1mm;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .barcode-grid-item { 
            border: 1px solid #000;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-grid">
        ${barcodeHTML}
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

export async function printGridQRCodes(product: any, quantity: number = 1): Promise<void> {
  try {
    const qrData = JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.price,
      barcode: product.barcode || '',
      category: product.category || ''
    });

    const qrCodeDataUrl = await generateQRCode(qrData);
    
    if (!qrCodeDataUrl) {
      console.error('Failed to generate QR code');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    let qrHTML = '';
    
    for (let i = 0; i < quantity; i++) {
      qrHTML += `
        <div class="qr-grid-item">
          <div class="product-name">${product.name}</div>
          <div class="product-price">₹${parseFloat(product.price).toLocaleString()}</div>
          <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-image" />
        </div>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Grid QR Codes</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5mm;
            width: 100%;
          }
          .qr-grid-item {
            border: 1px solid #ccc;
            padding: 2mm;
            text-align: center;
            background: white;
            width: 1in;
            height: 1in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            page-break-inside: avoid;
          }
          .product-name {
            font-size: 6pt;
            font-weight: bold;
            margin-bottom: 1mm;
            color: #333;
            word-wrap: break-word;
            line-height: 1.1;
            max-height: 10pt;
            overflow: hidden;
          }
          .product-price {
            font-size: 7pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 2mm;
          }
          .qr-image {
            max-width: 15mm;
            max-height: 15mm;
            object-fit: contain;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .qr-grid-item { 
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="qr-grid">
          ${qrHTML}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing QR code grid:', error);
  }
}