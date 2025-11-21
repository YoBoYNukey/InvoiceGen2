import React, { useState, useEffect } from 'react';
import { Invoice, EMPTY_INVOICE } from './types';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import RecycleBin from './components/RecycleBin';
import { LayoutGrid, Trash2, Plus, Search, Filter, Download, X, Check } from 'lucide-react';
import { generateBatchZip, generateInvoicePDF } from './services/pdfService';

type View = 'list' | 'create' | 'edit' | 'bin';

// Sorting Types
type SortField = 'date' | 'clientName' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
       <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 w-96 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6">{message}</p>
          <div className="flex justify-end gap-3">
             <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-700 text-sm font-medium">Cancel</button>
             <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-brand-red hover:bg-red-600 text-white text-sm font-bold">Confirm</button>
          </div>
       </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>('list');
  const [activeInvoices, setActiveInvoices] = useState<Invoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(EMPTY_INVOICE);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortField; direction: SortOrder }>({
    key: 'date',
    direction: 'desc'
  });

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({
    isOpen: false, title: '', message: '', action: () => {}
  });

  // Load from Local Storage
  useEffect(() => {
    const savedActive = localStorage.getItem('activeInvoices');
    const savedDeleted = localStorage.getItem('deletedInvoices');
    if (savedActive) setActiveInvoices(JSON.parse(savedActive));
    if (savedDeleted) setDeletedInvoices(JSON.parse(savedDeleted));
  }, []);

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('activeInvoices', JSON.stringify(activeInvoices));
    localStorage.setItem('deletedInvoices', JSON.stringify(deletedInvoices));
  }, [activeInvoices, deletedInvoices]);

  // Clear selection when view changes
  useEffect(() => {
    setSelectedIds([]);
  }, [view]);

  const generateNextNumber = () => {
    const allNumbers = [...activeInvoices, ...deletedInvoices]
      .map(inv => {
         const match = inv.number.match(/(\d+)$/);
         return match ? parseInt(match[1], 10) : 0;
      });
    const max = Math.max(0, ...allNumbers);
    return `INV-${String(max + 1).padStart(3, '0')}`;
  };

  const handleCreateNew = () => {
    setCurrentInvoice({
      ...EMPTY_INVOICE,
      id: crypto.randomUUID(),
      number: generateNextNumber(),
      items: [{ id: crypto.randomUUID(), description: 'New Item', quantity: 1, rate: 0 }] // Ensure item has unique ID
    });
    setView('create');
  };

  const handleEdit = (id: string) => {
    const inv = activeInvoices.find(i => i.id === id);
    if (inv) {
      setCurrentInvoice(inv);
      setView('edit');
    }
  };

  // --- Sorting Logic ---
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      key: field,
      direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedInvoices = (invoices: Invoice[]) => {
    return [...invoices].sort((a, b) => {
       let valA: any = a[sortConfig.key as keyof Invoice];
       let valB: any = b[sortConfig.key as keyof Invoice];

       // Handle special cases for calculated fields or non-root keys
       if (sortConfig.key === 'amount') {
         valA = a.items.reduce((acc, i) => acc + i.quantity * i.rate, 0);
         valB = b.items.reduce((acc, i) => acc + i.quantity * i.rate, 0);
       }

       if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
       if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
       return 0;
    });
  };

  // --- Filter Logic ---
  const filteredInvoices = getSortedInvoices(activeInvoices.filter(inv => {
     const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inv.number.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
     return matchesSearch && matchesStatus;
  }));

  const filteredDeletedInvoices = deletedInvoices; // No specific filter for bin yet

  // --- Selection Logic ---
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  // --- Deletion Logic with Modal ---
  
  const confirmDelete = (id: string) => {
    setModal({
      isOpen: true,
      title: 'Delete Invoice',
      message: 'Are you sure you want to move this invoice to the recycle bin?',
      action: () => {
        const inv = activeInvoices.find(i => i.id === id);
        if (inv) {
          const deletedInv = { ...inv, deletedAt: Date.now() };
          setActiveInvoices(prev => prev.filter(i => i.id !== id));
          setDeletedInvoices(prev => [deletedInv, ...prev]);
        }
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmBulkDelete = () => {
    setModal({
      isOpen: true,
      title: 'Delete Selected Invoices',
      message: `Are you sure you want to move ${selectedIds.length} invoices to the recycle bin?`,
      action: () => {
         const toDelete = activeInvoices.filter(i => selectedIds.includes(i.id));
         const stampedToDelete = toDelete.map(i => ({...i, deletedAt: Date.now()}));
         setActiveInvoices(prev => prev.filter(i => !selectedIds.includes(i.id)));
         setDeletedInvoices(prev => [...stampedToDelete, ...prev]);
         setSelectedIds([]);
         setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmPermanentDelete = (id: string) => {
    setModal({
      isOpen: true,
      title: 'Permanently Delete',
      message: 'This action cannot be undone. Are you sure?',
      action: () => {
        setDeletedInvoices(prev => prev.filter(i => i.id !== id));
        // Also remove from selection if present
        setSelectedIds(prev => prev.filter(sid => sid !== id));
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmBulkPermanentDelete = () => {
     setModal({
      isOpen: true,
      title: 'Permanently Delete Selected',
      message: `This will permanently delete ${selectedIds.length} invoices. Cannot be undone.`,
      action: () => {
        setDeletedInvoices(prev => prev.filter(i => !selectedIds.includes(i.id)));
        setSelectedIds([]);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmDeleteAllBin = () => {
    setModal({
      isOpen: true,
      title: 'Empty Recycle Bin',
      message: 'Are you sure you want to permanently delete ALL invoices in the recycle bin?',
      action: () => {
        setDeletedInvoices([]);
        setSelectedIds([]);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  // --- Actions ---
  const handleRestore = (id: string) => {
    const inv = deletedInvoices.find(i => i.id === id);
    if (inv) {
      const restoredInv = { ...inv, deletedAt: undefined };
      setDeletedInvoices(prev => prev.filter(i => i.id !== id));
      setActiveInvoices(prev => [restoredInv, ...prev]);
    }
  };

  const handleToggleStatus = (id: string) => {
    setActiveInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: inv.status === 'Paid' ? 'Unpaid' : 'Paid' } : inv
    ));
  };

  const handleSave = () => {
    if (view === 'create') {
      setActiveInvoices(prev => [currentInvoice, ...prev]);
    } else {
      setActiveInvoices(prev => prev.map(inv => inv.id === currentInvoice.id ? currentInvoice : inv));
    }
    setView('list');
  };

  const handleBulkDownload = async () => {
     if (selectedIds.length === 1) {
        const inv = activeInvoices.find(i => i.id === selectedIds[0]);
        if(inv) generateInvoicePDF(inv);
     } else if (selectedIds.length > 1) {
        const invs = activeInvoices.filter(i => selectedIds.includes(i.id));
        await generateBatchZip(invs);
     }
  };

  return (
    <div className="flex h-screen bg-dark-900 text-white font-sans">
      <ConfirmationModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.action}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Sidebar */}
      <aside className="w-20 bg-dark-800 border-r border-dark-700 flex flex-col items-center py-6 rounded-r-2xl z-50">
        <div className="bg-brand-purple p-3 rounded-xl mb-8">
          <LayoutGrid size={24} className="text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          <button 
            onClick={() => setView('list')}
            className={`p-3 rounded-xl transition-colors relative group ${
              view === 'list' || view === 'create' || view === 'edit'
              ? 'text-brand-purple' 
              : 'text-gray-500 hover:text-gray-200'
            }`}
            title="Dashboard"
          >
            <LayoutGrid size={20} />
            {(view === 'list' || view === 'create' || view === 'edit') && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-purple rounded-r-full" />
            )}
          </button>
          
          <button 
            onClick={() => setView('bin')}
            className={`p-3 rounded-xl transition-colors relative group ${
              view === 'bin'
              ? 'text-brand-red' 
              : 'text-gray-500 hover:text-gray-200'
            }`}
            title="Recycle Bin"
          >
            <Trash2 size={20} />
            {deletedInvoices.length > 0 && (
               <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full"></span>
            )}
          </button>
        </nav>

        <div className="mt-auto">
          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 py-6 bg-dark-900">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold text-brand-purple tracking-tight">Invoicify.</h1>
            <div className="h-6 w-px bg-dark-700 mx-2"></div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {view === 'bin' ? 'Recycle Bin' : (view === 'edit' ? 'Edit Invoice' : 'Active Invoices')}
              </h2>
              {/* Removed Count Text as requested */}
            </div>
          </div>

          {selectedIds.length > 0 && view !== 'create' && view !== 'edit' && (
             <div className="flex items-center gap-3 bg-dark-800 px-4 py-2 rounded-full border border-dark-700 animate-in fade-in slide-in-from-top-4 duration-200">
                <span className="text-sm font-bold text-white">{selectedIds.length} selected</span>
                
                {view === 'list' && (
                  <>
                    <button 
                      onClick={handleBulkDownload}
                      className="p-2 text-brand-green hover:bg-dark-700 rounded-full transition-colors" title={selectedIds.length > 1 ? "Download ZIP" : "Download PDF"}
                    >
                       <Download size={18} />
                    </button>
                    <button 
                      onClick={confirmBulkDelete}
                      className="p-2 text-brand-red hover:bg-dark-700 rounded-full transition-colors" title="Delete"
                    >
                       <Trash2 size={18} />
                    </button>
                  </>
                )}
                
                {view === 'bin' && (
                    <button 
                      onClick={confirmBulkPermanentDelete}
                      className="p-2 text-brand-red hover:bg-dark-700 rounded-full transition-colors" title="Delete Forever"
                    >
                       <Trash2 size={18} />
                    </button>
                )}
                
                <button onClick={() => setSelectedIds([])} className="ml-2">
                  <X size={16} className="text-gray-500 hover:text-white" />
                </button>
             </div>
          )}

          <div className="flex items-center gap-4">
            {/* Search */}
            {(view === 'list' || view === 'bin') && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark-800 border border-dark-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-purple w-64"
                />
              </div>
            )}

            {/* Filter & Sort Dropdown */}
            {(view === 'list' || view === 'bin') && (
              <div className="relative">
                <button 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 text-white font-medium hover:text-gray-300 px-3 py-2 ${showFilterMenu ? 'text-brand-purple' : ''}`}
                >
                  <span>Filter</span>
                  <Filter size={16} />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl p-2 z-[60]">
                     <p className="text-xs font-bold text-gray-500 px-2 py-1 uppercase">Status</p>
                     <button onClick={() => {setFilterStatus('All'); setShowFilterMenu(false)}} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">All {filterStatus === 'All' && <Check size={14}/>}</button>
                     <button onClick={() => {setFilterStatus('Paid'); setShowFilterMenu(false)}} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">Paid {filterStatus === 'Paid' && <Check size={14}/>}</button>
                     <button onClick={() => {setFilterStatus('Unpaid'); setShowFilterMenu(false)}} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">Unpaid {filterStatus === 'Unpaid' && <Check size={14}/>}</button>
                     
                     <div className="h-px bg-dark-700 my-2"></div>
                     
                     <p className="text-xs font-bold text-gray-500 px-2 py-1 uppercase">Sort By</p>
                     <button onClick={() => handleSort('date')} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">Date {sortConfig.key === 'date' && <Check size={14}/>}</button>
                     <button onClick={() => handleSort('clientName')} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">Name {sortConfig.key === 'clientName' && <Check size={14}/>}</button>
                     <button onClick={() => handleSort('amount')} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-dark-700 text-white flex justify-between">Amount {sortConfig.key === 'amount' && <Check size={14}/>}</button>
                  </div>
                )}
              </div>
            )}

            {/* Create Button */}
            <button 
              onClick={handleCreateNew}
              className="bg-brand-purple hover:bg-brand-purpleLight text-white px-4 pr-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-3 transition-all shadow-lg shadow-indigo-900/20"
            >
              <div className="bg-white rounded-full p-1">
                <Plus size={14} className="text-brand-purple" />
              </div>
              Create Invoice
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-8 pt-2">
          
          {(view === 'create' || view === 'edit') ? (
            <div className="flex flex-col lg:flex-row h-full bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 shadow-2xl">
              {/* Editor 35% */}
              <div className="lg:w-[35%] h-full border-r border-dark-700">
                <InvoiceForm 
                  invoice={currentInvoice} 
                  setInvoice={setCurrentInvoice}
                  onSave={handleSave}
                  onCancel={() => setView('list')}
                />
              </div>
              {/* Preview 65% */}
              <div className="hidden lg:block lg:w-[65%] h-full bg-dark-900 p-8">
                <InvoicePreview invoice={currentInvoice} />
              </div>
            </div>
          ) : view === 'bin' ? (
            <RecycleBin 
              invoices={filteredDeletedInvoices} 
              onRestore={handleRestore}
              onDeletePermanently={confirmPermanentDelete}
              onDeleteAll={confirmDeleteAllBin}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ) : (
            <InvoiceList 
              invoices={filteredInvoices}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              onToggleStatus={handleToggleStatus}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;