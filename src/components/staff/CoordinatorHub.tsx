import React from 'react';
import { motion } from 'motion/react';
import { Loader2, School, UserRound, X } from 'lucide-react';
import {
  blankEvaluationPoints,
  COORDINATOR_POINTS,
  FOLLOW_OPTIONS,
  LEVEL_OPTIONS,
  fetchCoordinatorEvaluations,
  saveCoordinatorEvaluation,
  summarizePoint,
  type CoordinatorPointDef,
} from '../../lib/coordinator';
import { coordinatorDuties, fetchStaffMembers, teachersUnderClass } from '../../lib/staff';
import type { CoordinatorEvaluation, CoordinatorEvaluationPoint, StaffMember } from '../../types';

const inputClass =
  'w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold';

function updatePoint(
  points: CoordinatorEvaluationPoint[],
  pointId: string,
  patch: Partial<CoordinatorEvaluationPoint>,
): CoordinatorEvaluationPoint[] {
  return points.map((point) => (point.pointId === pointId ? { ...point, ...patch } : point));
}

function PointFields({
  def,
  point,
  onChange,
}: {
  def: CoordinatorPointDef;
  point: CoordinatorEvaluationPoint;
  onChange: (patch: Partial<CoordinatorEvaluationPoint>) => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-school-blue">
        {def.number}. {def.title}
      </p>

      {def.kind === 'count' && (
        <input
          type="number"
          min={0}
          className={inputClass}
          value={point.count ?? ''}
          onChange={(event) => onChange({ count: event.target.value === '' ? undefined : Number(event.target.value) })}
          placeholder="How many"
        />
      )}

      {def.kind === 'count_detail' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={point.count ?? ''}
            onChange={(event) => onChange({ count: event.target.value === '' ? undefined : Number(event.target.value) })}
            placeholder="How many"
          />
          <input
            className={`${inputClass} md:col-span-2`}
            value={point.detail ?? ''}
            onChange={(event) => onChange({ detail: event.target.value })}
            placeholder="What are they?"
          />
        </div>
      )}

      {def.kind === 'follow' && (
        <select className={inputClass} value={point.mark ?? ''} onChange={(event) => onChange({ mark: event.target.value })}>
          <option value="">Select</option>
          {FOLLOW_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      )}

      {def.kind === 'level' && (
        <select className={inputClass} value={point.mark ?? ''} onChange={(event) => onChange({ mark: event.target.value })}>
          <option value="">Select</option>
          {LEVEL_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      )}

      {def.kind === 'behaviour' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(def.subs ?? []).map((sub) => (
            <label key={sub} className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-school-muted">{sub}</span>
              <select
                className={`${inputClass} mt-1`}
                value={point.subMarks?.[sub] ?? ''}
                onChange={(event) =>
                  onChange({ subMarks: { ...(point.subMarks ?? {}), [sub]: event.target.value } })
                }
              >
                <option value="">Select</option>
                {LEVEL_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <textarea
        className={`${inputClass} min-h-[72px]`}
        value={point.note}
        onChange={(event) => onChange({ note: event.target.value })}
        placeholder={def.kind === 'text' ? 'Reason / note' : 'Note'}
      />
    </div>
  );
}

function MarkModal({
  coordinator,
  teacher,
  className,
  existing,
  onClose,
  onSaved,
}: {
  coordinator: StaffMember;
  teacher: StaffMember;
  className: string;
  existing?: CoordinatorEvaluation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [points, setPoints] = React.useState<CoordinatorEvaluationPoint[]>(
    existing?.points?.length ? existing.points : blankEvaluationPoints(),
  );
  const [overallNote, setOverallNote] = React.useState(existing?.overallNote ?? '');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveCoordinatorEvaluation({
        id: existing?.id,
        className,
        teacherId: teacher.id,
        teacherName: teacher.name,
        coordinatorId: coordinator.id,
        coordinatorName: coordinator.name,
        points,
        overallNote,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mark save করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] border border-school-border shadow-2xl p-8 space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-school-muted">{className}</p>
            <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">{teacher.name}</h3>
            <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-1">Coordinator marking</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {COORDINATOR_POINTS.map((def) => {
          const point = points.find((item) => item.pointId === def.id) ?? {
            pointId: def.id,
            note: '',
            mark: '',
            detail: '',
          };
          return (
            <div key={def.id}>
              <PointFields
                def={def}
                point={point}
                onChange={(patch) => setPoints((current) => updatePoint(current, def.id, patch))}
              />
            </div>
          );
        })}

        <textarea
          className={`${inputClass} min-h-[80px]`}
          value={overallNote}
          onChange={(event) => setOverallNote(event.target.value)}
          placeholder="Overall note for Principal"
        />
        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin inline" /> : 'Send to Principal'}
        </button>
      </form>
    </div>
  );
}

export function CoordinatorHub({ coordinator }: { coordinator: StaffMember }) {
  const classes = coordinatorDuties(coordinator).map((duty) => duty.className as string);
  const [className, setClassName] = React.useState(classes[0] || '');
  const [people, setPeople] = React.useState<StaffMember[]>([]);
  const [evaluations, setEvaluations] = React.useState<CoordinatorEvaluation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<StaffMember | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [staff, reports] = await Promise.all([fetchStaffMembers(), fetchCoordinatorEvaluations()]);
      setPeople(staff);
      setEvaluations(reports.filter((item) => item.coordinatorId === coordinator.id));
    } finally {
      setLoading(false);
    }
  }, [coordinator.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!className && classes[0]) setClassName(classes[0]);
  }, [className, classes]);

  const under = teachersUnderClass(people, className, coordinator.id);
  const today = new Date().toISOString().slice(0, 10);
  const existingFor = (teacherId: string) =>
    evaluations.find((item) => item.teacherId === teacherId && item.className === className && item.date === today);

  if (loading) {
    return (
      <div className="py-16 text-center text-school-muted font-bold">
        <Loader2 size={22} className="animate-spin mx-auto mb-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-school-blue rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <School size={28} />
          </div>
          <h4 className="text-2xl font-black text-school-blue">{classes.length}</h4>
          <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Coordinator classes</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-50 text-school-gold rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <UserRound size={28} />
          </div>
          <h4 className="text-2xl font-black text-school-blue">{under.length}</h4>
          <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Teachers under this class</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm text-center">
          <h4 className="text-2xl font-black text-school-blue">{evaluations.length}</h4>
          <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Marks sent to Principal</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Teachers under you</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Nominated points-এ marking ও note দিন — Principal Office দেখবে
            </p>
          </div>
          {classes.length > 1 && (
            <select
              className="rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              {classes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          )}
        </div>

        {under.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-school-muted">
            এই ক্লাসে এখনো class/subject teacher deploy হয়নি। Principal Office Staff Directory থেকে duty দিলে এখানে আসবে।
          </p>
        ) : (
          <div className="space-y-3">
            {under.map((teacher) => {
              const existing = existingFor(teacher.id);
              return (
                <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <p className="font-black text-school-blue uppercase tracking-tight">{teacher.name}</p>
                    <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-1">
                      {teacher.designation}
                      {existing ? ' · Marked today' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(teacher)}
                    className="px-5 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {existing ? 'Update marks' : 'Give marks'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {evaluations.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
          <h3 className="text-lg font-black text-school-blue uppercase tracking-tight mb-4">Recent marks</h3>
          <div className="space-y-3">
            {evaluations.slice(0, 8).map((evaluation) => (
              <div key={evaluation.id} className="p-4 rounded-2xl border border-slate-100">
                <p className="font-black text-school-blue">{evaluation.teacherName} · {evaluation.className}</p>
                <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-1">{evaluation.date}</p>
                <p className="text-xs font-medium text-school-muted mt-2">
                  {COORDINATOR_POINTS.slice(0, 3).map((def) => {
                    const point = evaluation.points.find((item) => item.pointId === def.id);
                    return point ? `${def.number}. ${summarizePoint(def, point)}` : '';
                  }).filter(Boolean).join('  ·  ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <MarkModal
          coordinator={coordinator}
          teacher={selected}
          className={className}
          existing={existingFor(selected.id)}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export function CoordinatorClassTags({ classes }: { classes: string[] }) {
  if (classes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {classes.map((className) => (
        <motion.span
          key={className}
          initial={{ opacity: 0, scale: 0.7, y: 6 }}
          animate={{ opacity: 1, scale: [1, 1.08, 1], y: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-school-gold text-school-blue text-[10px] font-black uppercase tracking-widest shadow-md shadow-amber-500/30"
        >
          <School size={12} />
          Coordinator · {className}
        </motion.span>
      ))}
    </div>
  );
}
