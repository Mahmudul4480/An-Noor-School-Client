import React from 'react';
import { cn, dhakaToday, formatDateTime } from '../../lib/utils';
import { showToast } from '../../lib/toast';
import { userErrorMessage } from '../../lib/errorMessages';
import { classSectionLabel } from '../../lib/schoolConstants';
import { fetchAllTopics, fetchAttendanceForDate, progressPercent, recordEntries, type AttendanceSheet, type CurriculumTopic } from '../../lib/teaching';
import { CountChips } from '../teacher/AttendancePanel';
import { ProgressBar, SubjectProgress } from '../teacher/CurriculumPanel';

const card = 'bg-white p-6 rounded-[2rem] border border-school-border shadow-sm';
const h = 'text-xs font-black text-school-blue tracking-widest mb-4';

/** Principal / super admin: read-only attendance by date + curriculum progress for all classes. */
export function TeachingOverviewPanel() {
  const [date, setDate] = React.useState(dhakaToday());
  const [sheets, setSheets] = React.useState<AttendanceSheet[]>([]);
  const [topics, setTopics] = React.useState<CurriculumTopic[]>([]);
  const [open, setOpen] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAttendanceForDate(date)
      .then((s) => { if (alive) setSheets(s.sort((a, b) => classSectionLabel(a.className, a.section).localeCompare(classSectionLabel(b.className, b.section)))); })
      .catch((e) => showToast('error', 'উপস্থিতি লোড করা যায়নি', userErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [date]);
  React.useEffect(() => {
    fetchAllTopics().then(setTopics).catch((e) => showToast('error', 'সিলেবাস লোড করা যায়নি', userErrorMessage(e)));
  }, []);

  const totals = sheets.reduce((acc, s) => {
    (['present', 'absent', 'late', 'leave'] as const).forEach((k) => { acc[k] += s.counts?.[k] ?? 0; });
    acc.total += s.total ?? 0; return acc;
  }, { present: 0, absent: 0, late: 0, leave: 0, total: 0 });

  const byKey = new Map<string, CurriculumTopic[]>();
  topics.forEach((t) => byKey.set(t.key, [...(byKey.get(t.key) ?? []), t]));

  return (
    <div className="space-y-6 font-bn">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className={cn(h, 'mb-0')}>ক্লাসভিত্তিক উপস্থিতি</h3>
          <input type="date" value={date} max={dhakaToday()} onChange={(e) => setDate(e.target.value || dhakaToday())}
            className="px-3 py-2 rounded-xl border border-school-border text-[12px] font-bold text-school-blue" />
        </div>
        <div className="mb-4"><CountChips counts={totals} total={totals.total} /></div>
        {loading ? <p className="text-sm text-school-muted text-center py-6">লোড হচ্ছে…</p> : sheets.length === 0 ? (
          <p className="text-sm text-school-muted text-center py-6">{formatDateTime(date)} তারিখে কোনো ক্লাসের উপস্থিতি নেওয়া হয়নি</p>
        ) : (
          <div className="space-y-2">
            {sheets.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 rounded-xl">
                <button type="button" className="w-full text-left" onClick={() => setOpen(open === s.id ? '' : s.id)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-black text-school-blue">{classSectionLabel(s.className, s.section)}</p>
                    <CountChips counts={s.counts ?? {}} total={s.total} />
                  </div>
                  <p className="text-[10px] font-bold text-school-muted mt-1">নিয়েছেন: {s.teacherName} • {formatDateTime(s.updatedAtIso)}</p>
                </button>
                {open === s.id && (
                  <div className="mt-2 text-[11px] grid sm:grid-cols-2 gap-1">
                    {recordEntries(s).filter(([, r]) => r.status !== 'present')
                      .map(([id, r]) => <p key={id}><b>{r.roll ? `${r.roll}. ` : ''}{r.name}</b> — {({ absent: 'অনুপস্থিত', late: 'দেরি', leave: 'ছুটি' } as Record<string, string>)[r.status]}</p>)}
                    {recordEntries(s).every(([, r]) => r.status === 'present') && <p>সবাই উপস্থিত</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className={h}>সিলেবাস অগ্রগতি (সব ক্লাস)</h3>
        {byKey.size === 0 ? <p className="text-sm text-school-muted text-center py-6">শিক্ষকরা এখনো কোনো টপিক যোগ করেননি</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {[...byKey.entries()].map(([k, list]) => ({ k, list, label: classSectionLabel(list[0].className, list[0].section) }))
              .sort((a, b) => a.label.localeCompare(b.label)).map(({ k, list, label }) => (
                <div key={k} className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex justify-between text-[12px] font-black text-school-blue mb-1"><span>{label}</span><span>{progressPercent(list)}%</span></div>
                  <ProgressBar pct={progressPercent(list)} />
                  <div className="mt-3"><SubjectProgress topics={list} /></div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
