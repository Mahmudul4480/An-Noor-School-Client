import React from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, TrendingUp, Tag, X, FileText, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import { getCurrentActorLabel } from '../../lib/actor';
import { computeIncomeStats, createIncomeEntry, fetchIncomeEntries } from '../../lib/income';
import { fetchApprovedCategories, fetchCategoryRequests, requestCategory } from '../../lib/categories';
import { fetchAccounts, ONLINE_PAYMENT_ACCOUNT_ID } from '../../lib/ledger';
import { cn } from '../../lib/utils';
import { IncomeReceiptModal } from './IncomeReceiptModal';
import type { CategoryRequest, IncomeEntry, LedgerAccount } from '../../types';

const METHOD_LABEL: Record<NonNullable<IncomeEntry['paymentMethod']>, string> = {
  cash: 'Cash',
  bank: 'Bank Deposit / Transfer',
  mobile: 'Mobile Banking',
};

const METHOD_FOR_ACCOUNT: Record<LedgerAccount['type'], NonNullable<IncomeEntry['paymentMethod']>> = {
  cash: 'cash',
  bank: 'bank',
  mobile: 'mobile',
  online: 'bank',
};

export function IncomePanel() {
  const [entries, setEntries] = React.useState<IncomeEntry[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [pendingCategories, setPendingCategories] = React.useState<CategoryRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | IncomeEntry['approvalStatus']>('all');
  const [receiptEntry, setReceiptEntry] = React.useState<IncomeEntry | null>(null);

  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [categoryBusy, setCategoryBusy] = React.useState(false);
  const [categoryError, setCategoryError] = React.useState('');

  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    source: '',
    description: '',
    amount: '',
    accountId: '',
    paymentMethod: 'cash' as NonNullable<IncomeEntry['paymentMethod']>,
    reference: '',
    note: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [entryData, accountData, categoryList, categoryRequests] = await Promise.all([
        fetchIncomeEntries(),
        fetchAccounts(),
        fetchApprovedCategories('income'),
        fetchCategoryRequests(),
      ]);
      const usable = accountData.filter((account) => account.id !== ONLINE_PAYMENT_ACCOUNT_ID);
      setEntries(entryData);
      setAccounts(accountData);
      setCategories(categoryList);
      setPendingCategories(
        categoryRequests.filter((request) => request.type === 'income' && request.status === 'pending'),
      );
      setForm((prev) => ({
        ...prev,
        accountId: prev.accountId || usable.find((account) => account.id === 'main-cash')?.id || usable[0]?.id || '',
        category: prev.category || categoryList[0] || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const collectionAccounts = accounts.filter((account) => account.id !== ONLINE_PAYMENT_ACCOUNT_ID);
  const stats = computeIncomeStats(entries);
  const filtered = entries.filter((entry) => statusFilter === 'all' || entry.approvalStatus === statusFilter);

  const handleAccountChange = (accountId: string) => {
    const account = collectionAccounts.find((item) => item.id === accountId);
    setForm((prev) => ({
      ...prev,
      accountId,
      paymentMethod: account ? METHOD_FOR_ACCOUNT[account.type] : prev.paymentMethod,
    }));
  };

  const handleCreateCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      setCategoryError('Category name লিখুন।');
      return;
    }
    setCategoryBusy(true);
    setCategoryError('');
    try {
      await requestCategory({ type: 'income', name, requestedBy: getCurrentActorLabel('Accounts Department') });
      setNewCategory('');
      setShowNewCategory(false);
      setMessage(`"${name}" income category Principal approval-এর জন্য পাঠানো হয়েছে।`);
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
    setMessage('');

    if (form.paymentMethod !== 'cash' && !form.reference.trim()) {
      setError('Bank / mobile-এ জমা হলে deposit slip বা transaction number দিন।');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createIncomeEntry({
        date: form.date,
        category: form.category,
        source: form.source,
        description: form.description,
        amount: parseFloat(form.amount),
        accountId: form.accountId,
        paymentMethod: form.paymentMethod,
        reference: form.reference || undefined,
        note: form.note || undefined,
      });
      setForm((prev) => ({ ...prev, source: '', description: '', amount: '', reference: '', note: '' }));
      setMessage(
        `${created.receiptNumber} — ৳ ${created.amount.toLocaleString('en-BD')} Principal approval-এর জন্য পাঠানো হয়েছে। Approve হলে ledger-এ credit হবে ও money receipt তৈরি হবে।`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Income entry failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Approved Income" value={`৳ ${stats.approvedTotal.toLocaleString('en-BD')}`} icon={<CheckCircle2 size={18} />} tone="emerald" />
        <StatCard label="This Month" value={`৳ ${stats.monthTotal.toLocaleString('en-BD')}`} icon={<TrendingUp size={18} />} tone="blue" />
        <StatCard label="Awaiting Principal" value={`৳ ${stats.pendingTotal.toLocaleString('en-BD')}`} icon={<Clock size={18} />} tone="amber" />
        <StatCard label="Pending Entries" value={String(stats.pendingCount)} icon={<Wallet size={18} />} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm lg:col-span-1"
        >
          <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Manual Income Entry
          </h3>
          <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mb-6">
            Tuition ও admission ছাড়া অন্য সব income — Principal approve করলে ledger-এ যাবে
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
                    নতুন income category Principal approve করার পর dropdown-এ আসবে।
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
                    placeholder="e.g. Hall Rent"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Received From</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. Mr. Rahman / Canteen Contractor"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Annual sports donation"
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
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                Deposited In Account
              </label>
              <select
                value={form.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              >
                <option value="">Select account...</option>
                {collectionAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Payment Mode</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(METHOD_LABEL) as NonNullable<IncomeEntry['paymentMethod']>[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: method })}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border text-left',
                      form.paymentMethod === method
                        ? 'bg-school-blue text-white border-school-blue'
                        : 'bg-slate-50 text-school-muted border-slate-100',
                    )}
                  >
                    {METHOD_LABEL[method]}
                  </button>
                ))}
              </div>
            </div>

            {form.paymentMethod !== 'cash' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                  Deposit Slip / Transaction No
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="e.g. DEP-778142"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Note</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>
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
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Send for Approval
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-xs font-black text-school-blue uppercase tracking-widest">Income History</h3>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest',
                    statusFilter === status ? 'bg-school-blue text-white' : 'bg-slate-50 text-school-muted',
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={28} className="animate-spin mx-auto text-school-blue" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-school-muted font-medium text-sm">কোনো income entry নেই।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Receipt</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">From</th>
                    <th className="pb-3">Account</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Entered By</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-bold text-school-blue">{entry.date}</td>
                      <td className="py-4 font-black text-school-gold">{entry.receiptNumber}</td>
                      <td className="py-4 font-black text-school-blue uppercase">{entry.category}</td>
                      <td className="py-4 text-slate-500 font-medium">
                        {entry.source}
                        <span className="block text-[10px] text-school-muted">{entry.description}</span>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        {accounts.find((account) => account.id === entry.accountId)?.name || entry.accountId}
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-lg text-[9px] font-black uppercase',
                            entry.approvalStatus === 'pending'
                              ? 'bg-amber-50 text-school-gold'
                              : entry.approvalStatus === 'rejected'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-emerald-50 text-emerald-600',
                          )}
                        >
                          {entry.approvalStatus}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">{entry.createdBy || '—'}</td>
                      <td className="py-4 text-right font-black text-emerald-600">
                        ৳ {entry.amount.toLocaleString('en-BD')}
                      </td>
                      <td className="py-4 text-right">
                        {entry.approvalStatus === 'approved' ? (
                          <button
                            type="button"
                            onClick={() => setReceiptEntry(entry)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100"
                          >
                            <FileText size={12} /> Receipt
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
      </div>

      {receiptEntry && (
        <IncomeReceiptModal
          entry={receiptEntry}
          account={accounts.find((account) => account.id === receiptEntry.accountId)}
          onClose={() => setReceiptEntry(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100 text-school-blue',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-school-gold',
    red: 'bg-red-50 border-red-100 text-red-600',
  };

  return (
    <div className={cn('p-5 rounded-[1.5rem] border', tones[tone])}>
      <div className="flex justify-between items-start mb-2">
        {icon}
        <span className="text-lg font-black">{value}</span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</p>
    </div>
  );
}
