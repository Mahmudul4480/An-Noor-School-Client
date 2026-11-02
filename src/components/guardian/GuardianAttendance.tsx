import React from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, dhakaToday, formatDateTime } from '../../lib/utils';
import { showToast } from '../../lib/toast';
import { userErrorMessage } from '../../lib/errorMessages';
import { ATTENDANCE_BN, fetchStudentAttendance, type AttendanceStatus, type StudentAttendanceDay } from '../../lib/teaching';

const STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white', absent: 'bg-red-500 text-white', late: 'bg-amber-500 text-white', leave: 'bg-sky-500 text-white',
};
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const bnDigits = (v: string | number) => String(v).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export function GuardianAttendance({ studentId, studentName }: { studentId?: string; studentName?: string }) {
  const thisMonth = dhakaToday().slice(0, 7);
  const [month, setMonth] = React.useState(thisMonth);
  const [days, setDays] = React.useState<StudentAttendanceDay[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!studentId) return;
    let alive = true;
    setLoading(true);
    fetchStudentAttendance(studentId)
      .then((d) => { if (alive) setDays(d); })
      .catch((e) => showToast('error', 'উপস্থিতির তথ্য লোড করা যায়নি', userErrorMessage(e)))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [studentId]);

  const monthDays = days.filter((d) => d.date.slice(0, 7) === month);
  const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, leave: 0 };
  monthDays.forEach((d) => { if (counts[d.status] !== undefined) counts[d.status] += 1; });
  const taken = monthDays.length;
  const pct = taken ? Math.round(((counts.present + counts.late) / taken) * 100) : 0;
  const [y, m] = month.split('-');

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm" style={{ fontFamily: "'Anek Bangla', sans-serif" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-black text-school-blue flex items-center gap-2">
          <CalendarCheck size={16} className="text-school-gold" /> মাসিক উপস্থিতি{studentName ? ` • ${studentName}` : ''}
        </h3>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="আগের মাস" onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 rounded-xl bg-slate-100"><ChevronLeft size={14} /></button>
          <span className="text-[12px] font-black text-school-blue min-w-[110px] text-center">{BN_MONTHS[Number(m) - 1]} {bnDigits(y)}</span>
          <button type="button" aria-label="পরের মাস" disabled={month >= thisMonth} onClick={() => setMonth(shiftMonth(month, 1))} className="p-2 rounded-xl bg-slate-100 disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-slate-50 text-center"><p className="text-[10px] font-black text-school-muted">মোট দিন</p><p className="text-xl font-black text-school-blue">{bnDigits(taken)}</p></div>
        {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map((s) => (
          <div key={s} className="p-3 rounded-2xl bg-slate-50 text-center">
            <p className="text-[10px] font-black text-school-muted">{ATTENDANCE_BN[s]}</p>
            <p className={cn('text-xl font-black', s === 'present' ? 'text-emerald-600' : s === 'absent' ? 'text-red-600' : s === 'late' ? 'text-amber-600' : 'text-sky-600')}>{bnDigits(counts[s])}</p>
          </div>
        ))}
      </div>
      {taken > 0 && <p className="text-[11px] font-black text-school-blue mb-4">উপস্থিতির হার (দেরিসহ): {bnDigits(pct)}%</p>}
      {loading ? <p className="text-sm text-school-muted text-center py-6">লোড হচ্ছে…</p> : monthDays.length === 0 ? (
        <p className="text-sm text-school-muted text-center py-6">এই মাসে এখনো কোনো উপস্থিতি রেকর্ড নেই</p>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {monthDays.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50">
              <div>
                <p className="text-[12px] font-black text-school-blue">{formatDateTime(d.date)}</p>
                <p className="text-[10px] font-bold text-school-muted">নিয়েছেন: {d.teacherName} • {formatDateTime(d.updatedAtIso)}</p>
              </div>
              <span className={cn('px-3 py-1 rounded-lg text-[11px] font-black', STYLE[d.status])}>{ATTENDANCE_BN[d.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
