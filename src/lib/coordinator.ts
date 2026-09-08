import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { omitUndefined, toIsoString } from './utils';
import type {
  CoordinatorEvaluation,
  CoordinatorEvaluationPoint,
  CoordinatorPointKind,
  CoordinatorPrincipalAction,
} from '../types';

const EVAL_COLLECTION = 'coordinatorEvaluations';
const LOCAL_EVAL_KEY = 'an-noor-coordinator-evaluations';

export interface CoordinatorPointDef {
  id: string;
  number: number;
  title: string;
  kind: CoordinatorPointKind;
  subs?: string[];
}

export const COORDINATOR_POINTS: CoordinatorPointDef[] = [
  { id: 'class_count', number: 1, title: 'Class: How many?', kind: 'count' },
  { id: 'deadline', number: 2, title: 'Following given deadline or not', kind: 'follow' },
  { id: 'lesson_plan', number: 3, title: 'Lesson plan submission', kind: 'follow' },
  { id: 'meeting', number: 4, title: 'Meeting instructions: Following or not', kind: 'follow' },
  { id: 'activity', number: 5, title: 'Activity base / classes: How many and what are they?', kind: 'count_detail' },
  { id: 'projector', number: 6, title: 'Projector-based classes', kind: 'count' },
  { id: 'absence', number: 7, title: 'Absence reason / Early departure reason', kind: 'text' },
  {
    id: 'behaviour',
    number: 8,
    title: 'Behaviour with',
    kind: 'behaviour',
    subs: ['Parents', 'Students', 'Colleagues', 'Attendant'],
  },
  { id: 'english', number: 9, title: 'Spoken English', kind: 'level' },
  { id: 'arabic', number: 10, title: 'Spoken Arabic', kind: 'level' },
  { id: 'duty_roster', number: 11, title: 'Duty roster following or not', kind: 'follow' },
];

export const FOLLOW_OPTIONS = [
  { id: 'following', label: 'Following' },
  { id: 'partial', label: 'Partial' },
  { id: 'not_following', label: 'Not following' },
] as const;

export const LEVEL_OPTIONS = [
  { id: 'good', label: 'Good' },
  { id: 'average', label: 'Average' },
  { id: 'needs_attention', label: 'Needs attention' },
] as const;

export const PRINCIPAL_ACTIONS: { id: CoordinatorPrincipalAction; label: string }[] = [
  { id: 'noted', label: 'Noted' },
  { id: 'appreciation', label: 'Appreciation' },
  { id: 'counsel', label: 'Counsel' },
  { id: 'warning', label: 'Warning' },
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

function emptyPoint(def: CoordinatorPointDef): CoordinatorEvaluationPoint {
  return {
    pointId: def.id,
    mark: '',
    note: '',
    detail: '',
    subMarks: def.subs ? Object.fromEntries(def.subs.map((sub) => [sub, ''])) : undefined,
  };
}

export function blankEvaluationPoints(): CoordinatorEvaluationPoint[] {
  return COORDINATOR_POINTS.map(emptyPoint);
}

function normalizePoint(raw: Partial<CoordinatorEvaluationPoint>): CoordinatorEvaluationPoint {
  return {
    pointId: raw.pointId || '',
    mark: raw.mark || '',
    count: typeof raw.count === 'number' ? raw.count : undefined,
    detail: raw.detail || '',
    note: raw.note || '',
    subMarks: raw.subMarks,
  };
}

function normalizeEvaluation(raw: Partial<CoordinatorEvaluation>, fallbackId?: string): CoordinatorEvaluation {
  const pointsById = new Map((raw.points ?? []).map((point) => [point.pointId, normalizePoint(point)]));
  return {
    id: raw.id || fallbackId || generateId('ceval'),
    className: raw.className || '',
    teacherId: raw.teacherId || '',
    teacherName: raw.teacherName || '',
    coordinatorId: raw.coordinatorId || '',
    coordinatorName: raw.coordinatorName || '',
    date: (raw.date || new Date().toISOString()).slice(0, 10),
    points: COORDINATOR_POINTS.map((def) => pointsById.get(def.id) ?? emptyPoint(def)),
    overallNote: raw.overallNote,
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt, toIsoString(raw.createdAt)),
    principalAction: raw.principalAction,
    principalNote: raw.principalNote,
    reviewedBy: raw.reviewedBy,
    reviewedAt: raw.reviewedAt ? toIsoString(raw.reviewedAt) : undefined,
  };
}

