import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Save, Settings } from 'lucide-react';
import { fetchFeeStructure, saveFeeStructure } from '../../lib/admissions';
import type { FeeStructureItem } from '../../types';

export function FeeStructureModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = React.useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetchFeeStructure()
      .then((structure) => setItems(structure.items))
      .finally(() => setLoading(false));
  }, []);

  const handleAmountChange = (key: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, amount: parseFloat(value) || 0 } : item)));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFeeStructure(items);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

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
          className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-school-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-school-gold" />
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Fee Structure</h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto text-school-blue" />
              </div>
            ) : (
              items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{item.label}</p>
                    {!item.discountable && (
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
              ))
            )}
          </div>

          <div className="p-6 border-t border-school-border flex items-center justify-between">
            {saved && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Saved ✓</p>}
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="ml-auto px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Structure
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
