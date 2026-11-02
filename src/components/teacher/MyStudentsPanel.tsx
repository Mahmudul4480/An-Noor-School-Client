import React from 'react';
import { cn } from '../../lib/utils';
import { card, h, input, sortByRoll, type TeacherClassRow } from './types';

export function MyStudentsPanel({ rows }: { rows: TeacherClassRow[] }) {
  const [rowKey, setRowKey] = React.useState('all');
  const [q, setQ] = React.useState('');
  const visibleRows = rowKey === 'all' ? rows : rows.filter((r) => r.key === rowKey);
  const term = q.trim().toLowerCase();
  const total = new Set(rows.flatMap((r) => r.students.map((s) => s.studentId))).size;

  return (
    <div className={card}>
      <h3 className={h}>আমার ক্লাসের ছাত্র ({total} জন)</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <select className={input} value={rowKey} onChange={(e) => setRowKey(e.target.value)}>
          <option value="all">সব ক্লাস/সেকশন</option>
          {rows.map((r) => <option key={r.key} value={r.key}>{r.label} ({r.students.length} জন)</option>)}
        </select>
        <input className={input} placeholder="নাম, আইডি বা রোল দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {rows.length === 0 && <p className="text-sm text-school-muted text-center py-6">এখনো কোনো ক্লাস দেওয়া হয়নি</p>}
      {visibleRows.map((r) => {
        const list = sortByRoll(r.students).filter((s) => !term
          || s.name.toLowerCase().includes(term) || s.studentId.toLowerCase().includes(term) || (s.roll ?? '').toLowerCase() === term);
        return (
          <div key={r.key} className="mb-5">
            <p className="text-[12px] font-black text-school-blue mb-2">{r.label} <span className="text-school-muted">• {list.length} জন</span></p>
            {list.length === 0 ? (
              <p className="text-[11px] text-school-muted py-2">কোনো ছাত্র পাওয়া যায়নি</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="text-left text-[10px] text-school-muted">
                    <th className="p-2">রোল</th><th className="p-2">নাম</th><th className="p-2">আইডি</th><th className="p-2">সেকশন</th><th className="p-2">অবস্থা</th>
                  </tr></thead>
                  <tbody>
                    {list.map((s) => (
                      <tr key={s.studentId} className="border-t border-slate-100">
                        <td className="p-2 font-black">{s.roll || '—'}</td>
                        <td className="p-2 font-black text-school-blue">{s.name}</td>
                        <td className="p-2 font-bold text-school-muted">{s.studentId}</td>
                        <td className="p-2">{s.section || '—'}</td>
                        <td className="p-2"><span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black', s.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>{s.status === 'Active' ? 'সক্রিয়' : s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
