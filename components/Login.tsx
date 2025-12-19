
import React, { useState } from 'react';
import { Language, translations } from '../translations';
import { UserSession } from '../types';

interface LoginProps {
  lang: Language;
  onLogin: (session: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ lang, onLogin }) => {
  const t = translations[lang];
  const [loginMode, setLoginMode] = useState<'admin' | 'user'>('user');
  const [idValue, setIdValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loginMode === 'admin') {
      // Official: admin / 1245
      if (idValue === 'admin' && password === '1245') {
        onLogin({ customerId: 'admin', role: 'admin', name: 'Post Master' });
      } else {
        setError('Invalid Official Credentials. Ensure Employee ID is "admin" and Password is correct.');
      }
    } else {
      // Citizen: 10-Digit ID & 8-Char Password
      if (idValue.length !== 10 || !/^\d+$/.test(idValue)) {
        setError('Citizen ID must be exactly 10 digits.');
        return;
      }
      if (password.length !== 8) {
        setError('Citizen Password must be exactly 8 characters.');
        return;
      }
      onLogin({ customerId: idValue, role: 'user', name: 'Citizen User' });
    }
  };

  const switchMode = (mode: 'admin' | 'user') => {
    setLoginMode(mode);
    setIdValue('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-slate-200 rounded-sm shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
      {/* Security Header */}
      <div className="bg-[#003366] py-4 px-8 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 016 0v2H7V7z"/></svg>
            <span className="text-[#FFCC00] text-[10px] font-black uppercase tracking-[0.2em]">Secure Access Portal</span>
         </div>
         <span className="text-white/40 text-[9px] font-bold">Ver 4.2.0</span>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button 
          onClick={() => switchMode('user')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${loginMode === 'user' ? 'border-[#003366] text-[#003366] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {t.asUser}
        </button>
        <button 
          onClick={() => switchMode('admin')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${loginMode === 'admin' ? 'border-[#C8102E] text-[#C8102E] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {t.asAdmin}
        </button>
      </div>

      <div className="p-10 relative">
        {/* Ashoka Emblem Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="" className="w-64" />
        </div>

        <div className="text-center mb-8">
          <h2 className={`font-black text-2xl uppercase tracking-tighter mb-1 transition-colors ${loginMode === 'admin' ? 'text-[#C8102E]' : 'text-[#003366]'}`}>
            {loginMode === 'admin' ? 'Post Master Portal' : 'Citizen Grievance Cell'}
          </h2>
          <div className={`w-16 h-1 mx-auto mb-4 transition-colors ${loginMode === 'admin' ? 'bg-[#C8102E]' : 'bg-[#FFCC00]'}`}></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {loginMode === 'admin' ? 'Authorized Officials Only' : 'Official Public Support Access'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#003366] uppercase tracking-widest">
              {loginMode === 'admin' ? t.employeeId : t.citizenId}
            </label>
            <input 
              type="text" 
              maxLength={loginMode === 'admin' ? 10 : 10}
              value={idValue}
              onChange={(e) => { 
                setIdValue(e.target.value); 
                setError(null); 
              }}
              className={`w-full px-4 py-3 border-2 rounded-sm focus:border-[#C8102E] outline-none text-sm font-black transition-all bg-white text-black placeholder:text-slate-400 ${error && error.includes('ID') ? 'border-red-600 bg-red-50' : 'border-black'}`}
              placeholder={loginMode === 'admin' ? "e.g. admin" : "10-Digit Customer ID"}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#003366] uppercase tracking-widest">{t.password}</label>
            <input 
              type="password" 
              maxLength={12}
              value={password}
              onChange={(e) => { 
                setPassword(e.target.value); 
                setError(null); 
              }}
              className={`w-full px-4 py-3 border-2 rounded-sm focus:border-[#C8102E] outline-none text-sm font-black transition-all bg-white text-black placeholder:text-slate-400 ${error && (error.includes('Password') || error.includes('Credentials')) ? 'border-red-600 bg-red-50' : 'border-black'}`}
              placeholder={loginMode === 'admin' ? "e.g. 1245" : "8-Character Password"}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[10px] font-bold text-[#C8102E] uppercase flex items-center gap-2 animate-in slide-in-from-top-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              className={`w-full py-4 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-sm transition-all shadow-xl active:scale-95 border-b-4 border-black/10 ${
                loginMode === 'admin' ? 'bg-[#C8102E] hover:brightness-110' : 'bg-[#003366] hover:brightness-110'
              }`}
            >
              Log In to Dashboard
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Warning: This is a Government of India system. Unauthorized access is prohibited by law. 
          {loginMode === 'admin' 
            ? 'Official credentials required (Employee ID & Password).' 
            : 'Citizen credentials required (10-Digit Customer ID & 8-Char Password).'}
        </p>
      </div>
    </div>
  );
};
