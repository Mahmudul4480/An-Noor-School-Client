import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  computeInvoiceStats,
  createOptionalInvoice,
  ensureMonthlyTuitionInvoices,
  fetchInvoices,
  formatBillingMonth,
  formatBillingMonthLabel,
  markInvoicePaidAtSchool,
  OPTIONAL_FEE_TYPES,
} from '../../lib/invoices';
import { fetchAccounts, ONLINE_PAYMENT_ACCOUNT_ID } from '../../lib/ledger';
import { fetchStudents } from '../../lib/students';
import { isPaymentGatewayConfigured } from '../../lib/payments';
import type { InvoiceLineItem, LedgerAccount, PaymentMethod, Student, StudentInvoice } from '../../types';

const STATUS_STYLE: Record<StudentInvoice['status'], string> = {
  pending: 'bg-amber-50 text-school-gold',
  paid: 'bg-emerald-50 text-emerald-600',
  partial: 'bg-blue-50 text-school-blue',
  overdue: 'bg-red-50 text-red-500',
  cancelled: 'bg-slate-100 text-slate-500',
};

export function InvoicingPanel() {
  const [invoices, setInvoices] = React.useState<StudentInvoice[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [billingMonth, setBillingMonth] = React.useState(formatBillingMonth());
  const [statusFilter, setStatusFilter] = React.useState<'all' | StudentInvoice['status']>('all');
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [showOptional, setShowOptional] = React.useState(false);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payAccountId, setPayAccountId] = React.useState('');

  const [optionalForm, setOptionalForm] = React.useState({
    studentId: '',
    selectedFees: [] as string[],
    customLabel: '',
    customAmount: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invoiceData, studentData, accountData] = await Promise.all([
        fetchInvoices({ billingMonth }),
        fetchStudents(),
        fetchAccounts(),
      ]);
      setInvoices(invoiceData);
      setStudents(studentData.filter((student) => student.status === 'Active'));
      setAccounts(accountData);
      setPayAccountId((prev) => prev || accountData.find((account) => account.id === 'main-cash')?.id || accountData[0]?.id || '');
      setOptionalForm((prev) => ({
        ...prev,
        studentId: prev.studentId || studentData.find((student) => student.status === 'Active')?.studentId || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [billingMonth]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    ensureMonthlyTuitionInvoices(formatBillingMonth())
      .then((result) => {
        if (result.created > 0) {
          setMessage(`Auto-generated ${result.created} tuition invoice(s) for ${formatBillingMonthLabel(formatBillingMonth())}.`);
          load();
        }
      })
      .catch(() => {
        /* silent on background auto-generate */
      });
  }, []);

  const stats = computeInvoiceStats(invoices);
  const filtered = invoices.filter((invoice) => statusFilter === 'all' || invoice.status === statusFilter);
  const onlineAccount = accounts.find((account) => account.id === ONLINE_PAYMENT_ACCOUNT_ID);
  const gatewayReady = isPaymentGatewayConfigured();

  const handleGenerateMonth = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const result = await ensureMonthlyTuitionInvoices(billingMonth);
      setMessage(
        `${formatBillingMonthLabel(billingMonth)}: ${result.created} new invoice(s) created, ${result.skipped} already existed.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (invoiceId: string, method: PaymentMethod) => {
    if (!payAccountId) {
      setError('Payment account select করুন।');
      return;
    }
    setPayingId(invoiceId);
    setError('');
    try {
      await markInvoicePaidAtSchool({
        invoiceId,
        accountId: payAccountId,
        paymentMethod: method === 'gateway' || method === 'online' ? 'cash' : method,
      });
      setMessage('Payment recorded successfully.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment recording failed.');
    } finally {
      setPayingId(null);
    }
  };

  const handleOptionalInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const lineItems: InvoiceLineItem[] = OPTIONAL_FEE_TYPES.filter((fee) =>
      optionalForm.selectedFees.includes(fee.key),
    ).map((fee) => ({ key: fee.key, label: fee.label, amount: fee.defaultAmount }));

    if (optionalForm.customLabel.trim() && parseFloat(optionalForm.customAmount) > 0) {
      lineItems.push({
        key: 'other',
        label: optionalForm.customLabel.trim(),
        amount: parseFloat(optionalForm.customAmount),
      });
    }

    if (lineItems.length === 0) {
      setError('At least one optional fee select করুন।');
      return;
    }

    setGenerating(true);
    try {
      await createOptionalInvoice({
        studentId: optionalForm.studentId,
        billingMonth,
        lineItems,
      });
      setShowOptional(false);
      setOptionalForm((prev) => ({ ...prev, selectedFees: [], customLabel: '', customAmount: '' }));
      setMessage('Optional fee invoice created.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optional invoice failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight flex items-center gap-2">
                <Zap size={18} className="text-school-gold" /> Monthly Tuition Invoicing
              </h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
                Active students-এর tuition fee auto generate হয় • Manual optional fees add করা যায়
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              />
              <button
                type="button"
                onClick={handleGenerateMonth}
                disabled={generating}
                className="px-5 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Generate Tuition
              </button>
              <button
                type="button"
                onClick={() => setShowOptional(true)}
                className="px-5 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={14} /> Optional Fee
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">{error}</div>
          )}
          {message && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-700">{message}</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="This Month Invoices" value={String(invoices.length)} icon={<CreditCard size={18} />} />
            <StatCard label="Paid" value={String(stats.paidCount)} icon={<CheckCircle2 size={18} />} tone="emerald" />
            <StatCard label="Pending / Due" value={String(stats.pendingCount)} icon={<Clock size={18} />} tone="amber" />
            <StatCard label="Due Amount" value={`৳ ${stats.totalDue.toLocaleString('en-BD')}`} icon={<AlertCircle size={18} />} tone="red" />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {(['all', 'pending', 'overdue', 'paid', 'partial'] as const).map((status) => (
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

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
              <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading invoices...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                    <th className="pb-4">Invoice</th>
                    <th className="pb-4">Student</th>
                    <th className="pb-4">Fee</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-school-muted font-medium">
                        {formatBillingMonthLabel(billingMonth)}-এ কোনো invoice নেই। Generate Tuition চাপুন।
                      </td>
                    </tr>
                  ) : (
                    filtered.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-black text-school-gold">{invoice.invoiceNumber}</td>
                        <td className="py-4">
                          <p className="font-black text-school-blue uppercase">{invoice.studentName}</p>
                          <p className="text-[10px] text-school-muted">{invoice.className}{invoice.section ? ` (${invoice.section})` : ''}</p>
                        </td>
                        <td className="py-4 text-slate-500">
                          {invoice.lineItems.map((item) => item.label).join(', ')}
                        </td>
                        <td className="py-4 font-black text-school-blue">
                          ৳ {invoice.totalAmount.toLocaleString('en-BD')}
                          {invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount && (
                            <span className="block text-[10px] text-emerald-600">Paid ৳ {invoice.paidAmount.toLocaleString('en-BD')}</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={cn('px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider', STATUS_STYLE[invoice.status])}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
                            <button
                              type="button"
                              disabled={payingId === invoice.id}
                              onClick={() => handleMarkPaid(invoice.id, 'cash')}
                              className="px-4 py-2 bg-school-gold text-school-blue rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-60"
                            >
                              {payingId === invoice.id ? 'Saving...' : 'Mark Paid'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">{invoice.receiptNumber ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-6"
        >
          <h3 className="text-xs font-black text-school-blue uppercase tracking-widest">Collection & Online Payment</h3>

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-1">Online Payment Account</p>
            <p className="text-lg font-black text-school-blue">{onlineAccount?.name ?? 'Online Payment'}</p>
            <p className="text-[10px] text-school-muted mt-1">Gateway / online payment এখানে ledger-এ record হবে</p>
          </div>

          <div className={cn('p-5 rounded-2xl border', gatewayReady ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">
              Payment Gateway: {gatewayReady ? 'Configured' : 'Not configured yet'}
            </p>
            <p className="text-[11px] font-medium text-slate-600">
              {gatewayReady
                ? 'Guardian "Pay Now" দিলে gateway redirect হবে এবং payment Online Payment account-এ auto post হবে।'
                : 'Gateway add হলে .env-এ VITE_PAYMENT_GATEWAY_ENABLED=true ও key set করুন। System intent + webhook flow ready আছে।'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Mark Paid Account</label>
            <select
              value={payAccountId}
              onChange={(e) => setPayAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-school-muted uppercase tracking-widest">Recent Paid</h4>
            {invoices.filter((invoice) => invoice.status === 'paid').slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black text-school-blue uppercase">{invoice.studentName}</p>
                <p className="text-[9px] font-bold text-school-muted">
                  ৳ {invoice.totalAmount.toLocaleString('en-BD')} • {invoice.paymentMethod ?? 'cash'} • {invoice.receiptNumber}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showOptional && (
          <Modal title="Add Optional Fee Invoice" onClose={() => setShowOptional(false)}>
            <form onSubmit={handleOptionalInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Student</label>
                <select
                  value={optionalForm.studentId}
                  onChange={(e) => setOptionalForm({ ...optionalForm, studentId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                >
                  {students.map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.name} — {student.class}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Optional Fees</label>
                <div className="grid grid-cols-2 gap-2">
                  {OPTIONAL_FEE_TYPES.map((fee) => (
                    <label key={fee.key} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optionalForm.selectedFees.includes(fee.key)}
                        onChange={(e) =>
                          setOptionalForm({
                            ...optionalForm,
                            selectedFees: e.target.checked
                              ? [...optionalForm.selectedFees, fee.key]
                              : optionalForm.selectedFees.filter((key) => key !== fee.key),
                          })
                        }
                      />
                      <span className="text-[10px] font-bold text-school-blue">{fee.label} (৳{fee.defaultAmount})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Custom fee label"
                  value={optionalForm.customLabel}
                  onChange={(e) => setOptionalForm({ ...optionalForm, customLabel: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                />
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={optionalForm.customAmount}
                  onChange={(e) => setOptionalForm({ ...optionalForm, customAmount: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowOptional(false)} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                <button type="submit" disabled={generating} className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase">
                  Create Invoice
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100 text-school-blue',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-school-gold',
    red: 'bg-red-50 border-red-100 text-red-600',
  };

  return (
    <div className={cn('p-5 rounded-[1.5rem] border', tones[tone])}>
      <div className="flex justify-between items-start mb-2">{icon}<span className="text-lg font-black">{value}</span></div>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] border shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-black text-school-blue uppercase">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}
