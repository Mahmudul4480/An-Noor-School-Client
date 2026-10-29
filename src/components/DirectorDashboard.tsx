import { Eye } from 'lucide-react';
import { AccountsDashboard } from './AccountsDashboard';

const DIRECTOR_SECTIONS = [
  'overview',
  'students',
  'billing',
  'income',
  'expenses',
  'ledger',
  'report',
  'dayclose',
];

export function DirectorDashboard({ activeSection = 'overview' }: { activeSection?: string }) {
  return (
    <div>
      <div className="mx-6 mt-6 rounded-[2rem] border border-slate-200 bg-slate-900 text-white px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 text-school-gold flex items-center justify-center shrink-0">
          <Eye size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-school-gold">Director · View only</p>
          <p className="text-sm font-bold mt-1">
            Overviews, students, invoices, income, expenses, ledgers, and reports are open. PDF and Excel export stays available.
          </p>
          <p className="text-[11px] font-medium text-white/70 mt-1">
            Creating, editing, deleting, approving, collecting payments, importing, and changing settings are turned off.
          </p>
        </div>
      </div>
      <AccountsDashboard activeSection={activeSection} readOnly sections={DIRECTOR_SECTIONS} />
    </div>
  );
}
