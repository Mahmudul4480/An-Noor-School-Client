import React from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, ArrowDownRight, Tag, FileText, X } from 'lucide-react';
import { getCurrentActorLabel } from '../../lib/actor';
import { formatSignedBdt } from '../../lib/utils';
import { createExpense, fetchExpenses } from '../../lib/expenses';
import { fetchApprovedCategories, fetchCategoryRequests, requestCategory } from '../../lib/categories';
import { computeAllBalances, fetchAccounts, fetchEntries, isPettyCashAccount } from '../../lib/ledger';
import { ExpenseVoucherModal } from './ExpenseVoucherModal';
import type { CategoryRequest, Expense, LedgerAccount, LedgerEntry } from '../../types';

export function ExpensePanel() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [entries, setEntries] = React.useState<LedgerEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [pendingCategories, setPendingCategories] = React.useState<CategoryRequest[]>([]);
  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [categoryBusy, setCategoryBusy] = React.useState(false);
  const [categoryError, setCategoryError] = React.useState('');
  const [voucherExpense, setVoucherExpense] = React.useState<Expense | null>(null);
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
      const [expenseData, accountData, entryData, categoryList, categoryRequests] = await Promise.all([
        fetchExpenses(),
        fetchAccounts(),
        fetchEntries(),
        fetchApprovedCategories('expense'),
        fetchCategoryRequests(),
      ]);
      setExpenses(expenseData);
      setAccounts(accountData);
      setEntries(entryData);
      setCategories(categoryList);
      setPendingCategories(
        categoryRequests.filter((request) => request.type === 'expense' && request.status === 'pending'),
      );
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

  const balances = computeAllBalances(accounts, entries);
  const selectedAccount = accounts.find((account) => account.id === form.accountId);
  const selectedBalance = selectedAccount
    ? balances.find((row) => row.account.id === selectedAccount.id)?.balance ?? selectedAccount.openingBalance
    : 0;
  const selectedIsPetty = selectedAccount ? isPettyCashAccount(selectedAccount) : false;

  const handleCreateCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      setCategoryError('Category name লিখুন।');
      return;
    }
    setCategoryBusy(true);
    setCategoryError('');
    try {
      await requestCategory({ type: 'expense', name, requestedBy: getCurrentActorLabel('Accounts Department') });
      setNewCategory('');
      setShowNewCategory(false);
      setMessage(`"${name}" category Principal approval-এর জন্য পাঠানো হয়েছে। Approve হলে dropdown-এ যুক্ত হবে।`);
      await load();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Category request failed.');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.description.trim() || !amount || amount <= 0 || !form.accountId) {
      setError('Description, valid amount, ও account select করা আবশ্যক।');
      return;
    }

    setSubmitting(true);
    setMessage('');
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
      setMessage(
        selectedIsPetty
          ? 'Expense নেওয়া হয়েছে। Petty cash-এ টাকা না থাকলেও balance minus দেখাবে; Principal approve করবে, পরে bank থেকে transfer করলে ঘাটতি কমে যাবে।'
          : 'Expense Principal approval-এর জন্য submit হয়েছে।',
      );
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
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2 flex items-center gap-2">
          <ArrowDownRight size={16} className="text-red-500" /> New Expense Entry
        </h3>
        <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mb-6">
          সব expense Principal approve করার পর ledger-এ record হবে
        </p>
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Category</label>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory((open) => !open);
                  setCategoryError('');
                }}
                className="text-[9px] font-black uppercase tracking-widest text-school-gold hover:text-school-blue flex items-center gap-1"
              >
                {showNewCategory ? <X size={11} /> : <Plus size={11} />}
                {showNewCategory ? 'Close' : 'New Category'}
              </button>
            </div>
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

            {showNewCategory && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <p className="text-[10px] font-bold text-school-muted">
                  নতুন expense category Principal approve করার পর dropdown-এ আসবে।
                </p>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="e.g. Generator Fuel"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                />
                {categoryError && <p className="text-[11px] font-bold text-red-600">{categoryError}</p>}
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={categoryBusy}
                  className="w-full py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {categoryBusy ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                  Send to Principal
                </button>
              </div>
            )}

            {pendingCategories.length > 0 && (
              <p className="text-[10px] font-bold text-school-gold">
                Awaiting approval: {pendingCategories.map((request) => request.name).join(', ')}
              </p>
            )}
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
              {accounts.map((account) => {
                const balance = balances.find((row) => row.account.id === account.id)?.balance ?? account.openingBalance;
                return (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatSignedBdt(balance)})
                    {isPettyCashAccount(account) ? ' — minus allowed' : ''}
                  </option>
                );
              })}
            </select>
            {selectedIsPetty && (
              <p className="text-[10px] font-bold text-school-muted">
                এখন {formatSignedBdt(selectedBalance)}. টাকা না থাকলেও entry হবে — কারো কাছ থেকে নিয়ে খরচ হলে petty cash minus যাবে। পরে transfer করলে কমে যাবে।
              </p>
            )}
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
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-700">
              {message}
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
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Entered By</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Voucher</th>
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
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                        expense.approvalStatus === 'pending'
                          ? 'bg-amber-50 text-school-gold'
                          : expense.approvalStatus === 'rejected'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {expense.approvalStatus ?? 'approved'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 font-medium">{expense.createdBy || '—'}</td>
                    <td className="py-4 text-right font-black text-red-500">৳ {expense.amount.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      {(expense.approvalStatus ?? 'approved') === 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setVoucherExpense(expense)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100"
                        >
                          <FileText size={12} /> Voucher
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-school-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {voucherExpense && (
        <ExpenseVoucherModal
          expense={voucherExpense}
          account={accounts.find((account) => account.id === voucherExpense.accountId)}
          onClose={() => setVoucherExpense(null)}
        />
      )}
    </div>
  );
}
