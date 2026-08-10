import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { actOnApproval, cancelAdmission, fetchAdmissions } from '../../lib/admissions';
import { fetchAccounts } from '../../lib/ledger';
import { NewAdmissionModal } from './NewAdmissionModal';
import { FeeStructureModal } from './FeeStructureModal';
import type { Admission, ApprovalDepartment, LedgerAccount } from '../../types';

const STATUS_STYLES: Record<Admission['status'], string> = {
  pending_approval: 'bg-amber-50 text-school-gold',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
  cancelled: 'bg-slate-100 text-slate-500',
};

export function AdmissionsPanel() {
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [showFeeSettings, setShowFeeSettings] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [admissionData, accountData] = await Promise.all([fetchAdmissions(), fetchAccounts()]);
      setAdmissions(admissionData);
      setAccounts(accountData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Admissions</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Physical Form Entry → Fee & Discount → Multi-Department Approval
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowFeeSettings(true)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-100 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2 w-fit"
            >
              <Settings size={14} /> Fee Structure
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-6 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2 w-fit"
            >
              <Plus size={14} /> New Admission
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
            <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading admissions...</p>
          </div>
        ) : admissions.length === 0 ? (
          <div className="py-16 text-center text-school-muted font-medium text-sm">
            কোনো admission নেই। "New Admission" দিয়ে physical form-এর data entry শুরু করুন।
          </div>
        ) : (
          <div className="space-y-4">
            {admissions.map((admission) => (
              <AdmissionRow
                key={admission.id}
                admission={admission}
                accounts={accounts}
                expanded={expandedId === admission.id}
                onToggle={() => setExpandedId(expandedId === admission.id ? null : admission.id)}
                acting={actingId === admission.id}
                setActing={(value) => setActingId(value ? admission.id : null)}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <NewAdmissionModal onClose={() => setShowNewModal(false)} onCreated={load} />
        )}
        {showFeeSettings && <FeeStructureModal onClose={() => setShowFeeSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AdmissionRow({
  admission,
  accounts,
  expanded,
  onToggle,
  acting,
  setActing,
  onRefresh,
}: {
  key?: string;
  admission: Admission;
  accounts: LedgerAccount[];
  expanded: boolean;
  onToggle: () => void;
  acting: boolean;
  setActing: (value: boolean) => void;
  onRefresh: () => void;
}) {
  const [selectedAccountId, setSelectedAccountId] = React.useState(accounts[0]?.id ?? '');
  const [showCancelForm, setShowCancelForm] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [approvalNote, setApprovalNote] = React.useState('');
  const [activeDept, setActiveDept] = React.useState<ApprovalDepartment | null>(null);

  const nextPendingStep = admission.approvals.find((step) => step.status === 'pending');

  const handleApprove = async (department: ApprovalDepartment) => {
    if (department === 'accounts' && !selectedAccountId) {
      alert('Fee কোন account-এ collect হয়েছে সেটা select করুন।');
      return;
    }

    setActing(true);
    try {
      await actOnApproval({
        admission,
        department,
        action: 'approved',
        actorName: 'Accounts Dept.',
        note: approvalNote || undefined,
        receivedInAccountId: department === 'accounts' ? selectedAccountId : undefined,
      });
      setApprovalNote('');
      setActiveDept(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (department: ApprovalDepartment) => {
    if (!approvalNote.trim()) {
      alert('Reject করার আগে reason লিখুন।');
      return;
    }
    setActing(true);
    try {
      await actOnApproval({
        admission,
        department,
        action: 'rejected',
        actorName: 'Accounts Dept.',
        note: approvalNote,
      });
      setApprovalNote('');
      setActiveDept(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Cancellation reason লিখুন।');
      return;
    }
    setActing(true);
    try {
      await cancelAdmission(admission, cancelReason, 'Accounts Dept.');
      setShowCancelForm(false);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setActing(false);
    }
  };

  const canCancel = admission.status !== 'cancelled';

  return (
    <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-school-border flex items-center justify-center text-school-blue">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">
              {admission.studentName} • {admission.formSerial}
            </p>
            <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest mt-1">
              {admission.classApplied} {admission.section ? `• ${admission.section}` : ''} • ৳{' '}
              {admission.grandTotal.toLocaleString()}
              {admission.studentId ? ` • Student ID: ${admission.studentId}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter',
              STATUS_STYLES[admission.status],
            )}
          >
            {admission.status.replace('_', ' ')}
          </span>
          {expanded ? <ChevronUp size={16} className="text-school-muted" /> : <ChevronDown size={16} className="text-school-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 border-t border-slate-100">
              {/* Fee breakdown */}
              <div>
                <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">Fee & Discount</p>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 text-school-muted font-black uppercase tracking-widest">
                        <th className="p-3">Item</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {admission.feeItems.map((item) => {
                        const discount = admission.discounts.find((d) => d.itemKey === item.key);
                        return (
                          <tr key={item.key}>
                            <td className="p-3 font-bold text-school-blue uppercase">{item.label}</td>
                            <td className="p-3 text-right">৳ {item.amount.toLocaleString()}</td>
                            <td className="p-3 text-right text-red-500 font-bold">
                              {discount ? `− ৳ ${discount.amount.toLocaleString()}` : '—'}
                            </td>
                            <td className="p-3 text-slate-500">{discount?.reason || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-6 mt-3 text-xs font-black">
                  <span className="text-school-muted">Gross: ৳ {admission.grossTotal.toLocaleString()}</span>
                  <span className="text-red-500">Discount: ৳ {admission.totalDiscount.toLocaleString()}</span>
                  <span className="text-emerald-600">Grand Total: ৳ {admission.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Scanned form */}
              {admission.scannedFormUrl && (
                <div>
                  <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">Scanned Form</p>
                  <a
                    href={admission.scannedFormUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-school-blue hover:bg-slate-100"
                  >
                    <ImageIcon size={14} /> {admission.scannedFormName || 'View scanned copy'}
                  </a>
                </div>
              )}

              {/* Approval steps */}
              <div>
                <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">
                  Department Approval Flow
                </p>
                <div className="space-y-3">
                  {admission.approvals.map((step) => (
                    <div
                      key={step.department}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <div>
                        <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{step.label}</p>
                        {step.note && <p className="text-[10px] text-slate-500 font-medium mt-1">Note: {step.note}</p>}
                        {step.actionedBy && (
                          <p className="text-[9px] text-school-muted font-bold uppercase mt-1">
                            By {step.actionedBy}
                            {step.actionedAt ? ` • ${new Date(step.actionedAt).toLocaleString('en-BD')}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {step.status === 'pending' && admission.status === 'pending_approval' ? (
                          activeDept === step.department ? (
                            <div className="flex flex-col gap-2 min-w-[220px]">
                              {step.department === 'accounts' && (
                                <select
                                  value={selectedAccountId}
                                  onChange={(e) => setSelectedAccountId(e.target.value)}
                                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                                >
                                  <option value="">Select receiving account...</option>
                                  {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                placeholder="Note (optional for approve, required for reject)"
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={acting}
                                  onClick={() => handleApprove(step.department)}
                                  className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-60"
                                >
                                  Confirm Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={acting}
                                  onClick={() => handleReject(step.department)}
                                  className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-60"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDept(null)}
                                  className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveDept(step.department)}
                              className="px-4 py-2 bg-school-blue text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-900"
                            >
                              Act as {step.label}
                            </button>
                          )
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                              step.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-600'
                                : step.status === 'rejected'
                                  ? 'bg-red-50 text-red-500'
                                  : 'bg-slate-100 text-slate-400',
                            )}
                          >
                            {step.status === 'approved' ? (
                              <CheckCircle2 size={12} />
                            ) : step.status === 'rejected' ? (
                              <XCircle size={12} />
                            ) : null}
                            {step.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {nextPendingStep && admission.status === 'pending_approval' && (
                  <p className="text-[9px] text-school-muted font-bold uppercase tracking-widest mt-3">
                    Waiting on: {nextPendingStep.label}
                  </p>
                )}
              </div>

              {/* Cancellation */}
              {canCancel && (
                <div className="pt-4 border-t border-slate-100">
                  {showCancelForm ? (
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Cancellation reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={handleCancel}
                          className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 disabled:opacity-60"
                        >
                          Confirm Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelForm(false)}
                          className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100"
                    >
                      <Ban size={14} /> Cancel Admission
                    </button>
                  )}
                </div>
              )}
              {admission.status === 'cancelled' && admission.cancelReason && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Cancelled: {admission.cancelReason}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
