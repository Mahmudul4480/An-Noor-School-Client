import React from 'react';
import { Users, BookOpen, ClipboardList, School, Calendar, MessageSquare, CheckSquare, BookMarked } from 'lucide-react';
import { cn } from '../lib/utils';
import { CoordinatorClassTags, CoordinatorHub } from './staff/CoordinatorHub';
import { coordinatorDuties, dutyLabel, fetchStaffMemberForCurrentUser } from '../lib/staff';
import { fetchMyRoster, type RosterEntry } from '../lib/teacherAccess';
import { actionLabel, fetchCoordinatorEvaluations } from '../lib/coordinator';
import { classSectionLabel } from '../lib/schoolConstants';
import { showToast } from '../lib/toast';
import { userErrorMessage } from '../lib/errorMessages';
import { ErrorBoundary } from './ErrorBoundary';
import { MyStudentsPanel } from './teacher/MyStudentsPanel';
import { AttendancePanel } from './teacher/AttendancePanel';
import { CurriculumPanel } from './teacher/CurriculumPanel';
import type { CoordinatorEvaluation, DutyAssignment, StaffMember } from '../types';

type Student = RosterEntry;

const card = 'bg-white p-6 rounded-[2rem] border border-school-border shadow-sm';
const h = 'text-xs font-black text-school-blue tracking-widest mb-4';
const NOT_TRACKED = 'এখনো ট্র্যাক হচ্ছে না';

const NOT_TRACKED_ITEMS = [
  'আজকের ক্লাস রুটিন / সময়সূচি',
  'পরীক্ষার ফলাফল / ক্লাস পারফরম্যান্স',
  'নোটিশ ও ইভেন্ট',
  'ছুটির আবেদন (Leave)',
  'রিপোর্ট (Behaviour / Term)',
];

const STATUS_BN: Record<string, string> = { active: 'চলমান', pending: 'অনুমোদনের অপেক্ষায়', ended: 'শেষ', rejected: 'বাতিল' };

interface ClassRow { key: string; label: string; className: string; section: string; kinds: string[]; students: Student[] }

function buildClassRows(staff: StaffMember | null, students: Student[]): ClassRow[] {
  if (!staff) return [];
  const map = new Map<string, ClassRow>();
  staff.duties
    .filter((d) => d.status === 'active' && d.className)
    .forEach((d) => {
      const className = d.className as string;
      const section = d.section ?? '';
      const key = `${className}|${section}`;
      const row = map.get(key) ?? {
        key, className, section, label: classSectionLabel(className, section), kinds: [],
        students: students.filter((s) => s.status === 'Active' && s.class === className && (!section || (s.section ?? '') === section)),
      };
      const k = dutyLabel(d.kind);
      if (!row.kinds.includes(k)) row.kinds.push(k);
      map.set(key, row);
    });
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className={card}>
    <p className="text-[10px] font-black text-school-muted tracking-widest mb-1">{label}</p>
    <h4 className="font-black text-school-blue text-2xl">{value}</h4>
    {sub && <p className="text-[10px] font-bold text-school-muted mt-1">{sub}</p>}
  </div>
);

const NotTracked = () => (
  <div className={card}>
    <h3 className={h}>{NOT_TRACKED}</h3>
    <div className="space-y-2">
      {NOT_TRACKED_ITEMS.map((i) => (
        <div key={i} className="flex justify-between gap-3 p-3 bg-slate-50 rounded-xl text-[11px] font-black text-school-blue">
          <span>{i}</span><span className="text-slate-400 whitespace-nowrap">{NOT_TRACKED}</span>
        </div>
      ))}
    </div>
  </div>
);

