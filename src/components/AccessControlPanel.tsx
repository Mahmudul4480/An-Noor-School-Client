import React from 'react';
import { KeyRound, Loader2, Mail, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { getCurrentActorLabel } from '../lib/actor';
import { sendLoginResetEmail } from '../lib/provisionAuth';
import { fetchStaffAccessList, grantAccountsAccess, revokeStaffAccess, setAccountsLoginPassword } from '../lib/staffAccess';
import type { StaffAccessGrant } from '../types';

export function AccessControlPanel() {
  const [grants, setGrants] = React.useState<StaffAccessGrant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [actingEmail, setActingEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({ email: '', name: '', note: '', password: '' });
  const [issuedPassword, setIssuedPassword] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGrants(await fetchStaffAccessList());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access list load করতে পারিনি।');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleGrant = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const { grant, login } = await grantAccountsAccess(form);
      if (login.status === 'created' || login.status === 'demo') {
        setIssuedPassword(login.password || '');
        setMessage(`${grant.name} (${grant.email}) Accounts পাবে। Password: ${login.password}`);
      } else {
        setIssuedPassword('');
        setMessage(`${grant.email} আগে থেকেই Firebase-এ আছে। নিচে Reset email পাঠান, অথবা আগের password দিয়ে login করুক।`);
      }
      setForm({ email: '', name: '', note: '', password: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access দিতে পারিনি।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (email: string) => {
    setActingEmail(email);
    setError('');
    setMessage('');
    try {
      const grant = await revokeStaffAccess(email);
      setMessage(`${grant.email} এর Accounts access revoke করা হয়েছে।`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke করতে পারিনি।');
    } finally {
      setActingEmail('');
    }
  };

  const active = grants.filter((grant) => grant.status === 'active');
  const revoked = grants.filter((grant) => grant.status === 'revoked');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-school-blue to-blue-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <KeyRound size={48} className="absolute right-8 top-8 opacity-20" />
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Accounts Access</h3>
        <p className="text-xs font-bold opacity-80 uppercase tracking-widest max-w-2xl">
          Principal Office ইমেইল দিয়ে আলাদা আলাদা Accounts dashboard access দেয়। ওই ইমেইল দিয়ে login করলেই Accounts পায়, আর প্রতিটি কাজ সেই ID দিয়ে mark হয়।
        </p>
        <p className="text-[10px] font-bold opacity-70 mt-3">
          Grant করছেন: {getCurrentActorLabel('Principal Office')}
        </p>
      </div>

      <form
        onSubmit={handleGrant}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-school-gold flex items-center justify-center">
            <UserPlus size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">Grant Accounts Access</h4>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">
              Person-এর Firebase login email দিন — password Principal তৈরি করে দিতে হবে
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="fatema@school.com"
              className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Full Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Fatema Begum"
              className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Login password</span>
          <input
            type="text"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="খালি রাখলে system password তৈরি করবে"
            className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold"
          />
        </label>
        {issuedPassword && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Give this password</p>
            <p className="text-lg font-black text-school-blue mt-1 select-all">{issuedPassword}</p>
          </div>
        )}
        <label className="block">
          <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">Note (optional)</span>
          <input
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Cashier / Billing desk"
            className="mt-2 w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold"
          />
        </label>

        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Grant Access
        </button>
      </form>

      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">Granted People</h4>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              {active.length} active • {revoked.length} revoked
            </p>
          </div>
          <ShieldCheck className="text-school-gold" size={20} />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-school-muted text-sm font-bold">
            <Loader2 size={16} className="animate-spin" /> Loading access list…
          </div>
        ) : grants.length === 0 ? (
          <p className="text-sm font-bold text-school-muted">এখনো কাউকে Accounts access দেওয়া হয়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                  <th className="pb-4">Name & Email</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Granted By</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((grant) => (
                  <tr key={grant.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4">
                      <p className="font-black text-school-blue uppercase tracking-tight">{grant.name}</p>
                      <p className="text-school-muted font-bold mt-1">{grant.email}</p>
                      {grant.note && <p className="text-[10px] text-school-muted mt-1">{grant.note}</p>}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          grant.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {grant.status}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-school-muted">
                      {grant.grantedBy}
                      <p className="text-[10px] mt-1">
                        {new Date(grant.grantedAt).toLocaleDateString('en-BD')}
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      {grant.status === 'active' ? (
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            disabled={actingEmail === grant.email}
                            onClick={async () => {
                              setActingEmail(grant.email);
                              setError('');
                              try {
                                const login = await setAccountsLoginPassword(grant.email);
                                if (login.password) {
                                  setIssuedPassword(login.password);
                                  setMessage(`${grant.email} এর নতুন password: ${login.password}`);
                                } else {
                                  await sendLoginResetEmail(grant.email);
                                  setMessage(`${grant.email}-এ password reset email পাঠানো হয়েছে।`);
                                }
                              } catch (err) {
                                try {
                                  await sendLoginResetEmail(grant.email);
                                  setMessage(`${grant.email}-এ password reset email পাঠানো হয়েছে।`);
                                } catch {
                                  setError(err instanceof Error ? err.message : 'Password set করা যায়নি।');
                                }
                              } finally {
                                setActingEmail('');
                              }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-school-blue bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                          >
                            {actingEmail === grant.email ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                            Password
                          </button>
                          <button
                            type="button"
                            disabled={actingEmail === grant.email}
                            onClick={() => handleRevoke(grant.email)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                          >
                            {actingEmail === grant.email ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <UserMinus size={12} />
                            )}
                            Revoke
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Revoked {grant.revokedAt ? new Date(grant.revokedAt).toLocaleDateString('en-BD') : ''}
                        </span>
                      )}
                    </td>
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
