import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Save, Settings } from 'lucide-react';
import {
  admissionFeeFromItems,
  fetchAllFeeStructures,
  resolveClassFeeItems,
  saveFeeStructure,
  tuitionFromItems,
} from '../../lib/admissions';
import { syncClassTuitionInvoices } from '../../lib/invoices';
import { CLASS_OPTIONS } from '../../lib/schoolConstants';
import { cn } from '../../lib/utils';
import type { FeeStructure, FeeStructureItem } from '../../types';

const HIGHLIGHT_KEYS = new Set(['admissionFee', 'tuitionFee']);

export function FeeStructureModal({ onClose }: { onClose: () => void }) {
  const [selectedClass, setSelectedClass] = React.useState<string>(CLASS_OPTIONS[0]);
  const [structures, setStructures] = React.useState<FeeStructure[]>([]);
  const [items, setItems] = React.useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchAllFeeStructures();
      setStructures(all);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setItems(resolveClassFeeItems(structures, selectedClass));
  }, [selectedClass, structures]);

  React.useEffect(() => {
    setMessage('');
  }, [selectedClass]);

  const handleAmountChange = (key: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, amount: parseFloat(value) || 0 } : item)));
    setMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const saved = await saveFeeStructure(selectedClass, items);
      const tuitionAmount = tuitionFromItems(saved.items);
      const sync = await syncClassTuitionInvoices({
        className: selectedClass,
        tuitionAmount,
      });
      setStructures((prev) => {
        const next = prev.filter((structure) => structure.id !== saved.id && structure.className !== saved.className);
        return [...next, saved];
      });
      setMessage(
        `${selectedClass} saved. Admission ৳ ${admissionFeeFromItems(saved.items).toLocaleString('en-BD')}, Tuition ৳ ${tuitionAmount.toLocaleString('en-BD')}. This month: ${sync.created} new invoice(s), ${sync.updated} updated, ${sync.skippedPaid} already paid skipped.`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Fee structure save failed.');
    } finally {
      setSaving(false);
    }
  };

  const overview = CLASS_OPTIONS.map((className) => {
    const classItems = className === selectedClass ? items : resolveClassFeeItems(structures, className);
    return {
      className,
      admission: admissionFeeFromItems(classItems),
      tuition: tuitionFromItems(classItems),
    };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-school-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-school-gold" />
              <div>
                <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Class Fee Structure</h3>
                <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                  প্রতি class-এ আলাদা Admission Fee ও Tuition Fee
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              >
                {CLASS_OPTIONS.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-school-muted font-black uppercase tracking-widest">
                    <th className="p-3">Class</th>
                    <th className="p-3 text-right">Admission Fee</th>
                    <th className="p-3 text-right">Tuition Fee / Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {overview.map((row) => (
                    <tr
                      key={row.className}
                      className={cn(
                        'cursor-pointer hover:bg-slate-50',
                        row.className === selectedClass && 'bg-amber-50',
                      )}
                      onClick={() => setSelectedClass(row.className)}
                    >
                      <td className="p-3 font-black text-school-blue uppercase">{row.className}</td>
                      <td className="p-3 text-right font-bold">৳ {row.admission.toLocaleString('en-BD')}</td>
                      <td className="p-3 text-right font-bold">৳ {row.tuition.toLocaleString('en-BD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading ? (
              <div className="py-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto text-school-blue" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-school-blue uppercase tracking-widest">
                  Edit fees for {selectedClass}
                </p>
                {items.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-center justify-between gap-4 p-3 rounded-xl border',
                      HIGHLIGHT_KEYS.has(item.key)
                        ? 'bg-amber-50 border-school-gold/40'
                        : 'bg-slate-50 border-slate-100',
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{item.label}</p>
                      {item.key === 'admissionFee' && (
                        <p className="text-[9px] font-bold text-school-gold uppercase tracking-widest mt-0.5">
                          Class-wise admission amount
                        </p>
                      )}
                      {item.key === 'tuitionFee' && (
                        <p className="text-[9px] font-bold text-school-gold uppercase tracking-widest mt-0.5">
                          Monthly invoice this class-এর studentদের এই amount-এ generate হবে
                        </p>
                      )}
                      {!item.discountable && item.key !== 'tuitionFee' && (
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mt-0.5">Non-discountable</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-school-muted">৳</span>
                      <input
                        type="number"
                        min={0}
                        value={item.amount}
                        onChange={(e) => handleAmountChange(item.key, e.target.value)}
                        className="w-28 text-right px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                {message}
              </p>
            )}
          </div>

          <div className="p-6 border-t border-school-border flex items-center justify-between gap-3">
            <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest">
              Paid invoice change হবে না
            </p>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save {selectedClass}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
