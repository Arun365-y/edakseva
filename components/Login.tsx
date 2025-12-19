
import React, { useState } from 'react';
import { Language, translations } from '../translations';
import { UserSession } from '../types';

interface LoginProps {
  lang: Language;
  onLogin: (session: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ lang, onLogin }) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === '1245') {
      setError(null);
      onLogin({ email: 'admin@indiapost.gov.in', role: 'admin', name: 'Post Master' });
    } else {
      setError('Invalid Official Credentials. Access Denied.');
    }
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Citizens must provide registered email/mobile and password.');
      return;
    }
    setError(null);
    onLogin({ email: email, role: 'user', name: 'Citizen User' });
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-slate-200 rounded-sm shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
      {/* Security Header */}
      <div className="bg-[#003366] py-4 px-8 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"/></svg>
            <span className="text-[#FFCC00] text-[10px] font-black uppercase tracking-[0.2em]">Secure Access Portal</span>
         </div>
         <span className="text-white/40 text-[9px] font-bold">Ver 4.0.2</span>
      </div>

      <div className="p-10 relative">
        {/* Ashoka Emblem Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="" className="w-64" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-[#C8102E] font-black text-2xl uppercase tracking-tighter mb-1">{t.login}</h2>
          <div className="w-16 h-1 bg-[#FFCC00] mx-auto mb-4"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official e_DakSeva Gateway</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#003366] uppercase tracking-widest">{t.email}</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={`w-full px-4 py-3 border-2 rounded-sm focus:border-[#C8102E] outline-none text-sm font-black transition-all bg-white text-black placeholder:text-slate-400 ${error ? 'border-red-600 bg-red-50' : 'border-black'}`}
              placeholder="Username / Email ID"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#003366] uppercase tracking-widest">{t.password}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={`w-full px-4 py-3 border-2 rounded-sm focus:border-[#C8102E] outline-none text-sm font-black transition-all bg-white text-black placeholder:text-slate-400 ${error ? 'border-red-600 bg-red-50' : 'border-black'}`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[10px] font-bold text-[#C8102E] uppercase flex items-center gap-2 animate-in slide-in-from-top-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
              {error}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={handleAdminLogin}
              className="w-full py-3.5 bg-[#C8102E] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all shadow-xl active:scale-95 border-b-4 border-black/10"
            >
              {t.asAdmin}
            </button>
            <div className="flex items-center gap-3 py-2">
               <div className="flex-1 h-px bg-slate-100"></div>
               <span className="text-[9px] font-black text-slate-300 uppercase">Public Login</span>
               <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            <button 
              onClick={handleUserLogin}
              className="w-full py-3.5 bg-[#003366] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all shadow-xl active:scale-95 border-b-4 border-black/10"
            >
              {t.asUser}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Warning: This is a Government of India system. Unauthorized access is prohibited by law. 
          Use your registered Post Office credentials for official access.
        </p>
      </div>
    </div>
  );
};
