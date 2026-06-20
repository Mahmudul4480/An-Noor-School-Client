import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, UserCheck, Shield, BookOpen, GraduationCap, Calculator } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from './types';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = React.useState<UserRole>('guardian');
  const [formData, setFormData] = React.useState({
    userId: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, we'll store the role in localStorage and navigate
    const finalRole = formData.userId === 'chotan4480@gmail.com' ? 'super_admin' : role;
    localStorage.setItem('userRole', finalRole);
    if (finalRole === 'super_admin') {
      localStorage.removeItem('currentView'); // Reset view for super admin
    }
    navigate('/dashboard');
  };

  const roles = [
    { id: 'guardian', label: 'Guardian', icon: <GraduationCap size={18} /> },
    { id: 'teacher', label: 'Teacher', icon: <BookOpen size={18} /> },
    { id: 'accounts', label: 'Accounts', icon: <Calculator size={18} /> },
    { id: 'principal', label: 'Principal', icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-school-light-gray flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-4 mb-8 group">
            <motion.img 
              src="https://i.postimg.cc/15vr8swG/Logo-For-SMC-02.png" 
              alt="An-Noor Logo" 
              className="h-[120px] w-auto drop-shadow-xl"
              referrerPolicy="no-referrer"
              animate={{ y: [0, -10, 0] }}
              whileHover={{ scale: 1.1, rotate: [0, -2, 2, -2, 0] }}
              transition={{ 
                y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                rotate: { type: "tween", duration: 0.5 },
                scale: { type: "spring", stiffness: 400 }
              }}
            />
            <div className="text-center">
              <h1 className="text-2xl font-black text-school-blue leading-none tracking-tighter uppercase">An-Noor</h1>
              <p className="text-[12px] text-school-muted font-black uppercase tracking-widest mt-1">International School System</p>
            </div>
          </Link>
          <h2 className="text-3xl font-black text-school-blue uppercase tracking-tight">SaaS Management</h2>
          <p className="text-school-muted mt-2 font-medium">Unified portal for all stakeholders</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border-2 border-school-border">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as UserRole)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  role === r.id 
                    ? 'bg-school-blue text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-50 text-school-muted hover:bg-slate-100 hover:text-school-blue border border-slate-100'
                }`}
              >
                {r.icon}
                {r.label}
              </button>
            ))}
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-black text-school-blue uppercase tracking-widest mb-2">
                {role === 'guardian' ? 'Guardian ID' : 'Employee ID'} / Email
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={role === 'guardian' ? 'e.g. ANS-GRD-001' : 'e.g. EMP-101'}
                  className="w-full px-5 py-4 bg-slate-50 border border-school-border rounded-2xl focus:ring-2 focus:ring-school-blue outline-none transition-all pl-12 font-medium"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  required
                />
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-school-blue" size={20} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-black text-school-blue uppercase tracking-widest">Password</label>
                <a href="#" className="text-xs font-bold text-school-gold hover:underline uppercase tracking-wider">Forgot?</a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-school-border rounded-2xl focus:ring-2 focus:ring-school-blue outline-none transition-all pl-12 font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-school-blue" size={20} />
              </div>
            </div>
            
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-school-gold text-school-blue rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-school-blue hover:text-white transition-all shadow-lg shadow-black/10"
            >
              Log In as <span className="underline">{role}</span> <ArrowRight size={20} />
            </motion.button>
          </form>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
            <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-3">Demo Access Hints</p>
            <div className="space-y-2 text-left">
              <p className="text-[10px] text-school-blue font-bold">
                <span className="text-school-gold">Super Admin:</span> Use <span className="underline font-black">chotan4480@gmail.com</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                <span className="font-bold text-school-blue">Password:</span> Use any characters for now.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Contact Admin for credentials? <a href="#" className="text-school-blue font-bold hover:underline tracking-tight">Support Desk</a>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest">
          Powered by An-Noor SaaS Management
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