export async function fetchCoordinatorEvaluations(): Promise<CoordinatorEvaluation[]> {
  if (isDemoLoginEnabled) {
    return readLocal<CoordinatorEvaluation[]>(LOCAL_EVAL_KEY, [])
      .map((item) => normalizeEvaluation(item))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, EVAL_COLLECTION)));
  return snapshot.docs
    .map((document) => normalizeEvaluation(document.data() as CoordinatorEvaluation, document.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function persistEvaluation(entry: CoordinatorEvaluation): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<CoordinatorEvaluation[]>(LOCAL_EVAL_KEY, []);
    const index = existing.findIndex((item) => item.id === entry.id);
    if (index >= 0) existing[index] = entry;
    else existing.push(entry);
    writeLocal(LOCAL_EVAL_KEY, existing);
    return;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, EVAL_COLLECTION, entry.id),
    omitUndefined({ ...entry, updatedAt: serverTimestamp() } as unknown as Record<string, unknown>),
    { merge: true },
  );
}

export async function saveCoordinatorEvaluation(input: {
  id?: string;
  className: string;
  teacherId: string;
  teacherName: string;
  coordinatorId: string;
  coordinatorName: string;
  date?: string;
  points: CoordinatorEvaluationPoint[];
  overallNote?: string;
}): Promise<CoordinatorEvaluation> {
  const existing = await fetchCoordinatorEvaluations();
  const date = (input.date || new Date().toISOString()).slice(0, 10);
  const previous =
    (input.id ? existing.find((item) => item.id === input.id) : undefined) ??
    existing.find(
      (item) =>
        item.coordinatorId === input.coordinatorId &&
        item.teacherId === input.teacherId &&
        item.className === input.className &&
        item.date === date,
    );

  const now = new Date().toISOString();
  const entry = normalizeEvaluation({
    ...(previous ?? {}),
    id: previous?.id || generateId('ceval'),
    className: input.className,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
    coordinatorId: input.coordinatorId,
    coordinatorName: input.coordinatorName,
    date,
    points: input.points,
    overallNote: input.overallNote?.trim() || undefined,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    principalAction: previous?.principalAction,
    principalNote: previous?.principalNote,
    reviewedBy: previous?.reviewedBy,
    reviewedAt: previous?.reviewedAt,
  });

  await persistEvaluation(entry);
  return entry;
}

export async function reviewCoordinatorEvaluation(params: {
  evaluation: CoordinatorEvaluation;
  action: CoordinatorPrincipalAction;
  note?: string;
}): Promise<CoordinatorEvaluation> {
  const updated = normalizeEvaluation({
    ...params.evaluation,
    principalAction: params.action,
    principalNote: params.note?.trim() || undefined,
    reviewedBy: getCurrentActorLabel('Principal Office'),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await persistEvaluation(updated);
  return updated;
}

export function followLabel(mark?: string): string {
  return FOLLOW_OPTIONS.find((item) => item.id === mark)?.label || mark || '—';
}

export function levelLabel(mark?: string): string {
  return LEVEL_OPTIONS.find((item) => item.id === mark)?.label || mark || '—';
}

export function actionLabel(action?: CoordinatorPrincipalAction): string {
  return PRINCIPAL_ACTIONS.find((item) => item.id === action)?.label || 'Pending';
}

export function summarizePoint(def: CoordinatorPointDef, point: CoordinatorEvaluationPoint): string {
  if (def.kind === 'count') {
    const count = point.count ?? (point.mark ? Number(point.mark) : undefined);
    return count != null && !Number.isNaN(count) ? String(count) : '—';
  }
  if (def.kind === 'count_detail') {
    const count = point.count ?? (point.mark ? Number(point.mark) : undefined);
    const bits = [count != null && !Number.isNaN(count) ? String(count) : '', point.detail].filter(Boolean);
    return bits.join(' · ') || '—';
  }
  if (def.kind === 'follow') return followLabel(point.mark);
  if (def.kind === 'level') return levelLabel(point.mark);
  if (def.kind === 'behaviour') {
    const parts = (def.subs ?? [])
      .map((sub) => `${sub}: ${levelLabel(point.subMarks?.[sub])}`)
      .filter((part) => !part.endsWith(': —'));
    return parts.join(' · ') || '—';
  }
  return point.note?.trim() || point.detail?.trim() || '—';
}
