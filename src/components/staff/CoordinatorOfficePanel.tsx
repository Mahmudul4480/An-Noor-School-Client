import React from 'react';
import { Loader2, School } from 'lucide-react';
import { CLASS_OPTIONS } from '../../lib/schoolConstants';
import { getCurrentActorLabel } from '../../lib/actor';
import {
  actionLabel,
  COORDINATOR_POINTS,
  PRINCIPAL_ACTIONS,
  fetchCoordinatorEvaluations,
  reviewCoordinatorEvaluation,
  summarizePoint,
} from '../../lib/coordinator';
import {
  assignDutyDirect,
  coordinatorByClass,
  fetchStaffMembers,
} from '../../lib/staff';
import type { CoordinatorEvaluation, CoordinatorPrincipalAction, StaffMember } from '../../types';

export function CoordinatorOfficePanel() {
  const [people, setPeople] = React.useState<StaffMember[]>([]);
  const [evaluations, setEvaluations] = React.useState<CoordinatorEvaluation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [className, setClassName] = React.useState(CLASS_OPTIONS[0]);
  const [teacherId, setTeacherId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<CoordinatorPrincipalAction>('noted');
  const [actionNote, setActionNote] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [staff, reports] = await Promise.all([fetchStaffMembers(), fetchCoordinatorEvaluations()]);
      setPeople(staff);
      setEvaluations(reports);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const teachers = React.useMemo(
    () => people.filter((person) => person.track === 'teacher' && person.status === 'active'),
    [people],
  );
  const assigned = coordinatorByClass(people);
  const currentForClass = assigned.find((row) => row.className === className);

  React.useEffect(() => {
    if (!teacherId && teachers[0]) setTeacherId(teachers[0].id);
  }, [teacherId, teachers]);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    const person = people.find((item) => item.id === teacherId);
    if (!person) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await assignDutyDirect({
        person,
        kind: 'coordinator',
        className,
        actorName: getCurrentActorLabel('Principal Office'),
      });
      setMessage(`${person.name} is now Class Coordinator for ${className}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coordinator assign করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (evaluation: CoordinatorEvaluation) => {
    setBusy(true);
    setError('');
    try {
      await reviewCoordinatorEvaluation({ evaluation, action, note: actionNote });
      setActionNote('');
      setOpenId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action save করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-school-muted font-bold">
        <Loader2 size={22} className="animate-spin mx-auto mb-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Class Coordinators</h3>
        <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
          যেকোনো teacher-কে ক্লাস অনুযায়ী coordinator select করুন
        </p>

        <form onSubmit={handleAssign} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Class</span>
            <select
              className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              {CLASS_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Teacher</span>
            <select
              className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
            >
              {teachers.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy || teachers.length === 0}
              className="w-full px-6 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin inline" /> : 'Assign Coordinator'}
            </button>
          </div>
        </form>
        {currentForClass && (
          <p className="mt-3 text-xs font-bold text-school-blue">
            Current: {currentForClass.person.name} · {className}
          </p>
        )}
        {error && <p className="mt-3 text-xs font-bold text-red-500">{error}</p>}
        {message && <p className="mt-3 text-xs font-bold text-emerald-600">{message}</p>}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CLASS_OPTIONS.map((item) => {
            const row = assigned.find((entry) => entry.className === item);
            return (
              <div key={item} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-school-blue flex items-center justify-center">
                  <School size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-school-muted">{item}</p>
                  <p className="text-sm font-black text-school-blue">{row ? row.person.name : 'Not assigned'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Coordinator Marks</h3>
        <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
          Coordinator যে marking ও note দিয়েছেন — এখান থেকে ব্যবস্থা নিন
        </p>

        {evaluations.length === 0 ? (
          <p className="py-10 text-center text-sm font-bold text-school-muted">এখনো কোনো coordinator report আসেনি।</p>
        ) : (
          <div className="mt-6 space-y-4">
            {evaluations.map((evaluation) => {
              const open = openId === evaluation.id;
              return (
                <div key={evaluation.id} className="rounded-[2rem] border border-slate-100 p-5">
                  <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : evaluation.id)}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-school-blue uppercase tracking-tight">{evaluation.teacherName}</p>
                        <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-1">
                          {evaluation.className} · by {evaluation.coordinatorName} · {evaluation.date}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        evaluation.principalAction ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-school-gold'
                      }`}>
                        {actionLabel(evaluation.principalAction)}
                      </span>
                    </div>
                    {evaluation.overallNote && (
                      <p className="mt-3 text-sm font-bold text-school-blue">{evaluation.overallNote}</p>
                    )}
                  </button>

                  {open && (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      {COORDINATOR_POINTS.map((def) => {
                        const point = evaluation.points.find((item) => item.pointId === def.id);
                        if (!point) return null;
                        return (
                          <div key={def.id} className="text-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-school-muted">
                              {def.number}. {def.title}
                            </p>
                            <p className="font-bold text-school-blue mt-1">{summarizePoint(def, point)}</p>
                            {point.note && <p className="text-xs font-medium text-school-muted mt-1">{point.note}</p>}
                          </div>
                        );
                      })}

                      {evaluation.principalNote && (
                        <p className="text-xs font-bold text-school-blue bg-blue-50 rounded-xl p-3">
                          Principal: {evaluation.principalNote}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <select
                          className="rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue"
                          value={action}
                          onChange={(event) => setAction(event.target.value as CoordinatorPrincipalAction)}
                        >
                          {PRINCIPAL_ACTIONS.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                        <input
                          className="md:col-span-2 rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue"
                          value={actionNote}
                          onChange={(event) => setActionNote(event.target.value)}
                          placeholder="Action note"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReview(evaluation)}
                        className="px-5 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                      >
                        Save action
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
