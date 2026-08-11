import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Bell, 
  ClipboardList, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  XCircle,
  FileText,
  Clock,
  ChevronRight,
  Plus,
  BarChart3,
  MessageSquare,
  Sparkles,
  School,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ApprovalsPanel } from './accounts/ApprovalsPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TeacherDashboard = () => {
  const [activeSubTab, setActiveSubTab] = React.useState('overview');
  const [isWifiConnected, setIsWifiConnected] = React.useState(false);
  const [checkedIn, setCheckedIn] = React.useState(false);

  // Simulated Attendance State
  const [students, setStudents] = React.useState([
    { id: 'ANS-001', name: 'Omar Bin Ahmed', status: 'Present' },
    { id: 'ANS-002', name: 'Sarah Khan', status: 'Absent' },
    { id: 'ANS-003', name: 'Zaid Islam', status: 'Present' },
    { id: 'ANS-004', name: 'Alif Rayhan', status: 'Present' },
    { id: 'ANS-005', name: 'Maryam Bibi', status: 'Pending' },
  ]);

  const toggleAttendance = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' };
      }
      return s;
    }));
  };

  const coordinatorReports = [
    { teacher: 'Ustaz Ahmedullah', class: 'Grade 4', performance: 94, status: 'On Track' },
    { teacher: 'Ms. Rabeya', class: 'Grade 2', performance: 88, status: 'Consultation' },
    { teacher: 'Ustaz Karim', class: 'Grade 5', performance: 92, status: 'Excellent' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Calendar size={16} /> },
    { id: 'attendance', label: 'Attendance', icon: <Users size={16} /> },
    { id: 'input', label: 'Daily Lessons', icon: <BookOpen size={16} /> },
    { id: 'leave', label: 'Leave Portal', icon: <FileText size={16} /> },
    { id: 'approvals', label: 'Approvals', icon: <ShieldCheck size={16} /> },
    { id: 'coordinator', label: 'Coordinator Hub', icon: <School size={16} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Teacher Top Bar with Wi-Fi Logic */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-school-border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-school-blue flex items-center justify-center text-white border-2 border-school-gold shadow-lg shadow-blue-900/20">
             <Users size={30} />
          </div>
          <div>
            <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Ustaz Ahmedullah</h3>
            <p className="text-[10px] font-black text-school-muted uppercase tracking-[0.2em] mt-1">Class Teacher: Grade 4 (Sapphire)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                 <span className={cn("text-[9px] font-black uppercase", isWifiConnected ? "text-emerald-500" : "text-red-400")}>
                    {isWifiConnected ? "School Wi-Fi: Active" : "Waiting for Network..."}
                 </span>
                 {isWifiConnected ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-red-400" />}
              </div>
              <button 
                onClick={() => setIsWifiConnected(!isWifiConnected)}
                className="text-[8px] font-bold text-school-muted underline underline-offset-4 mt-1 hover:text-school-blue"
              >
                Simulate Network Sync
              </button>
           </div>
           <button 
             disabled={!isWifiConnected || checkedIn}
             onClick={() => setCheckedIn(true)}
             className={cn(
               "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
               checkedIn 
                 ? "bg-emerald-500 text-white shadow-emerald-500/20 cursor-default" 
                 : isWifiConnected 
                   ? "bg-school-gold text-school-blue shadow-amber-500/20 hover:scale-105" 
                   : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
             )}
           >
             {checkedIn ? "Checked In ✓" : "Check-in to Class"}
           </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-2 rounded-[1.5rem] border border-school-border sticky top-20 z-20 overflow-x-auto whitespace-nowrap custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeSubTab === tab.id 
                ? "bg-school-blue text-white shadow-lg shadow-blue-900/10" 
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6">Today's Class Schedule</h3>
                <div className="space-y-4">
                  {[
                    { time: '08:00 AM', subject: 'Arabic Linguistics', room: 'RL-102', status: 'Completed' },
                    { time: '10:00 AM', subject: 'Quran Hifz', room: 'QH-04', status: 'Ongoing' },
                    { time: '12:00 PM', subject: 'Islamic History', room: 'IH-09', status: 'Upcoming' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-school-gold/20 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black",
                            s.status === 'Ongoing' ? "bg-school-gold text-school-blue" : "bg-white text-school-muted"
                          )}>
                             <Clock size={16} className="mb-0.5" />
                             <span className="text-[8px]">{s.time.split(' ')[0]}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">{s.subject}</h4>
                            <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest">{s.room} • {s.status}</p>
                          </div>
                       </div>
                       {s.status === 'Ongoing' && (
                         <div className="flex gap-2">
                            <span className="animate-pulse w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-[10px] font-black text-red-400 uppercase">Live Now</span>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm">
                 <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6">Subject Progress Tracker</h3>
                 <div className="space-y-6">
                    {['Arabic', 'Hifz', 'English', 'Math'].map(sub => (
                      <div key={sub}>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2">
                           <span className="text-school-blue">{sub} Syllabus</span>
                           <span className="text-school-gold">72%</span>
                         </div>
                         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} whileInView={{ width: '72%' }} className="h-full bg-school-blue rounded-full" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-school-blue text-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/20 relative overflow-hidden">
                 <Sparkles className="absolute top-4 right-4 text-school-gold opacity-30" />
                 <h3 className="text-lg font-black uppercase tracking-tight mb-4">Class Performance</h3>
                 <div className="mb-6 h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{v:40}, {v:70}, {v:65}, {v:90}]}>
                        <Area type="monotone" dataKey="v" stroke="#FFD700" fill="#FFD700" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-[10px] font-bold opacity-60 uppercase mb-4 tracking-widest">Average Monthly Score</p>
                 <div className="text-3xl font-black text-school-gold">88.4 / 100</div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm">
                 <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6">Recent Reports</h3>
                 <div className="space-y-4">
                    {['Behavior Report - Omar', 'Term Summary - Grade 4', 'Parent Meeting Notes'].map(r => (
                      <div key={r} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                         <span className="text-[10px] font-black text-school-blue uppercase tracking-tight">{r}</span>
                         <ChevronRight size={14} className="text-school-muted group-hover:text-school-gold transition-colors" />
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'attendance' && (
          <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
               <div>
                 <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Daily Student Attendance</h3>
                 <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">Status: Session Active • 26 Apr 2024</p>
               </div>
               <div className="flex gap-2">
                  <button className="px-6 py-2.5 bg-slate-50 text-school-muted rounded-xl text-[10px] font-black uppercase tracking-widest">Mark All Present</button>
                  <button className="px-6 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10">Submit Register</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {students.map((s) => (
                 <div key={s.id} className={cn(
                   "p-6 rounded-[2rem] border transition-all flex items-center justify-between",
                   s.status === 'Present' ? "bg-emerald-50/50 border-emerald-100" : s.status === 'Absent' ? "bg-red-50/50 border-red-100" : "bg-white border-school-border"
                 )}>
                    <div>
                      <h4 className="text-sm font-black text-school-blue uppercase tracking-tight">{s.name}</h4>
                      <p className="text-[9px] font-bold text-school-muted uppercase tracking-widest">{s.id}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => toggleAttendance(s.id)}
                         className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                           s.status === 'Present' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border border-slate-200 text-slate-300 hover:text-emerald-500"
                         )}
                       >
                          <CheckCircle2 size={18} />
                       </button>
                       <button 
                         onClick={() => toggleAttendance(s.id)}
                         className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center transition-all text-slate-300",
                           s.status === 'Absent' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white border border-slate-200 text-slate-300 hover:text-red-500"
                         )}
                       >
                          <XCircle size={18} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'input' && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Daily Lesson Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
                <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-8 flex items-center gap-2">
                  <BookOpen size={16} className="text-school-gold" />
                  Lesson Entry Form
                </h3>
                <form className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Select Student</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 ring-school-gold/20">
                          <option>Broadcast to All</option>
                          {students.map(s => <option key={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Subject</label>
                        <input type="text" defaultValue="Arabic Linguistics" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 ring-school-gold/20" />
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Daily Progress / Notes</label>
                     <textarea 
                       rows={4}
                       placeholder="Enter daily progress details here... (This will reflect on the Guardian Dashboard)"
                       className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-[11px] font-medium outline-none focus:ring-2 ring-school-gold/20 leading-relaxed"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     {['Completed Homework', 'Excellent Behavior', 'Participated in Recitation'].map(tag => (
                        <label key={tag} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all">
                           <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                           <span className="text-[10px] font-black text-school-blue uppercase tracking-tighter">{tag}</span>
                        </label>
                     ))}
                   </div>

                   <button className="w-full py-5 bg-school-gold text-school-blue rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-school-blue hover:text-white transition-all">
                     Update Feed & Send Alert
                   </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm">
                  <h3 className="text-xs font-black text-school-blue uppercase tracking-widest mb-6">Recent Submissions</h3>
                  <div className="space-y-4">
                     {[
                       { sub: 'Mathemtics', time: '10 mins ago', student: 'Sarah Khan' },
                       { sub: 'English', time: '1h ago', student: 'All Students' },
                       { sub: 'Islamic Studies', time: '2h ago', student: 'Omar Ahmed' },
                     ].map((sub, idx) => (
                       <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                          <p className="text-[10px] font-black text-school-blue uppercase tracking-tight">{sub.sub}</p>
                          <p className="text-[9px] font-bold text-school-muted uppercase mt-1">To: {sub.student}</p>
                          <p className="text-[8px] font-bold text-school-gold uppercase mt-2">{sub.time}</p>
                       </div>
                     ))}
                  </div>
               </div>
               
               <div className="bg-emerald-500 text-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-500/20 text-center">
                  <Sparkles className="mx-auto mb-4" />
                  <h4 className="text-sm font-black uppercase tracking-tight mb-2">Reflect to Guardians</h4>
                  <p className="text-[10px] font-medium opacity-80 leading-relaxed">System is syncing your notes to 42 active Guardian Portals instantly.</p>
               </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'leave' && (
          <motion.div 
            key="leave"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] p-10 border border-school-border shadow-sm">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-amber-50 text-school-gold rounded-2xl"><FileText size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-school-blue uppercase tracking-tight">Leave Application</h3>
                    <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest">Portal for Staff Absence Requests</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Start Date</label>
                       <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">End Date</label>
                       <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Reason</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 ring-school-gold/20">
                       <option>Medical Emergency</option>
                       <option>Casual Leave</option>
                       <option>Priveledge Leave</option>
                       <option>Hajj/Umrah</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Remarks</label>
                    <textarea rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] outline-none" />
                 </div>

                 <button className="w-full py-5 bg-school-blue text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10">Submit for Principal Approval</button>
               </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
               <h4 className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-4">Request Status</h4>
               <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <p className="text-[11px] font-black text-school-blue uppercase tracking-tight">Medical Leave (2 Days)</p>
                    <p className="text-[9px] font-bold text-school-muted uppercase tracking-tighter">Applied on 24 Apr 2024</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-school-gold text-[8px] font-black rounded-lg uppercase tracking-widest">Pending</span>
               </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ApprovalsPanel viewerDepartment="teacher" actorName="Class Teacher / Coordinator" />
          </motion.div>
        )}

        {activeSubTab === 'coordinator' && (
          <motion.div 
            key="coordinator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm flex flex-col justify-center text-center">
                  <div className="w-20 h-20 bg-blue-50 text-school-blue rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <Users size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-school-blue">14</h4>
                  <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Staff Under Management</p>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm flex flex-col justify-center text-center">
                  <div className="w-20 h-20 bg-amber-50 text-school-gold rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-school-blue">91.4%</h4>
                  <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Academic KPI Avg.</p>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-school-border shadow-sm flex flex-col justify-center text-center">
                  <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-school-blue">08</h4>
                  <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mt-1">Unresolved Reports</p>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-school-border shadow-sm">
               <h3 className="text-lg font-black text-school-blue uppercase tracking-tight mb-8">Academic Staff Performance Tracker</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px]">
                   <thead>
                     <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                       <th className="pb-4">Teacher Name</th>
                       <th className="pb-4">Assigned Class</th>
                       <th className="pb-4">Attendance Rate</th>
                       <th className="pb-4">KPI Score</th>
                       <th className="pb-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {coordinatorReports.map((report, idx) => (
                       <tr key={idx} className="group hover:bg-slate-50 transition-all">
                         <td className="py-6 font-black text-school-blue uppercase tracking-tight">{report.teacher}</td>
                         <td className="py-6 font-black text-school-muted uppercase">{report.class}</td>
                         <td className="py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-school-gold" style={{ width: '92%' }} />
                               </div>
                               <span className="font-black text-school-blue">92%</span>
                            </div>
                         </td>
                         <td className="py-6">
                           <span className={cn(
                             "px-4 py-1.5 rounded-xl font-black uppercase text-[8px] tracking-widest shadow-sm",
                             report.performance > 90 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-school-gold"
                           )}>
                             {report.performance}% • {report.status}
                           </span>
                         </td>
                         <td className="py-6 text-right">
                           <button className="p-3 bg-white border border-slate-100 rounded-xl text-school-blue hover:text-school-gold transition-colors shadow-sm">
                             <BarChart3 size={16} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
