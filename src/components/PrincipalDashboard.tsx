import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  BarChart3, 
  MessageSquare,
  LayoutGrid,
  BellRing,
  Award,
  Zap,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';

const enrollmentData = [
  { name: 'Grade 1', students: 45, color: '#1E3A8A' },
  { name: 'Grade 2', students: 52, color: '#FBBF24' },
  { name: 'Grade 3', students: 38, color: '#1E3A8A' },
  { name: 'Grade 4', students: 48, color: '#FBBF24' },
  { name: 'Grade 5', students: 30, color: '#1E3A8A' },
];

const revenueData = [
  { month: 'Jan', rev: 450, exp: 380 },
  { month: 'Feb', rev: 520, exp: 400 },
  { month: 'Mar', rev: 480, exp: 410 },
  { month: 'Apr', rev: 610, exp: 430 },
];

export const PrincipalDashboard = () => {
  const [activeSubTab, setActiveSubTab] = React.useState('overview');

  const pendingApprovals = [
    { id: 'REQ-001', from: 'Accounts', type: 'Communication', title: 'Monthly Fee Reminder SMS', priority: 'High', date: '26 Apr' },
    { id: 'REQ-002', from: 'Teacher', type: 'Leave', title: 'Ustaz Ahmedullah: Sick Leave (2 Days)', priority: 'Medium', date: '25 Apr' },
    { id: 'REQ-003', from: 'Office', type: 'Expense', title: 'CCTV Maintenance: ৳ 8,500', priority: 'Medium', date: '26 Apr' },
  ];

  const staffStatus = [
    { name: 'Ustaz Ahmedullah', role: 'Grade 4 Lead', status: 'Checked In', kpi: 94 },
    { name: 'Ms. Rabeya', role: 'Grade 2 Teacher', status: 'On Leave', kpi: 88 },
    { name: 'Ustaz Karim', role: 'Arabic Dept Head', status: 'Checked In', kpi: 92 },
  ];

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: <LayoutGrid size={16} /> },
    { id: 'approvals', label: 'Approval Hub', icon: <Shield size={16} /> },
    { id: 'staff', label: 'Staff Directory', icon: <Users size={16} /> },
    { id: 'analytics', label: 'Oversight', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Principal Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'School Enrollment', value: '213', sub: '+12 this month', icon: <Users />, color: 'text-school-blue', bg: 'bg-blue-50' },
          { label: 'Est. Revenue', value: '৳ 6.2M', sub: 'FY 2024-25', icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Staff KPI', value: '91.4%', sub: 'Exceeding Target', icon: <Award />, color: 'text-school-gold', bg: 'bg-amber-50' },
          { label: 'Daily Presence', value: '96%', sub: 'Students Today', icon: <UserCheck />, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-school-border shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>{stat.icon}</div>
                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight size={10} /> {stat.sub.split(' ')[0]}
                </div>
             </div>
             <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-1">{stat.label}</p>
             <h4 className="text-2xl font-black text-school-blue uppercase tracking-tight">{stat.value}</h4>
             <p className="text-[9px] font-bold text-school-muted uppercase mt-1 opacity-60">{stat.sub}</p>
          </div>
        ))}
      </div>

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
            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
                 <BellRing size={16} className="text-school-gold" />
                 Urgent Approval Queue
               </h3>
               <div className="space-y-4">
                  {pendingApprovals.map((req, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:border-school-gold/20 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black",
                            req.priority === 'High' ? "bg-red-100 text-red-500" : "bg-white text-school-blue"
                          )}>
                             {req.priority === 'High' ? <AlertTriangle size={20} /> : <Zap size={20} />}
                          </div>
                          <div>
                             <h4 className="text-[11px] font-black text-school-blue uppercase tracking-tight">{req.title}</h4>
                             <p className="text-[9px] font-bold text-school-muted uppercase mt-1">From: {req.from} Dept • {req.date}</p>
                          </div>
                       </div>
                       <motion.button 
                         whileHover={{ x: 3 }}
                         className="p-3 bg-white text-school-blue rounded-xl shadow-sm group-hover:bg-school-blue group-hover:text-white transition-all"
                       >
                         <Shield size={18} />
                       </motion.button>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-4 bg-slate-50 text-school-blue border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                 View All Requests (14)
               </button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm flex flex-col">
               <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
                 <TrendingUp size={16} className="text-school-gold" />
                 Academic Distribution
               </h3>
               <div className="flex-1 h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={enrollmentData} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Bar dataKey="students" radius={[0, 10, 10, 0]}>
                       {enrollmentData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-6">
                  <div>
                     <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-2">Top Performer</p>
                     <p className="text-sm font-black text-school-blue uppercase tracking-tight">Grade 2 Elite</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-2">Attention Required</p>
                     <p className="text-sm font-black text-red-400 uppercase tracking-tight">Grade 5 Science</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'approvals' && (
          <motion.div 
            key="approvals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-school-blue text-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/20 text-center relative overflow-hidden">
               <Shield className="mx-auto mb-6 opacity-30" size={60} />
               <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Executive Decision Hub</h3>
               <p className="text-xs font-bold opacity-60 uppercase tracking-widest max-w-md mx-auto">Authorize fiscal expenses, policy changes, and official communications.</p>
            </div>

            <div className="space-y-4">
               {pendingApprovals.map((req, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="p-4 bg-slate-50 text-school-blue rounded-2xl relative">
                          {req.type === 'Leave' ? <Users size={24} /> : req.type === 'Expense' ? <DollarSign size={24} /> : <MessageSquare size={24} />}
                          <span className={cn(
                            "absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white",
                            req.priority === 'High' ? "bg-red-500" : "bg-school-gold"
                          )} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <span className="text-[10px] font-black text-school-gold bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter">{req.from} REQUEST</span>
                             <span className="text-[9px] font-bold text-school-muted uppercase tracking-widest">{req.date}</span>
                          </div>
                          <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">{req.title}</h4>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                          <CheckCircle2 size={16} /> Approve
                       </button>
                       <button className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                          <XCircle size={16} /> Decline
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'staff' && (
          <motion.div 
            key="staff"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Staff Oversight Directory</h3>
                  <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">Total Academic Staff: 20 Active</p>
               </div>
               <button className="px-6 py-2.5 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                  Broadcast Staff Notice
               </button>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-[11px]">
                 <thead>
                   <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                     <th className="pb-4">Name & Designation</th>
                     <th className="pb-4">Status Today</th>
                     <th className="pb-4">KPI Performance</th>
                     <th className="pb-4 text-right">Oversight</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {staffStatus.map((staff, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                         <td className="py-6">
                            <p className="font-black text-school-blue tracking-tight uppercase leading-tight">{staff.name}</p>
                            <p className="text-[9px] font-bold text-school-muted uppercase mt-0.5">{staff.role}</p>
                         </td>
                         <td className="py-6">
                            <span className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                              staff.status === 'Checked In' ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-school-gold"
                            )}>
                               {staff.status}
                            </span>
                         </td>
                         <td className="py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-school-blue" style={{ width: `${staff.kpi}%` }} />
                               </div>
                               <span className="font-black text-school-blue">{staff.kpi}%</span>
                            </div>
                         </td>
                         <td className="py-6 text-right font-black text-school-blue uppercase underline underline-offset-4 cursor-pointer hover:text-school-gold">Details</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
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
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8">Revenue vs Operations Cost</h3>
                <ResponsiveContainer width="100%" height="80%">
                   <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rev" stroke="#1E3A8A" strokeWidth={4} dot={{ r: 6, fill: '#1E3A8A', strokeWidth: 2, stroke: '#fff' }} />
                      <Line type="monotone" dataKey="exp" stroke="#FBBF24" strokeWidth={4} strokeDasharray="5 5" />
                   </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-school-blue" /><span className="text-[10px] font-black uppercase tracking-widest text-school-blue">Realized Revenue</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-school-gold" /><span className="text-[10px] font-black uppercase tracking-widest text-school-gold">Fixed Expense</span></div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8">Performance Indices</h3>
                <div className="space-y-8">
                   {[
                     { label: 'Academic Index', value: 89.2, color: 'bg-school-blue' },
                     { label: 'Attendance Index', value: 96.5, color: 'bg-emerald-500' },
                     { label: 'Staff Satisfaction', value: 84.8, color: 'bg-school-gold' },
                     { label: 'Account Health', value: 72.1, color: 'bg-purple-500' },
                   ].map((idx, i) => (
                     <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-school-blue uppercase tracking-widest">{idx.label}</span>
                           <span className="text-[10px] font-black text-school-blue">{idx.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             whileInView={{ width: `${idx.value}%` }}
                             className={cn("h-full rounded-full", idx.color)} 
                           />
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
