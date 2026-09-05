import React from 'react';
import {
  Bell,
  Building2,
  CalendarRange,
  Landmark,
  Loader2,
  Palette,
  Save,
  Shield,
} from 'lucide-react';
import { getCurrentActor, getCurrentActorLabel } from '../lib/actor';
import { CLASS_OPTIONS } from '../lib/schoolConstants';
import { fetchSchoolSettings, saveSchoolSettings } from '../lib/schoolSettings';
import { AccessControlPanel } from './AccessControlPanel';
import type { SchoolSettings, UserRole } from '../types';

const MONTHS = [
  { id: '01', label: 'January' },
  { id: '02', label: 'February' },
  { id: '03', label: 'March' },
  { id: '04', label: 'April' },
  { id: '05', label: 'May' },
  { id: '06', label: 'June' },
  { id: '07', label: 'July' },
  { id: '08', label: 'August' },
  { id: '09', label: 'September' },
  { id: '10', label: 'October' },
  { id: '11', label: 'November' },
  { id: '12', label: 'December' },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full rounded-2xl border border-school-border px-4 py-3 text-sm font-bold text-school-blue outline-none focus:border-school-gold disabled:bg-slate-50 disabled:text-slate-400';

export function SettingsPanel({ portal }: { portal?: UserRole | null }) {
  const loggedInRole = (localStorage.getItem('userRole') as UserRole) || 'guardian';
  const view = portal || loggedInRole;
  const isSchoolAdminView = view === 'principal' || view === 'super_admin';
  const canEdit = isSchoolAdminView && (loggedInRole === 'principal' || loggedInRole === 'super_admin');
  const canManageAccess = canEdit;
  const actor = getCurrentActor();

  const [settings, setSettings] = React.useState<SchoolSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    fetchSchoolSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Settings load করতে পারিনি।'))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setMessage('');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings || !canEdit) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveSchoolSettings(settings, getCurrentActorLabel());
      setSettings(saved);
      setMessage('School settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings save করতে পারিনি।');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 flex items-center gap-3 text-school-muted font-bold">
        <Loader2 size={18} className="animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Logged in as</p>
        <h2 className="text-2xl font-black text-school-blue uppercase tracking-tight mt-1">
          {actor.name || view}
        </h2>
        <p className="text-sm font-bold text-school-muted mt-1">{actor.email || 'No email on this session'}</p>
        {view === 'accounts' && (
          <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest mt-3">
            Accounts-এর প্রতিটি কাজ এই ID দিয়ে mark হবে
          </p>
        )}
      </div>

      {!isSchoolAdminView && (
        <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-school-blue flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">School on receipts</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">
                Principal Office এই তথ্য বদলায় — এখানে শুধু দেখা যায়
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-school-blue">
            <p><span className="block text-[10px] text-school-muted uppercase tracking-widest mb-1">School</span>{settings.schoolName}</p>
            <p><span className="block text-[10px] text-school-muted uppercase tracking-widest mb-1">Session</span>{settings.sessionLabel || settings.academicYear}</p>
            <p><span className="block text-[10px] text-school-muted uppercase tracking-widest mb-1">Address</span>{settings.address}</p>
            <p><span className="block text-[10px] text-school-muted uppercase tracking-widest mb-1">Currency</span>{settings.currency}</p>
          </div>
        </div>
      )}

      {isSchoolAdminView && (
      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-school-blue flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">School Profile</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">Name, address, EIIN, contact</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="School Name">
              <input disabled={!canEdit} className={inputClass} value={settings.schoolName} onChange={(e) => update('schoolName', e.target.value)} />
            </Field>
            <Field label="Short Name">
              <input disabled={!canEdit} className={inputClass} value={settings.shortName} onChange={(e) => update('shortName', e.target.value)} />
            </Field>
            <Field label="Address">
              <input disabled={!canEdit} className={inputClass} value={settings.address} onChange={(e) => update('address', e.target.value)} />
            </Field>
            <Field label="City">
              <input disabled={!canEdit} className={inputClass} value={settings.city} onChange={(e) => update('city', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input disabled={!canEdit} className={inputClass} value={settings.phone} onChange={(e) => update('phone', e.target.value)} />
            </Field>
            <Field label="School Email">
              <input disabled={!canEdit} type="email" className={inputClass} value={settings.email} onChange={(e) => update('email', e.target.value)} />
            </Field>
            <Field label="Website">
              <input disabled={!canEdit} className={inputClass} value={settings.website} onChange={(e) => update('website', e.target.value)} />
            </Field>
            <Field label="EIIN">
              <input disabled={!canEdit} className={inputClass} value={settings.eiin} onChange={(e) => update('eiin', e.target.value)} />
            </Field>
            <Field label="Principal Name">
              <input disabled={!canEdit} className={inputClass} value={settings.principalName} onChange={(e) => update('principalName', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-school-gold flex items-center justify-center">
              <CalendarRange size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">Academic Session</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">Year shown on receipts, invoices, header</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Academic Year">
              <input disabled={!canEdit} className={inputClass} value={settings.academicYear} onChange={(e) => update('academicYear', e.target.value)} />
            </Field>
            <Field label="Session Label">
              <input disabled={!canEdit} className={inputClass} value={settings.sessionLabel} onChange={(e) => update('sessionLabel', e.target.value)} />
            </Field>
          </div>
          <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest">
            Classes in system: {CLASS_OPTIONS.join(' • ')}
          </p>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">Finance Defaults</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">Currency, fiscal year, receipt footer</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Currency">
              <input disabled={!canEdit} className={inputClass} value={settings.currency} onChange={(e) => update('currency', e.target.value)} />
            </Field>
            <Field label="Fiscal Year Starts">
              <select
                disabled={!canEdit}
                className={inputClass}
                value={settings.fiscalYearStartMonth}
                onChange={(e) => update('fiscalYearStartMonth', e.target.value)}
              >
                {MONTHS.map((month) => (
                  <option key={month.id} value={month.id}>{month.label}</option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Receipt Footer">
                <input disabled={!canEdit} className={inputClass} value={settings.receiptFooter} onChange={(e) => update('receiptFooter', e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">Notifications</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">SMS / email switches for later gateway wiring</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-2xl border border-school-border px-4 py-3">
              <span className="text-xs font-black text-school-blue uppercase tracking-widest">SMS alerts</span>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={settings.smsEnabled}
                onChange={(e) => update('smsEnabled', e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-school-border px-4 py-3">
              <span className="text-xs font-black text-school-blue uppercase tracking-widest">Email notices</span>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={settings.emailNotifyEnabled}
                onChange={(e) => update('emailNotifyEnabled', e.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">Branding</h3>
              <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">
                Receipts use the school logo already configured in the system
              </p>
            </div>
          </div>
        </section>

        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        {message && <p className="text-xs font-bold text-emerald-600">{message}</p>}

        {canEdit ? (
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-school-gold text-school-blue rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        ) : (
          <p className="text-[10px] font-bold text-school-muted uppercase tracking-widest">
            School profile Principal Office edit করতে পারে।
          </p>
        )}
      </form>
      )}

      {canManageAccess && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Shield size={18} className="text-school-gold" />
            <h3 className="text-sm font-black text-school-blue uppercase tracking-tight">Access Control</h3>
          </div>
          <AccessControlPanel />
        </div>
      )}
    </div>
  );
}
