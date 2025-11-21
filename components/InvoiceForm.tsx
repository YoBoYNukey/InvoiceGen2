
import React, { useRef } from 'react';
import { Invoice, InvoiceItem, BankDetails } from '../types';
import { Plus, Trash2, ChevronLeft, Save, Upload, X } from 'lucide-react';

interface InvoiceFormProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  onSave: () => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, setInvoice, onSave, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDetailChange = (field: keyof Invoice, value: any) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (field: keyof Invoice['signature'], value: string) => {
    setInvoice(prev => ({
      ...prev,
      signature: { ...prev.signature, [field]: value }
    }));
  };

  const handleBankChange = (field: keyof BankDetails, value: string) => {
    setInvoice(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: 'New Item',
      quantity: 1,
      rate: 0
    };
    setInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length === 1) return;
    setInvoice(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSignatureChange('signatureImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-800 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark-700 sticky top-0 bg-dark-800 z-20">
        <button onClick={onCancel} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft size={16} />
            Go Back
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        
        {/* TOP SECTION: No, Date, Due Date, Currency */}
        <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs text-gray-400">Invoice No</label>
               <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.number}
                onChange={(e) => handleDetailChange('number', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Date</label>
                    <input 
                    type="date"
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold [color-scheme:dark]"
                    value={invoice.date}
                    onChange={(e) => handleDetailChange('date', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Due Date</label>
                    <input 
                    type="date"
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold [color-scheme:dark]"
                    value={invoice.dueDate}
                    onChange={(e) => handleDetailChange('dueDate', e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs text-gray-400">Currency Symbol</label>
               <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.currencySymbol}
                onChange={(e) => handleDetailChange('currencySymbol', e.target.value)}
                placeholder="$"
              />
            </div>
        </div>

        {/* SECTION: CLIENT DETAILS (BILLED TO) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">Client Details (Billed To)</h3>
          <div className="flex flex-col gap-4">
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.clientName}
                onChange={(e) => handleDetailChange('clientName', e.target.value)}
                placeholder="Client Name"
              />
             <input 
                type="email"
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.clientEmail}
                onChange={(e) => handleDetailChange('clientEmail', e.target.value)}
                placeholder="Client Email"
              />
             <input 
               className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
               value={invoice.clientAddress}
               onChange={(e) => handleDetailChange('clientAddress', e.target.value)}
               placeholder="Address Line 1"
             />
             <input 
               className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
               value={invoice.clientAddress2}
               onChange={(e) => handleDetailChange('clientAddress2', e.target.value)}
               placeholder="Address Line 2 / Postcode"
             />
          </div>
        </div>

        {/* SECTION: ITEMS */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
             <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider">Items</h3>
             <button 
                onClick={addItem}
                className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1"
             >
                <Plus size={12} /> Add Item
             </button>
           </div>
           
           <div className="space-y-3">
             {invoice.items.map((item) => (
               <div key={item.id} className="p-4 bg-dark-700/50 border border-dark-700 rounded-lg space-y-3">
                  <div className="flex gap-3">
                      <input 
                        className="flex-1 p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-10 flex items-center justify-center text-gray-500 hover:text-brand-red transition-colors bg-dark-700 border border-dark-600 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[10px] text-gray-500 mb-1 block pl-1">Qty</label>
                       <input 
                         type="number"
                         className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                         value={item.quantity}
                         onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] text-gray-500 mb-1 block pl-1">Price</label>
                       <input 
                         type="number"
                         className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                         value={item.rate}
                         onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                       />
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* SECTION: TOTALS (Discount & Shipping) */}
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs text-gray-400">Discount (%)</label>
               <input 
                type="number"
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.discountRate}
                onChange={(e) => handleDetailChange('discountRate', parseFloat(e.target.value) || 0)}
              />
             </div>
             <div className="space-y-1">
               <label className="text-xs text-gray-400">Shipping</label>
               <input 
                type="number"
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.shipping}
                onChange={(e) => handleDetailChange('shipping', parseFloat(e.target.value) || 0)}
              />
             </div>
        </div>

        {/* SECTION: TERMS & FOOTER */}
        <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs text-gray-400">Terms & Conditions</label>
                <textarea 
                    value={invoice.terms}
                    onChange={(e) => handleDetailChange('terms', e.target.value)}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold h-24 resize-none"
                    placeholder="Payment terms..."
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs text-gray-400">Footer Note (e.g. Thank You)</label>
                <textarea 
                    value={invoice.footerNote}
                    onChange={(e) => handleDetailChange('footerNote', e.target.value)}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold h-16 resize-none"
                    placeholder="Thank you for your business"
                />
             </div>
        </div>

        {/* SECTION: SIGNATURE */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">Signature</h3>
           <div className="flex flex-col gap-4">
              <input 
                 className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                 value={invoice.signature.signatoryName}
                 onChange={(e) => handleSignatureChange('signatoryName', e.target.value)}
                 placeholder="Signatory Name (e.g. Irfan)"
               />
              <input 
                 className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                 value={invoice.signature.designation}
                 onChange={(e) => handleSignatureChange('designation', e.target.value)}
                 placeholder="Designation (e.g. Designer)"
               />
               
               <div className="space-y-1">
                 <label className="text-xs text-gray-400 block">Signature Image (Optional)</label>
                 <div className="flex items-center gap-3">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-xs font-bold hover:bg-dark-600 transition-colors"
                    >
                        <Upload size={14}/> Upload Image
                    </button>
                    {invoice.signature.signatureImage && (
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-brand-green">Image Uploaded</span>
                             <button 
                                onClick={() => handleSignatureChange('signatureImage', '')}
                                className="text-brand-red hover:text-red-400 text-xs"
                             >
                                Remove
                             </button>
                        </div>
                    )}
                 </div>
               </div>
           </div>
        </div>

        {/* SECTION: SENDER DETAILS (YOU) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sender Details (You)</h3>
          <div className="flex flex-col gap-4">
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.sellerName}
                onChange={(e) => handleDetailChange('sellerName', e.target.value)}
                placeholder="Your Name / Company"
              />
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.sellerPhone}
                onChange={(e) => handleDetailChange('sellerPhone', e.target.value)}
                placeholder="Phone Number"
              />
             <input 
               className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
               value={invoice.sellerAddress}
               onChange={(e) => handleDetailChange('sellerAddress', e.target.value)}
               placeholder="Address Line 1"
             />
             <input 
               className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
               value={invoice.sellerAddress2}
               onChange={(e) => handleDetailChange('sellerAddress2', e.target.value)}
               placeholder="Address Line 2 / Postcode"
             />
          </div>
        </div>

        {/* SECTION: BANK DETAILS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bank Details</h3>
          <div className="grid grid-cols-2 gap-4">
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.bankDetails.accountName}
                onChange={(e) => handleBankChange('accountName', e.target.value)}
                placeholder="Account Name"
              />
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.bankDetails.accountNumber}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                placeholder="Account Number"
              />
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.bankDetails.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                placeholder="Bank Name / IFSC"
              />
             <input 
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-1 focus:ring-brand-purple outline-none text-white text-sm font-bold"
                value={invoice.bankDetails.swiftCode}
                onChange={(e) => handleBankChange('swiftCode', e.target.value)}
                placeholder="SWIFT / Branch Code"
              />
          </div>
        </div>
      </div>
      
      {/* Footer Buttons */}
      <div className="p-6 flex justify-between items-center bg-dark-800 border-t border-dark-700 sticky bottom-0 z-20">
        <button 
          onClick={onCancel}
          className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-bold rounded-full text-sm transition-colors"
        >
          Discard
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onSave}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purpleLight text-white font-bold rounded-full text-sm transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
