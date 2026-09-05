import React from 'react';
import { motion } from 'motion/react';
import { FileDown, Loader2, CalendarRange } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  directorReportFileBase,
  downloadDirectorBriefingPdf,
  getDirectorBriefing,
} from '../../lib/directorReport';
import { getSchoolLogoCircle } from '../../lib/receipts';
import type { DirectorBriefing } from '../../types';
import { DirectorReportSheets } from './DirectorReportSheets';

function ymd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstDayOfMonth(year: number, month: number): string {
  return ymd(new Date(year, month, 1));
}

function lastDayOfMonth(year: number, month: number): string {
  return ymd(new Date(year, month + 1, 0));
}

export function DirectorReportPanel() {
  const now = new Date();
  const [filterMode, setFilterMode] = React.useState<'month' | 'year' | 'custom'>('month');
  const [month, setMonth] = React.useState(now.getMonth());
  const [year, setYear] = React.useState(now.getFullYear());
  const [customFrom, setCustomFrom] = React.useState(firstDayOfMonth(now.getFullYear(), now.getMonth()));
  const [customTo, setCustomTo] = React.useState(ymd(now));
  const [briefing, setBriefing] = React.useState<DirectorBriefing | null>(null);
  const [logo, setLogo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState('');
  const packRef = React.useRef<HTMLDivElement>(null);

  const range = React.useMemo(() => {
    if (filterMode === 'month') {
      return { from: firstDayOfMonth(year, month), to: lastDayOfMonth(year, month) };
    }
    if (filterMode === 'year') {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    return { from: customFrom, to: customTo };
  }, [filterMode, month, year, customFrom, customTo]);

  const loadBriefing = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDirectorBriefing(range.from, range.to, filterMode);
      setBriefing(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generate করতে সমস্যা হয়েছে।');
      return null;
    } finally {
      setLoading(false);
    }
  }, [range, filterMode]);

  React.useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  React.useEffect(() => {
    const reload = () => {
      if (document.visibilityState === 'visible') loadBriefing();
    };
    document.addEventListener('visibilitychange', reload);
    window.addEventListener('focus', reload);
    return () => {
      document.removeEventListener('visibilitychange', reload);
      window.removeEventListener('focus', reload);
    };
  }, [loadBriefing]);

  React.useEffect(() => {
    getSchoolLogoCircle().then(setLogo);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const latest = await getDirectorBriefing(range.from, range.to, filterMode);
      setBriefing(latest);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pack = packRef.current?.querySelector<HTMLElement>('[data-director-pack]');
      if (!pack) throw new Error('Report view ready হয়নি।');
      await downloadDirectorBriefingPdf(pack, directorReportFileBase(latest));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download করতে সমস্যা হয়েছে।');
    } finally {
      setDownloading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-school-border shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">
              Director Meeting Report
            </h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              এখানে নতুন করে কিছু লিখতে হয় না — Principal approve হলেই অটো উঠে
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!briefing || loading || downloading}
              onClick={handleDownload}
              className="px-6 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              {downloading ? 'Preparing PDF' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
            {(['month', 'year', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={cn(
                  'px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                  filterMode === mode ? 'bg-school-blue text-white shadow' : 'text-school-muted hover:text-school-blue',
                )}
              >
                {mode === 'month' ? 'Masik' : mode === 'year' ? 'Batsorik' : 'Custom'}
              </button>
            ))}
          </div>

          {filterMode === 'month' && (
            <>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              />
            </>
          )}

          {filterMode === 'year' && (
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-28 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
            />
          )}

          {filterMode === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              />
              <span className="text-school-muted text-xs font-bold">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              />
            </>
          )}

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-school-muted uppercase tracking-widest">
            <CalendarRange size={14} /> {range.from} → {range.to}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
            {error}
          </div>
        )}

        {loading && !briefing ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue" />
          </div>
        ) : briefing ? (
          <div ref={packRef} className="overflow-x-auto pb-2">
            <DirectorReportSheets briefing={briefing} logo={logo} />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
