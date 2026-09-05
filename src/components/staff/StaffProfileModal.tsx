import React from 'react';
import { FileText, Loader2, UserRound, X } from 'lucide-react';
import { CLASS_OPTIONS } from '../../lib/schoolConstants';
import { getCurrentActorLabel } from '../../lib/actor';
import {
  activeDuties,
  assignDutyDirect,
  DUTY_OPTIONS,
  requestDutyAssignment,
  statusLabel,
} from '../../lib/staff';
import type { DutyKind, StaffMember } from '../../types';

const inputClass =
  'w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold';

export function StaffProfileModal({
  person,
  viewer,
  onClose,
  onChanged,
}: {
  person: StaffMember;
  viewer: 'accounts' | 'principal';
  onClose: () => void;
  onChanged: () => void;
}) {
  const [kind, setKind] = React.useState<DutyKind>('class_teacher');
  const [className, setClassName] = React.useState(CLASS_OPTIONS[0]);
  const [section, setSection] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const needsClass = DUTY_OPTIONS.find((item) => item.id === kind)?.needsClass;

  const handleDeploy = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (viewer === 'principal') {
        await assignDutyDirect({
          person,
          kind,
          className: needsClass ? className : undefined,
          section: needsClass ? section : undefined,
          note,
          actorName: getCurrentActorLabel('Principal Office'),
        });
        setMessage('Duty deploy করা হয়েছে।');
      } else {
        await requestDutyAssignment({
          person,
          kind,
          className: needsClass ? className : undefined,
          section: needsClass ? section : undefined,
          note,
        });
        setMessage('Duty request Principal approval-এ পাঠানো হয়েছে।');
      }
      setNote('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duty save করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const duties = person.duties;
  const live = activeDuties(person);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] border border-school-border shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-8 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="w-24 h-28 object-cover rounded-2xl border border-school-border" />
            ) : (
              <div className="w-24 h-28 rounded-2xl bg-slate-100 text-school-muted flex items-center justify-center">
                <UserRound size={36} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{person.employeeId}</p>
              <h3 className="text-2xl font-black text-school-blue uppercase tracking-tight">{person.name}</h3>
              <p className="text-xs font-bold text-school-muted uppercase tracking-widest mt-1">
                {person.designation} • {person.category}
              </p>
              <span className="inline-block mt-3 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                {statusLabel(person.status)}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-school-blue">
          <Info label="Phone" value={person.phone} />
          <Info label="Email" value={person.email || '—'} />
          <Info label="Gender" value={person.gender || '—'} />
          <Info label="Date of birth" value={person.dob || '—'} />
          <Info label="NID" value={person.nid || '—'} />
          <Info label="Joining date" value={person.joiningDate} />
          <Info label="Father" value={person.fatherName || '—'} />
          <Info label="Address" value={person.address || '—'} />
          <div className="md:col-span-2"><Info label="Education" value={person.education || '—'} /></div>
          <div className="md:col-span-2"><Info label="Experience" value={person.experience || '—'} /></div>
          <Info label="Hired by" value={person.createdBy} />
          <Info label="Approved by" value={person.reviewedBy || '—'} />
        </div>

        <section className="px-8 pb-6">
          <h4 className="text-xs font-black text-school-blue uppercase tracking-widest mb-3">CV & hire documents</h4>
          {person.documents.length === 0 ? (
            <p className="text-sm font-bold text-school-muted">কোনো document upload হয়নি।</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {person.documents.map((document) => (
                <a
                  key={document.id}
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl border border-school-border hover:border-school-gold"
                >
                  <FileText size={18} className="text-school-gold" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-school-muted">{document.kind}</p>
                    <p className="text-sm font-bold text-school-blue">{document.name}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="px-8 pb-6">
          <h4 className="text-xs font-black text-school-blue uppercase tracking-widest mb-3">Current duties</h4>
          {live.length === 0 ? (
            <p className="text-sm font-bold text-school-muted">এখনো কোনো active duty নেই।</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {live.map((duty) => (
                <span key={duty.id} className="px-3 py-1.5 rounded-xl bg-blue-50 text-school-blue text-[10px] font-black uppercase tracking-widest">
                  {duty.title}
                </span>
              ))}
            </div>
          )}
          {duties.some((duty) => duty.status === 'pending') && (
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-3">
              {duties.filter((duty) => duty.status === 'pending').length} duty Principal approval-এ আছে
            </p>
          )}
        </section>

        {person.status === 'active' && (
          <form onSubmit={handleDeploy} className="px-8 pb-8 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-black text-school-blue uppercase tracking-widest">
              {viewer === 'principal' ? 'Deploy duty' : 'Request duty (Principal approval)'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Duty</span>
                <select className={`${inputClass} mt-2`} value={kind} onChange={(event) => setKind(event.target.value as DutyKind)}>
                  {DUTY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              {needsClass && (
                <label className="block">
                  <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Class</span>
                  <select className={`${inputClass} mt-2`} value={className} onChange={(event) => setClassName(event.target.value)}>
                    {CLASS_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              )}
              {needsClass && (
                <label className="block">
                  <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Section</span>
                  <input className={`${inputClass} mt-2`} value={section} onChange={(event) => setSection(event.target.value)} placeholder="A" />
                </label>
              )}
              <label className="block md:col-span-2">
                <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Note</span>
                <input className={`${inputClass} mt-2`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
              </label>
            </div>
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin inline" /> : viewer === 'principal' ? 'Deploy now' : 'Send for approval'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-[10px] text-school-muted uppercase tracking-widest mb-1">{label}</span>
      {value}
    </p>
  );
}
