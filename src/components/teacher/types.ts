import type { RosterEntry } from '../../lib/teacherAccess';
export interface TeacherClassRow { key: string; label: string; className: string; section: string; kinds: string[]; students: RosterEntry[] }
export const card = 'bg-white p-6 rounded-[2rem] border border-school-border shadow-sm';
export const h = 'text-xs font-black text-school-blue tracking-widest mb-4';
export const input = 'w-full px-3 py-2 rounded-xl border border-school-border bg-white text-[12px] font-bold text-school-blue outline-none focus:ring-2 ring-school-gold/40';
export const inputErr = 'border-red-500 ring-2 ring-red-300 bg-red-50';
export function sortByRoll<T extends { roll?: string; name?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = (a.roll ?? '').trim(); const rb = (b.roll ?? '').trim();
    if (ra && !rb) return -1; if (!ra && rb) return 1;
    return ra.localeCompare(rb, undefined, { numeric: true }) || (a.name ?? '').localeCompare(b.name ?? '');
  });
}
export function focusFieldEl(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => (el as HTMLElement | null)?.focus(), 300);
}
