import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Tag,
  Receipt,
  Clock,
  Eye,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { fetchApprovalQueue, type ApprovalQueueItem } from '../../lib/approvals';
import { actOnApproval } from '../../lib/admissions';
import { reviewCategoryRequest } from '../../lib/categories';
import { reviewExpense } from '../../lib/expenses';
import { fetchAccounts, reviewReverseRequest } from '../../lib/ledger';
import type { ApprovalDepartment, LedgerAccount } from '../../types';

const KIND_ICON = {
  admission: ClipboardCheck,
  category: Tag,
  expense: Receipt,
  reversal: RotateCcw,
};

interface ApprovalsPanelProps {
  viewerDepartment: ApprovalDepartment;
  actorName: string;
}

export function ApprovalsPanel({ viewerDepartment, actorName }: ApprovalsPanelProps) {
  const [pending, setPending] = React.useState<ApprovalQueueItem[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [accountSelections, setAccountSelections] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [queue, accountData] = await Promise.all([
        fetchApprovalQueue(viewerDepartment),
        fetchAccounts(),
      ]);
      setPending(queue.pending);
      setAccounts(accountData);
      setAccountSelections((prev) => {
        const next = { ...prev };
        queue.actionable.forEach((item) => {
          if (item.kind === 'admission' && item.admission && !next[item.id]) {
            next[item.id] = item.admission.receivedInAccountId ?? accountData[0]?.id ?? '';
          }
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals.');
    } finally {
      setLoading(false);
    }
  }, [viewerDepartment]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (item: ApprovalQueueItem) => {
    setActingId(item.id);
    setError('');
    setMessage('');
    try {
      if (item.kind === 'admission' && item.admission && item.department) {
        await actOnApproval({
          admission: item.admission,
          department: item.department,
          action: 'approved',
          actorName,
          note: notes[item.id] || undefined,
        });
      } else if (item.kind === 'category' && item.categoryRequest) {
        await reviewCategoryRequest({
          request: item.categoryRequest,
          action: 'approved',
          reviewedBy: actorName,
          note: notes[item.id],
        });
      } else if (item.kind === 'expense' && item.expense) {
        await reviewExpense({
          expense: item.expense,
          action: 'approved',
          reviewedBy: actorName,
          note: notes[item.id],
        });
      } else if (item.kind === 'reversal' && item.reverseRequest) {
        await reviewReverseRequest({
          request: item.reverseRequest,
          action: 'approved',
          reviewedBy: actorName,
          note: notes[item.id],
        });
      }
      setMessage(`Approved: ${item.title}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (item: ApprovalQueueItem) => {
    const note = notes[item.id]?.trim();
    if (!note) {
      setError('Reject করার জন্য reason লিখুন।');
      return;
    }

    setActingId(item.id);
    setError('');
    setMessage('');
    try {
      if (item.kind === 'admission' && item.admission && item.department) {
        await actOnApproval({
          admission: item.admission,
          department: item.department,
          action: 'rejected',
          actorName,
          note,
        });
      } else if (item.kind === 'category' && item.categoryRequest) {
        await reviewCategoryRequest({
          request: item.categoryRequest,
          action: 'rejected',
          reviewedBy: actorName,
          note,
        });
      } else if (item.kind === 'expense' && item.expense) {
        await reviewExpense({
          expense: item.expense,
          action: 'rejected',
          reviewedBy: actorName,
          note,
        });
      } else if (item.kind === 'reversal' && item.reverseRequest) {
        await reviewReverseRequest({
          request: item.reverseRequest,
          action: 'rejected',
          reviewedBy: actorName,
          note,
        });
      }
      setMessage(`Rejected: ${item.title}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setActingId(null);
    }
  };

  const departmentLabel =
    viewerDepartment === 'accounts' ? 'Accounts Department' : 'Principal Office';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-school-blue to-blue-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <ShieldCheck size={48} className="absolute right-8 top-8 opacity-20" />
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Approval Hub</h3>
        <p className="text-xs font-bold opacity-80 uppercase tracking-widest max-w-xl">
          {viewerDepartment === 'principal'
            ? 'Accounts থেকে আসা admission, expense, reverse entry ও category request approve/reject করুন'
            : 'Principal approve না করা পর্যন্ত প্রতিটি pending entry এখানে থাকবে — monitor করুন'}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <StatPill
            label={viewerDepartment === 'principal' ? 'Action Required' : 'Waiting for Principal'}
            value={pending.length}
          />
          <button
            type="button"
            onClick={load}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">{error}</div>
      )}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-700">{message}</div>
      )}

      {loading ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-school-border">
          <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
          <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading approval queue...</p>
        </div>
      ) : viewerDepartment === 'accounts' ? (
        <ApprovalSection
          title="Pending until Principal Approves"
          emptyText="এখন কোনো pending entry নেই। Admission, Expense, Reverse বা Category submit করলে Principal approve না হওয়া পর্যন্ত এখানে দেখাবে।"
          items={pending}
          accounts={accounts}
          notes={notes}
          accountSelections={accountSelections}
          actingId={actingId}
          onNoteChange={(id, value) => setNotes((prev) => ({ ...prev, [id]: value }))}
          onAccountChange={(id, value) => setAccountSelections((prev) => ({ ...prev, [id]: value }))}
          onApprove={handleApprove}
          onReject={handleReject}
          actionable={false}
        />
      ) : (
        <ApprovalSection
          title="Action Required"
          emptyText="আপনার action-এর জন্য কোনো pending approval নেই।"
          items={pending}
          accounts={accounts}
          notes={notes}
          accountSelections={accountSelections}
          actingId={actingId}
          onNoteChange={(id, value) => setNotes((prev) => ({ ...prev, [id]: value }))}
          onAccountChange={(id, value) => setAccountSelections((prev) => ({ ...prev, [id]: value }))}
          onApprove={handleApprove}
          onReject={handleReject}
          actionable
        />
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-3 bg-white/10 rounded-2xl border border-white/20">
      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function ApprovalSection({
  title,
  emptyText,
  items,
  accounts,
  notes,
  accountSelections,
  actingId,
  onNoteChange,
  onAccountChange,
  onApprove,
  onReject,
  actionable,
}: {
  title: string;
  emptyText: string;
  items: ApprovalQueueItem[];
  accounts: LedgerAccount[];
  notes: Record<string, string>;
  accountSelections: Record<string, string>;
  actingId: string | null;
  onNoteChange: (id: string, value: string) => void;
  onAccountChange: (id: string, value: string) => void;
  onApprove: (item: ApprovalQueueItem) => void;
  onReject: (item: ApprovalQueueItem) => void;
  actionable: boolean;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
      <h4 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
        {actionable ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Eye size={16} className="text-school-muted" />}
        {title}
      </h4>

      {items.length === 0 ? (
        <p className="text-sm text-school-muted font-medium py-8 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-school-blue border border-slate-100 shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg',
                            item.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-school-gold',
                          )}
                        >
                          {item.kind}
                        </span>
                        {!actionable && (
                          <span className="text-[9px] font-bold text-amber-600 uppercase">
                            Waiting: Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-school-blue uppercase tracking-tight">{item.title}</p>
                      <p className="text-[11px] text-school-muted font-medium mt-1">{item.subtitle}</p>
                      <p className="text-[10px] text-school-muted font-bold uppercase mt-2 flex items-center gap-1">
                        <Clock size={12} /> {item.requestedBy} • {new Date(item.requestedAt).toLocaleDateString('en-BD')}
                      </p>
                    </div>
                  </div>

                  {actionable && (
                    <div className="flex flex-col gap-3 min-w-[240px]">
                      <input
                        type="text"
                        value={notes[item.id] ?? ''}
                        onChange={(e) => onNoteChange(item.id, e.target.value)}
                        placeholder="Note / reject reason..."
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => onApprove(item)}
                          className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {actingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => onReject(item)}
                          className="flex-1 px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
