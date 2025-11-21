import React from 'react';
import { Invoice } from '../types';
import { Edit2, Trash2, Download, ArrowUpDown } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onSort: (field: 'date' | 'clientName' | 'amount' | 'status') => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig
}) => {
  
  const allIds = invoices.map(i => i.id);
  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < invoices.length;

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <img src="https://illustrations.popsy.co/amber/surr-no-data.svg" alt="No Invoices" className="w-64 opacity-50 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">There is nothing here</h3>
        <p className="text-sm">Create an invoice by clicking the <span className="font-bold text-white">New Invoice</span> button and get started</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
      <table className="w-full text-left border-separate border-spacing-y-4">
        <thead>
          <tr className="text-gray-400 text-xs font-medium">
            <th className="pb-2 pl-6 w-10">
               <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-brand-purple focus:ring-brand-purple cursor-pointer accent-brand-purple"
                  checked={allSelected}
                  ref={input => { if(input) input.indeterminate = someSelected; }}
                  onChange={() => onToggleSelectAll(allSelected ? [] : allIds)}
               />
            </th>
            <th className="pb-2 pl-2 cursor-pointer hover:text-white" onClick={() => onSort('date')}>
              <div className="flex items-center gap-1">
                 Details {sortConfig.key === 'date' && <ArrowUpDown size={12} />}
              </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('clientName')}>
               <div className="flex items-center gap-1">
                 Client {sortConfig.key === 'clientName' && <ArrowUpDown size={12} />}
               </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('amount')}>
               <div className="flex items-center gap-1">
                 Amount {sortConfig.key === 'amount' && <ArrowUpDown size={12} />}
               </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('status')}>
               <div className="flex items-center gap-1">
                 Status {sortConfig.key === 'status' && <ArrowUpDown size={12} />}
               </div>
            </th>
            <th className="pb-2 text-right pr-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
             const total = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
             const isSelected = selectedIds.includes(invoice.id);

             return (
              <tr key={invoice.id} className={`bg-dark-800 border border-transparent transition-all shadow-sm rounded-lg group ${isSelected ? 'border-brand-purple' : 'hover:border-brand-purple'}`}>
                
                <td className="py-5 pl-6 rounded-l-lg border-y border-l border-dark-800 group-hover:border-brand-purple">
                   <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-brand-purple focus:ring-brand-purple cursor-pointer accent-brand-purple"
                      checked={isSelected}
                      onChange={() => onToggleSelect(invoice.id)}
                   />
                </td>

                {/* Details (ID & Date) */}
                <td className="py-5 pl-2 border-y border-dark-800 group-hover:border-brand-purple">
                  <div className="flex flex-col">
                    <span className="font-bold text-brand-purple text-sm">#{invoice.number}</span>
                    <span className="text-gray-400 text-xs mt-1">Due {invoice.dueDate}</span>
                  </div>
                </td>
                
                {/* Client */}
                <td className="py-5 border-y border-dark-800 group-hover:border-brand-purple">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">{invoice.clientName || 'Unknown Client'}</span>
                    <span className="text-gray-500 text-xs">{invoice.clientEmail || 'No email'}</span>
                  </div>
                </td>
                
                {/* Amount */}
                <td className="py-5 border-y border-dark-800 group-hover:border-brand-purple">
                  <span className="text-brand-green font-bold text-lg">
                    {invoice.currencySymbol || '$'} {total.toFixed(2)}
                  </span>
                </td>
                
                {/* Status */}
                <td className="py-5 border-y border-dark-800 group-hover:border-brand-purple">
                  <button
                    onClick={() => onToggleStatus(invoice.id)}
                    className={`
                      w-28 py-2.5 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all
                      ${invoice.status === 'Paid' 
                        ? 'bg-brand-green/5 text-brand-green border border-brand-green/20' 
                        : 'bg-brand-orange/5 text-brand-orange border border-brand-orange/20'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${invoice.status === 'Paid' ? 'bg-brand-green' : 'bg-brand-orange'}`}></div>
                    {invoice.status.toUpperCase()}
                  </button>
                </td>
                
                {/* Actions */}
                <td className="py-5 pr-6 rounded-r-lg text-right border-y border-r border-dark-800 group-hover:border-brand-purple">
                  <div className="flex items-center justify-end gap-4">
                    {isSelected ? (
                        // When selected: Download (Green) & Delete
                        <>
                           <button 
                             onClick={() => generateInvoicePDF(invoice)}
                             className="text-brand-green hover:text-green-400 transition-colors"
                             title="Download"
                           >
                             <Download size={18} />
                           </button>
                           <button 
                             onClick={() => onDelete(invoice.id)}
                             className="text-brand-red hover:text-red-400 transition-colors"
                             title="Delete"
                           >
                             <Trash2 size={18} />
                           </button>
                        </>
                    ) : (
                       // Default Actions
                        <>
                            <button 
                            onClick={() => generateInvoicePDF(invoice)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Download PDF"
                            >
                            <Download size={18} />
                            </button>
                            <button 
                            onClick={() => onEdit(invoice.id)}
                            className="text-gray-400 hover:text-brand-purple transition-colors"
                            title="Edit"
                            >
                            <Edit2 size={18} />
                            </button>
                            <button 
                            onClick={() => onDelete(invoice.id)}
                            className="text-gray-400 hover:text-brand-red transition-colors"
                            title="Delete"
                            >
                            <Trash2 size={18} />
                            </button>
                        </>
                    )}
                  </div>
                </td>
              </tr>
             );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;