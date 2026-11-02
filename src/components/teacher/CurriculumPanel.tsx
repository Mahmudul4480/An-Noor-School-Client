import React from 'react';
import { cn, dhakaToday, formatDateTime } from '../../lib/utils';
import { showToast } from '../../lib/toast';
import { userErrorMessage } from '../../lib/errorMessages';
import {
  addTopic, classKey, fetchTopicsForKeys, progressPercent, setTopicStatus, SUBJECT_SUGGESTIONS, TOPIC_BN,
  type CurriculumTopic, type TopicStatus,
} from '../../lib/teaching';
import { card, focusFieldEl, h, input, inputErr, type TeacherClassRow } from './types';

const TOPIC_STYLE: Record<TopicStatus, string> = { planned: 'bg-slate-100 text-slate-600', ongoing: 'bg-amber-50 text-amber-600', done: 'bg-emerald-50 text-emerald-600' };

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
  );
}

/** Subject-wise progress list, shared with the Principal view. */
export function SubjectProgress({ topics }: { topics: CurriculumTopic[] }) {
  const bySubject = new Map<string, CurriculumTopic[]>();
  topics.forEach((t) => bySubject.set(t.subject, [...(bySubject.get(t.subject) ?? []), t]));
  return (
    <div className="space-y-2">
      {[...bySubject.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([subj, list]) => {
        const pct = progressPercent(list);
        return (
          <div key={subj}>
            <div className="flex justify-between text-[11px] font-black text-school-blue"><span>{subj}</span>
              <span>{pct}% • {list.filter((t) => t.status === 'done').length}/{list.length} সম্পন্ন</span></div>
            <ProgressBar pct={pct} />
          </div>
        );
      })}
    </div>
  );
}

