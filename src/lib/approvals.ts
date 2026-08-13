import { fetchAdmissions } from './admissions';
import { fetchCategoryRequests } from './categories';
import { fetchExpenses } from './expenses';
import { fetchReverseRequests } from './ledger';
import { toIsoString } from './utils';
import type {
  Admission,
  ApprovalDepartment,
  CategoryRequest,
  Expense,
  ReverseRequest,
} from '../types';

export type ApprovalItemKind = 'admission' | 'category' | 'expense' | 'reversal';

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
  reverseRequest?: ReverseRequest;
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
  ]);

  const admissions = results[0].status === 'fulfilled' ? results[0].value : [];
  const categories = results[1].status === 'fulfilled' ? results[1].value : [];
  const expenses = results[2].status === 'fulfilled' ? results[2].value : [];
  const reverseRequests = results[3].status === 'fulfilled' ? results[3].value : [];

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
      requestedBy: 'Accounts Department',
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
      subtitle: `${expense.category} • ৳ ${expense.amount.toLocaleString('en-BD')}`,
      requestedBy: expense.createdBy ?? 'Accounts Department',
      requestedAt: toIsoString(expense.createdAt || expense.date),
      priority: expense.amount >= 10000 ? 'high' : 'medium',
      actionable: department === 'principal',
      expense,
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
