
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface SignatureData {
  signatureText: string; // Visual signature representation
  signatoryName: string; // Printed name
  designation: string;
  date: string;
  signatureImage?: string; // Base64 data URL
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string; // Used for IFSC/Routing in UI
  swiftCode: string;
}

export type InvoiceStatus = 'Paid' | 'Unpaid';

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  currencySymbol: string;
  
  // Bill From
  sellerName: string;
  sellerAddress: string;
  sellerAddress2: string; // Extra line
  sellerEmail: string;
  sellerPhone: string;

  // Bill To
  clientName: string;
  clientAddress: string;
  clientAddress2: string; // Extra line
  clientEmail: string;

  items: InvoiceItem[];
  
  discountRate: number; // Percentage
  shipping: number;

  terms: string;
  footerNote: string; // e.g. "Thank you for your business"
  notes: string; // Internal notes
  
  status: InvoiceStatus;
  
  signature: SignatureData;
  bankDetails: BankDetails;
  
  createdAt: number;
  deletedAt?: number; // If present, it's in the recycle bin
}

export const EMPTY_INVOICE: Invoice = {
  id: '',
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currencySymbol: '$',
  
  sellerName: '',
  sellerAddress: '',
  sellerAddress2: '',
  sellerEmail: '',
  sellerPhone: '',
  
  clientName: '',
  clientAddress: '',
  clientAddress2: '',
  clientEmail: '',
  
  items: [{ id: '1', description: 'Design Services', quantity: 1, rate: 0 }],
  
  discountRate: 0,
  shipping: 0,
  
  terms: 'Payment is due within 15 days.',
  footerNote: 'Thank you for your business',
  notes: '',
  status: 'Unpaid',
  
  signature: {
    signatureText: '',
    signatoryName: '',
    designation: '',
    date: new Date().toISOString().split('T')[0],
    signatureImage: ''
  },
  bankDetails: {
    accountName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: ''
  },
  
  createdAt: Date.now(),
};