export function CurriculumPanel({ rows, teacherName }: { rows: TeacherClassRow[]; teacherName: string }) {
  const [rowKey, setRowKey] = React.useState(rows[0]?.key ?? '');
  const [topics, setTopics] = React.useState<CurriculumTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [plannedDate, setPlannedDate] = React.useState('');
  const [note, setNote] = React.useState('');
  const [errs, setErrs] = React.useState<Record<string, boolean>>({});
  const [subjectFilter, setSubjectFilter] = React.useState('all');

  const keys = React.useMemo(() => rows.map((r) => classKey(r.className, r.section)), [rows]);
  const load = React.useCallback(async () => {
    setLoading(true);
    try { setTopics(await fetchTopicsForKeys(keys)); }
    catch (e) { showToast('error', 'সিলেবাস লোড করা যায়নি', userErrorMessage(e)); }
    finally { setLoading(false); }
  }, [keys]);
  React.useEffect(() => { void load(); }, [load]);

  const row = rows.find((r) => r.key === rowKey);
  const key = row ? classKey(row.className, row.section) : '';
  const classTopics = topics.filter((t) => t.key === key);
  const subjects = [...new Set(classTopics.map((t) => t.subject))].sort();
  const shown = classTopics.filter((t) => subjectFilter === 'all' || t.subject === subjectFilter)
    .sort((a, b) => a.subject.localeCompare(b.subject) || (a.plannedDate ?? '9').localeCompare(b.plannedDate ?? '9') || a.title.localeCompare(b.title));

  const fail = (field: string, msg: string) => {
    setErrs({ [field]: true }); focusFieldEl(`cur-${field}`);
    showToast('error', msg, 'লাল দাগ দেওয়া ঘরটি ঠিক করুন');
  };

  const add = async () => {
    if (!row) return fail('class', 'ক্লাস/সেকশন বেছে নিন');
    if (!subject.trim()) return fail('subject', 'বিষয়ের নাম লিখুন');
    if (!title.trim()) return fail('title', 'টপিক / পাঠের নাম লিখুন');
    if (classTopics.some((t) => t.subject.toLowerCase() === subject.trim().toLowerCase() && t.title.toLowerCase() === title.trim().toLowerCase())) {
      return fail('title', 'এই বিষয়ে এই টপিক আগেই যোগ করা আছে');
    }
    setSaving(true);
    try {
      await addTopic({ className: row.className, section: row.section, subject, title, note, plannedDate, teacherName });
      showToast('success', 'টপিক যোগ হয়েছে', `${row.label} • ${subject.trim()}`);
      setTitle(''); setNote(''); setPlannedDate(''); setErrs({});
      await load();
    } catch (e) { showToast('error', 'টপিক যোগ করা যায়নি', userErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const changeStatus = async (t: CurriculumTopic, st: TopicStatus) => {
    if (t.status === st) return;
    try {
      const patch = await setTopicStatus(t, st, teacherName);
      setTopics((list) => list.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
      showToast('success', `“${t.title}” এখন ${TOPIC_BN[st]}`);
    } catch (e) { showToast('error', 'অগ্রগতি সেভ করা যায়নি', userErrorMessage(e)); }
  };

  if (!rows.length) return <div className={card}><p className="text-sm text-school-muted text-center py-6">এখনো কোনো ক্লাস দেওয়া হয়নি, তাই সিলেবাস যোগ করা যাবে না</p></div>;

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className={h}>সিলেবাস অগ্রগতি (সব ক্লাস)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => {
            const list = topics.filter((t) => t.key === classKey(r.className, r.section));
            const pct = progressPercent(list);
            return (
              <button key={r.key} type="button" onClick={() => { setRowKey(r.key); setSubjectFilter('all'); }}
                className={cn('text-left p-4 rounded-2xl', r.key === rowKey ? 'bg-white ring-2 ring-school-gold/50' : 'bg-slate-50')}>
                <p className="text-[12px] font-black text-school-blue">{r.label}</p>
                <p className="text-2xl font-black text-school-blue">{list.length ? `${pct}%` : '—'}</p>
                <ProgressBar pct={pct} />
                <p className="text-[10px] font-bold text-school-muted mt-1">{list.length ? `${list.filter((t) => t.status === 'done').length}/${list.length} টপিক সম্পন্ন` : 'এখনো কোনো টপিক নেই'}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className={card}>
        <h3 className={h}>নতুন টপিক / পাঠ যোগ করুন</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-black text-school-muted">ক্লাস / সেকশন</label>
            <select id="cur-class" className={cn(input, errs.class && inputErr)} value={rowKey} onChange={(e) => { setRowKey(e.target.value); setSubjectFilter('all'); setErrs({}); }}>
              {rows.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-school-muted">বিষয়</label>
            <input id="cur-subject" list="cur-subjects" className={cn(input, errs.subject && inputErr)} value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrs({}); }} placeholder="যেমন: Bangla" />
            <datalist id="cur-subjects">{[...new Set([...subjects, ...SUBJECT_SUGGESTIONS])].map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <label className="text-[10px] font-black text-school-muted">টপিক / পাঠ</label>
            <input id="cur-title" className={cn(input, errs.title && inputErr)} value={title} onChange={(e) => { setTitle(e.target.value); setErrs({}); }} placeholder="যেমন: স্বরবর্ণ অ–ঔ" />
          </div>
          <div>
            <label className="text-[10px] font-black text-school-muted">পরিকল্পিত তারিখ (ঐচ্ছিক)</label>
            <input id="cur-date" type="date" className={input} value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} min={dhakaToday().slice(0, 4) + '-01-01'} />
          </div>
        </div>
        <input className={cn(input, 'mt-3')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="নোট (ঐচ্ছিক)" />
        <button type="button" disabled={saving} onClick={add} className="mt-3 px-6 py-3 rounded-xl bg-school-blue text-white text-[12px] font-black disabled:opacity-50">
          {saving ? 'যোগ হচ্ছে…' : 'টপিক যোগ করুন'}
        </button>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className={cn(h, 'mb-0')}>{row?.label} • টপিক তালিকা</h3>
          <select className={cn(input, 'w-auto')} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="all">সব বিষয়</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {classTopics.length > 0 && <div className="mb-4"><SubjectProgress topics={classTopics} /></div>}
        {loading ? <p className="text-sm text-school-muted text-center py-6">লোড হচ্ছে…</p> : shown.length === 0 ? (
          <p className="text-sm text-school-muted text-center py-6">এখনো কোনো টপিক যোগ করা হয়নি</p>
        ) : (
          <div className="space-y-2">
            {shown.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-[12px] font-black text-school-blue">{t.title} <span className={cn('ml-2 px-2 py-0.5 rounded-lg text-[10px]', TOPIC_STYLE[t.status])}>{TOPIC_BN[t.status]}</span></p>
                  <p className="text-[10px] font-bold text-school-muted">
                    {t.subject}{t.plannedDate ? ` • পরিকল্পনা: ${formatDateTime(t.plannedDate)}` : ''}{t.startedDate ? ` • শুরু: ${formatDateTime(t.startedDate)}` : ''}{t.doneDate ? ` • শেষ: ${formatDateTime(t.doneDate)}` : ''}
                    {` • ${t.teacherName}`}{t.updatedAtIso ? ` (${formatDateTime(t.updatedAtIso)})` : ''}
                  </p>
                  {t.note && <p className="text-[11px] mt-1">{t.note}</p>}
                </div>
                <div className="flex gap-1">
                  {(['planned', 'ongoing', 'done'] as TopicStatus[]).map((st) => (
                    <button key={st} type="button" onClick={() => changeStatus(t, st)}
                      className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black', t.status === st ? 'bg-school-blue text-white' : 'bg-white text-school-muted border border-school-border')}>
                      {TOPIC_BN[st]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
