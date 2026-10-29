import { userErrorMessage } from '../../lib/errorMessages';
import React from 'react';
import { motion } from 'motion/react';
import { Lock, Loader2, Wallet, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { getCurrentActorLabel } from '../../lib/actor';
import { dayCloseStatus, getDailySummary, getDayCloseRecord, submitDayClose } from '../../lib/dayClose';
import type { DayCloseRecord } from '../../types';
import { showToast } from '../../lib/toast';
import { cn, formatDateTime, formatSignedBdt } from '../../lib/utils';

export function DayClosePanel() {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const [date, setDate] = React.useState(today);
  const [loading, setLoading] = React.useState(true);
  const [closing, setClosing] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [record, setRecord] = React.useState<DayCloseRecord | null>(null);
  const [error, setError] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [resultPopup, setResultPopup] = React.useState<{ kind: 'success' | 'error' | 'info'; title: string; detail?: string } | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof getDailySummary>> | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, current] = await Promise.all([getDailySummary(date), getDayCloseRecord(date).catch(() => null)]);
      setRecord(current);
      setSummary(data);
      setClosed(dayCloseStatus(current) === 'approved');
    } catch (err) {
      setError(userErrorMessage(err, 'Failed to load daily summary.'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    load();
  }, [load]);

  const dateLabel = formatDateTime(date);

  const openConfirm = async () => {
    setError('');
    const current = await getDayCloseRecord(date).catch(() => record);
    const status = dayCloseStatus(current);
    if (status === 'approved') {
      setClosed(true);
      setResultPopup({ kind: 'info', title: `${dateLabel} তারিখের দিন আগেই ক্লোজ (লক) করা হয়েছে।`, detail: current?.approvedBy || current?.closedBy ? `অনুমোদন: ${formatDateTime(current?.approvedAt ?? current?.closedAt)} • ${current?.approvedBy ?? current?.closedBy}` : undefined });
      return;
    }
    if (status === 'pending_approval') {
      setResultPopup({ kind: 'info', title: 'এই দিনের ক্লোজ অনুরোধ আগেই Principal-এর অনুমোদনের অপেক্ষায় আছে।', detail: `জমা: ${formatDateTime(current?.requestedAt)} • ${current?.requestedBy ?? ''}` });
      return;
    }
    setConfirmOpen(true);
  };

  const handleCloseDay = async () => {
    setConfirmOpen(false);
    setClosing(true);
    setError('');
    try {
      const saved = await submitDayClose({ date, requestedBy: getCurrentActorLabel('Accounts Department'), note: note || undefined });
      const title = `${date === today ? 'আজকের' : dateLabel + ' তারিখের'} দিন ক্লোজের অনুরোধ Principal-এর অনুমোদনের জন্য পাঠানো হয়েছে`;
      const detail = `${formatDateTime(saved.requestedAt)} • ${saved.requestedBy}। অনুমোদনের পর দিনটি লক হবে।`;
      setResultPopup({ kind: 'success', title, detail });
      showToast('success', title, detail);
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('pending approval')) {
        setResultPopup({ kind: 'info', title: 'এই দিনের ক্লোজ অনুরোধ আগেই অনুমোদনের অপেক্ষায় আছে।' });
      } else if (raw.includes('already closed')) {
        setClosed(true);
        setResultPopup({ kind: 'info', title: `${dateLabel} তারিখের দিন আগেই ক্লোজ করা হয়েছে।` });
      } else {
        const msg = userErrorMessage(err, 'দিন ক্লোজ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
        setError(msg);
        setResultPopup({ kind: 'error', title: 'দিন ক্লোজ করা যায়নি', detail: msg });
        showToast('error', 'দিন ক্লোজ করা যায়নি', msg);
      }
    } finally {
      setClosing(false);
    }
  };

  const bdt = (n: number) => `৳ ${n.toLocaleString('en-BD')}`;

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
                      <td className={cn('p-3 text-right font-black', row.balance < 0 ? 'text-red-600' : 'text-school-blue')}>
                        {formatSignedBdt(row.balance)}
                      </td>
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
                disabled={closed || dayCloseStatus(record) === 'pending_approval'}
              />
              <button
                type="button"
                disabled={closed || closing || dayCloseStatus(record) === 'pending_approval'}
                onClick={openConfirm}
                className="mt-4 px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
              >
                {closing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {closed ? 'দিন ক্লোজ (লক) হয়েছে' : dayCloseStatus(record) === 'pending_approval' ? 'অনুমোদনের অপেক্ষায়' : dayCloseStatus(record) === 'rejected' ? 'আবার জমা দিন (Close Day)' : 'Close Day'}
              </button>
              {record && (
                <div className="mt-3 space-y-1 text-[10px] font-bold">
                  {record.requestedAt && (
                    <p className="text-school-muted">জমা দেওয়া হয়েছে: {formatDateTime(record.requestedAt)} • {record.requestedBy}</p>
                  )}
                  {dayCloseStatus(record) === 'pending_approval' && (
                    <p className="text-amber-600">অনুমোদনের অপেক্ষায় — দিনটি এখনো লক হয়নি</p>
                  )}
                  {record.rejectedAt && (
                    <p className="text-red-600">
                      ফেরত দেওয়া হয়েছে: {formatDateTime(record.rejectedAt)} • {record.rejectedBy} — কারণ: {record.rejectReason}
                      {dayCloseStatus(record) === 'rejected' ? ' (ঠিক করে আবার জমা দিন)' : ''}
                    </p>
                  )}
                  {dayCloseStatus(record) === 'approved' && (
                    <p className="text-emerald-600">অনুমোদিত ও লক: {formatDateTime(record.approvedAt ?? record.closedAt)} • {record.approvedBy ?? record.closedBy}</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
      {confirmOpen && summary && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-base font-black text-school-blue">দিন ক্লোজের অনুরোধ নিশ্চিত করুন</h4>
            <p className="text-xs text-school-muted mt-1">তারিখ: <b>{dateLabel}</b>। অনুরোধটি Principal-এর কাছে অনুমোদনের জন্য যাবে; অনুমোদনের পর দিনটি লক হবে।</p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-3 rounded-xl bg-emerald-50"><p className="text-[10px] text-school-muted">আজকের আয়</p><p className="font-black text-emerald-600">{bdt(summary.totalIncome)}</p></div>
              <div className="p-3 rounded-xl bg-red-50"><p className="text-[10px] text-school-muted">আজকের খরচ</p><p className="font-black text-red-500">{bdt(summary.totalExpense)}</p></div>
              <div className="p-3 rounded-xl bg-slate-50"><p className="text-[10px] text-school-muted">নেট</p><p className="font-black text-school-blue">{formatSignedBdt(summary.netCash)}</p></div>
            </div>
            <p className="text-[11px] font-black text-school-blue mt-4 mb-2">অ্যাকাউন্টভিত্তিক ক্লোজিং ব্যালেন্স</p>
            <table className="w-full text-[11px]">
              <tbody className="divide-y divide-slate-100">
                {summary.accountSnapshots.map((row) => (
                  <tr key={row.accountId}>
                    <td className="py-1.5 font-bold">{row.accountName}</td>
                    <td className="py-1.5 text-right font-black">{formatSignedBdt(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setConfirmOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black">বাতিল</button>
              <button type="button" onClick={handleCloseDay} className="px-5 py-2.5 rounded-xl bg-school-blue text-white text-xs font-black">হ্যাঁ, অনুমোদনের জন্য পাঠান</button>
            </div>
          </div>
        </div>
      )}
      {resultPopup && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
            <p className={cn('text-base font-black', resultPopup.kind === 'success' ? 'text-emerald-600' : resultPopup.kind === 'error' ? 'text-red-600' : 'text-amber-600')}>
              {resultPopup.kind === 'success' ? '✓ ' : resultPopup.kind === 'error' ? '✕ ' : 'ℹ '}{resultPopup.title}
            </p>
            {resultPopup.detail && <p className="text-xs text-school-muted mt-2">{resultPopup.detail}</p>}
            <button type="button" onClick={() => setResultPopup(null)} className="mt-5 px-6 py-2.5 rounded-xl bg-school-blue text-white text-xs font-black">ঠিক আছে</button>
          </div>
        </div>
      )}
    </div>
  );
}
