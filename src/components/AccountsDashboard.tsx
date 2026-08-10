import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  FileText, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  Users,
  Plus,
  Zap,
  ShieldCheck,
  Building2,
  Wallet,
  Landmark,
  Smartphone,
  Tag, 
  Monitor, 
  BellRing, 
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ClipboardCheck,
  Receipt,
  FileBarChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { StudentManagement } from './StudentManagement';
import { AdmissionsPanel } from './accounts/AdmissionsPanel';
import { ExpensePanel } from './accounts/ExpensePanel';
import { LedgerPanel } from './accounts/LedgerPanel';
import { DirectorReportPanel } from './accounts/DirectorReportPanel';
import { computeAllBalances, fetchAccounts, fetchEntries } from '../lib/ledger';
import type { LedgerAccount } from '../types';

const financialData = [
  { name: 'Jan', revenue: 4000, expense: 2400 },
  { name: 'Feb', revenue: 3000, expense: 1398 },
  { name: 'Mar', revenue: 5000, expense: 3800 },
  { name: 'Apr', revenue: 4780, expense: 3208 },
  { name: 'May', revenue: 6890, expense: 4100 },
];

const LEDGER_TYPE_ICON: Record<string, React.ReactNode> = {
  cash: <Wallet size={18} />,
  bank: <Landmark size={18} />,
  mobile: <Smartphone size={18} />,
};

