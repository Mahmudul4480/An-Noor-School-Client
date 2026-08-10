import React from 'react';
import { motion } from 'motion/react';
import { FileDown, DollarSign, ArrowDownRight, TrendingUp, Percent, Loader2, CalendarRange } from 'lucide-react';
import { cn } from '../../lib/utils';
import { exportSummaryToPdf, getFinancialSummary } from '../../lib/reports';
import type { FinancialSummary } from '../../types';

function firstDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

export function DirectorReportPanel() {
  const now = new Date();
  const [filterMode, setFilterMode] = React.useState<'month' | 'year' | 'custom'>('month');
  const [month, setMonth] = React.useState(now.getMonth());
  const [year, setYear] = React.useState(now.getFullYear());
  const [customFrom, setCustomFrom] = React.useState(firstDayOfMonth(now.getFullYear(), now.getMonth()));
  const [customTo, setCustomTo] = React.useState(now.toISOString().slice(0, 10));
  const [summary, setSummary] = React.useState<FinancialSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const range = React.useMemo(() => {
    if (filterMode === 'month') {
      return { from: firstDayOfMonth(year, month), to: lastDayOfMonth(year, month) };
    }
    if (filterMode === 'year') {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    return { from: customFrom, to: customTo };
  }, [filterMode, month, year, customFrom, customTo]);

  const runReport = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getFinancialSummary(range.from, range.to);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generate করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }, [range]);

  React.useEffect(() => {
    runReport();
  }, [runReport]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Director Financial Report</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Filter by date, month or year — export as PDF
            </p>
          </div>
          <button
            type="button"
            disabled={!summary || loading}
            onClick={() => summary && exportSummaryToPdf(summary)}
            className="px-6 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center gap-2 w-fit"
          >
            <FileDown size={14} /> Export PDF
          </button>
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
                {mode}
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

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue" />
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard label="Total Collections" value={summary.totalCollections} icon={<DollarSign size={20} />} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard label="Discounts Given" value={summary.totalDiscountsGiven} icon={<Percent size={20} />} color="text-school-gold" bg="bg-amber-50" />
              <StatCard label="Total Expenses" value={summary.totalExpenses} icon={<ArrowDownRight size={20} />} color="text-red-500" bg="bg-red-50" />
              <StatCard label="Net Cash Flow" value={summary.netCashFlow} icon={<TrendingUp size={20} />} color="text-school-blue" bg="bg-blue-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">
                  Admissions in Period ({summary.admissionsInRange.length})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0">
                      <tr className="bg-slate-50 text-school-muted font-black uppercase tracking-widest">
                        <th className="p-3">Form</th>
                        <th className="p-3">Student</th>
                        <th className="p-3 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {summary.admissionsInRange.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-school-muted">
                            No admissions
                          </td>
                        </tr>
                      ) : (
                        summary.admissionsInRange.map((a) => (
                          <tr key={a.id}>
                            <td className="p-3 font-bold text-school-blue">{a.formSerial}</td>
                            <td className="p-3">{a.studentName}</td>
                            <td className="p-3 text-right font-black text-emerald-600">৳ {a.grandTotal.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">
                  Expenses in Period ({summary.expensesInRange.length})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0">
                      <tr className="bg-slate-50 text-school-muted font-black uppercase tracking-widest">
                        <th className="p-3">Date</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {summary.expensesInRange.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-school-muted">
                            No expenses
                          </td>
                        </tr>
                      ) : (
                        summary.expensesInRange.map((e) => (
                          <tr key={e.id}>
                            <td className="p-3 font-bold text-school-blue">{e.date.slice(0, 10)}</td>
                            <td className="p-3">{e.category}</td>
                            <td className="p-3 text-right font-black text-red-500">৳ {e.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-3">Account Balances (Current)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summary.accountBalances.map(({ account, balance }) => (
                  <div key={account.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-school-muted uppercase tracking-widest">{account.name}</p>
                    <p className="text-sm font-black text-school-blue mt-1">৳ {balance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-school-border shadow-sm flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', bg, color)}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-school-blue">৳ {value.toLocaleString()}</p>
      </div>
    </div>
  );
}
