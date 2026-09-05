import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import type { CategoryRequest, CategoryType } from '../types';

const CATEGORIES_COLLECTION = 'categoryRequests';
const LOCAL_CATEGORIES_KEY = 'an-noor-category-requests';

export const DEFAULT_INCOME_CATEGORIES = [
  'Admission Fee',
  'Monthly Tuition',
  'Exam Fee',
  'Transport Fee',
  'Book & Stationery',
  'Digital Fee',
  'Asset Sale',
  'Other Income',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Utility Bill',
  'Salary',
  'Maintenance',
  'Stationery',
  'Transport',
  'Marketing',
  'Event',
  'Bank / MFS Charge',
  'Other',
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function fetchCategoryRequests(): Promise<CategoryRequest[]> {
  if (isDemoLoginEnabled) {
    return readLocal<CategoryRequest[]>(LOCAL_CATEGORIES_KEY, []);
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, CATEGORIES_COLLECTION)));
  return snapshot.docs.map((document) => document.data() as CategoryRequest);
}

export async function fetchApprovedCategories(type: CategoryType): Promise<string[]> {
  const defaults = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const requests = await fetchCategoryRequests();
  const approved = requests
    .filter((request) => request.type === type && request.status === 'approved')
    .map((request) => request.name);

  return [...new Set([...defaults, ...approved])].sort((a, b) => a.localeCompare(b));
}

export async function requestCategory(input: {
  type: CategoryType;
  name: string;
  requestedBy: string;
}): Promise<CategoryRequest> {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('Category name is required.');

  const existing = await fetchApprovedCategories(input.type);
  if (existing.some((cat) => cat.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('This category already exists.');
  }

  const request: CategoryRequest = {
    id: generateId('cat'),
    type: input.type,
    name: trimmed,
    requestedBy: input.requestedBy,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    const all = readLocal<CategoryRequest[]>(LOCAL_CATEGORIES_KEY, []);
    writeLocal(LOCAL_CATEGORIES_KEY, [...all, request]);
    return request;
  }

  await waitForAuthUser();
  await setDoc(doc(db, CATEGORIES_COLLECTION, request.id), { ...request, createdAt: serverTimestamp() });
  return request;
}

export async function reviewCategoryRequest(params: {
  request: CategoryRequest;
  action: 'approved' | 'rejected';
  reviewedBy: string;
  note?: string;
}): Promise<CategoryRequest> {
  const updated: CategoryRequest = {
    ...params.request,
    status: params.action,
    reviewedBy: params.reviewedBy,
    reviewedAt: new Date().toISOString(),
    note: params.note,
  };

  if (isDemoLoginEnabled) {
    const all = readLocal<CategoryRequest[]>(LOCAL_CATEGORIES_KEY, []);
    writeLocal(
      LOCAL_CATEGORIES_KEY,
      all.map((item) => (item.id === updated.id ? updated : item)),
    );
    return updated;
  }

  await waitForAuthUser();
  await updateDoc(doc(db, CATEGORIES_COLLECTION, updated.id), {
    status: updated.status,
    reviewedBy: updated.reviewedBy,
    reviewedAt: serverTimestamp(),
    note: updated.note ?? null,
  });
  return updated;
}
