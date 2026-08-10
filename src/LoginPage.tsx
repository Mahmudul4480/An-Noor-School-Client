import React from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, UserCheck, Shield, BookOpen, GraduationCap, Calculator } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from './types';
import {
  demoLogin,
  firebaseLogin,
  getFirebaseAuthErrorMessage,
  isDemoLoginEnabled,
} from './lib/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = React.useState<UserRole>('guardian');
  const [formData, setFormData] = React.useState({
    userId: '',
    password: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const roles = [
    { id: 'guardian', label: 'Guardian', icon: <GraduationCap size={18} /> },
    { id: 'teacher', label: 'Teacher', icon: <BookOpen size={18} /> },
    { id: 'accounts', label: 'Accounts', icon: <Calculator size={18} /> },
    { id: 'principal', label: 'Principal', icon: <Shield size={18} /> },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isDemoLoginEnabled) {
        demoLogin(formData.userId, role);
      } else {
        await firebaseLogin(formData.userId, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
                y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                rotate: { type: 'tween', duration: 0.5 },
                scale: { type: 'spring', stiffness: 400 },
              }}
            />
            <div className="text-center">
              <h1 className="text-2xl font-black text-school-blue leading-none tracking-tighter uppercase">
                An-Noor
              </h1>
              <p className="text-[12px] text-school-muted font-black uppercase tracking-widest mt-1">
                International School System
              </p>
            </div>
          </Link>
          <h2 className="text-3xl font-black text-school-blue uppercase tracking-tight">
            SaaS Management
          </h2>
          <p className="text-school-muted mt-2 font-medium">Unified portal for all stakeholders</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border">
            {isDemoLoginEnabled ? (
              <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-3 py-1 rounded-full">
                Demo Mode — All dashboards accessible
              </span>
            ) : (
              <span className="text-school-blue bg-blue-50 border-school-border px-3 py-1 rounded-full">
                Production — Firebase Auth
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border-2 border-school-border">
          {isDemoLoginEnabled && (
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
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-black text-school-blue uppercase tracking-widest mb-2">
                {isDemoLoginEnabled
                  ? role === 'guardian'
                    ? 'Guardian ID / Email'
                    : 'Employee ID / Email'
                  : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type={isDemoLoginEnabled ? 'text' : 'email'}
                  placeholder={
                    isDemoLoginEnabled
                      ? role === 'guardian'
                        ? 'e.g. ANS-GRD-001'
                        : 'e.g. EMP-101'
                      : 'you@example.com'
                  }
                  className="w-full px-5 py-4 bg-slate-50 border border-school-border rounded-2xl focus:ring-2 focus:ring-school-blue outline-none transition-all pl-12 font-medium"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  disabled={loading}
                />
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-school-blue" size={20} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-black text-school-blue uppercase tracking-widest">
                  Password
                </label>
                {!isDemoLoginEnabled && (
                  <a href="#" className="text-xs font-bold text-school-gold hover:underline uppercase tracking-wider">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-school-border rounded-2xl focus:ring-2 focus:ring-school-blue outline-none transition-all pl-12 font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isDemoLoginEnabled}
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-school-blue" size={20} />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
              className="w-full py-4 bg-school-gold text-school-blue rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-school-blue hover:text-white transition-all shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Signing in...'
              ) : isDemoLoginEnabled ? (
                <>
                  Log In as <span className="underline">{role}</span> <ArrowRight size={20} />
                </>
              ) : (
                <>
                  Log In <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {isDemoLoginEnabled && (
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-school-muted uppercase tracking-widest mb-3">
                Demo Access Hints
              </p>
              <div className="space-y-2 text-left">
                <p className="text-[10px] text-school-blue font-bold">
                  <span className="text-school-gold">Super Admin:</span> Use{' '}
                  <span className="underline font-black">chotan4480@gmail.com</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  <span className="font-bold text-school-blue">All dashboards:</span> Super Admin login
                  করে Guardian, Teacher, Accounts, Principal — সব portal দেখতে পারবেন।
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  <span className="font-bold text-school-blue">Password:</span> যেকোনো character ব্যবহার
                  করুন।
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Contact Admin for credentials?{' '}
              <a href="#" className="text-school-blue font-bold hover:underline tracking-tight">
                Support Desk
              </a>
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
