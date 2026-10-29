import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../../lib/firebase';
import {
  assetSummary, dayOf, enrollment, fetchPrincipalData, incomeExpense, localToday, moneyRows, netLiquidity, uncollectedDues, type PrincipalData,
} from '../../lib/principalOverview';
import { fetchStaffMembers } from '../../lib/staff';
import { computeInventoryStats, fetchInventoryItems, fetchInventoryLots, fetchInventoryMovements, findLowStockItems } from '../../lib/inventory';
import { fetchApprovalStats } from '../../lib/approvals';
import { fetchPendingDayCloses } from '../../lib/dayClose';
import type { StaffMember } from '../../types';

const tk = (n: number) => `৳ ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const card = 'bg-white rounded-[2rem] p-6 border border-school-border shadow-sm';
const h = 'text-xs font-black text-school-blue uppercase tracking-widest mb-4';
const th = 'text-left text-[10px] font-black uppercase tracking-widest text-school-muted py-2 px-2';
const td = 'py-2 px-2 text-xs text-school-blue';

function useLoad<T>(fn: () => Promise<T>): { data: T | null; error: string | null } {
  const [state, setState] = React.useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  React.useEffect(() => { fn().then((data) => setState({ data, error: null })).catch((e) => setState({ data: null, error: String(e?.message ?? e) })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
const Loading = ({ error }: { error?: string | null }) => (
  <p className="p-10 text-center text-sm text-school-muted">{error ? `ডাটা লোড করা যায়নি: ${error}` : 'লোড হচ্ছে…'}</p>
);
const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className={card}>
    <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-1">{label}</p>
    <h4 className={`font-black tracking-tight ${value === 'Not tracked yet' ? 'text-slate-400 text-lg' : 'text-school-blue text-2xl'}`}>{value}</h4>
    {sub && <p className="text-[10px] font-bold text-school-muted mt-1">{sub}</p>}
  </div>
);
const NoData = () => <p className="text-sm text-school-muted text-center py-8">No data</p>;
const NotTracked = ({ items }: { items: string[] }) => (
  <div className={card}>
    <h3 className={h}>এখনো ট্র্যাক করা হয় না</h3>
    <div className="space-y-2">{items.map((i) => (
      <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-[11px] font-black text-school-blue"><span>{i}</span><span className="text-slate-400">Not tracked yet</span></div>
    ))}</div>
  </div>
);

/* ---------------- Analytics ---------------- */
export function PrincipalAnalyticsPage() {
  const { data, error } = useLoad(fetchPrincipalData);
  if (!data) return <Loading error={error} />;
  const today = localToday();
  const monthFrom = `${today.slice(0, 8)}01`;
  const month = incomeExpense(data, monthFrom, today);
  const rows = moneyRows(data, monthFrom, today);
  const cats = (kind: 'income' | 'expense') => {
    const m = new Map<string, number>();
    rows.filter((r) => r.kind === kind).forEach((r) => m.set(r.category, (m.get(r.category) ?? 0) + r.amount));
    return [...m.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  };
  const trend: { month: string; income: number; expense: number }[] = [];
  const base = new Date(`${today.slice(0, 7)}-01T00:00:00`);
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const r = incomeExpense(data, `${ym}-01`, `${ym}-31`);
    trend.push({ month: ym, income: r.totalIncome, expense: r.totalExpense });
  }
  const dues = uncollectedDues(data);
  const billed = data.invoices.filter((i) => i.status !== 'cancelled' as string);
  const billedTotal = billed.reduce((s, i) => s + i.totalAmount, 0);
  const collected = billed.reduce((s, i) => s + i.paidAmount, 0);
  const enroll = enrollment(data);
  const admMonth = data.admissions.filter((a) => dayOf((a as { admissionDate?: unknown }).admissionDate ?? a.createdAt).slice(0, 7) === today.slice(0, 7));
  const income = cats('income'); const expense = cats('expense');
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="এই মাসের আয়" value={tk(month.totalIncome)} />
        <Stat label="এই মাসের ব্যয়" value={tk(month.totalExpense)} sub={`নিট ${tk(month.totalIncome - month.totalExpense)}`} />
        <Stat label="বিল আদায়ের হার (Collection rate)" value={billedTotal ? `${Math.round((collected / billedTotal) * 100)}%` : 'No data'} sub={`${tk(collected)} / ${tk(billedTotal)}`} />
        <Stat label="আদায় বাকি" value={tk(dues.total)} sub={`${dues.rows.length} জন • ${dues.rows.filter((r) => r.overdue).length} overdue`} />
        <Stat label="সক্রিয় ছাত্র/ছাত্রী" value={String(enroll.count)} />
        <Stat label="এই মাসের ভর্তি" value={String(admMonth.length)} sub={`মোট ভর্তি আবেদন ${data.admissions.length}`} />
        <Stat label="Academic results" value="Not tracked yet" />
        <Stat label="Student attendance" value="Not tracked yet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${card} h-[340px]`}>
          <h3 className={h}>আয় বনাম ব্যয় — শেষ ৬ মাস</h3>
          {trend.every((t) => !t.income && !t.expense) ? <NoData /> : (
            <ResponsiveContainer width="100%" height="85%"><LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} /><Tooltip formatter={(v: number) => tk(v)} />
              <Line dataKey="income" name="আয়" stroke="#1E3A8A" strokeWidth={3} /><Line dataKey="expense" name="ব্যয়" stroke="#FBBF24" strokeWidth={3} />
            </LineChart></ResponsiveContainer>
          )}
        </div>
        <div className={`${card} h-[340px]`}>
          <h3 className={h}>ক্লাস অনুযায়ী ছাত্র/ছাত্রী</h3>
          {enroll.byClass.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height="85%"><BarChart data={enroll.byClass}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} /><YAxis allowDecimals={false} fontSize={10} /><Tooltip />
              <Bar dataKey="students" name="ছাত্র" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
            </BarChart></ResponsiveContainer>
          )}
        </div>
        {([['এই মাসে আয় — খাত অনুযায়ী', income], ['এই মাসে ব্যয় — খাত অনুযায়ী', expense]] as const).map(([title, list]) => (
          <div key={title} className={card}>
            <h3 className={h}>{title}</h3>
            {list.length === 0 ? <NoData /> : (
              <table className="w-full"><tbody>{list.map((c) => (
                <tr key={c.name} className="border-t"><td className={td}>{c.name}</td><td className={`${td} text-right font-black`}>{tk(c.amount)}</td></tr>
              ))}</tbody></table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Staff ---------------- */
interface LoginUser { id: string; role?: string; email?: string; name?: string }
async function loadStaff() {
  const [staff, users] = await Promise.all([
    fetchStaffMembers().catch(() => [] as StaffMember[]),
    getDocs(collection(db, 'users')).then((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LoginUser, 'id'>) }))).catch(() => [] as LoginUser[]),
  ]);
  return { staff, users };
}
const STATUS_BN: Record<string, string> = { active: 'সক্রিয়', pending_approval: 'অনুমোদনের অপেক্ষায়', rejected: 'বাতিল', inactive: 'নিষ্ক্রিয়' };

export function PrincipalStaffPage() {
  const { data, error } = useLoad(loadStaff);
  if (!data) return <Loading error={error} />;
  const { staff, users } = data;
  const count = (f: (s: StaffMember) => boolean) => staff.filter(f).length;
  const roles = new Map<string, number>();
  users.forEach((u) => roles.set(u.role ?? 'unknown', (roles.get(u.role ?? 'unknown') ?? 0) + 1));
  const pendingDuties = staff.reduce((s, m) => s + (Array.isArray(m.duties) ? m.duties.filter((d) => (d as { status?: string }).status === 'pending_approval').length : 0), 0);
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="সক্রিয় শিক্ষক" value={String(count((s) => s.status === 'active' && s.track === 'teacher'))} />
        <Stat label="সক্রিয় স্টাফ" value={String(count((s) => s.status === 'active' && s.track === 'staff'))} />
        <Stat label="নিয়োগ অনুমোদনের অপেক্ষায়" value={String(count((s) => s.status === 'pending_approval'))} />
        <Stat label="দায়িত্ব অনুমোদনের অপেক্ষায়" value={String(pendingDuties)} />
        <Stat label="লগইন একাউন্ট (users)" value={String(users.length)} sub={[...roles.entries()].map(([r, n]) => `${r}: ${n}`).join(' • ') || undefined} />
        <Stat label="Staff KPI" value="Not tracked yet" />
        <Stat label="Staff attendance" value="Not tracked yet" />
        <Stat label="Leave / Payroll" value="Not tracked yet" />
      </div>
      <div className={card}>
        <h3 className={h}>স্টাফ তালিকা ({staff.length})</h3>
        {staff.length === 0 ? <NoData /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr>
            <th className={th}>নাম</th><th className={th}>পদবি</th><th className={th}>ধরন</th><th className={th}>অবস্থা</th><th className={th}>যোগদান</th><th className={th}>দায়িত্ব</th>
          </tr></thead><tbody>{staff.map((s) => (
            <tr key={s.id} className="border-t">
              <td className={td}>{s.name || '—'}</td><td className={td}>{s.designation || '—'}</td>
              <td className={td}>{s.track === 'teacher' ? 'শিক্ষক' : 'স্টাফ'}</td><td className={td}>{STATUS_BN[s.status] ?? s.status ?? '—'}</td>
              <td className={td}>{typeof s.joiningDate === 'string' ? s.joiningDate : '—'}</td><td className={td}>{Array.isArray(s.duties) ? s.duties.length : 0}</td>
            </tr>
          ))}</tbody></table></div>
        )}
      </div>
    </div>
  );
}

