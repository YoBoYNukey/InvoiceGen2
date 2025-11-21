import React from 'react';
import { Invoice } from '../types';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

interface RecycleBinProps {
  invoices: Invoice[];
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onDeleteAll: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ 
  invoices, 
  onRestore, 
  onDeletePermanently, 
  onDeleteAll,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}) => {
  
  const allIds = invoices.map(i => i.id);
  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < invoices.length;

  const handleDeleteClick = (id: string) => {
     onDeletePermanently(id);
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Trash2 size={64} className="text-dark-700 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Recycle Bin is Empty</h3>
        <p className="text-sm">Deleted invoices will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="mb-6 flex items-center justify-between">
         <div className="p-4 bg-red-500/10 border border-brand-red/20 rounded-lg flex items-center gap-3 flex-1 mr-4">
             <AlertTriangle className="text-brand-red" size={20}/>
             <p className="text-brand-red text-sm">Items in the recycle bin are not permanently deleted unless selected.</p>
         </div>
         <button 
            onClick={onDeleteAll}
            className="px-4 py-3 bg-red-500/10 hover:bg-brand-red text-brand-red hover:text-white border border-brand-red/50 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap"
         >
            <Trash2 size={16} /> Delete All
         </button>
      </div>

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
            <th className="pb-2 pl-2">Number</th>
            <th className="pb-2">Client</th>
            <th className="pb-2">Deleted Date</th>
            <th className="pb-2 text-right pr-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const isSelected = selectedIds.includes(invoice.id);
            return (
            <tr key={invoice.id} className={`bg-dark-800 transition-all rounded-lg ${isSelected ? 'border border-brand-red' : ''}`}>
              <td className="py-5 pl-6 rounded-l-lg">
                   <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-brand-purple focus:ring-brand-purple cursor-pointer accent-brand-purple"
                      checked={isSelected}
                      onChange={() => onToggleSelect(invoice.id)}
                   />
              </td>
              <td className="py-5 pl-2">
                <span className="font-bold text-white text-sm">#{invoice.number}</span>
              </td>
              <td className="py-5">
                <div className="flex flex-col">
                   <span className="text-gray-300 text-sm">{invoice.clientName || 'No Client'}</span>
                </div>
              </td>
              <td className="py-5 text-gray-400 text-sm">
                 {invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleDateString() : '-'}
              </td>
              <td className="py-5 pr-6 rounded-r-lg text-right">
                <div className="flex items-center justify-end gap-3">
                  {isSelected ? (
                      <button 
                        onClick={() => handleDeleteClick(invoice.id)}
                        className="flex items-center gap-1 text-brand-red hover:text-white font-medium text-xs bg-brand-red/10 hover:bg-brand-red px-3 py-2 rounded-md transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                  ) : (
                    <>
                        <button 
                            onClick={() => onRestore(invoice.id)}
                            className="flex items-center gap-1 text-brand-green hover:text-white font-medium text-xs bg-brand-green/10 hover:bg-brand-green px-3 py-2 rounded-md transition-all"
                        >
                            <RotateCcw size={14} /> Restore
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(invoice.id)}
                            className="flex items-center gap-1 text-brand-red hover:text-white font-medium text-xs bg-brand-red/10 hover:bg-brand-red px-3 py-2 rounded-md transition-all"
                        >
                            <Trash2 size={14} /> Delete Forever
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

export default RecycleBin;