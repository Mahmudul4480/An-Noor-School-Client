import React from 'react';
import { X } from 'lucide-react';
import { formatEntryDateTime } from '../../lib/utils';
import {
  assetSummary, incomeExpense, localToday, moneyRows, netLiquidity, uncollectedDues, type PrincipalData,
} from '../../lib/principalOverview';
import { bookValue } from '../../lib/assets';

export type DetailKind = 'money' | 'liquidity' | 'dues' | 'assets';

const tk = (n: number) => `৳ ${Math.round(n).toLocaleString('en-IN')}`;
const monthStart = () => `${localToday().slice(0, 8)}01`;

/** Principal / super_admin only drill-down. Never rendered for Accounts. */
export function PrincipalDetailModal({ kind, data, onClose }: { kind: DetailKind; data: PrincipalData; onClose: () => void }) {
  const [from, setFrom] = React.useState(monthStart());
  const [to, setTo] = React.useState(localToday());
  const [filter, setFilter] = React.useState<'all' | 'income' | 'expense'>('all');

  const title = { money: 'আয় ও ব্যয় বিস্তারিত (Income & Expense)', liquidity: 'একাউন্ট ব্যালেন্স (Net Liquidity)', dues: 'বকেয়া — ছাত্র অনুযায়ী (Uncollected Dues)', assets: 'সম্পদ তালিকা (Assets)' }[kind];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-5xl p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-school-blue uppercase tracking-widest">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        {kind === 'money' && <MoneyView data={data} from={from} to={to} setFrom={setFrom} setTo={setTo} filter={filter} setFilter={setFilter} />}
        {kind === 'liquidity' && <LiquidityView data={data} />}
        {kind === 'dues' && <DuesView data={data} />}
        {kind === 'assets' && <AssetsView data={data} />}
      </div>
    </div>
  );
}

const th = 'text-left text-[10px] font-black uppercase tracking-widest text-school-muted py-2 px-2';
const td = 'py-2 px-2 text-xs text-school-blue';

