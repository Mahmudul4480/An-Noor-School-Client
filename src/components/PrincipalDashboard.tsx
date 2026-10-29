import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  BarChart3, 
  LayoutGrid,
  BellRing,
  Award,
  Zap,
  ArrowUpRight,
  UserCheck,
  School,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';
import { ApprovalsPanel } from './accounts/ApprovalsPanel';
import { AccessControlPanel } from './AccessControlPanel';
import { CoordinatorOfficePanel } from './staff/CoordinatorOfficePanel';
import { StaffDirectoryPanel } from './staff/StaffDirectoryPanel';
import { LowStockAlertCard } from './LowStockAlertCard';
import { fetchApprovalStats } from '../lib/approvals';
import { getCurrentActorLabel } from '../lib/actor';
import { ErrorBoundary } from './ErrorBoundary';
import { PrincipalDetailModal, type DetailKind } from './principal/PrincipalDetailModal';
import {
  assetSummary, enrollment, fetchPrincipalData, incomeExpense, localToday, netLiquidity, uncollectedDues, type PrincipalData,
} from '../lib/principalOverview';

const tk = (n: number) => `৳ ${Math.round(n).toLocaleString('en-IN')}`;
const BAR_COLORS = ['#1E3A8A', '#FBBF24'];


export const PrincipalDashboard = () => (
  <ErrorBoundary label="PrincipalDashboard">
    <PrincipalDashboardInner />
  </ErrorBoundary>
);

