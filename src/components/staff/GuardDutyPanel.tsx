import React from 'react';
import { ShieldCheck, Loader2, X } from 'lucide-react';
import { fetchStaffMembers } from '../../lib/staff';
import { getCurrentActorLabel } from '../../lib/actor';
import { dhakaToday } from '../../lib/utils';
import {
  GUARD_POSTS, GUARD_SHIFTS, assignGuard, endGuardDeployment, fetchGuardDeployments, guardCandidates, guardPostLabel,
  type GuardDeployment,
} from '../../lib/guardDuty';
import type { StaffMember } from '../../types';

const card = 'bg-white rounded-[2rem] p-6 border border-school-border shadow-sm';
const input = 'w-full px-4 py-3 rounded-xl border border-school-border text-sm text-school-blue outline-none';
const bad = 'border-red-500 ring-2 ring-red-200';
type Field = 'guard' | 'post' | 'date';

export function GuardDutyPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [rows, setRows] = React.useState<GuardDeployment[]>([]);
  const [date, setDate] = React.useState(dhakaToday());
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({ staffId: '', post: '', date: dhakaToday(), shift: '', note: '' });
  const [badField, setBadField] = React.useState<Field | null>(null);
  const [popup, setPopup] = React.useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const refs = { guard: React.useRef<HTMLSelectElement>(null), post: React.useRef<HTMLSelectElement>(null), date: React.useRef<HTMLInputElement>(null) };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([fetchStaffMembers(), fetchGuardDeployments(date)]);
      setStaff(s); setRows(r);
    } catch (e) {
      setPopup({ kind: 'error', text: `ডাটা লোড করা যায়নি: ${(e as Error)?.message ?? e}` });
    } finally { setLoading(false); }
  }, [date]);
  React.useEffect(() => { void load(); }, [load]);

  const { people, fallback } = guardCandidates(staff);
  const fail = (f: Field | null, text: string) => {
    setBadField(f); setPopup({ kind: 'error', text });
    if (f) setTimeout(() => refs[f].current?.focus(), 50);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = people.find((p) => p.id === form.staffId);
    if (!person) return fail('guard', 'গার্ড নির্বাচন করুন।');
    if (!form.post) return fail('post', 'ডিউটি পোস্ট (গেট) নির্বাচন করুন।');
    if (!form.date) return fail('date', 'তারিখ দিন।');
    setBusy(true); setBadField(null);
    try {
      const existing = form.date === date ? rows : await fetchGuardDeployments(form.date);
      const rec = await assignGuard({ person, post: form.post, date: form.date, shift: form.shift, note: form.note, actor: getCurrentActorLabel('Principal'), existing });
      setPopup({ kind: 'ok', text: `${rec.staffName} কে ${guardPostLabel(rec.post)}-এ ডিউটি দেওয়া হয়েছে (${rec.assignedTime})।` });
      setForm((f) => ({ ...f, staffId: '', note: '' }));
      setDate(form.date); await load();
    } catch (err) {
      fail(null, `সেভ করা যায়নি: ${(err as Error)?.message ?? err}`);
    } finally { setBusy(false); }
  };

  const end = async (r: GuardDeployment) => {
    if (!window.confirm(`${r.staffName} এর ${guardPostLabel(r.post)} ডিউটি শেষ করবেন?`)) return;
    try { await endGuardDeployment(r.id, getCurrentActorLabel('Principal')); setPopup({ kind: 'ok', text: 'ডিউটি শেষ করা হয়েছে।' }); await load(); }
    catch (err) { fail(null, `ডিউটি শেষ করা যায়নি: ${(err as Error)?.message ?? err}`); }
  };
  const change = (r: GuardDeployment) => {
    setForm({ staffId: r.staffId, post: r.post, date: r.date, shift: r.shift ?? '', note: r.note ?? '' });
    setTimeout(() => refs.post.current?.focus(), 50);
  };

  const active = rows.filter((r) => r.status === 'active');
  return (
    <div className="space-y-6" style={{ fontFamily: "'Anek Bangla', sans-serif" }}>
      {!readOnly && (
        <form onSubmit={submit} className={card}>
          <h3 className="text-sm font-black text-school-blue mb-1 flex items-center gap-2"><ShieldCheck size={18} /> গার্ড ডিউটি দিন</h3>
          <p className="text-xs text-school-muted mb-4">একই দিনে একজন গার্ডকে নতুন গেটে দিলে আগের ডিউটি নিজে থেকেই শেষ হয়ে যাবে।
            {fallback && ' (পদবিতে Guard/Security লেখা কোনো স্টাফ পাওয়া যায়নি, তাই সব সক্রিয় নন-টিচিং স্টাফ দেখানো হচ্ছে।)'}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-xs font-bold text-school-blue">গার্ড *
              <select ref={refs.guard} className={`${input} ${badField === 'guard' ? bad : ''}`} value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
                <option value="">— নির্বাচন করুন —</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.employeeId}) · {p.designation}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-school-blue">ডিউটি পোস্ট *
              <select ref={refs.post} className={`${input} ${badField === 'post' ? bad : ''}`} value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })}>
                <option value="">— গেট নির্বাচন করুন —</option>
                {GUARD_POSTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-school-blue">তারিখ *
              <input ref={refs.date} type="date" className={`${input} ${badField === 'date' ? bad : ''}`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="text-xs font-bold text-school-blue">শিফট / সময় (ঐচ্ছিক)
              <input list="guard-shifts" className={input} value={form.shift} placeholder="যেমন: সকাল ৭টা – দুপুর ২টা" onChange={(e) => setForm({ ...form, shift: e.target.value })} />
              <datalist id="guard-shifts">{GUARD_SHIFTS.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
            <label className="text-xs font-bold text-school-blue md:col-span-2">নোট (ঐচ্ছিক)
              <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
          <button disabled={busy} className="mt-4 px-6 py-3 rounded-xl bg-school-blue text-white text-sm font-black disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} ডিউটি সেভ করুন
          </button>
        </form>
      )}

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-black text-school-blue">কে কোন গেটে আছে ({active.length})</h3>
          <input type="date" className="px-3 py-2 rounded-xl border border-school-border text-xs" value={date} onChange={(e) => setDate(e.target.value || dhakaToday())} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {GUARD_POSTS.map((p) => {
            const here = active.filter((r) => r.post === p.id);
            return (
              <div key={p.id} className={`p-4 rounded-2xl border ${here.length ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-xs font-black text-school-blue">{p.label}</p>
                <p className="text-sm mt-1">{here.length ? here.map((r) => r.staffName).join(', ') : 'কেউ নেই'}</p>
              </div>
            );
          })}
        </div>
        {loading ? <p className="text-center text-sm text-school-muted py-6">লোড হচ্ছে…</p> : rows.length === 0 ? (
          <p className="text-center text-sm text-school-muted py-6">এই তারিখে কোনো ডিউটি নেই</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-xs text-school-blue">
            <thead><tr className="text-left text-school-muted">{['গার্ড', 'পোস্ট', 'শিফট', 'দিয়েছেন', 'সময়', 'অবস্থা', 'নোট', ''].map((x) => <th key={x} className="py-2 px-2">{x}</th>)}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 px-2 font-bold">{r.staffName} <span className="text-school-muted">({r.employeeId})</span></td>
                <td className="py-2 px-2">{guardPostLabel(r.post)}</td>
                <td className="py-2 px-2">{r.shift || '—'}</td>
                <td className="py-2 px-2">{r.assignedBy}</td>
                <td className="py-2 px-2">{r.assignedTime}</td>
                <td className="py-2 px-2">{r.status === 'active' ? <span className="text-emerald-600 font-black">চলমান</span> : <span className="text-slate-400">শেষ {r.endedTime ? `(${r.endedTime})` : ''}</span>}</td>
                <td className="py-2 px-2">{r.note || '—'}</td>
                <td className="py-2 px-2 whitespace-nowrap">{!readOnly && r.status === 'active' && (<>
                  <button type="button" onClick={() => change(r)} className="px-2 py-1 rounded-lg bg-blue-50 font-black mr-1">পরিবর্তন</button>
                  <button type="button" onClick={() => end(r)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 font-black">শেষ করুন</button>
                </>)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {popup && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => setPopup(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4">
              <p className={`text-sm font-bold ${popup.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{popup.kind === 'error' ? '⚠️ ' : '✅ '}{popup.text}</p>
              <button onClick={() => setPopup(null)}><X size={16} /></button>
            </div>
            <button onClick={() => setPopup(null)} className="mt-4 w-full py-2 rounded-xl bg-school-blue text-white text-sm font-black">ঠিক আছে</button>
          </div>
        </div>
      )}
    </div>
  );
}