export const AccountsDashboard = () => {
  const [activeSubTab, setActiveSubTab] = React.useState('overview');
  const [ledgerBalances, setLedgerBalances] = React.useState<{ account: LedgerAccount; balance: number }[]>([]);

  React.useEffect(() => {
    Promise.all([fetchAccounts(), fetchEntries()]).then(([accounts, entries]) => {
      setLedgerBalances(computeAllBalances(accounts, entries));
    });
  }, [activeSubTab]);

  const assets = [
    { tag: 'FURN-001', name: 'Executive Desk', category: 'Furniture', value: '৳ 12,000', life: '5 Years' },
    { tag: 'ELEC-102', name: 'Smart Board (Class 4)', category: 'Electronics', value: '৳ 85,000', life: '3 Years' },
    { tag: 'ELEC-105', name: 'HP LaserJet Pro', category: 'Electronics', value: '৳ 35,000', life: '4 Years' },
    { tag: 'PROP-201', name: 'Water Purifier System', category: 'Property', value: '৳ 65,000', life: '10 Years' },
  ];

  const pendingApprovals = [
    { id: 'APP-99', type: 'Notice', title: 'Payment Reminder: Term 2', status: 'Pending', date: '26 Apr' },
    { id: 'APP-102', type: 'Expense', title: 'Generator Repair', status: 'Reviewing', date: '25 Apr' },
  ];

  const tabs = [
    { id: 'overview', label: 'Financials', icon: <PieChart size={16} /> },
    { id: 'students', label: 'Student Management', icon: <Users size={16} /> },
    { id: 'admissions', label: 'Admissions', icon: <ClipboardCheck size={16} /> },
    { id: 'billing', label: 'Invoicing', icon: <FileText size={16} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
    { id: 'ledger', label: 'Bank & MFS Ledger', icon: <Landmark size={16} /> },
    { id: 'assets', label: 'Asset Registry', icon: <Building2 size={16} /> },
    { id: 'report', label: 'Director Report', icon: <FileBarChart size={16} /> },
    { id: 'approvals', label: 'Approvals', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-school-border shadow-sm overflow-x-auto whitespace-nowrap custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeSubTab === tab.id 
                ? "bg-school-blue text-white shadow-lg shadow-blue-900/10" 
                : "text-school-muted hover:bg-slate-50 hover:text-school-blue"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Net Liquidity', value: '৳ 1.45M', icon: <DollarSign size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Monthly Expense', value: '৳ 320k', icon: <ArrowDownRight size={20} />, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Uncollected Dues', value: '৳ 85k', icon: <Clock size={20} />, color: 'text-school-gold', bg: 'bg-amber-50' },
                { label: 'Asset Value', value: '৳ 4.2M', icon: <Building2 size={20} />, color: 'text-school-blue', bg: 'bg-blue-50' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-school-border shadow-sm flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black text-school-blue">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-school-blue uppercase tracking-widest">Revenue Flow (Actual)</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-black text-school-blue"><div className="w-2 h-2 rounded-full bg-school-blue" /> Monthly Fees</span>
                    <span className="flex items-center gap-1 text-[10px] font-black text-school-muted"><div className="w-2 h-2 rounded-full bg-slate-300" /> Fixed Costs</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={financialData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="step" dataKey="revenue" stroke="#1E3A8A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expense" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm flex flex-col h-[400px]">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Landmark size={16} className="text-school-gold" />
                  Multi-Channel Ledgers
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {ledgerBalances.length === 0 ? (
                    <p className="text-xs text-school-muted font-medium text-center py-8">Loading accounts...</p>
                  ) : (
                    ledgerBalances.map(({ account, balance }) => (
                      <div key={account.id} className="group p-4 rounded-2xl border border-slate-50 hover:border-school-gold/30 hover:bg-slate-50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              account.type === 'cash' ? "bg-amber-50 text-school-gold" : account.type === 'bank' ? "bg-blue-50 text-school-blue" : "bg-pink-50 text-pink-500"
                            )}>
                              {LEDGER_TYPE_ICON[account.type]}
                            </div>
                            <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{account.name}</p>
                          </div>
                          <p className="text-xs font-black text-school-blue">৳ {balance.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-school-muted uppercase tracking-tighter">
                          <span>{account.type.toUpperCase()}</span>
                          <span className="text-emerald-500">Active</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setActiveSubTab('ledger')}
                  className="mt-6 py-3 bg-slate-50 border border-slate-100 text-school-blue text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Manage Accounts & Transfers
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StudentManagement />
          </motion.div>
        )}

        {activeSubTab === 'admissions' && (
          <motion.div
            key="admissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdmissionsPanel />
          </motion.div>
        )}

        {activeSubTab === 'billing' && (
          <motion.div 
            key="billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap size={16} className="text-school-gold" />
                 Bulk Invoice Generator
               </h3>
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Select Class</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 ring-school-gold/20">
                       <option>All Classes</option>
                       <option>Grade 1</option>
                       <option>Grade 4 (Sapphire)</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Billing Month</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 ring-school-gold/20">
                       <option>December 2024</option>
                       <option>January 2025</option>
                     </select>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Fee Categories</label>
                   <div className="grid grid-cols-2 gap-3">
                     {['Tuition Fee', 'Exam Fee', 'Bus Fee', 'Utility Bill', 'Sports Charge'].map(cat => (
                        <label key={cat} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-school-gold/30 transition-all">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-school-blue focus:ring-school-blue" />
                          <span className="text-[10px] font-black text-school-blue uppercase">{cat}</span>
                        </label>
                     ))}
                   </div>
                 </div>

                 <button className="w-full py-5 bg-school-blue text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-blue-900 transition-all">
                   Preview Invoices (245 Items)
                 </button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ArrowUpRight size={16} className="text-emerald-500" />
                 Collection Stats
               </h3>
               <div className="grid grid-cols-2 gap-6 mb-8">
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid Invoices</p>
                    <p className="text-2xl font-black text-emerald-700">182</p>
                 </div>
                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Unpaid/Due</p>
                    <p className="text-2xl font-black text-red-700">63</p>
                 </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-school-muted uppercase tracking-widest">Recent Collection Alerts</h4>
                  {[
                    { student: 'Omar Bin Ahmed', amount: '৳ 4,500', method: 'bKash', status: 'Pending Approval' },
                    { student: 'Sarah Khan', amount: '৳ 12,000', method: 'Cash', status: 'Verified' },
                  ].map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{alert.student}</p>
                        <p className="text-[9px] font-bold text-school-muted uppercase">{alert.amount} via {alert.method}</p>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter",
                        alert.status === 'Verified' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-school-gold"
                      )}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-4 bg-slate-50 text-school-blue border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                 Send Reminders (SMS/Portal)
               </button>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ExpensePanel />
          </motion.div>
        )}

        {activeSubTab === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LedgerPanel />
          </motion.div>
        )}

        {activeSubTab === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DirectorReportPanel />
          </motion.div>
        )}

        {activeSubTab === 'assets' && (
          <motion.div 
            key="assets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Asset & Property Registry</h3>
              <button className="px-6 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Plus size={14} /> Register Asset
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               {[
                 { label: 'IT Assets', count: 42, icon: <Monitor /> },
                 { label: 'Furniture', count: 156, icon: <Tag /> },
                 { label: 'Books', count: 1200, icon: <FileSpreadsheet /> },
                 { label: 'Others', count: 18, icon: <Building2 /> },
               ].map((c, idx) => (
                 <div key={idx} className="p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-50 text-school-blue rounded-xl">{c.icon}</div>
                      <span className="text-xs font-black text-school-blue">{c.count}</span>
                    </div>
                    <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{c.label}</p>
                 </div>
               ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                    <th className="pb-4">Tag #</th>
                    <th className="pb-4">Asset Name</th>
                    <th className="pb-4">Category</th>
                    <th className="pb-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assets.map((asset, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-5 font-black text-school-gold tracking-tight">{asset.tag}</td>
                      <td className="py-5 font-black text-school-blue uppercase">{asset.name}</td>
                      <td className="py-5 text-slate-500 font-medium">{asset.category}</td>
                      <td className="py-5 text-right font-black text-school-blue">{asset.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'approvals' && (
          <motion.div 
            key="approvals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="bg-school-gold/5 border-2 border-school-gold/20 rounded-[2.5rem] p-10 text-center relative overflow-hidden group">
               <ShieldCheck size={60} className="mx-auto text-school-gold mb-6 opacity-20 group-hover:scale-110 transition-transform" />
               <h3 className="text-2xl font-black text-school-blue uppercase tracking-tight mb-2">Principal Approval Layer</h3>
               <p className="text-xs text-school-muted font-medium mb-8 max-w-sm mx-auto">Sensitive communications and major expenses must be reviewed by the Principal before system execution.</p>
               
               <div className="space-y-4">
                 {pendingApprovals.map((req, idx) => (
                   <div key={idx} className="bg-white p-6 rounded-[2rem] border border-school-border shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-school-blue">
                          {req.type === 'Notice' ? <BellRing size={20} /> : <DollarSign size={20} />}
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">{req.title}</p>
                          <p className="text-[9px] font-bold text-school-muted uppercase">{req.type} • Requested {req.date}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-school-gold bg-amber-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                          {req.status}
                        </span>
                        <div className="flex gap-1">
                           <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 size={18} /></button>
                           <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><XCircle size={18} /></button>
                        </div>
                     </div>
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