const PrincipalDashboardInner = () => {
  const [activeSubTab, setActiveSubTab] = React.useState('overview');
  const [pendingCount, setPendingCount] = React.useState(0);
  const [data, setData] = React.useState<PrincipalData | null>(null);
  const [detail, setDetail] = React.useState<DetailKind | null>(null);
  // Drill-down is Principal / super_admin only — Accounts never sees it.
  const role = localStorage.getItem('userRole');
  const canDrill = role === 'principal' || role === 'super_admin';

  React.useEffect(() => {
    fetchPrincipalData().then(setData).catch(() => setData(null));
  }, []);

  const today = localToday();
  const monthFrom = `${today.slice(0, 8)}01`;
  const todayIE = data ? incomeExpense(data, today, today) : null;
  const monthIE = data ? incomeExpense(data, monthFrom, today) : null;
  const liquidity = data ? netLiquidity(data) : null;
  const dues = data ? uncollectedDues(data) : null;
  const assets = data ? assetSummary(data) : null;
  const enroll = data ? enrollment(data) : null;
  const trend = React.useMemo(() => {
    if (!data) return [];
    const out: { month: string; income: number; expense: number }[] = [];
    const base = new Date(`${today.slice(0, 7)}-01T00:00:00`);
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const r = incomeExpense(data, `${ym}-01`, `${ym}-31`);
      out.push({ month: ym, income: r.totalIncome, expense: r.totalExpense });
    }
    return out;
  }, [data, today]);
  const loading = !data;

  React.useEffect(() => {
    fetchApprovalStats('principal').then((stats) => setPendingCount(stats.actionableCount));
  }, [activeSubTab]);

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: <LayoutGrid size={16} /> },
    { id: 'approvals', label: 'Approval Hub', icon: <Shield size={16} /> },
    { id: 'access', label: 'Accounts Access', icon: <UserCheck size={16} /> },
    { id: 'staff', label: 'Staff Directory', icon: <Users size={16} /> },
    { id: 'coordinators', label: 'Coordinators', icon: <School size={16} /> },
    { id: 'analytics', label: 'Oversight', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Principal Stats Header — live data */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[
          { key: 'liquidity' as const, label: 'নেট লিকুইডিটি (Net Liquidity)', value: liquidity ? tk(liquidity.total) : '…', sub: liquidity ? `${liquidity.balances.length} টি একাউন্ট` : '', icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { key: 'money' as const, label: 'আজকের আয় / ব্যয় (Today)', value: todayIE ? `${tk(todayIE.totalIncome)} / ${tk(todayIE.totalExpense)}` : '…', sub: 'আয় / ব্যয় — Day Close হিসাব', icon: <TrendingUp />, color: 'text-school-blue', bg: 'bg-blue-50' },
          { key: 'money' as const, label: 'এই মাসের আয় / ব্যয় (This month)', value: monthIE ? `${tk(monthIE.totalIncome)} / ${tk(monthIE.totalExpense)}` : '…', sub: monthIE ? `নিট ${tk(monthIE.totalIncome - monthIE.totalExpense)}` : '', icon: <BarChart3 />, color: 'text-school-blue', bg: 'bg-blue-50' },
          { key: 'dues' as const, label: 'আদায় বাকি (Uncollected Dues)', value: dues ? tk(dues.total) : '…', sub: dues ? `${dues.rows.length} জন ছাত্র/ছাত্রী` : '', icon: <AlertTriangle />, color: 'text-red-500', bg: 'bg-red-50' },
          { key: 'assets' as const, label: 'সম্পদ (Assets)', value: assets ? tk(assets.value) : '…', sub: assets ? `${assets.count} টি সক্রিয় সম্পদ` : '', icon: <BookOpen />, color: 'text-school-gold', bg: 'bg-amber-50' },
          { key: null, label: 'মোট ছাত্র/ছাত্রী (Enrollment)', value: enroll ? String(enroll.count) : '…', sub: 'Active students', icon: <Users />, color: 'text-school-blue', bg: 'bg-blue-50' },
          { key: null, label: 'Staff KPI', value: 'Not tracked yet', sub: 'এখনো ট্র্যাক করা হয় না', icon: <Award />, color: 'text-slate-400', bg: 'bg-slate-50' },
          { key: null, label: 'উপস্থিতি (Attendance)', value: 'Not tracked yet', sub: 'এখনো ট্র্যাক করা হয় না', icon: <UserCheck />, color: 'text-slate-400', bg: 'bg-slate-50' },
        ].map((stat, idx) => {
          const clickable = canDrill && stat.key && !loading;
          return (
            <button
              type="button"
              key={idx}
              disabled={!clickable}
              onClick={() => clickable && setDetail(stat.key)}
              className={cn("text-left bg-white p-6 rounded-[2.5rem] border border-school-border shadow-sm", clickable && "hover:border-school-blue hover:shadow-md transition-all cursor-pointer")}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>{stat.icon}</div>
                {clickable && <span className="flex items-center gap-1 text-school-blue text-[10px] font-black bg-blue-50 px-2 py-1 rounded-lg"><ArrowUpRight size={10} /> বিস্তারিত</span>}
              </div>
              <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className={cn("font-black text-school-blue tracking-tight", stat.value.length > 16 ? 'text-lg' : 'text-2xl')}>{stat.value}</h4>
              <p className="text-[9px] font-bold text-school-muted uppercase mt-1 opacity-60">{stat.sub}</p>
            </button>
          );
        })}
      </div>
      {detail && data && canDrill && (
        <ErrorBoundary label="PrincipalDetail" onReset={() => setDetail(null)}>
          <PrincipalDetailModal kind={detail} data={data} onClose={() => setDetail(null)} />
        </ErrorBoundary>
      )}

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md p-2 rounded-[1.5rem] border border-school-border sticky top-20 z-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeSubTab === tab.id 
                ? "bg-school-blue text-white shadow-xl shadow-blue-900/20" 
                : "text-school-muted hover:bg-white hover:text-school-blue"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="lg:col-span-2">
              <LowStockAlertCard />
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
                 <BellRing size={16} className="text-school-gold" />
                 Urgent Approval Queue ({pendingCount})
               </h3>
               <div className="space-y-4">
                  {pendingCount === 0 ? (
                    <p className="text-sm text-school-muted font-medium py-6 text-center">No pending approvals for Principal.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('approvals')}
                      className="w-full p-6 bg-amber-50 border border-amber-100 rounded-[2rem] text-left hover:bg-amber-100 transition-colors"
                    >
                      <p className="text-sm font-black text-school-blue uppercase">{pendingCount} item(s) need your approval</p>
                      <p className="text-[10px] text-school-muted font-bold mt-1">Admission, expense, category — Accounts থেকে Principal approve</p>
                    </button>
                  )}
               </div>
               <button
                 type="button"
                 onClick={() => setActiveSubTab('approvals')}
                 className="w-full mt-8 py-4 bg-slate-50 text-school-blue border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
               >
                 Open Approval Hub
               </button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm flex flex-col">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
                 <TrendingUp size={16} className="text-school-gold" />
                 ক্লাস অনুযায়ী ছাত্র/ছাত্রী (Enrollment by class)
               </h3>
               {!enroll || enroll.byClass.length === 0 ? (
                 <p className="text-sm text-school-muted text-center py-10">{loading ? 'লোড হচ্ছে…' : 'No data'}</p>
               ) : (
               <div className="flex-1 h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={enroll.byClass} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide allowDecimals={false} />
                     <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={110} />
                     <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Bar dataKey="students" radius={[0, 10, 10, 0]}>
                       {enroll.byClass.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={BAR_COLORS[index % 2]} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ApprovalsPanel viewerDepartment="principal" actorName={getCurrentActorLabel('Principal Office')} />
          </motion.div>
        )}

        {activeSubTab === 'access' && (
          <motion.div key="access" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AccessControlPanel />
          </motion.div>
        )}

        {activeSubTab === 'staff' && (
          <motion.div key="staff" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <StaffDirectoryPanel viewer="principal" />
          </motion.div>
        )}

        {activeSubTab === 'coordinators' && (
          <motion.div key="coordinators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CoordinatorOfficePanel />
          </motion.div>
        )}

        {activeSubTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
             <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm h-[400px]">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8">আয় বনাম ব্যয় — শেষ ৬ মাস (Income vs Expense)</h3>
                {trend.every((t) => t.income === 0 && t.expense === 0) ? (
                  <p className="text-sm text-school-muted text-center py-20">{loading ? 'লোড হচ্ছে…' : 'No data'}</p>
                ) : (
                <ResponsiveContainer width="100%" height="80%">
                   <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => tk(v)} />
                      <Line type="monotone" dataKey="income" name="আয়" stroke="#1E3A8A" strokeWidth={4} dot={{ r: 6, fill: '#1E3A8A', strokeWidth: 2, stroke: '#fff' }} />
                      <Line type="monotone" dataKey="expense" name="ব্যয়" stroke="#FBBF24" strokeWidth={4} strokeDasharray="5 5" />
                   </LineChart>
                </ResponsiveContainer>
                )}
             </div>

             <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8">Performance Indices</h3>
                <div className="space-y-4">
                   {['Academic Index (ফলাফল)', 'Attendance Index (উপস্থিতি)', 'Staff KPI / Satisfaction'].map((label) => (
                     <div key={label} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <span className="text-[10px] font-black text-school-blue uppercase tracking-widest">{label}</span>
                        <span className="text-[10px] font-black text-slate-400">Not tracked yet</span>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
