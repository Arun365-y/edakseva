
import React, { useState, useMemo } from 'react';
import { Language, translations } from '../translations';
import { ComplaintRecord, UserSession, PostOrder } from '../types';

interface UserDashboardProps {
  lang: Language;
  session: UserSession;
  history: ComplaintRecord[];
  onAddComplaint: (text: string, subject: string, type: 'Complaint' | 'Feedback', orderId?: string) => void;
  isSubmitting?: boolean;
}

// Larger pool of Indian postal circles and hubs for better diversity
const CITIES = [
  'Mumbai GPO', 'Delhi Head PO', 'Bangalore RMS', 'Chennai GPO', 'Kolkata RMS', 
  'Hyderabad GPO', 'Ahmedabad RMS', 'Pune City PO', 'Jaipur Head PO', 'Lucknow RMS',
  'Patna GPO', 'Bhopal Head PO', 'Chandigarh RMS', 'Guwahati GPO', 'Thiruvananthapuram RMS',
  'Srinagar Head PO', 'Ranchi GPO', 'Bhubaneswar RMS', 'Raipur Head PO', 'Dehradun GPO',
  'Shimla RMS', 'Amritsar Head PO', 'Madurai GPO', 'Kochi RMS', 'Visakhapatnam GPO'
];

const STATUSES: ('In Transit' | 'Delivered' | 'Out for Delivery')[] = [
  'In Transit', 'Delivered', 'Out for Delivery', 'In Transit'
];

