import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  User, 
  CreditCard, 
  BarChart3, 
  Bell, 
  LogOut,
  Calendar,
  ChevronRight,
  Settings,
  BookOpen,
  Shield,
  Calculator,
  Users,
  TrendingUp,
  LayoutGrid,
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { logout } from './lib/auth';
import { UserRole } from './types';
import { GuardianDashboard } from './components/GuardianDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AccountsDashboard } from './components/AccountsDashboard';
import { PrincipalDashboard } from './components/PrincipalDashboard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const role = (localStorage.getItem('userRole') as UserRole) || 'guardian';
  
  // Super Admin view switching logic
  const [currentView, setCurrentView] = React.useState<UserRole | null>(() => {
    if (role === 'super_admin') {
      return (localStorage.getItem('adminCurrentView') as UserRole) || null;
    }
    return role;
  });

  const handleSetView = (view: UserRole) => {
    setCurrentView(view);
    if (role === 'super_admin') {
      localStorage.setItem('adminCurrentView', view);
    }
    setActiveTab('overview');
  };

  const portalConfigs: Record<string, any> = {
    guardian: {
      name: "Omar's Guardian",
      portalName: "Guardian Portal",
      color: "bg-school-blue",
      accent: "text-school-gold",
      icon: <GraduationCap size={40} />,
      menu: [
        { icon: <LayoutDashboard size={20} />, label: "Overview", id: "overview" },
        { icon: <User size={20} />, label: "Profile", id: "profile" },
        { icon: <CreditCard size={20} />, label: "Fees", id: "fees" },
        { icon: <BarChart3 size={20} />, label: "Reports", id: "reports" },
      ]
    },
    teacher: {
      name: "Ustaz Ahmedullah",
      portalName: "Teacher Portal",
      color: "bg-emerald-600",
      accent: "text-emerald-400",
      icon: <BookOpen size={40} />,
      menu: [
        { icon: <LayoutDashboard size={20} />, label: "Overview", id: "overview" },
        { icon: <Users size={20} />, label: "My Students", id: "students" },
        { icon: <BookOpen size={20} />, label: "Curriculum", id: "curriculum" },
        { icon: <Calendar size={20} />, label: "Attendance", id: "attendance" },
      ]
    },
    accounts: {
      name: "Finance Manager",
      portalName: "Accounts Portal",
      color: "bg-purple-600",
      accent: "text-purple-400",
      icon: <Calculator size={40} />,
      menu: [
        { icon: <LayoutDashboard size={20} />, label: "Overview", id: "overview" },
        { icon: <Calculator size={20} />, label: "Collections", id: "collections" },
        { icon: <CreditCard size={20} />, label: "Expenses", id: "expenses" },
        { icon: <BarChart3 size={20} />, label: "Financials", id: "financials" },
      ]
    },
    principal: {
      name: "Principal Office",
      portalName: "Executive Portal",
      color: "bg-school-gold",
      accent: "text-school-blue",
      icon: <Shield size={40} />,
      menu: [
        { icon: <Shield size={20} />, label: "Overview", id: "overview" },
        { icon: <TrendingUp size={20} />, label: "Analytics", id: "analytics" },
        { icon: <Users size={20} />, label: "Staff", id: "staff" },
        { icon: <Settings size={20} />, label: "School Ops", id: "ops" },
      ]
    },
    super_admin: {
      name: "Master Admin (chotan4480)",
      portalName: "Super Admin Control",
      color: "bg-slate-900",
      accent: "text-school-gold",
      icon: <Sparkles size={40} />,
      menu: []
    }
  };

  const activeConfig = currentView ? portalConfigs[currentView] : portalConfigs.super_admin;

  const accountsSidebarSections: Record<string, string> = {
    overview: 'overview',
    collections: 'billing',
    expenses: 'expenses',
    financials: 'report',
  };

  const isAccountsSidebarTab = currentView === 'accounts' && activeTab in accountsSidebarSections;

  const renderAdminPortal = () => (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 text-school-gold rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-school-gold/20">
          <Sparkles size={14} /> Master Power Mode Active
        </div>
        <h2 className="text-4xl font-black text-school-blue uppercase tracking-tight mb-2">Welcome, Super Admin</h2>
        <p className="text-school-muted font-medium uppercase tracking-widest text-xs">Select a department portal to inspect data</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {[
          { id: 'guardian', label: 'Guardian', icon: <GraduationCap size={32} />, color: 'bg-school-blue', desc: 'Parent/Student view' },
          { id: 'teacher', label: 'Teacher', icon: <BookOpen size={32} />, color: 'bg-emerald-600', desc: 'Classroom & Lessons' },
          { id: 'accounts', label: 'Accounts', icon: <Calculator size={32} />, color: 'bg-purple-600', desc: 'Fiscal & Billing' },
          { id: 'principal', label: 'Principal', icon: <Shield size={32} />, color: 'bg-school-gold text-school-blue', desc: 'School Operations' },
        ].map((p) => (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSetView(p.id as UserRole)}
            className="bg-white p-8 rounded-[2.5rem] border-2 border-school-border hover:border-school-gold shadow-xl shadow-blue-900/5 text-left group transition-all"
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white transition-transform group-hover:rotate-6", p.color)}>
              {p.icon}
            </div>
            <h3 className="text-xl font-black text-school-blue uppercase tracking-tight mb-2">{p.label}</h3>
            <p className="text-xs text-school-muted font-medium mb-6">{p.desc}</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-school-gold uppercase tracking-widest">
              Enter Portal <ArrowRight size={14} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (role === 'super_admin' && !currentView) {
      return renderAdminPortal();
    }

    if (activeTab !== 'overview' && !isAccountsSidebarTab) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
             <Settings size={40} />
          </div>
          <h3 className="text-2xl font-black text-school-blue uppercase tracking-tight">Under Construction</h3>
          <p className="text-school-muted max-w-sm mt-2 font-medium">We're building the <span className="text-school-blue font-bold">{activeTab}</span> module for the {activeConfig?.portalName}. Stay tuned!</p>
          <button 
            onClick={() => setActiveTab('overview')}
            className="mt-8 px-8 py-3 bg-school-gold text-school-blue rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-school-blue hover:text-white transition-all shadow-lg shadow-black/10"
          >
            Back to Overview
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'guardian': return <GuardianDashboard />;
      case 'teacher': return <TeacherDashboard />;
      case 'accounts':
        return (
          <AccountsDashboard
            activeSection={accountsSidebarSections[activeTab] ?? 'overview'}
          />
        );
      case 'principal': return <PrincipalDashboard />;
      default: return <GuardianDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-school-light-gray flex font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-school-border flex flex-col h-screen fixed left-0 top-0 z-30 transition-all shadow-sm"
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <motion.img 
                src="https://i.postimg.cc/15vr8swG/Logo-For-SMC-02.png" 
                alt="Logo" 
                className="h-12 w-auto"
                referrerPolicy="no-referrer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <div className="flex flex-col">
                <h1 className="text-[10px] font-black text-school-blue leading-none uppercase tracking-tighter">AN-NOOR</h1>
                <span className="text-[8px] font-bold text-school-gold uppercase tracking-[0.2em] mt-1">SYSTEMS</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 bg-school-light-gray text-school-muted rounded-lg hover:text-school-blue transition-colors"
          >
            <ChevronRight className={cn("transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {activeConfig?.menu.map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group text-sm uppercase tracking-wide",
                activeTab === item.id 
                  ? "bg-school-blue text-white shadow-lg shadow-blue-900/10" 
                  : "text-school-muted hover:bg-school-light-gray hover:text-school-blue"
              )}
            >
              <div className={cn(activeTab === item.id ? "text-school-gold" : "text-school-muted group-hover:text-school-blue")}>
                {item.icon}
              </div>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
          
          {role === 'super_admin' && sidebarOpen && (
            <div className="mt-8 pt-8 border-t border-school-border px-2">
               <p className="text-[9px] font-black text-school-muted uppercase tracking-widest mb-4">Master Controls</p>
               <button 
                 onClick={() => {
                   setCurrentView(null);
                   localStorage.removeItem('adminCurrentView');
                 }}
                 className="w-full flex items-center gap-4 px-4 py-3 bg-slate-900 text-school-gold rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
               >
                 <LayoutGrid size={18} />
                 <span>Switch View</span>
               </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-school-border space-y-4">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-xl bg-school-gold/10 border border-school-gold/20 flex items-center justify-center text-school-blue">
               <Settings size={20} />
            </div>
            {sidebarOpen && <span className="font-bold text-xs text-school-muted uppercase tracking-widest">Settings</span>}
          </div>
          <button 
            onClick={async () => {
                await logout();
                navigate('/login');
            }}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 text-school-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-bold text-sm uppercase">Logout</span>}
          </button>
        </div>
      </motion.aside>
      
      <main className={cn("flex-1 pb-8 transition-all", sidebarOpen ? "ml-[260px]" : "ml-[80px]")}>
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 sticky top-0 bg-white/80 backdrop-blur-md z-25 border-b-2 border-school-gold shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase text-school-blue tracking-tight">
              {currentView === 'accounts'
                ? ({
                    overview: 'Accounts Dashboard',
                    collections: 'Collections',
                    expenses: 'Expenses',
                    financials: 'Financials',
                  }[activeTab] ?? 'Accounts Dashboard')
                : activeTab === 'overview'
                  ? `${currentView || 'Admin'} Dashboard`
                  : activeTab}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={cn(
              "hidden md:flex text-white font-black px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10 border border-white/10",
              activeConfig?.color
            )}>
              {activeConfig?.portalName}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-2 border-school-border">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-school-blue leading-none underline decoration-school-gold decoration-2 underline-offset-4">{activeConfig?.name}</p>
                <p className="text-[10px] text-school-muted font-bold uppercase mt-2 tracking-wider">Session 2024-25</p>
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white border-2 border-school-gold shadow-sm", activeConfig?.color)}>
                 {currentView === 'principal' ? <Shield size={20} /> : <User size={20} />}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="max-w-7xl mx-auto">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
