import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Landmark, Smartphone, Plus, Loader2, ArrowLeftRight, Globe, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { addAccount, computeAllBalances, fetchAccounts, fetchEntries, isEntryReversed, reverseLedgerEntry, transferBetweenAccounts } from '../../lib/ledger';
import type { LedgerAccount, LedgerAccountType, LedgerEntry } from '../../types';

const TYPE_ICON: Record<LedgerAccountType, React.ReactNode> = {
  cash: <Wallet size={18} />,
  bank: <Landmark size={18} />,
  mobile: <Smartphone size={18} />,
  online: <Globe size={18} />,
};

const TYPE_STYLE: Record<LedgerAccountType, string> = {
  cash: 'bg-amber-50 text-school-gold',
  bank: 'bg-blue-50 text-school-blue',
  mobile: 'bg-pink-50 text-pink-500',
  online: 'bg-violet-50 text-violet-600',
};

export function LedgerPanel() {
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [entries, setEntries] = React.useState<LedgerEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddAccount, setShowAddAccount] = React.useState(false);
  const [showTransfer, setShowTransfer] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState({ name: '', type: 'bank' as LedgerAccountType, openingBalance: '' });
  const [transfer, setTransfer] = React.useState({ fromAccountId: '', toAccountId: '', amount: '', note: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [reverseNote, setReverseNote] = React.useState<Record<string, string>>({});
  const [reversingId, setReversingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [accountData, entryData] = await Promise.all([fetchAccounts(), fetchEntries()]);
      setAccounts(accountData);
      setEntries(entryData);
      setTransfer((prev) => ({
        ...prev,
        fromAccountId: prev.fromAccountId || accountData[0]?.id || '',
        toAccountId: prev.toAccountId || accountData[1]?.id || '',
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const balances = computeAllBalances(accounts, entries);
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);

  const handleReverse = async (entry: LedgerEntry) => {
    const reason = reverseNote[entry.id]?.trim();
    if (!reason) {
      setError('Reverse entry-র জন্য reason লিখুন।');
      return;
    }
    setReversingId(entry.id);
    setError('');
    setMessage('');
    try {
      await reverseLedgerEntry({ entry, reason, actorName: 'Accounts Department' });
      setMessage('Reverse entry recorded successfully.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse entry failed.');
    } finally {
      setReversingId(null);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newAccount.name.trim()) {
      setError('Account name দিন।');
      return;
    }
    setBusy(true);
    try {
      await addAccount({
        name: newAccount.name,
        type: newAccount.type,
        openingBalance: parseFloat(newAccount.openingBalance) || 0,
      });
      setNewAccount({ name: '', type: 'bank', openingBalance: '' });
      setShowAddAccount(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add account failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(transfer.amount);
    if (!transfer.fromAccountId || !transfer.toAccountId || transfer.fromAccountId === transfer.toAccountId || !amount || amount <= 0) {
      setError('From/To account আলাদা হতে হবে এবং valid amount দিতে হবে।');
      return;
    }
    setBusy(true);
    try {
      await transferBetweenAccounts({
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount,
        note: transfer.note || undefined,
      });
      setTransfer((prev) => ({ ...prev, amount: '', note: '' }));
      setShowTransfer(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Bank & MFS Ledger</h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowTransfer((v) => !v)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-100 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2"
            >
              <ArrowLeftRight size={14} /> Internal Transfer
            </button>
            <button
              type="button"
              onClick={() => setShowAddAccount((v) => !v)}
              className="px-5 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Plus size={14} /> Add Account
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-700">
            {message}
          </div>
        )}

        {showAddAccount && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddAccount}
            className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <input
              type="text"
              placeholder="Account name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <select
              value={newAccount.type}
              onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as LedgerAccountType })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mobile">Mobile (MFS)</option>
            </select>
            <input
              type="number"
              placeholder="Opening balance"
              value={newAccount.openingBalance}
              onChange={(e) => setNewAccount({ ...newAccount, openingBalance: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              Save Account
            </button>
          </motion.form>
        )}

        {showTransfer && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleTransfer}
            className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-3"
          >
            <select
              value={transfer.fromAccountId}
              onChange={(e) => setTransfer({ ...transfer, fromAccountId: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  From: {account.name}
                </option>
              ))}
            </select>
            <select
              value={transfer.toAccountId}
              onChange={(e) => setTransfer({ ...transfer, toAccountId: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  To: {account.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={transfer.note}
              onChange={(e) => setTransfer({ ...transfer, note: e.target.value })}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              Transfer
            </button>
          </motion.form>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map(({ account, balance }) => (
              <div key={account.id} className="p-5 rounded-2xl border border-slate-100 hover:border-school-gold/30 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', TYPE_STYLE[account.type])}>
                    {TYPE_ICON[account.type]}
                  </div>
                  <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{account.name}</p>
                </div>
                <p className="text-xl font-black text-school-blue">৳ {balance.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest mt-1">{account.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2">Recent Debit / Credit Entries</h3>
        <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mb-6">
          ভুল entry হলে Reverse Entry দিয়ে correction করুন
        </p>
        {recentEntries.length === 0 ? (
          <p className="text-school-muted text-sm font-medium text-center py-8">কোনো entry নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Reverse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEntries.map((entry) => {
                  const reversed = isEntryReversed(entry, entries);
                  return (
                  <tr key={entry.id} className={cn('hover:bg-slate-50 transition-colors', reversed && 'opacity-60')}>
                    <td className="py-3 font-bold text-school-blue">{entry.date.slice(0, 10)}</td>
                    <td className="py-3 text-slate-500 font-medium">
                      {accounts.find((a) => a.id === entry.accountId)?.name || entry.accountId}
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {entry.reference}
                      {entry.reversalOfEntryId && (
                        <span className="block text-[9px] text-amber-700 font-bold uppercase">Reversal Entry</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-lg text-[8px] font-black uppercase',
                          entry.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500',
                          reversed && 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {reversed ? 'reversed' : entry.type}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'py-3 text-right font-black',
                        entry.type === 'credit' ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {entry.type === 'credit' ? '+' : '−'} ৳ {entry.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {!reversed && !entry.reference.startsWith('REVERSAL —') ? (
                        <div className="flex flex-col items-end gap-2 min-w-[160px]">
                          <input
                            type="text"
                            value={reverseNote[entry.id] ?? ''}
                            onChange={(e) => setReverseNote((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                            placeholder="Reverse reason..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none"
                          />
                          <button
                            type="button"
                            disabled={reversingId === entry.id}
                            onClick={() => handleReverse(entry)}
                            className="px-3 py-1.5 bg-amber-50 text-school-gold rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 disabled:opacity-60"
                          >
                            {reversingId === entry.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Reverse
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-school-muted uppercase">—</span>
                      )}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
