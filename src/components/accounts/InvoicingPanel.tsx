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
  FileText,
  Settings,
  Tag,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  computeInvoiceStats,
  createManualInvoice,
  ensureMonthlyTuitionInvoices,
  fetchInvoices,
  formatBillingMonth,
  formatBillingMonthLabel,
  markInvoicePaidAtSchool,
} from '../../lib/invoices';
import { fetchInvoiceItemCategories } from '../../lib/invoiceItems';
import { fetchAccounts, ONLINE_PAYMENT_ACCOUNT_ID } from '../../lib/ledger';
import { fetchStudents } from '../../lib/students';
import { isPaymentGatewayConfigured } from '../../lib/payments';
import { CLASS_OPTIONS } from '../../lib/schoolConstants';
import { InvoiceReceiptModal } from '../InvoiceReceiptModal';
import { FeeStructureModal } from './FeeStructureModal';
import { InvoiceItemCatalogModal } from './InvoiceItemCatalogModal';
import type {
  InvoiceItemCategory,
  InvoiceLineItem,
  LedgerAccount,
  Student,
  StudentInvoice,
} from '../../types';

/** Ways money can physically reach the school counter (gateway is handled separately). */
type CollectionMethod = 'cash' | 'bank' | 'mobile';

const METHOD_LABEL: Record<CollectionMethod, string> = {
  cash: 'Cash',
  bank: 'Bank Deposit / Transfer',
  mobile: 'Mobile Banking (bKash / Nagad)',
};

const METHOD_FOR_ACCOUNT: Record<LedgerAccount['type'], CollectionMethod> = {
  cash: 'cash',
  bank: 'bank',
  mobile: 'mobile',
  online: 'bank',
};

/** One editable row in the manual invoice builder. */
interface ManualLine {
  uid: string;
  itemId: string;
  label: string;
  quantity: string;
  unitAmount: string;
}

const CUSTOM_ITEM = '__custom__';

function blankLine(): ManualLine {
  return {
    uid: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemId: '',
    label: '',
    quantity: '1',
    unitAmount: '',
  };
}

