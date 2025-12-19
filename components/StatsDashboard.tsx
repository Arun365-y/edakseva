
import React, { useEffect, useState, useMemo } from 'react';
import { Language, translations } from '../translations';
import { ComplaintRecord, PriorityLevel, ComplaintCategory } from '../types';

interface StatsDashboardProps {
  lang: Language;
  history: ComplaintRecord[];
  onBack: () => void;
}

// Helper to generate SVG pie slice path
const getPiePath = (startAngle: number, endAngle: number, radius: number) => {
  const x1 = radius + radius * Math.cos((Math.PI * startAngle) / 180);
  const y1 = radius + radius * Math.sin((Math.PI * startAngle) / 180);
  const x2 = radius + radius * Math.cos((Math.PI * endAngle) / 180);
  const y2 = radius + radius * Math.sin((Math.PI * endAngle) / 180);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ lang, history, onBack }) => {
  const t = translations[lang];
  const [animate, setAnimate] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'tactical'>('overview');

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Aggregated Stats
  const stats = useMemo(() => {
    const total = history.length;
    const resolvedItems = history.filter(h => h.status === 'sent' || h.status === 'resolved' || h.status === 'auto_resolved');
    const pendingItems = history.filter(h => h.status === 'drafted' || h.status === 'pending');
    
    const resolved = resolvedItems.length;
    const inProgress = pendingItems.length;
    const critical = history.filter(h => h.priority === PriorityLevel.HIGH && h.status !== 'sent').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Breakdown by Category
    const categoryStats = Object.values(ComplaintCategory).reduce((acc, cat) => {
      const catHistory = history.filter(h => h.category === cat);
      acc[cat] = {
        total: catHistory.length,
        resolved: catHistory.filter(h => h.status === 'sent' || h.status === 'resolved' || h.status === 'auto_resolved').length,
        pending: catHistory.filter(h => h.status === 'drafted' || h.status === 'pending').length
      };
      return acc;
    }, {} as Record<string, { total: number; resolved: number; pending: number }>);

    return { total, resolved, inProgress, critical, resolutionRate, categoryStats };
  }, [history]);

  // Pie Chart Data Prep
  const pieData = useMemo(() => {
    let currentAngle = -90; // Start from top
    const total = stats.total || 1;
    const colors: Record<string, string> = {
      [ComplaintCategory.DELIVERY_DELAY]: '#f59e0b', // Amber
      [ComplaintCategory.LOST_PACKAGE]: '#ef4444',    // Red
      [ComplaintCategory.DAMAGED_PARCEL]: '#f97316',  // Orange
      [ComplaintCategory.OTHERS]: '#3b82f6',          // Blue
      [ComplaintCategory.INVALID]: '#475569'          // Slate
    };

    // Fix: Explicitly type the entries in the map function to ensure TypeScript correctly identifies the 'total' property.
    return Object.entries(stats.categoryStats).map(([cat, val]: [string, { total: number; resolved: number; pending: number }]) => {
      const sliceAngle = (val.total / total) * 360;
      const data = {
        category: cat,
        count: val.total,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        color: colors[cat] || '#cbd5e1'
      };
      currentAngle += sliceAngle;
      return data;
    });
  }, [stats]);

  // Donut Chart Calculations (Resolved vs Pending)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const resolvedOffset = circumference - (stats.resolved / (stats.total || 1)) * circumference;
  const pendingOffset = circumference - (stats.inProgress / (stats.total || 1)) * circumference;

  const locationCounts = history.reduce((acc, curr) => {
    const loc = curr.location || 'Unspecified Circle';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  const maxLocCount = sortedLocations.length > 0 ? sortedLocations[0][1] : 1;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 space-y-8 bg-[#f8fafc] p-6 rounded-sm border-2 border-slate-200 shadow-2xl min-h-[80vh] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none select-none z-0">
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-slate-900"></div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between border-b-2 border-slate-200 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-india-post-red p-2.5 rounded-sm shadow-lg">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth={2}/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">e_Dak Analytics Dashboard</h2>
            <div className="flex items-center gap-2">
              <p className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-[0.3em]">Centralized National Performance Monitoring</p>
              <div className="px-2 py-0.5 bg-india-post-red text-white text-[0.5rem] font-black uppercase rounded-sm">v4.6 Pie_Eng</div>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-sm shadow-sm">
           <button 
             onClick={() => setViewMode('overview')}
             className={`px-6 py-2 text-[0.625rem] font-black uppercase tracking-widest transition-all rounded-sm ${viewMode === 'overview' ? 'bg-[#003366] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Executive Overview
           </button>
           <button 
             onClick={() => setViewMode('tactical')}
             className={`px-6 py-2 text-[0.625rem] font-black uppercase tracking-widest transition-all rounded-sm ${viewMode === 'tactical' ? 'bg-[#003366] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Tactical Breakdown
           </button>
        </div>

        <button 
          onClick={onBack}
          className="px-8 py-3 bg-white border-2 border-slate-100 text-[#003366] text-[0.625rem] font-black uppercase tracking-widest hover:bg-india-post-red hover:text-white hover:border-india-post-red transition-all rounded-sm shadow-xl active:scale-95"
        >
          {t.backToHome}
        </button>
      </div>

      {viewMode === 'overview' ? (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* New Category Pie Chart Section */}
          <div className="lg:col-span-6 bg-white p-8 rounded-sm shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 flex flex-col items-center">
              <h3 className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Complaint Distribution (Pie)</h3>
              <div className="relative w-56 h-56">
                <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100">
                  {pieData.map((slice, i) => (
                    <path
                      key={i}
                      d={getPiePath(slice.startAngle, slice.endAngle, 50)}
                      fill={slice.color}
                      className={`transition-all duration-1000 ease-out origin-center ${animate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                      style={{ transitionDelay: `${i * 150}ms` }}
                    />
                  ))}
                  {/* Inner overlay for branding */}
                  <circle cx="50" cy="50" r="10" fill="white" className="opacity-20" />
                </svg>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-[0.5rem] font-black text-slate-300 uppercase tracking-widest border-b pb-2 mb-4">Metric Legend</p>
              {pieData.filter(s => s.count > 0).map((slice, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
                    <span className="text-[0.625rem] font-black text-slate-700 uppercase group-hover:text-india-post-red transition-colors">{slice.category}</span>
                  </div>
                  <span className="text-[0.6875rem] font-black text-slate-400">{Math.round((slice.count / (stats.total || 1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div className="grid grid-cols-2 gap-8">
               {/* Small Donut for Resolved Status */}
               <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <h3 className="text-[0.5rem] font-black text-slate-400 uppercase tracking-widest mb-4">Resolution Split</h3>
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={animate ? resolvedOffset : circumference} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800">{stats.resolutionRate}%</span>
                    </div>
                  </div>
                  <p className="text-[0.5rem] font-black text-emerald-600 uppercase mt-4">Solved Success</p>
               </div>

               {/* Stats Summary Cards */}
               <div className="space-y-4">
                  <div className="bg-india-post-red p-6 text-white rounded-sm shadow-lg">
                    <p className="text-[0.5rem] font-black uppercase opacity-60">Escalated</p>
                    <h4 className="text-3xl font-black">{stats.critical}</h4>
                  </div>
                  <div className="bg-[#003366] p-6 text-white rounded-sm shadow-lg">
                    <p className="text-[0.5rem] font-black uppercase opacity-60">Active Queue</p>
                    <h4 className="text-3xl font-black">{stats.inProgress}</h4>
                  </div>
               </div>
            </div>

            {/* Regional Monitor (Condensed) */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-100">
               <h3 className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-6">Regional Strain Monitor</h3>
               <div className="space-y-4">
                  {sortedLocations.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-4">
                      <span className="text-[0.5rem] font-black text-slate-500 uppercase w-20 truncate">{name}</span>
                      <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden border">
                         <div className="h-full bg-india-post-red transition-all duration-1000" style={{ width: animate ? `${((count as number) / (maxLocCount as number)) * 100}%` : '0%' }}></div>
                      </div>
                      <span className="text-[0.5rem] font-black text-slate-400">{(count as number)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Tactical View Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Solved Statistics by Category */}
            <div className="bg-white p-8 border border-slate-100 rounded-sm shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[0.625rem] font-black text-[#003366] uppercase tracking-[0.3em]">Solved Dispersion (By Category)</h3>
                 <span className="text-[0.5rem] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-sm">High Success Rates</span>
              </div>
              <div className="space-y-6">
                {Object.entries(stats.categoryStats).map(([cat, val]) => {
                  const v = val as { total: number; resolved: number; pending: number };
                  return (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[0.625rem] font-black text-slate-800 uppercase flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          {cat}
                        </span>
                        <span className="text-[0.5625rem] font-bold text-slate-400 uppercase">{v.resolved} / {v.total} Solved</span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                          style={{ width: animate ? `${(v.resolved / (v.total || 1)) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Statistics by Category */}
            <div className="bg-white p-8 border border-slate-100 rounded-sm shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[0.625rem] font-black text-[#C8102E] uppercase tracking-[0.3em]">Pending Bottlenecks (Active Queue)</h3>
                 <span className="text-[0.5rem] font-bold text-india-post-red uppercase bg-red-50 px-2 py-0.5 rounded-sm">Action Required</span>
              </div>
              <div className="space-y-6">
                {Object.entries(stats.categoryStats).map(([cat, val]) => {
                  const v = val as { total: number; resolved: number; pending: number };
                  return (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[0.625rem] font-black text-slate-800 uppercase flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-india-post-red rounded-full"></div>
                          {cat}
                        </span>
                        <span className="text-[0.5625rem] font-bold text-slate-400 uppercase">{v.pending} Cases Active</span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-india-post-red to-orange-500 transition-all duration-1000 ease-out"
                          style={{ width: animate ? `${(v.pending / (v.total || 1)) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI-Driven Resolution Roadmap */}
          <div className="bg-[#003366] text-white p-10 rounded-sm shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM5 10a1 1 0 11-2 0 1 1 0 012 0zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/></svg>
             </div>
             <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                <div className="lg:w-1/3">
                   <h3 className="text-2xl font-black text-[#FFCC00] uppercase tracking-tighter mb-2">Resolution Roadmap</h3>
                   <p className="text-xs text-white/60 font-medium leading-relaxed uppercase tracking-widest">Strategic AI intelligence to optimize queue processing and hit National Performance Benchmarks.</p>
                </div>
                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                   <div className="bg-white/5 border border-white/10 p-6 rounded-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[0.6rem] font-bold">1</div>
                        <h4 className="text-[0.625rem] font-black uppercase tracking-widest text-emerald-400">Clear Low-Hanging Fruit</h4>
                      </div>
                      <p className="text-[0.6875rem] font-bold text-white/80 leading-relaxed uppercase">Process the {stats.categoryStats['Others']?.pending || 0} 'Others' category complaints using Auto-Response Templates to reduce load by {Math.round((stats.categoryStats['Others']?.pending || 0) / (stats.inProgress || 1) * 100)}% immediately.</p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-6 rounded-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-india-post-red flex items-center justify-center text-[0.6rem] font-bold">2</div>
                        <h4 className="text-[0.625rem] font-black uppercase tracking-widest text-red-400">Escalate Delay Bottlenecks</h4>
                      </div>
                      <p className="text-[0.6875rem] font-bold text-white/80 leading-relaxed uppercase">Coordinate with the {sortedLocations[0]?.[0] || 'Top'} Circle to resolve {stats.categoryStats['Delay']?.pending || 0} Delay cases. Target: 24-hour turnaround for tracking verification.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Real-time Ticker Style Status Bar */}
      <div className="relative z-10 bg-white border border-slate-100 p-4 rounded-sm flex items-center justify-between shadow-inner">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <span className="text-[0.5rem] font-black text-slate-400 uppercase">Live Queue:</span>
               <span className="text-[0.5625rem] font-black text-india-post-red uppercase px-2 py-0.5 bg-red-50 rounded-sm">Active Feed</span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
               <span className="text-[0.5rem] font-black text-slate-400 uppercase">Gateway:</span>
               <span className="text-[0.5625rem] font-black text-[#003366] uppercase">Postal Core v4.6</span>
            </div>
         </div>
         <div className="text-[0.5rem] font-black text-slate-300 uppercase italic">Last Refreshed: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};
