import React from 'react';
import { cn, dhakaToday, formatDateTime } from '../../lib/utils';
import { showToast } from '../../lib/toast';
import { userErrorMessage } from '../../lib/errorMessages';
import {
  ATTENDANCE_BN, ATTENDANCE_STATUSES, AttendanceConflictError, classKey, fetchAttendanceSheet, recordEntries, fetchAttendanceHistory, saveAttendance,
  type AttendanceSheet, type AttendanceStatus,
} from '../../lib/teaching';
import { card, focusFieldEl, h, input, inputErr, sortByRoll, type TeacherClassRow } from './types';

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white', absent: 'bg-red-500 text-white', late: 'bg-amber-500 text-white', leave: 'bg-sky-500 text-white',
};

export function CountChips({ counts, total }: { counts: Partial<Record<AttendanceStatus, number>>; total?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {typeof total === 'number' && <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-school-blue">মোট {total}</span>}
      {ATTENDANCE_STATUSES.map((s) => (
        <span key={s} className={cn('px-2 py-1 rounded-lg text-[10px] font-black', STATUS_STYLE[s])}>{ATTENDANCE_BN[s]} {counts[s] ?? 0}</span>
      ))}
    </div>
  );
}

export function AttendancePanel({ rows, teacherName }: { rows: TeacherClassRow[]; teacherName: string }) {
  const today = dhakaToday();
  const [rowKey, setRowKey] = React.useState(rows[0]?.key ?? '');
  const [history, setHistory] = React.useState<AttendanceSheet[]>([]);
  const [statuses, setStatuses] = React.useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [classErr, setClassErr] = React.useState(false);
  const [missing, setMissing] = React.useState<string[]>([]);
  const [viewDate, setViewDate] = React.useState('');
  const [baseSheet, setBaseSheet] = React.useState<AttendanceSheet | null>(null);
  const [confirmSheet, setConfirmSheet] = React.useState<AttendanceSheet | null>(null);

  const row = rows.find((r) => r.key === rowKey);
  const students = React.useMemo(() => sortByRoll(row?.students ?? []), [row]);
  const key = row ? classKey(row.className, row.section) : '';
  const todaySheet = history.find((s) => s.date === today) ?? null;

  const load = React.useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const hs = await fetchAttendanceHistory(key);
      setHistory(hs);
      const t = hs.find((s) => s.date === today);
      const init: Record<string, AttendanceStatus> = {};
      (row?.students ?? []).forEach((s) => { init[s.studentId] = t?.records?.[s.studentId]?.status ?? 'present'; });
      setStatuses(init);
      setBaseSheet(t ?? null);
      setMissing([]);
    } catch (e) {
      showToast('error', 'উপস্থিতির তথ্য লোড করা যায়নি', userErrorMessage(e));
    } finally { setLoading(false); }
  }, [key, today, row]);
  React.useEffect(() => { void load(); }, [load]);

  const live = React.useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    students.forEach((s) => { const st = statuses[s.studentId]; if (st) c[st] += 1; });
    return c;
  }, [students, statuses]);

  const save = async () => {
    if (!row) {
      setClassErr(true); focusFieldEl('att-class');
      showToast('error', 'ক্লাস/সেকশন বেছে নিন', 'লাল দাগ দেওয়া ঘরটি ঠিক করুন');
      return;
    }
    if (!students.length) { showToast('error', 'এই ক্লাসে কোনো ছাত্র নেই', 'Principal-কে "শিক্ষকদের ক্লাস অ্যাক্সেস সিঙ্ক" চাপতে বলুন'); return; }
    const miss = students.filter((s) => !statuses[s.studentId]).map((s) => s.studentId);
    if (miss.length) {
      setMissing(miss); focusFieldEl(`att-${miss[0]}`);
      showToast('error', `${miss.length} জন ছাত্রের উপস্থিতি দেওয়া হয়নি`, 'লাল দাগ দেওয়া সারি ঠিক করুন');
      return;
    }
    // A sheet for today already exists (maybe by another teacher): re-check the server and warn before saving.
    setSaving(true);
    try {
      const latest = await fetchAttendanceSheet(today, key);
      if (latest) {
        setConfirmSheet(latest); return;
      }
      await doSave(false);
    } catch (e) {
      showToast('error', 'উপস্থিতি সেভ করা যায়নি', userErrorMessage(e));
    } finally { setSaving(false); }
  };

  const doSave = async (force: boolean) => {
    if (!row) return;
    try {
      const saved = await saveAttendance({ className: row.className, section: row.section, teacherName, students, statuses, existing: baseSheet, force });
      setHistory((h0) => [saved, ...h0.filter((s) => s.date !== today)]);
      setBaseSheet(saved);
      setConfirmSheet(null);
      showToast('success', force || baseSheet ? 'উপস্থিতি হালনাগাদ হয়েছে' : 'উপস্থিতি সেভ হয়েছে', `${row.label} • ${formatDateTime(saved.updatedAtIso)}`);
    } catch (e) {
      if (e instanceof AttendanceConflictError) { setConfirmSheet(e.current); return; }
      throw e;
    }
  };

  const confirmOverwrite = async () => {
    setSaving(true);
    try { await doSave(true); }
    catch (e) { showToast('error', 'উপস্থিতি সেভ করা যায়নি', userErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const viewSheet = history.find((s) => s.date === viewDate) ?? null;

  if (!rows.length) return <div className={card}><p className="text-sm text-school-muted text-center py-6">এখনো কোনো ক্লাস দেওয়া হয়নি, তাই উপস্থিতি নেওয়া যাবে না</p></div>;

  return (
    <div className="space-y-6">
      {confirmSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h4 className="text-[14px] font-black text-red-600 mb-2">সতর্কতা: আজকের উপস্থিতি আগেই সেভ করা আছে</h4>
            <p className="text-[12px] font-bold text-school-blue mb-1">
              সেভ করেছেন: {confirmSheet.updatedByName || confirmSheet.teacherName} • {formatDateTime(confirmSheet.updatedAtIso)}
            </p>
            <div className="my-3"><CountChips counts={confirmSheet.counts ?? {}} total={confirmSheet.total} /></div>
            <p className="text-[11px] font-bold text-school-muted mb-4">
              চালিয়ে গেলে শুধু আপনি যেসব ছাত্রের অবস্থা বদলেছেন সেগুলো হালনাগাদ হবে, বাকিদের আগের তথ্য থাকবে।
              আগে সর্বশেষ তথ্য দেখে নিতে চাইলে "সর্বশেষ তথ্য লোড করুন" চাপুন।
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => { setConfirmSheet(null); void load(); }} className="px-4 py-2 rounded-xl bg-slate-100 text-[11px] font-black text-school-blue">সর্বশেষ তথ্য লোড করুন</button>
              <button type="button" onClick={() => setConfirmSheet(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-[11px] font-black text-school-muted">বাতিল</button>
              <button type="button" disabled={saving} onClick={confirmOverwrite} className="px-4 py-2 rounded-xl bg-red-600 text-white text-[11px] font-black disabled:opacity-50">তবুও সেভ করুন</button>
            </div>
          </div>
        </div>
      )}
      <div className={card}>
        <h3 className={h}>আজকের উপস্থিতি নিন</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-black text-school-muted">ক্লাস / সেকশন</label>
            <select id="att-class" className={cn(input, classErr && inputErr)} value={rowKey} onChange={(e) => { setRowKey(e.target.value); setClassErr(false); setViewDate(''); }}>
              {rows.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-school-muted">তারিখ (আজ)</label>
            <input className={cn(input, 'bg-slate-50')} value={formatDateTime(today)} readOnly />
          </div>
          <div className="text-[10px] font-bold text-school-muted self-end">
            {todaySheet ? <>আজ নেওয়া হয়েছে • শেষ সেভ করেছেন {todaySheet.updatedByName || todaySheet.teacherName}, {formatDateTime(todaySheet.updatedAtIso)}। আজকের মধ্যে বদলাতে পারবেন।</> : 'আজ এখনো উপস্থিতি নেওয়া হয়নি'}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <CountChips counts={live} total={students.length} />
          <button type="button" onClick={() => setStatuses(Object.fromEntries(students.map((s) => [s.studentId, 'present' as AttendanceStatus])))}
            className="px-3 py-2 rounded-xl bg-slate-100 text-[11px] font-black text-school-blue">সবাই উপস্থিত</button>
        </div>
        {loading ? <p className="text-sm text-school-muted text-center py-6">লোড হচ্ছে…</p> : students.length === 0 ? (
          <p className="text-sm text-school-muted text-center py-6">এই ক্লাসে কোনো ছাত্র পাওয়া যায়নি</p>
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.studentId} id={`att-${s.studentId}`} tabIndex={-1}
                className={cn('flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl', missing.includes(s.studentId) ? inputErr : 'bg-slate-50')}>
                <div>
                  <p className="text-[12px] font-black text-school-blue">{s.roll ? `${s.roll}. ` : ''}{s.name}</p>
                  <p className="text-[10px] font-bold text-school-muted">{s.studentId}</p>
                </div>
                <div className="flex gap-1">
                  {ATTENDANCE_STATUSES.map((st) => (
                    <button key={st} type="button"
                      onClick={() => { setStatuses((p) => ({ ...p, [s.studentId]: st })); setMissing((m) => m.filter((x) => x !== s.studentId)); }}
                      className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black', statuses[s.studentId] === st ? STATUS_STYLE[st] : 'bg-white text-school-muted border border-school-border')}>
                      {ATTENDANCE_BN[st]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" disabled={saving || loading} onClick={save}
          className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl bg-school-blue text-white text-[12px] font-black disabled:opacity-50">
          {saving ? 'সেভ হচ্ছে…' : todaySheet ? 'উপস্থিতি হালনাগাদ করুন' : 'উপস্থিতি সেভ করুন'}
        </button>
      </div>

      <div className={card}>
        <h3 className={h}>উপস্থিতির ইতিহাস • {row?.label}</h3>
        {history.length === 0 ? <p className="text-sm text-school-muted text-center py-6">এখনো কোনো রেকর্ড নেই</p> : (
          <div className="space-y-2">
            {history.map((s) => (
              <button key={s.id} type="button" onClick={() => setViewDate(viewDate === s.date ? '' : s.date)}
                className={cn('w-full text-left p-3 rounded-xl', viewDate === s.date ? 'ring-2 ring-school-gold/50 bg-white' : 'bg-slate-50')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-black text-school-blue">{formatDateTime(s.date)}</p>
                  <CountChips counts={s.counts ?? {}} total={s.total} />
                </div>
                <p className="text-[10px] font-bold text-school-muted mt-1">নিয়েছেন: {s.teacherName} • {formatDateTime(s.updatedAtIso)}</p>
              </button>
            ))}
          </div>
        )}
        {viewSheet && (
          <div className="mt-4 overflow-x-auto">
            <p className="text-[11px] font-black text-school-blue mb-2">{formatDateTime(viewSheet.date)} এর বিস্তারিত</p>
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[10px] text-school-muted"><th className="p-2">রোল</th><th className="p-2">নাম</th><th className="p-2">অবস্থা</th></tr></thead>
              <tbody>
                {sortByRoll(recordEntries(viewSheet).map(([id, r]) => ({ id, ...r }))).map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-2">{r.roll || '—'}</td><td className="p-2 font-black text-school-blue">{r.name}</td>
                    <td className="p-2"><span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black', STATUS_STYLE[r.status])}>{ATTENDANCE_BN[r.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