function DutyList({ duties }: { duties: DutyAssignment[] }) {
  if (!duties.length) return <p className="text-sm text-school-muted text-center py-6">কোনো দায়িত্ব দেওয়া হয়নি</p>;
  return (
    <div className="space-y-2">
      {duties.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
          <div>
            <p className="text-[12px] font-black text-school-blue">{d.title || dutyLabel(d.kind)}</p>
            <p className="text-[10px] font-bold text-school-muted">
              {dutyLabel(d.kind)}{d.className ? ` • ${classSectionLabel(d.className, d.section)}` : ''}{d.approvedBy ? ` • অনুমোদন: ${d.approvedBy}` : ''}
            </p>
          </div>
          <span className={cn('px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap',
            d.status === 'active' ? 'bg-emerald-50 text-emerald-600' : d.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')}>
            {STATUS_BN[d.status] ?? d.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function TeacherDashboardInner() {
  const [tab, setTab] = React.useState('overview');
  const [staff, setStaff] = React.useState<StaffMember | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [evals, setEvals] = React.useState<CoordinatorEvaluation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetchStaffMemberForCurrentUser();
        if (!alive) return;
        setStaff(me);
        const [st, ev] = await Promise.all([
          (me ? fetchMyRoster(me) : Promise.resolve([] as Student[])).catch((e) => { showToast('error', 'ছাত্রদের তালিকা লোড করা যায়নি', userErrorMessage(e)); return [] as Student[]; }),
          fetchCoordinatorEvaluations().catch(() => [] as CoordinatorEvaluation[]),
        ]);
        if (!alive) return;
        setStudents(st);
        setEvals(me ? ev.filter((e) => e.teacherId === me.id) : []);
      } catch (e) {
        const msg = userErrorMessage(e, 'ডাটা লোড করা যায়নি।');
        if (alive) setError(msg);
        showToast('error', 'Teacher Dashboard লোড করা যায়নি', msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const coordinatorClasses = staff ? coordinatorDuties(staff).map((d) => classSectionLabel(d.className, d.section)) : [];
  const isCoordinator = coordinatorClasses.length > 0;
  const rows = React.useMemo(() => buildClassRows(staff, students), [staff, students]);
  const myStudents = React.useMemo(() => {
    const seen = new Map<string, Student & { _label: string }>();
    rows.forEach((r) => r.students.forEach((s) => { if (!seen.has(s.studentId)) seen.set(s.studentId, { ...s, _label: classSectionLabel(s.class, s.section) }); }));
    return [...seen.values()].sort((a, b) => a._label.localeCompare(b._label) || (a.roll ?? '').localeCompare(b.roll ?? '', undefined, { numeric: true }) || a.name.localeCompare(b.name));
  }, [rows]);
  const allDuties = staff?.duties ?? [];
  const activeCount = allDuties.filter((d) => d.status === 'active').length;
  const pendingCount = allDuties.filter((d) => d.status === 'pending').length;

  const tabs = [
    { id: 'overview', label: 'সারসংক্ষেপ', icon: <Calendar size={16} /> },
    { id: 'students', label: 'আমার ছাত্র', icon: <Users size={16} /> },
    { id: 'attendance', label: 'উপস্থিতি', icon: <CheckSquare size={16} /> },
    { id: 'curriculum', label: 'সিলেবাস / কারিকুলাম', icon: <BookMarked size={16} /> },
    { id: 'duties', label: 'আমার দায়িত্ব', icon: <ClipboardList size={16} /> },
    { id: 'feedback', label: 'কো-অর্ডিনেটর মূল্যায়ন', icon: <MessageSquare size={16} /> },
    ...(isCoordinator ? [{ id: 'coordinator', label: 'Coordinator Hub', icon: <School size={16} /> }] : []),
  ];

  if (loading) return <p className="p-10 text-center text-sm text-school-muted">লোড হচ্ছে…</p>;
  if (error) return <p className="p-10 text-center text-sm text-red-500">ডাটা লোড করা যায়নি: {error}</p>;

  return (
    <div className="p-6 space-y-6 font-bn">
      <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-school-border shadow-sm">
        {staff?.photoUrl ? (
          <img src={staff.photoUrl} alt="" className="w-16 h-16 rounded-3xl object-cover border-2 border-school-gold" />
        ) : (
          <div className="w-16 h-16 rounded-3xl bg-school-blue flex items-center justify-center text-white border-2 border-school-gold"><Users size={30} /></div>
        )}
        <div>
          <h3 className="text-xl font-black text-school-blue">{staff?.name || 'শিক্ষক'}</h3>
          <p className="text-[11px] font-bold text-school-muted mt-1">
            {staff ? `${staff.designation || staff.category}${staff.employeeId ? ` • ${staff.employeeId}` : ''}` : 'আপনার লগইন ইমেইলের সাথে কোনো স্টাফ প্রোফাইল মেলেনি। Principal/Accounts-কে স্টাফ প্রোফাইলে ইমেইল যোগ করতে বলুন।'}
          </p>
          <CoordinatorClassTags classes={coordinatorClasses} />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/50 p-2 rounded-[1.5rem] border border-school-border overflow-x-auto whitespace-nowrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] transition-all',
              tab === t.id ? 'bg-school-blue text-white' : 'text-school-muted hover:bg-white hover:text-school-blue')}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="আমার ক্লাস/সেকশন" value={rows.length} />
            <Stat label="আমার ছাত্র (Active)" value={myStudents.length} />
            <Stat label="চলমান দায়িত্ব" value={activeCount} sub={pendingCount ? `${pendingCount}টি অনুমোদনের অপেক্ষায়` : undefined} />
            <Stat label="কো-অর্ডিনেটর মূল্যায়ন" value={evals.length} />
          </div>
          <div className={card}>
            <h3 className={h}>আমার ক্লাস ও ছাত্রসংখ্যা</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-school-muted text-center py-6">এখনো কোনো ক্লাস দেওয়া হয়নি (Principal → Coordinators / Staff থেকে দায়িত্ব দিলে এখানে দেখাবে)</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {rows.map((r) => (
                  <button key={r.key} onClick={() => setTab('students')} className="text-left p-4 bg-slate-50 rounded-2xl hover:ring-2 ring-school-gold/30">
                    <p className="text-[12px] font-black text-school-blue">{r.label}</p>
                    <p className="text-2xl font-black text-school-blue mt-1">{r.students.length} <span className="text-[11px] text-school-muted">জন</span></p>
                    <p className="text-[10px] font-bold text-school-muted mt-1">{r.kinds.join(', ')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <NotTracked />
        </div>
      )}

      {tab === 'students' && <ErrorBoundary><MyStudentsPanel rows={rows} /></ErrorBoundary>}
      {tab === 'attendance' && <ErrorBoundary><AttendancePanel rows={rows} teacherName={staff?.name ?? ''} /></ErrorBoundary>}
      {tab === 'curriculum' && <ErrorBoundary><CurriculumPanel rows={rows} teacherName={staff?.name ?? ''} /></ErrorBoundary>}

      {tab === 'duties' && (
        <div className={card}>
          <h3 className={h}><BookOpen size={14} className="inline mr-2" />আমার দায়িত্ব</h3>
          <DutyList duties={allDuties} />
        </div>
      )}

      {tab === 'feedback' && (
        <div className={card}>
          <h3 className={h}>আমার উপর কো-অর্ডিনেটর মূল্যায়ন</h3>
          {evals.length === 0 ? (
            <p className="text-sm text-school-muted text-center py-6">এখনো কোনো মূল্যায়ন নেই</p>
          ) : (
            <div className="space-y-2">
              {evals.map((e) => (
                <div key={e.id} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[12px] font-black text-school-blue">{e.date} • {e.className}</p>
                  <p className="text-[10px] font-bold text-school-muted">কো-অর্ডিনেটর: {e.coordinatorName || '—'}{e.principalAction ? ` • Principal: ${actionLabel(e.principalAction)}` : ''}</p>
                  {e.overallNote && <p className="text-[11px] mt-1">{e.overallNote}</p>}
                  {e.principalNote && <p className="text-[11px] mt-1 text-school-blue">Principal নোট: {e.principalNote}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'coordinator' && staff && <CoordinatorHub coordinator={staff} />}
    </div>
  );
}

export const TeacherDashboard = () => (
  <ErrorBoundary>
    <TeacherDashboardInner />
  </ErrorBoundary>
);
