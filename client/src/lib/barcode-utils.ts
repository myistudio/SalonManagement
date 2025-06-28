import JsBarcode from 'jsbarcode';

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

export function printMultipleBarcodes(products: Array<{code: string, name: string, quantity?: number}>): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  let barcodeHtml = '';
  
  products.forEach(product => {
    const quantity = product.quantity || 1;
    const barcodeDataUrl = generateBarcode(product.code);
    
    if (barcodeDataUrl) {
      for (let i = 0; i < quantity; i++) {
        barcodeHtml += `
          <div class="barcode-container">
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
      <title>Print Barcodes</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .barcode-container {
          border: 1px solid #ccc;
          padding: 15px;
          margin: 10px;
          display: inline-block;
          background: white;
          width: 200px;
          text-align: center;
          vertical-align: top;
        }
        .product-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
          word-wrap: break-word;
        }
        .barcode-image {
          display: block;
          margin: 0 auto;
          max-width: 180px;
        }
        .barcode-text {
          font-size: 10px;
          margin-top: 5px;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .barcode-container { 
            border: 1px solid #000; 
            page-break-inside: avoid;
            margin: 5px;
          }
        }
      </style>
    </head>
    <body>
      ${barcodeHtml}
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