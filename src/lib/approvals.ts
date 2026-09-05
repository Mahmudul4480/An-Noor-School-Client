import { fetchAdmissions } from './admissions';
import { fetchCategoryRequests } from './categories';
import { fetchExpenses } from './expenses';
import { fetchIncomeEntries } from './income';
import { fetchInvoices } from './invoices';
import { fetchAccounts, fetchReverseRequests } from './ledger';
import { fetchPendingDuties, fetchPendingHires } from './staff';
import { toIsoString } from './utils';
import type {
  Admission,
  ApprovalDepartment,
  CategoryRequest,
  DutyAssignment,
  Expense,
  IncomeEntry,
  ReverseRequest,
  StaffMember,
  StudentInvoice,
} from '../types';

export type ApprovalItemKind = 'admission' | 'category' | 'expense' | 'reversal' | 'invoice' | 'income' | 'hire' | 'duty';

export interface ApprovalQueueItem {
  id: string;
  kind: ApprovalItemKind;
  title: string;
  subtitle: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  admission?: Admission;
  categoryRequest?: CategoryRequest;
  expense?: Expense;
  incomeEntry?: IncomeEntry;
  reverseRequest?: ReverseRequest;
  invoice?: StudentInvoice;
  staffMember?: StaffMember;
  duty?: DutyAssignment;
  department?: ApprovalDepartment;
}

export function getNextPendingAdmissionStep(admission: Admission) {
  return (admission.approvals ?? []).find((step) => step.status === 'pending');
}

export function canDepartmentActOnAdmission(admission: Admission, department: ApprovalDepartment): boolean {
  if (admission.status !== 'pending_approval') return false;
  return department === 'principal';
}

