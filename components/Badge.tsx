
import React from 'react';

interface BadgeProps {
  label: string;
  type: 'category' | 'sentiment' | 'priority' | 'status' | 'confidence';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, type, value }) => {
  const getStyles = () => {
    const val = value.toLowerCase();
    
    if (type === 'confidence') {
      const score = parseFloat(value);
      if (score > 0.8) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      if (score > 0.5) return 'bg-amber-100 text-amber-800 border-amber-300';
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }

    if (type === 'status') {
      if (val === 'needs review') return 'bg-india-post-red text-white border-india-post-red animate-pulse';
      if (val === 'auto approved') return 'bg-[#003366] text-white border-[#003366]';
      return 'bg-slate-100 text-slate-500 border-slate-200';
    }

    if (type === 'priority') {
      if (val.includes('high') || val.includes('urgent')) return 'bg-[#C8102E] text-white border-[#C8102E] shadow-[0_2px_4px_rgba(200,16,46,0.2)]';
      if (val.includes('normal')) return 'bg-[#003366] text-white border-[#003366]';
      return 'bg-slate-100 text-slate-600 border-slate-300';
    }

    if (type === 'sentiment') {
      if (val === 'angry') return 'bg-red-50 text-[#C8102E] border-red-200 font-bold';
      if (val === 'unhappy') return 'bg-orange-50 text-orange-700 border-orange-200';
      if (val === 'positive') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      return 'bg-slate-50 text-slate-500 border-slate-200';
    }

    if (type === 'category') {
      if (val === 'invalid') return 'bg-slate-800 text-white border-black font-black';
      return 'bg-white text-[#003366] border-[#003366]/20 font-bold';
    }
    
    return 'bg-white text-[#003366] border-[#003366]/20 font-bold';
  };

  return (
    <div className="flex flex-col gap-1 min-w-[5rem]">
      <span className="text-[0.5625rem] uppercase font-black tracking-widest text-slate-400">{label}</span>
      <span className={`px-3 py-2 rounded-sm text-[0.5625rem] font-black border uppercase tracking-widest transition-all text-center ${getStyles()}`}>
        {value}
      </span>
    </div>
  );
};