function lineTotal(line: ManualLine): number {
  const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
  const unit = parseFloat(line.unitAmount) || 0;
  return Math.round(quantity * unit * 100) / 100;
}

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
  const [showManual, setShowManual] = React.useState(false);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payAccountId, setPayAccountId] = React.useState('');
  const [receiptInvoice, setReceiptInvoice] = React.useState<StudentInvoice | null>(null);
  const [showFeeSettings, setShowFeeSettings] = React.useState(false);
  const [payInvoice, setPayInvoice] = React.useState<StudentInvoice | null>(null);
  const [payMethod, setPayMethod] = React.useState<CollectionMethod>('cash');
  const [payReference, setPayReference] = React.useState('');
  const [payError, setPayError] = React.useState('');

  const [catalog, setCatalog] = React.useState<InvoiceItemCategory[]>([]);
  const [showItemCatalog, setShowItemCatalog] = React.useState(false);
  const [manualClass, setManualClass] = React.useState('');
  const [manualForm, setManualForm] = React.useState({ studentId: '', dueDate: '', note: '' });
  const [manualLines, setManualLines] = React.useState<ManualLine[]>([blankLine()]);
  const [manualError, setManualError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invoiceData, studentData, accountData, catalogData] = await Promise.all([
        fetchInvoices({ billingMonth }),
        fetchStudents(),
        fetchAccounts(),
        fetchInvoiceItemCategories(),
      ]);
      setInvoices(invoiceData);
      setStudents(studentData.filter((student) => student.status === 'Active'));
      setAccounts(accountData);
      setCatalog(catalogData);
      setPayAccountId((prev) => prev || accountData.find((account) => account.id === 'main-cash')?.id || accountData[0]?.id || '');
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
        if (result.created > 0 || result.updated > 0) {
          setMessage(
            `Auto-generated ${result.created} tuition invoice(s) for ${formatBillingMonthLabel(formatBillingMonth())}${result.updated ? `, ${result.updated} updated to class fee` : ''}.`,
          );
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
  // the online account is fed by the gateway, so counter collections never land there
  const collectionAccounts = accounts.filter((account) => account.id !== ONLINE_PAYMENT_ACCOUNT_ID);

  const handleGenerateMonth = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const result = await ensureMonthlyTuitionInvoices(billingMonth);
      setMessage(
        `${formatBillingMonthLabel(billingMonth)}: ${result.created} new invoice(s), ${result.updated} updated to class tuition, ${result.skipped} unchanged.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const openPayment = (invoice: StudentInvoice) => {
    const fallback = collectionAccounts.find((account) => account.id === 'main-cash') ?? collectionAccounts[0];
    const accountId = payAccountId || fallback?.id || '';
    const account = collectionAccounts.find((item) => item.id === accountId);
    setPayAccountId(accountId);
    setPayMethod(account ? METHOD_FOR_ACCOUNT[account.type] : 'cash');
    setPayReference('');
    setPayError('');
    setPayInvoice(invoice);
  };

  const handlePayAccountChange = (accountId: string) => {
    setPayAccountId(accountId);
    const account = collectionAccounts.find((item) => item.id === accountId);
    if (account) setPayMethod(METHOD_FOR_ACCOUNT[account.type]);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice) return;
    if (!payAccountId) {
      setPayError('Receiving account select করুন।');
      return;
    }
    if (payMethod !== 'cash' && !payReference.trim()) {
      setPayError('Bank / mobile payment-এর deposit slip বা transaction number দিন।');
      return;
    }

    setPayingId(payInvoice.id);
    setPayError('');
    setError('');
    try {
      const updated = await markInvoicePaidAtSchool({
        invoiceId: payInvoice.id,
        accountId: payAccountId,
        paymentMethod: payMethod,
        reference: payReference.trim() || undefined,
      });
      const accountName = collectionAccounts.find((item) => item.id === payAccountId)?.name ?? payAccountId;
      setPayInvoice(null);
      setMessage(
        `${updated.invoiceNumber} — ${accountName}-এ ${METHOD_LABEL[payMethod]} হিসেবে Principal approval-এর জন্য পাঠানো হয়েছে। Approve হলে paid হবে এবং receipt generate হবে.`,
      );
      await load();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment recording failed.');
    } finally {
      setPayingId(null);
    }
  };

  const openManual = () => {
    setManualLines([blankLine()]);
    setManualForm({ studentId: '', dueDate: '', note: '' });
    setManualClass('');
    setManualError('');
    setShowManual(true);
  };

  // only classes that actually have active students, in the school's own order
  const classesWithStudents = React.useMemo(() => {
    const present = new Set(students.map((student) => student.class));
    const ordered = CLASS_OPTIONS.filter((option) => present.has(option));
    const extras = [...present].filter((name) => !CLASS_OPTIONS.includes(name as never)).sort();
    return [...ordered, ...extras];
  }, [students]);

  const classStudents = React.useMemo(
    () =>
      students
        .filter((student) => student.class === manualClass)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, manualClass],
  );

  const handleManualClassChange = (className: string) => {
    setManualClass(className);
    setManualForm((prev) => ({ ...prev, studentId: '' }));
    setManualError('');
  };

  const updateLine = (uid: string, patch: Partial<ManualLine>) => {
    setManualLines((prev) => prev.map((line) => (line.uid === uid ? { ...line, ...patch } : line)));
  };

  const handleLineItemChange = (uid: string, itemId: string) => {
    if (itemId === CUSTOM_ITEM) {
      updateLine(uid, { itemId, label: '', unitAmount: '' });
      return;
    }
    const item = catalog.find((entry) => entry.id === itemId);
    updateLine(uid, {
      itemId,
      label: item?.label ?? '',
      unitAmount: item && item.defaultAmount > 0 ? String(item.defaultAmount) : '',
    });
  };

  const manualTotal = manualLines.reduce((sum, line) => sum + lineTotal(line), 0);

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    if (!manualClass) {
      setManualError('আগে Class select করুন।');
      return;
    }
    if (!manualForm.studentId) {
      setManualError('Student select করুন।');
      return;
    }

    const lineItems: InvoiceLineItem[] = manualLines
      .map((line) => {
        const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
        const unit = parseFloat(line.unitAmount) || 0;
        return {
          key: line.itemId && line.itemId !== CUSTOM_ITEM ? line.itemId : 'other',
          label: line.label.trim() + (quantity > 1 ? ` × ${quantity}` : ''),
          amount: Math.round(quantity * unit * 100) / 100,
          quantity,
          unitAmount: unit,
        };
      })
      .filter((item) => item.label && item.amount > 0);

    if (lineItems.length === 0) {
      setManualError('অন্তত একটি item ও amount দিন।');
      return;
    }

    setGenerating(true);
    try {
      const created = await createManualInvoice({
        studentId: manualForm.studentId,
        billingMonth,
        lineItems,
        dueDate: manualForm.dueDate || undefined,
        note: manualForm.note || undefined,
      });
      setShowManual(false);
      setMessage(
        `${created.invoiceNumber} তৈরি হয়েছে — ${created.studentName}, ৳ ${created.totalAmount.toLocaleString('en-BD')}.`,
      );
      await load();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Manual invoice failed.');
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
                Tuition class অনুযায়ী auto generate হয় • Class fee change করলে unpaid invoice update হয়
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
                onClick={() => setShowFeeSettings(true)}
                className="px-5 py-2.5 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100"
              >
                <Settings size={14} /> Class Fees
              </button>
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
                onClick={() => setShowItemCatalog(true)}
                className="px-5 py-2.5 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100"
              >
                <Tag size={14} /> Invoice Items
              </button>
              <button
                type="button"
                onClick={openManual}
                className="px-5 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={14} /> Manual Invoice
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
                          {invoice.paymentApprovalStatus === 'pending' ? (
                            <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-50 text-school-blue">
                              Awaiting Principal
                            </span>
                          ) : (
                            <span className={cn('px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider', STATUS_STYLE[invoice.status])}>
                              {invoice.status}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {invoice.status === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => setReceiptInvoice(invoice)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100"
                            >
                              <FileText size={12} /> Receipt
                            </button>
                          ) : invoice.status === 'cancelled' || invoice.paymentApprovalStatus === 'pending' ? (
                            <span className="text-[10px] font-bold text-school-muted uppercase tracking-widest">
                              {invoice.paymentApprovalStatus === 'pending' ? 'Sent to Principal' : '—'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={payingId === invoice.id}
                              onClick={() => openPayment(invoice)}
                              className="px-4 py-2 bg-school-gold text-school-blue rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-60"
                            >
                              {payingId === invoice.id ? 'Saving...' : 'Collect Payment'}
                            </button>
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

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-2">Counter Collection</p>
            <p className="text-[11px] font-medium text-slate-600">
              প্রতিটি invoice-এ <strong>Collect Payment</strong> চাপলে receiving account বেছে নেওয়া যাবে — cash হলে Main
              Cash, deposit slip থাকলে সেই bank / mobile account। Bank ও mobile-এর ক্ষেত্রে slip বা transaction number
              লিখতে হবে।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-school-muted uppercase tracking-widest">Recent Paid</h4>
            {invoices.filter((invoice) => invoice.status === 'paid').slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black text-school-blue uppercase">{invoice.studentName}</p>
                <p className="text-[9px] font-bold text-school-muted">
                  ৳ {invoice.totalAmount.toLocaleString('en-BD')} • {invoice.paymentMethod ?? 'cash'} • {invoice.receiptNumber}
                </p>
                <button
                  type="button"
                  onClick={() => setReceiptInvoice(invoice)}
                  className="mt-2 text-[9px] font-black uppercase tracking-widest text-school-gold hover:text-school-blue"
                >
                  View / Print Receipt
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {payInvoice && (
          <Modal
            title="Collect Fee Payment"
            onClose={() => {
              setPayInvoice(null);
              setPayError('');
            }}
          >
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-school-gold uppercase tracking-widest">{payInvoice.invoiceNumber}</p>
                <p className="text-sm font-black text-school-blue uppercase mt-1">{payInvoice.studentName}</p>
                <p className="text-[10px] font-bold text-school-muted mt-0.5">
                  {payInvoice.className}{payInvoice.section ? ` (${payInvoice.section})` : ''} • {formatBillingMonthLabel(payInvoice.billingMonth)}
                </p>
                <p className="text-lg font-black text-school-blue mt-2">
                  ৳ {(payInvoice.totalAmount - payInvoice.paidAmount).toLocaleString('en-BD')}
                  <span className="text-[10px] font-bold text-school-muted uppercase tracking-widest ml-2">Collectable</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Received In Account</label>
                <select
                  value={payAccountId}
                  onChange={(e) => handlePayAccountChange(e.target.value)}
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
                  {(['cash', 'bank', 'mobile'] as CollectionMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border text-left',
                        payMethod === method
                          ? 'bg-school-blue text-white border-school-blue'
                          : 'bg-slate-50 text-school-muted border-slate-100',
                      )}
                    >
                      {METHOD_LABEL[method]}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod !== 'cash' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Deposit Slip / Transaction No
                  </label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="e.g. DEP-778142"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                  />
                </div>
              )}

              {payError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{payError}</div>
              )}

              <p className="text-[10px] font-bold text-school-muted">
                Submit করলে Principal approval-এ যাবে। Approve হলে ledger-এ post হবে এবং receipt generate হবে।
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPayInvoice(null);
                    setPayError('');
                  }}
                  className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingId === payInvoice.id}
                  className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
                >
                  {payingId === payInvoice.id && <Loader2 size={14} className="animate-spin" />}
                  Send for Approval
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManual && (
          <Modal title="Create Manual Invoice" onClose={() => setShowManual(false)} wide>
            <form onSubmit={handleCreateManualInvoice} className="space-y-5">
              <p className="text-[11px] font-medium text-slate-600">
                Tuition ছাড়া অন্য যেকোনো বিল — Exam Fee, Khata, Boi, Dress, Transport ইত্যাদি — এখান থেকে তৈরি করুন।
                একাধিক item যোগ করা যাবে, quantity দিলে amount নিজে থেকে হিসাব হবে।
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Step 1 — Class
                  </label>
                  <select
                    value={manualClass}
                    onChange={(e) => handleManualClassChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                  >
                    <option value="">Select class...</option>
                    {classesWithStudents.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Step 2 — Student
                  </label>
                  <select
                    value={manualForm.studentId}
                    onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
                    disabled={!manualClass}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {manualClass ? 'Select student...' : 'আগে class select করুন'}
                    </option>
                    {classStudents.map((student) => (
                      <option key={student.studentId} value={student.studentId}>
                        {student.studentId} — {student.name}
                        {student.section ? ` (${student.section})` : ''}
                      </option>
                    ))}
                  </select>
                  {manualClass && classStudents.length === 0 && (
                    <p className="text-[10px] font-bold text-red-500">এই class-এ কোনো active student নেই।</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Billing Month
                  </label>
                  <input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    value={manualForm.dueDate}
                    onChange={(e) => setManualForm({ ...manualForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                    Invoice Items
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowItemCatalog(true)}
                    className="text-[9px] font-black uppercase tracking-widest text-school-gold hover:text-school-blue flex items-center gap-1"
                  >
                    <Tag size={11} /> Manage Item List
                  </button>
                </div>

                <div className="hidden md:grid grid-cols-[1fr_1fr_70px_110px_100px_36px] gap-2 px-1 text-[9px] font-black text-school-muted uppercase tracking-widest">
                  <span>Item</span>
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit ৳</span>
                  <span className="text-right">Line Total</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {manualLines.map((line) => (
                    <div
                      key={line.uid}
                      className="grid grid-cols-2 md:grid-cols-[1fr_1fr_70px_110px_100px_36px] gap-2 items-center p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-2xl"
                    >
                      <select
                        value={line.itemId}
                        onChange={(e) => handleLineItemChange(line.uid, e.target.value)}
                        className="px-3 py-2.5 bg-white md:bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="">Select item...</option>
                        {catalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                        <option value={CUSTOM_ITEM}>Custom item...</option>
                      </select>
                      <input
                        type="text"
                        value={line.label}
                        onChange={(e) => updateLine(line.uid, { label: e.target.value })}
                        placeholder="Item name"
                        className="px-3 py-2.5 bg-white md:bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.uid, { quantity: e.target.value })}
                        className="px-3 py-2.5 bg-white md:bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={line.unitAmount}
                        onChange={(e) => updateLine(line.uid, { unitAmount: e.target.value })}
                        placeholder="0"
                        className="px-3 py-2.5 bg-white md:bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      />
                      <span className="px-2 text-xs font-black text-school-blue text-right">
                        ৳ {lineTotal(line).toLocaleString('en-BD')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setManualLines((prev) => prev.filter((entry) => entry.uid !== line.uid))}
                        disabled={manualLines.length === 1}
                        className="p-2 rounded-xl bg-red-50 text-red-500 disabled:opacity-40 justify-self-end"
                        title="Remove line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setManualLines((prev) => [...prev, blankLine()])}
                  className="w-full py-2.5 bg-slate-50 border border-dashed border-slate-200 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={manualForm.note}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  placeholder="e.g. Half-yearly exam fee + 3 khata"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl border-2 border-school-gold bg-amber-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Invoice Total</span>
                <span className="text-lg font-black text-school-blue">৳ {manualTotal.toLocaleString('en-BD')}</span>
              </div>

              {manualError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
                  {manualError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
                >
                  {generating && <Loader2 size={14} className="animate-spin" />}
                  Create Invoice
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {showItemCatalog && (
        <InvoiceItemCatalogModal
          onClose={() => setShowItemCatalog(false)}
          onChanged={() => fetchInvoiceItemCategories().then(setCatalog).catch(() => undefined)}
        />
      )}

      {showFeeSettings && <FeeStructureModal onClose={() => setShowFeeSettings(false)} />}

      {receiptInvoice && (
        <InvoiceReceiptModal
          invoice={receiptInvoice}
          account={accounts.find((account) => account.id === receiptInvoice.paymentAccountId)}
          guardianName={students.find((student) => student.studentId === receiptInvoice.studentId)?.guardianName}
          onClose={() => setReceiptInvoice(null)}
        />
      )}
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

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'bg-white rounded-[2rem] border shadow-2xl w-full max-h-[92vh] flex flex-col',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="p-6 border-b flex items-center justify-between shrink-0">
          <h3 className="text-lg font-black text-school-blue uppercase">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}
