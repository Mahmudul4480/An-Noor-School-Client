import React from 'react';
import { motion } from 'motion/react';
import { X, Plus, Loader2, Trash2, RotateCcw, Check, Pencil, Tag } from 'lucide-react';
import {
  fetchInvoiceItemCategories,
  removeInvoiceItemCategory,
  restoreInvoiceItemCategory,
  saveInvoiceItemCategory,
} from '../../lib/invoiceItems';
import type { InvoiceItemCategory } from '../../types';

interface InvoiceItemCatalogModalProps {
  onClose: () => void;
  /** Fired after any change so the caller can refresh its own copy of the catalog */
  onChanged?: () => void;
}

export function InvoiceItemCatalogModal({ onClose, onChanged }: InvoiceItemCatalogModalProps) {
  const [items, setItems] = React.useState<InvoiceItemCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editLabel, setEditLabel] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchInvoiceItemCategories({ includeArchived: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice items.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    await load();
    onChanged?.();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusyId('new');
    try {
      await saveInvoiceItemCategory({ label: newLabel, defaultAmount: parseFloat(newAmount) || 0 });
      setMessage(`"${newLabel.trim()}" invoice item যুক্ত হয়েছে।`);
      setNewLabel('');
      setNewAmount('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add item.');
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item: InvoiceItemCategory) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditAmount(String(item.defaultAmount));
    setError('');
  };

  const handleSaveEdit = async (item: InvoiceItemCategory) => {
    setError('');
    setBusyId(item.id);
    try {
      await saveInvoiceItemCategory({
        id: item.id,
        label: editLabel,
        defaultAmount: parseFloat(editAmount) || 0,
      });
      setEditingId(null);
      setMessage(`"${editLabel.trim()}" update হয়েছে।`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item: InvoiceItemCategory) => {
    setError('');
    setBusyId(item.id);
    try {
      await removeInvoiceItemCategory(item);
      setMessage(`"${item.label}" list থেকে সরানো হয়েছে।`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (item: InvoiceItemCategory) => {
    setBusyId(item.id);
    try {
      await restoreInvoiceItemCategory(item);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-school-border flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight flex items-center gap-2">
              <Tag size={18} className="text-school-gold" /> Invoice Item Categories
            </h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Manual invoice-এ যে item গুলো select করা যাবে
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          <form onSubmit={handleAdd} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Add New Item</p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Annual Magazine"
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                required
              />
              <input
                type="number"
                min={0}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Default ৳"
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              />
            </div>
            <button
              type="submit"
              disabled={busyId === 'new'}
              className="w-full py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busyId === 'new' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add Item
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>
          )}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-school-blue" />
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-wrap items-center gap-3"
                >
                  {editingId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item)}
                        disabled={busyId === item.id}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 disabled:opacity-60"
                        title="Save"
                      >
                        {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-xl bg-slate-50 text-school-muted"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs font-black text-school-blue uppercase">{item.label}</p>
                        <p className="text-[10px] font-bold text-school-muted">
                          Default ৳ {item.defaultAmount.toLocaleString('en-BD')}
                          {item.builtIn ? ' • Built-in' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-2 rounded-xl bg-slate-50 text-school-blue"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={busyId === item.id}
                        className="p-2 rounded-xl bg-red-50 text-red-500 disabled:opacity-60"
                        title={item.builtIn ? 'Hide from list' : 'Delete'}
                      >
                        {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </>
                  )}
                </div>
              ))}

              {archived.length > 0 && (
                <div className="pt-4 space-y-2">
                  <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Hidden Items</p>
                  {archived.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3"
                    >
                      <p className="flex-1 text-xs font-bold text-school-muted uppercase line-through">{item.label}</p>
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        disabled={busyId === item.id}
                        className="p-2 rounded-xl bg-white text-school-blue border border-slate-200 disabled:opacity-60"
                        title="Restore"
                      >
                        {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-school-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