function MoneyView({ data, from, to, setFrom, setTo, filter, setFilter }: {
  data: PrincipalData; from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void;
  filter: 'all' | 'income' | 'expense'; setFilter: (v: 'all' | 'income' | 'expense') => void;
}) {
  const totals = incomeExpense(data, from, to);
  const rows = moneyRows(data, from, to);
  const shown = rows.filter((r) => filter === 'all' || r.kind === filter);
  const byDay = new Map<string, { income: number; expense: number }>();
  const byCat = new Map<string, { kind: string; amount: number; count: number }>();
  for (const r of rows) {
    const d = byDay.get(r.date) ?? { income: 0, expense: 0 }; d[r.kind] += r.amount; byDay.set(r.date, d);
    const key = `${r.kind}|${r.category}`;
    const c = byCat.get(key) ?? { kind: r.kind, amount: 0, count: 0 }; c.amount += r.amount; c.count += 1; byCat.set(key, c);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-[10px] font-black uppercase text-school-muted">শুরু (From)<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block mt-1 border rounded-xl px-3 py-2 text-xs" /></label>
        <label className="text-[10px] font-black uppercase text-school-muted">শেষ (To)<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block mt-1 border rounded-xl px-3 py-2 text-xs" /></label>
        <button type="button" className="px-3 py-2 text-[10px] font-black rounded-xl bg-slate-100" onClick={() => { setFrom(localToday()); setTo(localToday()); }}>আজ</button>
        <button type="button" className="px-3 py-2 text-[10px] font-black rounded-xl bg-slate-100" onClick={() => { setFrom(monthStart()); setTo(localToday()); }}>এই মাস</button>
        <div className="ml-auto flex gap-4 text-xs font-black">
          <span className="text-emerald-600">আয়: {tk(totals.totalIncome)}</span>
          <span className="text-red-500">ব্যয়: {tk(totals.totalExpense)}</span>
          <span className="text-school-blue">নিট: {tk(totals.totalIncome - totals.totalExpense)}</span>
        </div>
      </div>
      {rows.length === 0 ? <p className="text-sm text-school-muted text-center py-8">এই সময়ে কোনো লেনদেন নেই (No data)</p> : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[11px] font-black uppercase text-school-blue mb-2">দিন অনুযায়ী (Day by day)</h4>
              <table className="w-full"><thead><tr><th className={th}>তারিখ</th><th className={th}>আয়</th><th className={th}>ব্যয়</th></tr></thead>
                <tbody>{[...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([d, v]) => (
                  <tr key={d} className="border-t"><td className={td}>{d}</td><td className={`${td} text-emerald-600`}>{tk(v.income)}</td><td className={`${td} text-red-500`}>{tk(v.expense)}</td></tr>
                ))}</tbody></table>
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase text-school-blue mb-2">খাত অনুযায়ী (By category)</h4>
              <table className="w-full"><thead><tr><th className={th}>খাত</th><th className={th}>ধরন</th><th className={th}>সংখ্যা</th><th className={th}>টাকা</th></tr></thead>
                <tbody>{[...byCat.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([k, v]) => (
                  <tr key={k} className="border-t"><td className={td}>{k.split('|')[1]}</td><td className={td}>{v.kind === 'income' ? 'আয়' : 'ব্যয়'}</td><td className={td}>{v.count}</td><td className={td}>{tk(v.amount)}</td></tr>
                ))}</tbody></table>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-[11px] font-black uppercase text-school-blue">সব এন্ট্রি (All entries)</h4>
              {(['all', 'income', 'expense'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`px-2 py-1 rounded-lg text-[10px] font-black ${filter === f ? 'bg-school-blue text-white' : 'bg-slate-100'}`}>{{ all: 'সব', income: 'আয়', expense: 'ব্যয়' }[f]}</button>
              ))}
            </div>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr>
              <th className={th}>তারিখ ও সময়</th><th className={th}>ধরন</th><th className={th}>খাত</th><th className={th}>বিবরণ</th><th className={th}>একাউন্ট</th><th className={th}>টাকা</th><th className={th}>এন্ট্রি করেছেন</th>
            </tr></thead><tbody>{shown.map((r) => (
              <tr key={`${r.kind}-${r.id}`} className="border-t">
                <td className={td}>{formatEntryDateTime(r.date, r.createdAt)}</td>
                <td className={`${td} ${r.kind === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{r.kind === 'income' ? 'আয়' : 'ব্যয়'}</td>
                <td className={td}>{r.category}</td><td className={td}>{r.description}</td><td className={td}>{r.accountName}</td>
                <td className={`${td} font-black`}>{tk(r.amount)}</td><td className={td}>{r.enteredBy}</td>
              </tr>
            ))}</tbody></table></div>
          </div>
        </>
      )}
    </div>
  );
}

function LiquidityView({ data }: { data: PrincipalData }) {
  const { total, balances } = netLiquidity(data);
  if (balances.length === 0) return <p className="text-sm text-school-muted text-center py-8">কোনো একাউন্ট নেই (No data)</p>;
  return (
    <table className="w-full"><thead><tr><th className={th}>একাউন্ট</th><th className={th}>ধরন</th><th className={th}>শুরুর ব্যালেন্স</th><th className={th}>বর্তমান ব্যালেন্স</th></tr></thead>
      <tbody>{balances.map(({ account, balance }) => (
        <tr key={account.id} className="border-t"><td className={td}>{account.name}</td><td className={td}>{account.type}</td><td className={td}>{tk(account.openingBalance)}</td><td className={`${td} font-black`}>{tk(balance)}</td></tr>
      ))}<tr className="border-t-2"><td className={`${td} font-black`} colSpan={3}>মোট (Total)</td><td className={`${td} font-black`}>{tk(total)}</td></tr></tbody></table>
  );
}

function DuesView({ data }: { data: PrincipalData }) {
  const { total, rows } = uncollectedDues(data);
  if (rows.length === 0) return <p className="text-sm text-school-muted text-center py-8">কোনো বকেয়া নেই (No data)</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className={th}>ছাত্র/ছাত্রী</th><th className={th}>ক্লাস</th><th className={th}>বিল</th><th className={th}>বকেয়া</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.studentId} className="border-t"><td className={td}>{r.studentName}{r.overdue && <span className="ml-2 text-[9px] text-red-500 font-black">OVERDUE</span>}</td><td className={td}>{r.className}</td><td className={td}>{r.items}</td><td className={`${td} font-black`}>{tk(r.due)}</td></tr>
      ))}<tr className="border-t-2"><td className={`${td} font-black`} colSpan={3}>মোট (Total)</td><td className={`${td} font-black`}>{tk(total)}</td></tr></tbody></table></div>
  );
}

function AssetsView({ data }: { data: PrincipalData }) {
  const { count, value } = assetSummary(data);
  if (data.assets.length === 0) return <p className="text-sm text-school-muted text-center py-8">কোনো সম্পদ নেই (No data)</p>;
  return (
    <div className="overflow-x-auto">
      <p className="text-xs font-black text-school-blue mb-3">সক্রিয় সম্পদ: {count} টি • বর্তমান মূল্য: {tk(value)}</p>
      <table className="w-full"><thead><tr><th className={th}>নাম</th><th className={th}>খাত</th><th className={th}>অবস্থান</th><th className={th}>অবস্থা</th><th className={th}>ক্রয়মূল্য</th><th className={th}>বর্তমান মূল্য</th></tr></thead>
        <tbody>{data.assets.map((a) => (
          <tr key={a.id} className="border-t"><td className={td}>{a.name}</td><td className={td}>{a.categoryName}</td><td className={td}>{a.location ?? '—'}</td><td className={td}>{a.status ?? 'active'}</td><td className={td}>{tk(a.purchaseValue)}</td><td className={`${td} font-black`}>{tk(bookValue(a))}</td></tr>
        ))}</tbody></table>
    </div>
  );
}
