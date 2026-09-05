import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Landmark, Smartphone, Plus, Loader2, ArrowLeftRight, Globe, RotateCcw } from 'lucide-react';
import { getCurrentActorLabel } from '../../lib/actor';
import { cn, formatSignedBdt } from '../../lib/utils';
import { addAccount, computeAllBalances, fetchAccounts, fetchEntries, fetchReverseRequests, hasPendingReverseRequest, isEntryReversed, isPettyCashAccount, requestReverseEntry, transferBetweenAccounts } from '../../lib/ledger';
import type { LedgerAccount, LedgerAccountType, LedgerEntry, ReverseRequest } from '../../types';

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
  const [reverseRequests, setReverseRequests] = React.useState<ReverseRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddAccount, setShowAddAccount] = React.useState(false);
  const [showTransfer, setShowTransfer] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState({ name: '', type: 'bank' as LedgerAccountType, openingBalance: '' });
  const [transfer, setTransfer] = React.useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    charge: '',
    note: '',
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [reverseNote, setReverseNote] = React.useState<Record<string, string>>({});
  const [reversingId, setReversingId] = React.useState<string | null>(null);
  const [confirmEntry, setConfirmEntry] = React.useState<LedgerEntry | null>(null);
  const confirmBannerRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [accountData, entryData, reverseData] = await Promise.all([
        fetchAccounts(),
        fetchEntries(),
        fetchReverseRequests(),
      ]);
      setAccounts(accountData);
      setEntries(entryData);
      setReverseRequests(reverseData);
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
  const transferAmount = parseFloat(transfer.amount) || 0;
  const transferCharge = parseFloat(transfer.charge) || 0;
  const transferFromName = accounts.find((account) => account.id === transfer.fromAccountId)?.name ?? 'Source';
  const transferToName = accounts.find((account) => account.id === transfer.toAccountId)?.name ?? 'Destination';

  const handleReverse = (entry: LedgerEntry) => {
    const reason = reverseNote[entry.id]?.trim();
    if (!reason) {
      setError('Reverse entry-র জন্য reason লিখুন।');
      setMessage('');
      return;
    }
    setError('');
    setConfirmEntry(entry);
  };

  const handleConfirmReverse = async () => {
    if (!confirmEntry) return;
    const reason = reverseNote[confirmEntry.id]?.trim();
    if (!reason) {
      setError('Reverse entry-র জন্য reason লিখুন।');
      return;
    }
    setReversingId(confirmEntry.id);
    setError('');
    setMessage('');
    try {
      await requestReverseEntry({
        entry: confirmEntry,
        reason,
        accountName: accounts.find((account) => account.id === confirmEntry.accountId)?.name,
        actorName: getCurrentActorLabel('Accounts Department'),
      });
      setMessage(
        `Reverse request Principal-এর কাছে পাঠানো হয়েছে। ৳ ${confirmEntry.amount.toLocaleString('en-BD')} — ${confirmEntry.reference}. Accounts → Approvals ট্যাবে pending দেখাবে; Principal approve করলে reverse হবে।`,
      );
      setReverseNote((prev) => ({ ...prev, [confirmEntry.id]: '' }));
      setConfirmEntry(null);
      await load();
      window.setTimeout(() => confirmBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse request failed.');
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
    setMessage('');
    const amount = parseFloat(transfer.amount);
    const charge = parseFloat(transfer.charge) || 0;
    if (!transfer.fromAccountId || !transfer.toAccountId || transfer.fromAccountId === transfer.toAccountId || !amount || amount <= 0) {
      setError('From/To account আলাদা হতে হবে এবং valid amount দিতে হবে।');
      return;
    }
    if (charge < 0) {
      setError('Cashout / bank charge negative হতে পারে না।');
      return;
    }
    setBusy(true);
    try {
      const fromName = accounts.find((account) => account.id === transfer.fromAccountId)?.name ?? 'Source';
      const toName = accounts.find((account) => account.id === transfer.toAccountId)?.name ?? 'Destination';
      await transferBetweenAccounts({
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount,
        charge,
        note: transfer.note || undefined,
      });
      setTransfer((prev) => ({ ...prev, amount: '', charge: '', note: '' }));
      setShowTransfer(false);
      setMessage(
        charge > 0
          ? `৳ ${amount.toLocaleString('en-BD')} ${fromName} থেকে ${toName}-এ transfer হয়েছে। Cashout charge ৳ ${charge.toLocaleString('en-BD')} ${fromName} থেকে debit হয়ে Expenses-এ "Bank / MFS Charge" হিসেবে যোগ হয়েছে।`
          : `৳ ${amount.toLocaleString('en-BD')} ${fromName} থেকে ${toName}-এ transfer হয়েছে।`,
      );
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
          <div
            ref={confirmBannerRef}
            className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-700"
          >
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
            className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
          >
            <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest">
              Bank → Bank, bKash → Bank, Nagad cashout — charge থাকলে source account থেকে কাটা হবে এবং Expenses-এ যোগ হবে
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
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
                min={0}
                placeholder="Amount ৳"
                value={transfer.amount}
                onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
              />
              <input
                type="number"
                min={0}
                placeholder="Charge / Cashout ৳"
                value={transfer.charge}
                onChange={(e) => setTransfer({ ...transfer, charge: e.target.value })}
                className="px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none"
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
                {busy ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
            {transferAmount > 0 && (
              <p className="text-[11px] font-bold text-school-blue">
                {transferFromName} থেকে ৳ {(transferAmount + transferCharge).toLocaleString('en-BD')} যাবে
                {transferCharge > 0
                  ? ` (৳ ${transferAmount.toLocaleString('en-BD')} transfer + ৳ ${transferCharge.toLocaleString('en-BD')} charge)`
                  : ''}
                . {transferToName} পাবে ৳ {transferAmount.toLocaleString('en-BD')}
                {transferCharge > 0 ? '. Charge Expenses → Bank / MFS Charge-এ যোগ হবে।' : '.'}
              </p>
            )}
          </motion.form>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map(({ account, balance }) => (
              <div
                key={account.id}
                className={cn(
                  'p-5 rounded-2xl border hover:border-school-gold/30 hover:bg-slate-50 transition-all',
                  balance < 0 ? 'border-red-200 bg-red-50/60' : 'border-slate-100',
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', TYPE_STYLE[account.type])}>
                    {TYPE_ICON[account.type]}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{account.name}</p>
                    {isPettyCashAccount(account) && (
                      <p className="text-[9px] font-black uppercase tracking-widest text-school-muted">
                        {balance < 0 ? 'Overdrawn — transfer in to cover' : 'Minus allowed'}
                      </p>
                    )}
                  </div>
                </div>
                <p className={cn('text-xl font-black', balance < 0 ? 'text-red-600' : 'text-school-blue')}>
                  {formatSignedBdt(balance)}
                </p>
                <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest mt-1">{account.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-2">Recent Debit / Credit Entries</h3>
        <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mb-6">
          Reverse করলে Principal approve করার পর ledger update হবে
        </p>
        {message && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
            {error}
          </div>
        )}
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
                  const pendingReverse = hasPendingReverseRequest(entry.id, reverseRequests);
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
                          pendingReverse && 'bg-amber-50 text-school-gold',
                        )}
                      >
                        {reversed ? 'reversed' : pendingReverse ? 'pending reverse' : entry.type}
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
                      {reversed || entry.reference.startsWith('REVERSAL —') ? (
                        <span className="text-[9px] font-bold text-school-muted uppercase">—</span>
                      ) : pendingReverse ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-school-gold">
                          Waiting Principal
                        </span>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight mb-2">Confirm Reverse Entry</h3>
            <p className="text-[11px] text-school-muted font-medium mb-5">
              এই reverse Principal approve না করা পর্যন্ত ledger change হবে না। Request Accounts → Approvals-এ pending থাকবে।
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-bold space-y-1 mb-6">
              <p className="text-school-blue uppercase">{confirmEntry.reference}</p>
              <p className="text-school-muted">
                {accounts.find((account) => account.id === confirmEntry.accountId)?.name} • {confirmEntry.type.toUpperCase()} • ৳ {confirmEntry.amount.toLocaleString('en-BD')}
              </p>
              <p className="text-amber-700">Reason: {reverseNote[confirmEntry.id]}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmEntry(null)}
                className="flex-1 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reversingId === confirmEntry.id}
                onClick={handleConfirmReverse}
                className="flex-1 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {reversingId === confirmEntry.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Send to Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
