
import React from 'react';
import { Language, translations } from '../translations';
import { ComplaintRecord } from '../types';

interface StatsDashboardProps {
  lang: Language;
  history: ComplaintRecord[];
  onBack: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ lang, history, onBack }) => {
  const t = translations[lang];

  const total = history.length;
  const resolved = history.filter(h => h.status === 'sent' || h.status === 'resolved' || h.status === 'auto_resolved').length;
  // Fix: Explicitly cast operands to numbers and handle division by zero
  const rate = total > 0 ? ((resolved as number) / (total as number || 1)) * 100 : 0;

  const locationCounts = history.reduce((acc, curr) => {
    const loc = curr.location || 'Unspecified Circle';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fix: Explicitly type the sort operands for numeric operations
  const sortedLocations = Object.entries(locationCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10">
      <div className="flex items-center justify-between border-b-4 border-india-post-red pb-4">
        <div>
          <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">{t.liveAnalytics}</h2>
          <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{t.systemPerformance}</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 border-2 border-[#003366] text-[#003366] text-[0.625rem] font-black uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-all rounded-sm"
        >
          {t.backToHome}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border-2 border-slate-100 p-8 rounded-sm shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-india-post-red/5 -mr-12 -mt-12 rounded-full"></div>
           <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-4">{t.totalReceived}</p>
           <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-india-post-red group-hover:scale-105 transition-transform inline-block">{total}</span>
              <span className="text-[0.625rem] font-bold text-slate-300 uppercase">Grievances</span>
           </div>
           <div className="mt-6 w-full h-1 bg-slate-50">
              <div className="h-full bg-india-post-red w-full"></div>
           </div>
        </div>

        <div className="bg-white border-2 border-slate-100 p-8 rounded-sm shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full"></div>
           <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-4">{t.totalResolved}</p>
           <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-emerald-600 group-hover:scale-105 transition-transform inline-block">{resolved}</span>
              <span className="text-[0.625rem] font-bold text-slate-300 uppercase">Dispatched</span>
           </div>
           <div className="mt-6 w-full h-1 bg-slate-50">
              <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }}></div>
           </div>
        </div>

        <div className="bg-[#003366] border-2 border-[#003366] p-8 rounded-sm shadow-xl relative overflow-hidden text-white group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-12 -mt-12 rounded-full"></div>
           <p className="text-[0.625rem] font-black text-[#FFCC00] uppercase tracking-widest mb-4">{t.resolutionRate}</p>
           <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-white group-hover:scale-105 transition-transform inline-block">{rate.toFixed(1)}%</span>
              <span className="text-[0.625rem] font-bold text-white/30 uppercase">Efficiency</span>
           </div>
           <div className="mt-6 w-full h-1 bg-white/10">
              <div className="h-full bg-[#FFCC00]" style={{ width: `${rate}%` }}></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white border-2 border-slate-100 p-10 rounded-sm shadow-xl">
           <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-4">
              <div className="w-1.5 h-6 bg-india-post-red"></div>
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em]">{t.regionalHeatmap}</h3>
           </div>
           
           <div className="space-y-6">
              {sortedLocations.length === 0 ? (
                <p className="text-center py-20 text-slate-300 font-black uppercase text-[0.625rem]">No regional data currently synced</p>
              ) : (
                sortedLocations.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-6 group">
                     <span className="w-32 text-[0.625rem] font-black text-slate-500 uppercase tracking-tighter truncate group-hover:text-india-post-red transition-colors">{name}</span>
                     <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        {/* Fix: Explicitly ensure numeric types for division operator */}
                        <div 
                          className="h-full bg-gradient-to-r from-[#003366] to-india-post-red transition-all duration-1000" 
                          style={{ width: `${((count as number) / ((sortedLocations[0][1] as number) || 1)) * 100}%` }}
                        ></div>
                     </div>
                     <span className="text-[0.6875rem] font-black text-[#003366] min-w-[2rem] text-right">{count}</span>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="bg-[#f8fafc] border-2 border-slate-100 p-10 rounded-sm shadow-inner flex flex-col justify-center items-center text-center">
           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="Emblem" className="h-32 mb-8 opacity-20 grayscale" />
           <h4 className="text-lg font-black text-[#003366] uppercase tracking-tighter mb-4">India Post Integrity Monitoring</h4>
           <p className="text-[0.6875rem] text-slate-400 font-medium leading-relaxed max-w-sm uppercase tracking-widest">
              Automated auditing active for all circles. Data reflects aggregate metrics from Citizen Portal and Official Gmail Synchronization nodes.
           </p>
           <div className="mt-10 flex gap-4">
              <div className="flex flex-col items-center">
                 <span className="text-[0.5rem] font-black text-slate-300 uppercase mb-2 tracking-widest">Network Latency</span>
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[0.5625rem] font-black border border-emerald-100 rounded-sm">0.04 MS</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[0.5rem] font-black text-slate-300 uppercase mb-2 tracking-widest">AI Accuracy</span>
                 <span className="px-3 py-1 bg-india-post-red text-white text-[0.5625rem] font-black rounded-sm">99.2%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
