import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('bodya@databasik.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center items-center p-6 relative overflow-hidden text-slate-100">
      {/* Background Neon Glowing Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-bg-card rounded-3xl border border-accent-darkBorder p-8 shadow-2xl shadow-black relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-blue via-brand-sky to-brand-cyan rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-blue/30">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to Data Basik</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Cloud Database Management Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky transition-all placeholder:text-slate-600"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-bg-main text-brand-blue focus:ring-brand-sky" />
              Remember me
            </label>
            <a href="#forgot" className="text-brand-sky hover:underline font-semibold">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-accent-darkBorder flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Gateway • JWT & Vault Secured</span>
        </div>
      </div>
    </div>
  );
};
