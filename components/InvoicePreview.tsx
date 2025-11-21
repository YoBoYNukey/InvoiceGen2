import React from 'react';
import { Invoice } from '../types';
import { Download } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';

interface InvoicePreviewProps {
  invoice: Invoice;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const discountAmount = subtotal * (invoice.discountRate / 100);
  const subtotalLessDiscount = subtotal - discountAmount;
  const total = subtotalLessDiscount + invoice.shipping;
  const symbol = invoice.currencySymbol || '$';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white">Real-time Preview</h2>
        <button 
          onClick={() => generateInvoicePDF(invoice)}
          className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-xs font-bold"
        >
          <Download size={14} />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 flex justify-center">
        {/* Paper Sheet - A4 Ratio */}
        <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] relative text-sm text-gray-800 origin-top transform scale-[0.85] lg:scale-100 transition-transform flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="w-1/2 pr-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">{invoice.sellerName || 'Seller Name'}</h1>
              <div className="text-gray-600 text-sm leading-snug space-y-0.5">
                  <p className="break-words">{invoice.sellerAddress}</p>
                  {invoice.sellerAddress2 && <p className="break-words">{invoice.sellerAddress2}</p>}
                  <div className="mt-4 pt-2">
                     {invoice.sellerPhone && <p>Contact : {invoice.sellerPhone}</p>}
                     {invoice.sellerEmail && <p className="break-all">{invoice.sellerEmail}</p>}
                  </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-500 tracking-wide uppercase">INVOICE</div>
            </div>
          </div>

          {/* Meta Data Grid */}
          <div className="grid grid-cols-12 gap-4 mb-8 border-b border-white">
            {/* Col 1: Account Details */}
            <div className="col-span-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">ACCOUNT DETAILS</h3>
               <div className="border-t border-gray-300 w-full mb-2"></div>
               <div className="text-xs text-gray-800 space-y-1">
                   <p className="font-medium">{invoice.bankDetails.accountName}</p>
                   <p>{invoice.bankDetails.bankName}</p>
                   {invoice.bankDetails.accountNumber && <p>ACC NO : {invoice.bankDetails.accountNumber}</p>}
                   {invoice.bankDetails.swiftCode && <p>Swift Code {invoice.bankDetails.swiftCode}</p>}
               </div>
            </div>

            {/* Col 2: Billed To */}
            <div className="col-span-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">BILLED TO</h3>
               <div className="border-t border-gray-300 w-full mb-2"></div>
               <div className="text-sm text-gray-800 space-y-1">
                   <p className="font-medium break-words">{invoice.clientName || 'Client Name'}</p>
                   {invoice.clientEmail && <p className="text-xs break-all">Contact: {invoice.clientEmail}</p>}
                   <p className="text-xs break-words">{invoice.clientAddress}</p>
                   {invoice.clientAddress2 && <p className="text-xs break-words">{invoice.clientAddress2}</p>}
               </div>
            </div>

            {/* Col 3: Invoice Data */}
            <div className="col-span-4 flex flex-col items-end text-right">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm w-full">
                   <div className="font-bold text-gray-900 text-right">Invoice No:</div>
                   <div className="text-right">{invoice.number}</div>

                   <div className="font-bold text-gray-900 text-right">Invoice Date:</div>
                   <div className="text-right">{invoice.date}</div>

                   <div className="font-bold text-gray-900 text-right">Due Date:</div>
                   <div className="text-right">{invoice.dueDate}</div>
                </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            {/* Table Header */}
            <div className="grid grid-cols-12 border border-gray-300 bg-gray-50 text-xs font-bold text-gray-600 uppercase py-2">
               <div className="col-span-6 pl-4">DESCRIPTION</div>
               <div className="col-span-2 text-center border-l border-gray-300">QTY</div>
               <div className="col-span-2 text-right border-l border-gray-300 pr-2">UNIT PRICE</div>
               <div className="col-span-2 text-right border-l border-gray-300 pr-2">TOTAL</div>
            </div>

            {/* Table Rows */}
            <div className="border-l border-r border-b border-gray-300">
               {invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 text-sm text-gray-800 border-b border-gray-200 min-h-[32px]">
                     <div className="col-span-6 pl-4 py-2 break-words pr-2">{item.description}</div>
                     <div className="col-span-2 text-center border-l border-gray-200 py-2">{item.quantity}</div>
                     <div className="col-span-2 text-right border-l border-gray-200 py-2 pr-2">{item.rate.toFixed(2)}</div>
                     <div className="col-span-2 text-right border-l border-gray-200 py-2 pr-2">{(item.quantity * item.rate).toFixed(2)}</div>
                  </div>
               ))}
               {/* Empty filler rows for aesthetic */}
               {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                   <div key={`empty-${i}`} className="grid grid-cols-12 text-sm text-gray-800 border-b border-gray-200 min-h-[32px]">
                     <div className="col-span-6 pl-4 py-2"></div>
                     <div className="col-span-2 border-l border-gray-200 py-2"></div>
                     <div className="col-span-2 border-l border-gray-200 py-2"></div>
                     <div className="col-span-2 border-l border-gray-200 py-2"></div>
                   </div>
               ))}
            </div>
          </div>

          {/* Footer Layout */}
          <div className="flex justify-between items-start mt-auto">
              
              <div className="w-1/2 pt-4">
                 {invoice.footerNote && <p className="text-sm text-gray-800">{invoice.footerNote}</p>}
                 <div className="mt-12 border-t border-gray-300 w-40"></div>
              </div>

              <div className="w-1/2 pl-8">
                 {/* Subtotal */}
                 <div className="flex justify-between items-center text-xs mb-2">
                     <span className="font-bold text-gray-600 uppercase">SUBTOTAL</span>
                     <span className="text-gray-900 text-right w-24">{subtotal.toFixed(2)}</span>
                 </div>
                 <div className="border-b border-gray-200 w-full mb-2"></div>

                 {/* Discount */}
                 <div className="flex justify-between items-center text-xs mb-2">
                     <span className="font-bold text-gray-600 uppercase">DISCOUNT</span>
                     <span className="text-gray-900 text-right w-24">{discountAmount.toFixed(2)}</span>
                 </div>
                 <div className="border-b border-gray-200 w-full mb-2"></div>

                 {/* Subtotal less discount */}
                 <div className="flex justify-between items-center text-xs mb-2">
                     <div className="flex flex-col items-end">
                         <span className="font-bold text-gray-600 uppercase">SUBTOTAL</span>
                         <span className="font-bold text-gray-600 uppercase text-[10px]">LESS DISCOUNT</span>
                     </div>
                     <span className="text-gray-900 text-right w-24">{subtotalLessDiscount.toFixed(2)}</span>
                 </div>
                 <div className="border-b border-gray-200 w-full mb-2"></div>

                 {/* Shipping */}
                 <div className="flex justify-between items-center text-xs mb-2">
                     <span className="font-bold text-gray-600 uppercase">HIPPING/HANDLING</span>
                     <span className="text-gray-900 text-right w-24">{invoice.shipping.toFixed(2)}</span>
                 </div>
                 <div className="border-b border-gray-200 w-full mb-4"></div>

                 {/* Total */}
                 <div className="flex justify-between items-center">
                     <span className="font-bold text-gray-800 text-lg">Total Amount</span>
                     <span className="font-bold text-gray-900 text-lg text-right w-32">{total.toFixed(2)} {symbol === '$' ? 'USD' : symbol}</span>
                 </div>

              </div>
          </div>

          <div className="mt-12 flex justify-end">
               <div className="w-48 border-t border-black"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;