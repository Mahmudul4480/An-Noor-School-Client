import React from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { GENDER_OPTIONS } from '../../lib/schoolConstants';
import { ALL_STAFF_CATEGORIES, createStaffHire, fetchPendingHires, trackFromCategory } from '../../lib/staff';
import { StaffDirectoryPanel } from './StaffDirectoryPanel';
import type { StaffDocumentKind, StaffMember } from '../../types';

const inputClass =
  'w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold';

export function StaffHrPanel() {
  const [pending, setPending] = React.useState<StaffMember[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [form, setForm] = React.useState({
    category: ALL_STAFF_CATEGORIES[0],
    designation: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    nid: '',
    address: '',
    fatherName: '',
    education: '',
    experience: '',
    joiningDate: new Date().toISOString().slice(0, 10),
  });
  const [photo, setPhoto] = React.useState<File | undefined>();
  const [cv, setCv] = React.useState<File | undefined>();
  const [appointment, setAppointment] = React.useState<File | undefined>();
  const [extraDoc, setExtraDoc] = React.useState<File | undefined>();

  const loadPending = React.useCallback(async () => {
    setPending(await fetchPendingHires());
  }, []);

  React.useEffect(() => {
    loadPending();
  }, [loadPending, refreshKey]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleHire = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const documents: { kind: StaffDocumentKind; file: File }[] = [];
      if (cv) documents.push({ kind: 'cv', file: cv });
      if (appointment) documents.push({ kind: 'appointment', file: appointment });
      if (extraDoc) documents.push({ kind: 'other', file: extraDoc });

      const person = await createStaffHire({
        ...form,
        photo,
        documents,
      });
      setMessage(`${person.name} (${person.employeeId}) Principal approval-এ পাঠানো হয়েছে।`);
      setForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        phone: '',
        nid: '',
        address: '',
        fatherName: '',
        education: '',
        experience: '',
        designation: '',
      }));
      setPhoto(undefined);
      setCv(undefined);
      setAppointment(undefined);
      setExtraDoc(undefined);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hire request পাঠানো যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-school-blue to-blue-900 text-white rounded-[2.5rem] p-8">
        <h3 className="text-2xl font-black uppercase tracking-tight">Staff & Teacher Hiring</h3>
        <p className="text-xs font-bold opacity-80 uppercase tracking-widest max-w-2xl mt-2">
          Accounts সব staff category ও teacher নিয়োগ দেয়। Principal approve করলে Teachers / Staff লিস্টে onboard হবে।
        </p>
      </div>

      <form onSubmit={handleHire} className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-school-gold flex items-center justify-center">
            <UserPlus size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">New hire</h4>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">
              {trackFromCategory(form.category) === 'teacher' ? 'Teacher track' : 'Staff track'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Category</span>
            <select required className={`${inputClass} mt-2`} value={form.category} onChange={(event) => update('category', event.target.value)}>
              {ALL_STAFF_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Designation</span>
            <input className={`${inputClass} mt-2`} value={form.designation} onChange={(event) => update('designation', event.target.value)} placeholder="Same as category if empty" />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Full name</span>
            <input required className={`${inputClass} mt-2`} value={form.name} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Phone</span>
            <input required className={`${inputClass} mt-2`} value={form.phone} onChange={(event) => update('phone', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Email</span>
            <input type="email" className={`${inputClass} mt-2`} value={form.email} onChange={(event) => update('email', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Gender</span>
            <select className={`${inputClass} mt-2`} value={form.gender} onChange={(event) => update('gender', event.target.value)}>
              <option value="">Select</option>
              {GENDER_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Date of birth</span>
            <input type="date" className={`${inputClass} mt-2`} value={form.dob} onChange={(event) => update('dob', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">NID</span>
            <input className={`${inputClass} mt-2`} value={form.nid} onChange={(event) => update('nid', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Joining date</span>
            <input type="date" required className={`${inputClass} mt-2`} value={form.joiningDate} onChange={(event) => update('joiningDate', event.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Father's name</span>
            <input className={`${inputClass} mt-2`} value={form.fatherName} onChange={(event) => update('fatherName', event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Address</span>
            <input className={`${inputClass} mt-2`} value={form.address} onChange={(event) => update('address', event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Education</span>
            <input className={`${inputClass} mt-2`} value={form.education} onChange={(event) => update('education', event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Experience</span>
            <input className={`${inputClass} mt-2`} value={form.experience} onChange={(event) => update('experience', event.target.value)} />
          </label>
          <FileField label="Photo" onChange={setPhoto} accept="image/*" />
          <FileField label="CV" onChange={setCv} />
          <FileField label="Appointment / hire document" onChange={setAppointment} />
          <FileField label="Other document" onChange={setExtraDoc} />
        </div>

        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin inline" /> : 'Send hire for approval'}
        </button>
      </form>

      {pending.length > 0 && (
        <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100">
          <h4 className="text-sm font-black text-school-blue uppercase tracking-tight mb-4">
            Waiting for Principal ({pending.length})
          </h4>
          <div className="space-y-2">
            {pending.map((person) => (
              <p key={person.id} className="text-sm font-bold text-school-blue">
                {person.name} • {person.category} • {person.employeeId}
              </p>
            ))}
          </div>
        </div>
      )}

      <StaffDirectoryPanel viewer="accounts" reloadToken={refreshKey} />
    </div>
  );
}

function FileField({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept?: string;
  onChange: (file?: File) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</span>
      <input
        type="file"
        accept={accept}
        className={`${inputClass} mt-2`}
        onChange={(event) => onChange(event.target.files?.[0])}
      />
    </label>
  );
}