/* ---------------- School Ops ---------------- */
async function loadOps() {
  const [data, items, movements, lots, approvals, dayCloses] = await Promise.all([
    fetchPrincipalData(),
    fetchInventoryItems().catch(() => []),
    fetchInventoryMovements().catch(() => []),
    fetchInventoryLots().catch(() => []),
    fetchApprovalStats('principal').catch(() => null),
    fetchPendingDayCloses().catch(() => []),
  ]);
  return { data, items, movements, lots, approvals, dayCloses };
}

export function PrincipalOpsPage() {
  const { data: d, error } = useLoad(loadOps);
  if (!d) return <Loading error={error} />;
  const data: PrincipalData = d.data;
  let inv: ReturnType<typeof computeInventoryStats> | null = null;
  let low: ReturnType<typeof findLowStockItems> = [];
  try { inv = computeInventoryStats(d.items, d.movements, d.lots); low = findLowStockItems(d.items); } catch { inv = null; }
  const assets = assetSummary(data);
  const byCat = new Map<string, { count: number; value: number }>();
  assets.active.forEach((a) => { const c = byCat.get(a.categoryName) ?? { count: 0, value: 0 }; c.count += 1; c.value += Number(a.currentValue ?? a.purchaseValue) || 0; byCat.set(a.categoryName, c); });
  const liq = netLiquidity(data);
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="অনুমোদনের অপেক্ষায় (Principal)" value={d.approvals ? String(d.approvals.actionableCount) : 'No data'} />
        <Stat label="Day Close অনুমোদন বাকি" value={String(d.dayCloses.length)} />
        <Stat label="নেট লিকুইডিটি" value={tk(liq.total)} sub={`${liq.balances.length} একাউন্ট`} />
        <Stat label="সম্পদ (সক্রিয়)" value={tk(assets.value)} sub={`${assets.count} টি`} />
        <Stat label="ইনভেন্টরি আইটেম" value={inv ? String(inv.itemCount) : 'No data'} sub={inv ? `স্টক মূল্য ${tk(inv.stockValue)}` : undefined} />
        <Stat label="কম স্টক" value={String(low.length)} />
        <Stat label="এই মাসে ইনভেন্টরি বিক্রি" value={inv ? tk(inv.monthSaleAmount) : 'No data'} sub={inv ? `${inv.monthSaleQty} পিস` : undefined} />
        <Stat label="Transport / Maintenance" value="Not tracked yet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className={h}>কম স্টক আইটেম</h3>
          {low.length === 0 ? <NoData /> : (
            <table className="w-full"><thead><tr><th className={th}>আইটেম</th><th className={th}>বাকি</th><th className={th}>ঘাটতি</th></tr></thead>
              <tbody>{low.map((l) => <tr key={l.item.id} className="border-t"><td className={td}>{l.item.name}</td><td className={td}>{l.remaining} {l.item.unit}</td><td className={`${td} text-red-500`}>{l.shortBy}</td></tr>)}</tbody></table>
          )}
        </div>
        <div className={card}>
          <h3 className={h}>সম্পদ — খাত অনুযায়ী</h3>
          {byCat.size === 0 ? <NoData /> : (
            <table className="w-full"><tbody>{[...byCat.entries()].map(([k, v]) => (
              <tr key={k} className="border-t"><td className={td}>{k}</td><td className={td}>{v.count} টি</td><td className={`${td} text-right font-black`}>{tk(v.value)}</td></tr>
            ))}</tbody></table>
          )}
        </div>
        <div className={card}>
          <h3 className={h}>একাউন্ট ব্যালেন্স</h3>
          {liq.balances.length === 0 ? <NoData /> : (
            <table className="w-full"><tbody>{liq.balances.map(({ account, balance }) => (
              <tr key={account.id} className="border-t"><td className={td}>{account.name}</td><td className={`${td} text-right font-black`}>{tk(balance)}</td></tr>
            ))}</tbody></table>
          )}
        </div>
        <NotTracked items={['Transport', 'Maintenance requests', 'Facility / room booking']} />
      </div>
    </div>
  );
}
