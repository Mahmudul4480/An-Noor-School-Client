import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { dhakaToday, formatDateTime } from './utils';
import type { StaffMember } from '../types';

/** Duty posts for guards. Add a new post here and it appears everywhere. */
export const GUARD_POSTS = [
  { id: 'main_gate', label: 'Main Gate (মেইন গেট)' },
  { id: 'floor2_gate', label: '2nd Floor Gate (২য় তলা গেট)' },
  { id: 'floor3_gate', label: '3rd Floor Gate (৩য় তলা গেট)' },
] as const;

export const GUARD_SHIFTS = ['সকাল (Morning)', 'দুপুর (Day)', 'বিকাল (Evening)', 'রাত (Night)', 'সারাদিন (Full day)'];

export function guardPostLabel(id: string): string {
  return GUARD_POSTS.find((p) => p.id === id)?.label ?? id;
}

export interface GuardDeployment {
  id: string;
  staffId: string;
  employeeId: string;
  staffName: string;
  post: string;
  date: string; // yyyy-mm-dd (Dhaka)
  shift?: string;
  note?: string;
  status: 'active' | 'ended';
  assignedBy: string;
  assignedAt: string; // ISO
  assignedTime: string; // "12:09 PM" Dhaka
  endedBy?: string;
  endedAt?: string;
  endedTime?: string;
}

const COL = 'guardDeployments';
const LOCAL_KEY = 'an-noor-guard-deployments';

const GUARD_RE = /guard|security|gate|darwan|দারোয়ান|গার্ড|নিরাপত্তা/i;

/** Guards = active staff whose category/designation mentions guard/security. */
export function isGuard(p: StaffMember): boolean {
  return GUARD_RE.test(`${p.category ?? ''} ${p.designation ?? ''}`);
}

/** Selectable people: guards first; if none, any active non-teaching staff. */
export function guardCandidates(staff: StaffMember[]): { people: StaffMember[]; fallback: boolean } {
  const active = staff.filter((p) => p.status === 'active');
  const guards = active.filter(isGuard);
  if (guards.length) return { people: guards, fallback: false };
  return { people: active.filter((p) => p.track === 'staff'), fallback: true };
}

export function dhakaClock(d: Date = new Date()): string {
  return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true });
}

function readLocal(): GuardDeployment[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function writeLocal(v: GuardDeployment[]) { localStorage.setItem(LOCAL_KEY, JSON.stringify(v)); }

export async function fetchGuardDeployments(date?: string): Promise<GuardDeployment[]> {
  let rows: GuardDeployment[];
  if (isDemoLoginEnabled) rows = readLocal();
  else {
    await waitForAuthUser();
    const q = date ? query(collection(db, COL), where('date', '==', date)) : query(collection(db, COL));
    const snap = await getDocs(q);
    rows = snap.docs.map((d) => ({ ...(d.data() as GuardDeployment), id: d.id }));
  }
  return rows.filter((r) => !date || r.date === date).sort((a, b) => String(b.assignedAt).localeCompare(String(a.assignedAt)));
}

/** Active post per staff id for today (Dhaka). */
export async function fetchTodayGuardPosts(): Promise<Map<string, GuardDeployment>> {
  const rows = await fetchGuardDeployments(dhakaToday());
  const m = new Map<string, GuardDeployment>();
  rows.filter((r) => r.status === 'active').forEach((r) => { if (!m.has(r.staffId)) m.set(r.staffId, r); });
  return m;
}

async function endDoc(id: string, actor: string, now: Date) {
  const patch = { status: 'ended' as const, endedBy: actor, endedAt: now.toISOString(), endedTime: dhakaClock(now) };
  if (isDemoLoginEnabled) { writeLocal(readLocal().map((r) => (r.id === id ? { ...r, ...patch } : r))); return; }
  await updateDoc(doc(db, COL, id), patch);
}

export async function endGuardDeployment(id: string, actor: string): Promise<void> {
  await endDoc(id, actor, new Date());
}

/** Assign (or change) a guard's post for a date. Any active deployment of that guard on that date is ended first. */
export async function assignGuard(params: {
  person: StaffMember; post: string; date: string; shift?: string; note?: string; actor: string; existing: GuardDeployment[];
}): Promise<GuardDeployment> {
  if (!params.person) throw new Error('গার্ড নির্বাচন করুন।');
  if (!GUARD_POSTS.some((p) => p.id === params.post)) throw new Error('ডিউটি পোস্ট নির্বাচন করুন।');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw new Error('সঠিক তারিখ দিন।');
  const now = new Date();
  for (const r of params.existing) {
    if (r.status === 'active' && r.staffId === params.person.id && r.date === params.date) await endDoc(r.id, params.actor, now);
  }
  const id = `gd-${params.date}-${params.person.id}-${now.getTime()}`;
  const rec: GuardDeployment = {
    id, staffId: params.person.id, employeeId: params.person.employeeId || params.person.id, staffName: params.person.name,
    post: params.post, date: params.date, status: 'active', assignedBy: params.actor,
    assignedAt: now.toISOString(), assignedTime: dhakaClock(now),
  };
  if (params.shift?.trim()) rec.shift = params.shift.trim();
  if (params.note?.trim()) rec.note = params.note.trim();
  if (isDemoLoginEnabled) writeLocal([...readLocal(), rec]);
  else { await waitForAuthUser(); await setDoc(doc(db, COL, id), rec); }
  return rec;
}

export { formatDateTime };
