import { fetchAdmissions } from './admissions';
import { fetchCategoryRequests } from './categories';
import { fetchExpenses, EXPENSE_APPROVAL_THRESHOLD } from './expenses';
import type {
  Admission,
  ApprovalDepartment,
  CategoryRequest,
  Expense,
} from '../types';

export type ApprovalItemKind = 'admission' | 'category' | 'expense';

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
  department?: ApprovalDepartment;
}

export function getNextPendingAdmissionStep(admission: Admission) {
  return (admission.approvals ?? []).find((step) => step.status === 'pending');
}

export function canDepartmentActOnAdmission(admission: Admission, department: ApprovalDepartment): boolean {
  if (admission.status !== 'pending_approval') return false;
  const next = getNextPendingAdmissionStep(admission);
  return next?.department === department;
}

export async function fetchApprovalQueue(department: ApprovalDepartment): Promise<{
  actionable: ApprovalQueueItem[];
  watching: ApprovalQueueItem[];
}> {
  const [admissions, categories, expenses] = await Promise.all([
    fetchAdmissions(),
    fetchCategoryRequests(),
    fetchExpenses(),
  ]);

  const actionable: ApprovalQueueItem[] = [];
  const watching: ApprovalQueueItem[] = [];

  for (const admission of admissions) {
    if (admission.status !== 'pending_approval') continue;
    const next = getNextPendingAdmissionStep(admission);
    if (!next) continue;

    const item: ApprovalQueueItem = {
      id: `adm-${admission.id}-${next.department}`,
      kind: 'admission',
      title: `Admission — ${admission.studentName}`,
      subtitle: `${admission.formSerial} • ${admission.classApplied} • ৳ ${admission.grandTotal.toLocaleString('en-BD')}`,
      requestedBy: admission.guardianName,
      requestedAt: admission.createdAt,
      priority: 'high',
      actionable: next.department === department,
      admission,
      department: next.department,
    };

    if (item.actionable) actionable.push(item);
    else watching.push(item);
  }

  for (const request of categories.filter((item) => item.status === 'pending')) {
    const item: ApprovalQueueItem = {
      id: `cat-${request.id}`,
      kind: 'category',
      title: `${request.type === 'income' ? 'Income' : 'Expense'} Category — ${request.name}`,
      subtitle: `New ${request.type} category request`,
      requestedBy: request.requestedBy,
      requestedAt: request.createdAt,
      priority: 'medium',
      actionable: department === 'principal',
      categoryRequest: request,
    };

    if (item.actionable) actionable.push(item);
    else watching.push(item);
  }

  for (const expense of expenses.filter((item) => item.approvalStatus === 'pending')) {
    const item: ApprovalQueueItem = {
      id: `exp-${expense.id}`,
      kind: 'expense',
      title: `Major Expense — ${expense.description}`,
      subtitle: `${expense.category} • ৳ ${expense.amount.toLocaleString('en-BD')} (≥ ৳ ${EXPENSE_APPROVAL_THRESHOLD.toLocaleString('en-BD')})`,
      requestedBy: expense.createdBy ?? 'Accounts Department',
      requestedAt: expense.createdAt,
      priority: expense.amount >= EXPENSE_APPROVAL_THRESHOLD * 2 ? 'high' : 'medium',
      actionable: department === 'principal',
      expense,
    };

    if (item.actionable) actionable.push(item);
    else watching.push(item);
  }

  const byDate = (a: ApprovalQueueItem, b: ApprovalQueueItem) => b.requestedAt.localeCompare(a.requestedAt);
  return {
    actionable: actionable.sort(byDate),
    watching: watching.sort(byDate),
  };
}

export async function fetchApprovalStats(department: ApprovalDepartment) {
  const queue = await fetchApprovalQueue(department);
  return {
    actionableCount: queue.actionable.length,
    watchingCount: queue.watching.length,
    totalPending: queue.actionable.length + queue.watching.length,
  };
}
