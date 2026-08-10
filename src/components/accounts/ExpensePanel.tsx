import React from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, ArrowDownRight } from 'lucide-react';
import { createExpense, fetchExpenses } from '../../lib/expenses';
import { fetchApprovedCategories } from '../../lib/categories';
import { fetchAccounts } from '../../lib/ledger';
import type { Expense, LedgerAccount } from '../../types';

export function ExpensePanel() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    description: '',
    amount: '',
    accountId: '',
    note: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [expenseData, accountData, categoryList] = await Promise.all([
        fetchExpenses(),
        fetchAccounts(),
        fetchApprovedCategories('expense'),
      ]);
      setExpenses(expenseData);
      setAccounts(accountData);
      setCategories(categoryList);
      setForm((prev) => ({
        ...prev,
        accountId: prev.accountId || accountData[0]?.id || '',
        category: prev.category || categoryList[0] || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.description.trim() || !amount || amount <= 0 || !form.accountId) {
      setError('Description, valid amount, ও account select করা আবশ্যক।');
      return;
    }

    setSubmitting(true);
    try {
      await createExpense({
        date: form.date,
        category: form.category,
        description: form.description,
        amount,
        accountId: form.accountId,
        note: form.note || undefined,
      });
      setForm((prev) => ({ ...prev, description: '', amount: '', note: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Expense entry failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm lg:col-span-1"
      >
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
          <ArrowDownRight size={16} className="text-red-500" /> New Expense Entry
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Generator Repair"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Amount (৳)</label>
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Paid From</label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Plus size={14} /> Record Expense
              </>
            )}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm lg:col-span-2"
      >
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6">Expense History</h3>
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-school-muted font-medium text-sm">কোনো expense entry নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold text-school-blue">{expense.date.slice(0, 10)}</td>
                    <td className="py-4 font-black text-school-blue uppercase">{expense.category}</td>
                    <td className="py-4 text-slate-500 font-medium">{expense.description}</td>
                    <td className="py-4 text-slate-500 font-medium">
                      {accounts.find((a) => a.id === expense.accountId)?.name || expense.accountId}
                    </td>
                    <td className="py-4 text-right font-black text-red-500">৳ {expense.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