export async function fetchApprovalQueue(department: ApprovalDepartment): Promise<{
  actionable: ApprovalQueueItem[];
  watching: ApprovalQueueItem[];
  pending: ApprovalQueueItem[];
}> {
  const results = await Promise.allSettled([
    fetchAdmissions(),
    fetchCategoryRequests(),
    fetchExpenses(),
    fetchReverseRequests(),
    fetchInvoices(),
    fetchAccounts(),
    fetchIncomeEntries(),
    fetchPendingHires(),
    fetchPendingDuties(),
  ]);

  const admissions = results[0].status === 'fulfilled' ? results[0].value : [];
  const categories = results[1].status === 'fulfilled' ? results[1].value : [];
  const expenses = results[2].status === 'fulfilled' ? results[2].value : [];
  const reverseRequests = results[3].status === 'fulfilled' ? results[3].value : [];
  const invoices = results[4].status === 'fulfilled' ? results[4].value : [];
  const accounts = results[5].status === 'fulfilled' ? results[5].value : [];
  const incomeEntries = results[6].status === 'fulfilled' ? results[6].value : [];
  const hires = results[7].status === 'fulfilled' ? results[7].value : [];
  const duties = results[8].status === 'fulfilled' ? results[8].value : [];
  const accountName = (accountId?: string) =>
    accounts.find((account) => account.id === accountId)?.name ?? accountId ?? '—';

  const pending: ApprovalQueueItem[] = [];

  for (const admission of admissions) {
    const waitingOnPrincipal =
      admission.status === 'pending_approval' ||
      (admission.approvals ?? []).some((step) => step.status === 'pending');
    if (!waitingOnPrincipal || admission.status === 'approved' || admission.status === 'rejected' || admission.status === 'cancelled') {
      continue;
    }

    pending.push({
      id: `adm-${admission.id}`,
      kind: 'admission',
      title: `Admission — ${admission.studentName}`,
      subtitle: `${admission.formSerial} • ${admission.classApplied} • ৳ ${admission.grandTotal.toLocaleString('en-BD')}`,
      requestedBy: admission.createdBy ?? 'Accounts Department',
      requestedAt: toIsoString(admission.createdAt),
      priority: 'high',
      actionable: department === 'principal',
      admission,
      department: 'principal',
    });
  }

  for (const request of categories.filter((item) => item.status === 'pending')) {
    pending.push({
      id: `cat-${request.id}`,
      kind: 'category',
      title: `${request.type === 'income' ? 'Income' : 'Expense'} Category — ${request.name}`,
      subtitle: `New ${request.type} category request`,
      requestedBy: request.requestedBy,
      requestedAt: toIsoString(request.createdAt),
      priority: 'medium',
      actionable: department === 'principal',
      categoryRequest: request,
      department: 'principal',
    });
  }

  for (const expense of expenses.filter((item) => item.approvalStatus === 'pending')) {
    pending.push({
      id: `exp-${expense.id}`,
      kind: 'expense',
      title: `Expense — ${expense.description}`,
      subtitle: `${expense.category} • ৳ ${expense.amount.toLocaleString('en-BD')} • Paid from ${accountName(expense.accountId)}`,
      requestedBy: expense.createdBy ?? 'Accounts Department',
      requestedAt: toIsoString(expense.createdAt || expense.date),
      priority: expense.amount >= 10000 ? 'high' : 'medium',
      actionable: department === 'principal',
      expense,
      department: 'principal',
    });
  }

  for (const entry of incomeEntries.filter((item) => item.approvalStatus === 'pending')) {
    pending.push({
      id: `inc-${entry.id}`,
      kind: 'income',
      title: `Income — ${entry.description}`,
      subtitle: `${entry.category} • ৳ ${entry.amount.toLocaleString('en-BD')} • From ${entry.source} • Into ${accountName(entry.accountId)}${entry.reference ? ` • Ref ${entry.reference}` : ''}`,
      requestedBy: entry.createdBy ?? 'Accounts Department',
      requestedAt: toIsoString(entry.createdAt || entry.date),
      priority: entry.amount >= 10000 ? 'high' : 'medium',
      actionable: department === 'principal',
      incomeEntry: entry,
      department: 'principal',
    });
  }

  for (const reverseRequest of reverseRequests.filter((item) => item.approvalStatus === 'pending')) {
    pending.push({
      id: `rev-${reverseRequest.id}`,
      kind: 'reversal',
      title: `Reverse Entry — ${reverseRequest.reference}`,
      subtitle: `${reverseRequest.accountName ?? reverseRequest.accountId} • ${reverseRequest.entryType.toUpperCase()} ৳ ${reverseRequest.amount.toLocaleString('en-BD')} • ${reverseRequest.reason}`,
      requestedBy: reverseRequest.requestedBy,
      requestedAt: toIsoString(reverseRequest.createdAt),
      priority: 'high',
      actionable: department === 'principal',
      reverseRequest,
      department: 'principal',
    });
  }

  for (const invoice of invoices.filter((item) => item.paymentApprovalStatus === 'pending')) {
    const amount = invoice.pendingPaymentAmount || invoice.totalAmount - invoice.paidAmount;
    const intoAccount = accountName(invoice.pendingPaymentAccountId);
    const slip = invoice.pendingPaymentReference ? ` • Slip ${invoice.pendingPaymentReference}` : '';
    pending.push({
      id: `inv-${invoice.id}`,
      kind: 'invoice',
      title: `Fee Payment — ${invoice.invoiceNumber}`,
      subtitle: `${invoice.studentName} • ${invoice.className} • ৳ ${amount.toLocaleString('en-BD')} • Into ${intoAccount}${slip}`,
      requestedBy: invoice.paymentRequestedBy ?? 'Accounts Department',
      requestedAt: toIsoString(invoice.paymentRequestedAt || invoice.generatedAt),
      priority: amount >= 10000 ? 'high' : 'medium',
      actionable: department === 'principal',
      invoice,
      department: 'principal',
    });
  }

  for (const person of hires) {
    pending.push({
      id: `hire-${person.id}`,
      kind: 'hire',
      title: `Hire — ${person.name}`,
      subtitle: `${person.employeeId} • ${person.category} • ${person.track === 'teacher' ? 'Teacher' : 'Staff'} • ${person.phone}`,
      requestedBy: person.createdBy,
      requestedAt: toIsoString(person.createdAt),
      priority: 'high',
      actionable: department === 'principal',
      staffMember: person,
      department: 'principal',
    });
  }

  for (const { person, duty } of duties) {
    pending.push({
      id: `duty-${duty.id}`,
      kind: 'duty',
      title: `Duty — ${duty.title}`,
      subtitle: `${person.name} • ${person.employeeId} • ${person.category}`,
      requestedBy: duty.requestedBy,
      requestedAt: toIsoString(duty.requestedAt),
      priority: 'medium',
      actionable: department === 'principal',
      staffMember: person,
      duty,
      department: 'principal',
    });
  }

  const byDate = (a: ApprovalQueueItem, b: ApprovalQueueItem) =>
    toIsoString(b.requestedAt).localeCompare(toIsoString(a.requestedAt));
  const sorted = pending.sort(byDate);

  return {
    actionable: sorted.filter((item) => item.actionable),
    watching: sorted.filter((item) => !item.actionable),
    pending: sorted,
  };
}

export async function fetchApprovalStats(department: ApprovalDepartment) {
  const queue = await fetchApprovalQueue(department);
  return {
    actionableCount: queue.actionable.length,
    watchingCount: queue.watching.length,
    totalPending: queue.pending.length,
  };
}
