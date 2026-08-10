import React from 'react';
import { motion } from 'motion/react';
import { Lock, Loader2, Wallet, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { closeDay, getDailySummary, isDayClosed } from '../../lib/dayClose';
import { cn } from '../../lib/utils';

export function DayClosePanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = React.useState(today);
  const [loading, setLoading] = React.useState(true);
  const [closing, setClosing] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getDailySummary>> | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, dayClosed] = await Promise.all([getDailySummary(date), isDayClosed(date)]);
      setSummary(data);
      setClosed(dayClosed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily summary.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCloseDay = async () => {
    setClosing(true);
    setError('');
    try {
      await closeDay({ date, closedBy: 'Accounts Dept.', note: note || undefined });
      setClosed(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Day close failed.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Day Close & Cash Summary</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Daily income, expense, account-wise balance & cash deposit reminder
            </p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
            <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading summary...</p>
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Today Income', value: summary.totalIncome, icon: <ArrowUpRight size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Today Expense', value: summary.totalExpense, icon: <ArrowDownRight size={18} />, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Net Cash Flow', value: summary.netCash, icon: <Wallet size={18} />, color: 'text-school-blue', bg: 'bg-blue-50' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg, stat.color)}>{stat.icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-school-muted uppercase tracking-widest">{stat.label}</p>
                    <p className={cn('text-xl font-black', stat.color)}>৳ {stat.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-black text-school-blue uppercase tracking-widest mb-4">Account-wise Summary</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 mb-8">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-school-muted font-black uppercase tracking-widest">
                    <th className="p-3">Account</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Today Income</th>
                    <th className="p-3 text-right">Today Expense</th>
                    <th className="p-3 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.accountSnapshots.map((row) => (
                    <tr key={row.accountId}>
                      <td className="p-3 font-black text-school-blue">{row.accountName}</td>
                      <td className="p-3 uppercase text-school-muted">{row.accountType}</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">৳ {row.todayIncome.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-500 font-bold">৳ {row.todayExpense.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-school-blue">৳ {row.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {summary.depositReminders.length > 0 && (
              <div className="mb-8 space-y-3">
                <h4 className="text-xs font-black text-school-blue uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} className="text-school-gold" /> Cash Deposit Reminders
                </h4>
                {summary.depositReminders.map((reminder) => (
                  <div key={reminder.accountId} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-800">
                    {reminder.message}
                    <p className="mt-1 text-[10px]">Suggested deposit: ৳ {reminder.suggestedDeposit.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Day Close Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cash deposited to City Bank"
                className="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                disabled={closed}
              />
              <button
                type="button"
                disabled={closed || closing}
                onClick={handleCloseDay}
                className="mt-4 px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
              >
                {closing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {closed ? 'Day Already Closed' : 'Close Day'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