// Simple deterministic hash for strings to select unique values from pools
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Generates unique mock data based on user customerId
const getMockOrdersForUser = (customerId: string): PostOrder[] => {
  if (customerId === '1234567890') return []; // Admin doesn't have personal orders
  
  const baseHash = hashString(customerId);
  const orderCount = (baseHash % 3) + 2; // 2 to 4 orders per user
  const orders: PostOrder[] = [];

  for (let i = 0; i < orderCount; i++) {
    const itemSeed = baseHash + (i * 1337);
    const originIdx = itemSeed % CITIES.length;
    // Ensure destination is different from origin
    const destIdx = (itemSeed + 7) % CITIES.length === originIdx 
      ? (itemSeed + 8) % CITIES.length 
      : (itemSeed + 7) % CITIES.length;
    
    const status = STATUSES[itemSeed % STATUSES.length];
    const day = (itemSeed % 28) + 1;
    const trackingPrefix = (itemSeed % 2 === 0) ? 'SP' : 'RP';
    const trackingNum = (itemSeed % 9000000) + 1000000;

    orders.push({
      id: `ORD-${itemSeed % 10000}`,
      trackingId: `${trackingPrefix}${trackingNum}IN`,
      origin: CITIES[originIdx],
      destination: CITIES[destIdx],
      status: status,
      estimatedDelivery: `${day} Oct 2023`
    });
  }

  return orders;
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ lang, session, history, onAddComplaint, isSubmitting }) => {
  const t = translations[lang];
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PostOrder | null>(null);
  const [mode, setMode] = useState<'Complaint' | 'Feedback'>('Complaint');

  // Generate unique orders based on the current user session ID
  const userOrders = useMemo(() => getMockOrdersForUser(session.customerId), [session.customerId]);
  const userComplaints = history.filter(h => h.customerId === session.customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !subject.trim() || isSubmitting) return;
    onAddComplaint(text, subject, mode, selectedOrder?.id);
    setText('');
    setSubject('');
    setSelectedOrder(null);
  };

  const handleModeChange = (newMode: 'Complaint' | 'Feedback', order: PostOrder) => {
    setSelectedOrder(order);
    setMode(newMode);
    setSubject(`${newMode === 'Complaint' ? 'Grievance' : 'Service Feedback'} for ${order.trackingId}`);
    document.getElementById('grievance-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* SECTION: TRACKING DASHBOARD */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-[#C8102E] pb-3 px-1">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-[#C8102E]"></div>
             <h2 className="text-lg font-black text-[#003366] uppercase tracking-[0.1em]">{t.myOrders}</h2>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tracking Session</span>
             <span className="text-[8px] font-bold text-india-post-red uppercase tracking-tighter">ID: {session.customerId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userOrders.map(order => (
            <div 
              key={order.id} 
              className={`bg-white border rounded-sm p-6 transition-all relative overflow-hidden group shadow-sm ${selectedOrder?.id === order.id ? 'border-[#C8102E] ring-1 ring-[#C8102E]/20 bg-red-50/10' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] grayscale pointer-events-none group-hover:scale-110 transition-transform">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" className="w-24" alt="" />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#003366] uppercase tracking-[0.2em]">{t.tracking}</span>
                  <span className="text-sm font-black text-slate-800 tracking-tight">{order.trackingId}</span>
                </div>
                <div className={`text-[8px] font-black px-2.5 py-1 rounded-sm uppercase tracking-widest shadow-sm ${
                  order.status === 'Delivered' ? 'bg-[#003366] text-white' : 'bg-[#FFCC00] text-[#C8102E]'
                }`}>
                  {order.status}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Origin</span>
                    <span className="text-slate-800 truncate pl-2">{order.origin}</span>
                 </div>
                 <div className="h-px bg-slate-100 w-full relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                       <svg className="w-3 h-3 text-[#C8102E]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                    </div>
                 </div>
                 <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Destination</span>
                    <span className="text-slate-800 truncate pl-2">{order.destination}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={() => handleModeChange('Complaint', order)}
                  className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all border ${
                    selectedOrder?.id === order.id && mode === 'Complaint' 
                    ? 'bg-[#C8102E] text-white border-[#C8102E]' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E]'
                  }`}
                >
                  {t.raiseComplaint}
                </button>
                <button 
                  onClick={() => handleModeChange('Feedback', order)}
                  className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all border ${
                    selectedOrder?.id === order.id && mode === 'Feedback' 
                    ? 'bg-[#003366] text-white border-[#003366]' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-[#003366] hover:text-[#003366]'
                  }`}
                >
                  {t.shareFeedback}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: GRIEVANCE CELL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5" id="grievance-form">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl overflow-hidden sticky top-32">
            <div className={`px-8 py-4 border-b-2 flex items-center justify-between ${mode === 'Complaint' ? 'bg-[#C8102E] border-[#C8102E]' : 'bg-[#003366] border-[#003366]'}`}>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2v2zm0-4H9V7h2v2z"/></svg>
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                  {mode === 'Complaint' ? t.registerComplaint : t.shareFeedback}
                </h2>
              </div>
              {selectedOrder && (
                <button onClick={() => {setSelectedOrder(null); setSubject('');}} className="text-[9px] font-black text-[#FFCC00] hover:underline uppercase tracking-widest">
                  Reset Form
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white relative">
              {isSubmitting && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                   <div className="w-12 h-12 border-4 border-india-post-red/20 border-t-india-post-red rounded-full animate-spin mb-4"></div>
                   <h3 className="text-xs font-black text-india-post-red uppercase tracking-widest">{t.aiProcessing}</h3>
                   <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Analyzing grievance & generating instant solution...</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Subject Line</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-sm focus:border-[#C8102E] outline-none text-sm font-black text-[#003366] tracking-tight transition-all"
                  placeholder="Summarize your issue briefly"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">
                  {mode === 'Complaint' ? t.complaintText : 'Service Experience Feedback'}
                </label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-44 px-5 py-5 bg-slate-50 border border-slate-200 rounded-sm focus:border-[#C8102E] outline-none text-sm font-medium resize-none leading-relaxed tracking-tight"
                  placeholder={mode === 'Complaint' ? "Detail the grievance for departmental review..." : "Describe your postal service experience..."}
                  required
                />
              </div>
              <div className="pt-2">
                 <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-sm shadow-2xl transition-all active:scale-95 border-b-4 border-black/10 ${
                      mode === 'Complaint' ? 'bg-[#C8102E] hover:brightness-110' : 'bg-[#003366] hover:brightness-110'
                    } ${isSubmitting ? 'opacity-50 grayscale' : ''}`}
                  >
                    {mode === 'Complaint' ? t.submitComplaint : 'Submit to Cell'}
                  </button>
                  <p className="text-[8px] font-bold text-slate-400 uppercase text-center mt-6 tracking-widest">
                    AI will provide an instant preliminary resolution.
                  </p>
              </div>
            </form>
          </div>
        </div>

        {/* COMPLAINT HISTORY */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border border-slate-200 rounded-sm shadow-lg flex flex-col h-full min-h-[600px]">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em]">{t.myComplaints}</h2>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Records: {userComplaints.length}</span>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 max-h-[800px] bg-[#f8fafc]">
              {userComplaints.length === 0 ? (
                <div className="text-center py-40 opacity-20 italic flex flex-col items-center gap-6">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="" className="h-20 grayscale" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#003366]">Official history empty.</p>
                </div>
              ) : (
                userComplaints.map(complaint => (
                  <div key={complaint.id} className="bg-white border border-slate-200 rounded-sm p-8 space-y-5 hover:border-[#C8102E]/30 transition-all shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                       ID: {complaint.id.split('-')[0]}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm ${complaint.type === 'Complaint' ? 'bg-[#C8102E] text-white' : 'bg-[#003366] text-white'}`}>
                             {complaint.type || 'Complaint'}
                           </span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(complaint.timestamp).toLocaleString()}</span>
                        </div>
                        <h3 className="text-base font-black text-[#003366] uppercase tracking-tighter leading-tight">{complaint.subject}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`px-4 py-2 border rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                          complaint.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {complaint.status === 'sent' ? 'RESOLVED' : 'PENDING OFFICIAL REVIEW'}
                        </div>
                        {complaint.status !== 'sent' && (
                          <span className="text-[8px] font-bold text-[#C8102E] uppercase animate-pulse">Post Master follow-up active</span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-l-4 border-slate-300 rounded-sm text-xs text-slate-600 leading-[1.8] font-medium italic">
                      "{complaint.originalText}"
                    </div>
                    
                    <div className="space-y-6 mt-4">
                       {complaint.aiResponse && (
                         <div className="pt-6 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="bg-[#003366] p-1.5 rounded-sm shadow-lg">
                                    <svg className="w-4 h-4 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                                 </div>
                                 <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em]">Instant Preliminary AI Resolution</h4>
                               </div>
                            </div>
                            <div className="p-8 bg-white text-[13px] leading-[2] text-slate-700 whitespace-pre-wrap rounded-sm border border-slate-100 shadow-inner font-serif relative">
                               {complaint.aiResponse}
                               <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300">
                                  <span className="uppercase">Generated by e_DakSeva AI v4.0</span>
                                  <span className="uppercase">Automated Desk</span>
                               </div>
                            </div>
                         </div>
                       )}

                       {complaint.status === 'sent' && complaint.adminResponse && (
                         <div className="pt-6 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="bg-[#C8102E] p-1.5 rounded-sm shadow-lg">
                                    <svg className="w-4 h-4 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                                 </div>
                                 <h4 className="text-[10px] font-black text-[#C8102E] uppercase tracking-[0.2em]">Official Departmental Response</h4>
                               </div>
                            </div>
                            <div className="p-8 bg-white text-[13px] leading-[2] text-slate-900 whitespace-pre-wrap rounded-sm border border-[#C8102E]/20 shadow-xl font-serif relative ring-2 ring-india-post-red/5">
                               {complaint.adminResponse}
                               <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-india-post-red">
                                  <span className="uppercase">Official Digital Signature Verified</span>
                                  <span className="uppercase">Dept of Posts India</span>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
