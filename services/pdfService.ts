import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Invoice } from "../types";

// Helper to get the PDF blob instead of saving directly
export const generateInvoicePDF = (invoice: Invoice, returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 15;
  const symbol = invoice.currencySymbol || '$';

  // Colors
  const grayLight = 150;
  const grayDark = 50;
  const black = 0;

  // --- Header ---
  // Left Side: Name & Address
  doc.setFontSize(18);
  doc.setTextColor(black);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.sellerName || "Seller Name", margin, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayDark);
  
  let sellerLines = [];
  if (invoice.sellerAddress) sellerLines.push(invoice.sellerAddress);
  if (invoice.sellerAddress2) sellerLines.push(invoice.sellerAddress2);
  
  doc.text(sellerLines, margin, yPos);
  yPos += (sellerLines.length * 4) + 4;

  // Contact Info
  if (invoice.sellerPhone) doc.text(`Contact: ${invoice.sellerPhone}`, margin, yPos);
  if (invoice.sellerEmail) doc.text(invoice.sellerEmail, margin, yPos + 4);

  // Right Side: INVOICE Label
  const rightColX = 140;
  doc.setFontSize(28);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, 25, { align: "right" });

  // --- Details Section (Account Details / Billed To / Invoice Info) ---
  yPos = 60;
  
  // Column headers styling
  doc.setFontSize(8);
  doc.setTextColor(grayLight); // Blue-ish/Dark Gray
  doc.setFont("helvetica", "bold");
  
  doc.text("ACCOUNT DETAILS", margin, yPos);
  doc.text("BILLED TO", 80, yPos);
  
  // Details Data
  yPos += 5;
  doc.setDrawColor(200);
  doc.line(margin, yPos, 60, yPos); // Underline Account Details
  doc.line(80, yPos, 130, yPos); // Underline Billed To

  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(black);
  doc.setFont("helvetica", "normal");

  // Account Details Data
  let bankY = yPos;
  if (invoice.bankDetails.accountName) { doc.text(invoice.bankDetails.accountName, margin, bankY); bankY += 4; }
  if (invoice.bankDetails.bankName) { doc.text(invoice.bankDetails.bankName, margin, bankY); bankY += 4; }
  if (invoice.bankDetails.accountNumber) { doc.text(`ACC NO: ${invoice.bankDetails.accountNumber}`, margin, bankY); bankY += 4; }
  if (invoice.bankDetails.swiftCode) { doc.text(`Swift Code ${invoice.bankDetails.swiftCode}`, margin, bankY); bankY += 4; }

  // Billed To Data
  let clientY = yPos;
  doc.text(invoice.clientName || "Client Name", 80, clientY); clientY += 4;
  if(invoice.clientEmail) { doc.text(`Contact: ${invoice.clientEmail}`, 80, clientY); clientY += 4; }
  
  let clientAddr = [];
  if(invoice.clientAddress) clientAddr.push(invoice.clientAddress);
  if(invoice.clientAddress2) clientAddr.push(invoice.clientAddress2);
  doc.text(clientAddr, 80, clientY);

  // Invoice Meta Data (Right aligned list)
  let metaY = yPos - 6; // Align with headers roughly
  const metaLabelX = 150;
  const metaValueX = pageWidth - margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  doc.text("Invoice No:", metaLabelX, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.number, metaValueX, metaY, { align: "right" });
  metaY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", metaLabelX, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.date, metaValueX, metaY, { align: "right" });
  metaY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", metaLabelX, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.dueDate, metaValueX, metaY, { align: "right" });
  
  yPos = Math.max(bankY, clientY, metaY) + 15;

  // --- Items Table ---
  const colDesc = margin + 2;
  const colQty = 110;
  const colPrice = 145;
  const colTotal = pageWidth - margin - 2;

  // Header
  doc.setDrawColor(200);
  doc.rect(margin, yPos, contentWidth, 8);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  
  doc.text("DESCRIPTION", colDesc + 10, yPos + 5.5); // Centered roughly
  doc.text("QTY", colQty, yPos + 5.5, { align: "center" });
  doc.text("UNIT PRICE", colPrice, yPos + 5.5, { align: "right" });
  doc.text("TOTAL", colTotal, yPos + 5.5, { align: "right" });
  
  yPos += 8;

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(black);
  let subtotal = 0;

  // Define grid lines
  const drawGridRow = (y: number, h: number) => {
    doc.rect(margin, y, contentWidth, h);
    doc.line(colQty - 10, y, colQty - 10, y + h); // Vertical line before Qty
    doc.line(colPrice - 25, y, colPrice - 25, y + h); // Vertical line before Price
    doc.line(colTotal - 30, y, colTotal - 30, y + h); // Vertical line before Total
  };

  invoice.items.forEach((item) => {
    const lineAmount = item.quantity * item.rate;
    subtotal += lineAmount;

    const descWidth = (colQty - 10) - margin - 4;
    const descLines = doc.splitTextToSize(item.description, descWidth);
    const rowHeight = Math.max(7, descLines.length * 4 + 2);

    if (yPos + rowHeight > 260) {
      doc.addPage();
      yPos = 20;
    }

    drawGridRow(yPos, rowHeight);

    doc.text(descLines, colDesc, yPos + 4);
    doc.text(item.quantity.toString(), colQty, yPos + 4, { align: "center" });
    doc.text(`${item.rate.toFixed(2)}`, colPrice, yPos + 4, { align: "right" });
    doc.text(`${lineAmount.toFixed(2)}`, colTotal, yPos + 4, { align: "right" });

    yPos += rowHeight;
  });

  // Fill empty rows to make it look like the template (optional aesthetic)
  const minRows = 5;
  const emptyRowsNeeded = Math.max(0, minRows - invoice.items.length);
  for(let i=0; i<emptyRowsNeeded; i++) {
      if (yPos + 7 > 260) break;
      drawGridRow(yPos, 7);
      yPos += 7;
  }

  yPos += 5;

  // --- Footer Calculations ---
  const footerX = 130;
  
  const discountAmount = subtotal * (invoice.discountRate / 100);
  const total = subtotal - discountAmount + invoice.shipping;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);

  // Subtotal
  doc.text("SUBTOTAL", pageWidth - 50, yPos, { align: "right" });
  doc.setTextColor(black);
  doc.setFont("helvetica", "normal");
  doc.text(`${subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  doc.setDrawColor(230);
  doc.line(pageWidth - 55, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 6;

  // Discount
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("DISCOUNT", pageWidth - 50, yPos, { align: "right" });
  doc.setTextColor(black);
  doc.setFont("helvetica", "normal");
  doc.text(`${discountAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  doc.line(pageWidth - 55, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 6;

  // Subtotal Less Discount
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("SUBTOTAL", pageWidth - 50, yPos, { align: "right" });
  doc.text("LESS DISCOUNT", pageWidth - 50, yPos + 3, { align: "right" });
  doc.setTextColor(black);
  doc.setFont("helvetica", "normal");
  doc.text(`${(subtotal - discountAmount).toFixed(2)}`, pageWidth - margin, yPos + 3, { align: "right" });
  doc.line(pageWidth - 55, yPos + 5, pageWidth - margin, yPos + 5);
  yPos += 9;

  // Shipping
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);
  doc.text("SHIPPING/HANDLING", pageWidth - 50, yPos, { align: "right" });
  doc.setTextColor(black);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice.shipping.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  doc.line(pageWidth - 55, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 6;

  // Total
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50);
  doc.text("Total Amount", pageWidth - 50, yPos + 2, { align: "right" });
  doc.setTextColor(black);
  doc.text(`${total.toFixed(2)} ${invoice.currencySymbol === '$' ? 'USD' : invoice.currencySymbol}`, pageWidth - margin, yPos + 2, { align: "right" });

  // Left side Footer Note
  if (invoice.footerNote) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(black);
      doc.text(invoice.footerNote, margin, yPos);
  }

  // Signature Line
  const sigY = 270;
  doc.setDrawColor(0);
  doc.line(pageWidth - 70, sigY, pageWidth - margin, sigY);

  // Bottom Line
  doc.setDrawColor(200);
  doc.line(margin, 280, 80, 280);


  if (returnBlob) {
    return doc.output("blob");
  } else {
    doc.save(`Invoice-${invoice.number}.pdf`);
  }
};

export const generateBatchZip = async (invoices: Invoice[]) => {
  const zip = new JSZip();
  
  invoices.forEach((invoice) => {
    const blob = generateInvoicePDF(invoice, true);
    if (blob instanceof Blob) {
        zip.file(`Invoice-${invoice.number}.pdf`, blob);
    }
  });

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = "Invoices_Batch.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
