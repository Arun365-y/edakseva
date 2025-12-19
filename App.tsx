
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Badge } from './components/Badge';
import { Login } from './components/Login';
import { UserDashboard } from './components/UserDashboard';
import { StatsDashboard } from './components/StatsDashboard';
import { ChatWidget } from './components/ChatWidget';
import { geminiService } from './services/geminiService';
import { emailService } from './services/emailService';
import { AnalysisResult, ComplaintRecord, UserSession, PriorityLevel } from './types';
import { Language, translations } from './translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [session, setSession] = useState<UserSession | null>(null);
  const [fontSize, setFontSize] = useState<number>(100);
  const [showPublicStats, setShowPublicStats] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  
  const [currentRecord, setCurrentRecord] = useState<ComplaintRecord | null>(null);
  const [history, setHistory] = useState<ComplaintRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [adminSource, setAdminSource] = useState<'portal' | 'gmail'>('portal');

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('dak_seva_gmail_sync_v4_1');
    const savedLang = localStorage.getItem('dak_seva_lang') as Language;
    const savedSession = localStorage.getItem('dak_seva_session_v4_1');
    const savedFontSize = localStorage.getItem('dak_seva_font_size');
    
    if (savedLang) setLang(savedLang);
    if (savedSession) setSession(JSON.parse(savedSession));
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dak_seva_gmail_sync_v4_1', JSON.stringify(history));
    localStorage.setItem('dak_seva_lang', lang);
    localStorage.setItem('dak_seva_font_size', fontSize.toString());
    if (session) localStorage.setItem('dak_seva_session_v4_1', JSON.stringify(session));
    else localStorage.removeItem('dak_seva_session_v4_1');
  }, [history, lang, session, fontSize]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const incoming = await emailService.fetchIncomingComplaints();
      const newMails = incoming.map(mail => ({
        ...mail, 
        customerId: mail.customerEmail, 
        source: 'gmail'
      })).filter(mail => !history.find(h => h.id === mail.id));
      
      if (newMails.length > 0) {
        setHistory(prev => [...newMails, ...prev]);
        setAdminSource('gmail');
        setActiveTab('inbox');
      }
    } catch (err) {
      setError("Failed to connect to Gmail servers.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectRecord = async (record: ComplaintRecord) => {
    setCurrentRecord(record);
    setIsEditing(false);
    
    if (record.status !== 'pending' && record.status !== 'auto_resolved') return;
    if (record.formalEmailDraft) return; 
    
    setIsAnalyzing(true);
    setError(null);
    setProcessingStep(1);

    try {
      await new Promise(r => setTimeout(r, 600)); setProcessingStep(2); 
      await new Promise(r => setTimeout(r, 800)); setProcessingStep(3); 
      
      const analysis = await geminiService.analyzeComplaint(record.originalText);
      await new Promise(r => setTimeout(r, 400)); setProcessingStep(4); 
      await new Promise(r => setTimeout(r, 400)); setProcessingStep(5); 
      
      const formalDraft = await geminiService.generateEmailResponse(
        record.originalText,
        analysis.category,
        analysis.sentiment,
        analysis.priority,
        lang
      );
      
      const updatedRecord: ComplaintRecord = {
        ...record,
        ...analysis,
        status: analysis.requiresReview ? 'drafted' : 'pending',
        formalEmailDraft: formalDraft,
        aiResponse: formalDraft,
        timestamp: record.timestamp
      };

      setCurrentRecord(updatedRecord);
      setHistory(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
    } catch (err) {
      console.error(err);
      setError("Workflow engine encountered an error.");
    } finally {
      setIsAnalyzing(false);
      setProcessingStep(0);
    }
  };

  const startEditing = () => {
    if (currentRecord?.formalEmailDraft) {
      setEditedDraft(currentRecord.formalEmailDraft);
      setIsEditing(true);
    }
  };

  const saveEditedDraft = () => {
    if (currentRecord) {
      const updated = { ...currentRecord, formalEmailDraft: editedDraft };
      setCurrentRecord(updated);
      setHistory(prev => prev.map(r => r.id === currentRecord.id ? updated : r));
      setIsEditing(false);
    }
  };

  const handleDispatchResponse = async () => {
    if (!currentRecord || !currentRecord.formalEmailDraft) return;
    setIsSending(true);
    try {
      if (currentRecord.source === 'gmail') {
        await emailService.sendAutomatedResponse(
          currentRecord.customerId,
          currentRecord.subject,
          currentRecord.formalEmailDraft
        );
      }
      
      const updatedRecord: ComplaintRecord = {
        ...currentRecord,
        status: 'sent',
        adminResponse: currentRecord.formalEmailDraft, 
        timestamp: Date.now()
      };
      
      setCurrentRecord(updatedRecord);
      setHistory(prev => prev.map(r => r.id === currentRecord.id ? updatedRecord : r));
    } catch (err) {
      setError("Failed to dispatch response.");
    } finally {
      setIsSending(false);
    }
  };

  const handleUserAddComplaint = async (text: string, subject: string, type: 'Complaint' | 'Feedback', orderId?: string) => {
    if (!session) return;
    setIsUserSubmitting(true);
    setError(null);

    const tempId = crypto.randomUUID();
    const initialRecord: ComplaintRecord = {
      id: tempId,
      originalText: text,
      subject: subject,
      customerId: session.customerId,
      timestamp: Date.now(),
      status: 'pending', 
      type: type,
      orderId: orderId,
      source: 'portal',
      location: 'Delhi Circle' 
    };

    try {
      const analysis = await geminiService.analyzeComplaint(text);
      const instantAiResponse = await geminiService.generateEmailResponse(
        text,
        analysis.category,
        analysis.sentiment,
        analysis.priority,
        lang
      );

      const completedRecord: ComplaintRecord = {
        ...initialRecord,
        ...analysis,
        status: 'pending', 
        aiResponse: instantAiResponse, 
        formalEmailDraft: instantAiResponse 
      };

      setHistory(prev => [completedRecord, ...prev]);
    } catch (err) {
      console.error("Submission Analysis Failed:", err);
      setHistory(prev => [initialRecord, ...prev]);
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentRecord(null);
    setIsEditing(false);
    setShowPublicStats(false);
    localStorage.removeItem('dak_seva_session_v4_1');
  };

  const adminFilteredHistory = history.filter(r => 
    r.source === adminSource && (activeTab === 'inbox' ? r.status !== 'sent' : r.status === 'sent')
  );

  const stats = {
    total: history.length,
    pending: history.filter(h => h.status === 'pending' || h.status === 'drafted').length,
    solved: history.filter(h => h.status === 'sent' || h.status === 'resolved' || h.status === 'auto_resolved').length,
    urgent: history.filter(h => h.priority === PriorityLevel.HIGH && h.status !== 'sent').length
  };

  const locationCounts = history.reduce((acc, curr) => {
    const loc = curr.location || 'Unspecified Circle';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fix: Explicitly type the sort operands to avoid "arithmetic operation must be type any, number..." errors
  const sortedLocations = Object.entries(locationCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
  const highestLocation = sortedLocations.length > 0 ? sortedLocations[0] : null;
  const lowestLocation = sortedLocations.length > 0 ? sortedLocations[sortedLocations.length - 1] : null;
  const topCircles = sortedLocations.slice(0, 3);

  const renderContent = () => {
    if (!session) {
      return <Login lang={lang} onLogin={setSession} />;
    }

    if (showPublicStats && session.role === 'admin') {
      return <StatsDashboard lang={lang} history={history} onBack={() => setShowPublicStats(false)} />;
    }

    if (session.role === 'user') {
      return (
        <UserDashboard 
          lang={lang} 
          session={session} 
          history={history} 
          onAddComplaint={handleUserAddComplaint}
          isSubmitting={isUserSubmitting}
        />
      );
    }

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 bg-white border-2 border-slate-100 p-6 rounded-sm shadow-sm flex flex-col justify-between">
              <div>
                 <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Inbound Traffic</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#003366]">{stats.total}</span>
                    <span className="text-[0.625rem] font-bold text-slate-400 uppercase">Total Received</span>
                 </div>
              </div>
              <div className="mt-8 space-y-3">
                 <div className="flex justify-between items-center text-[0.6875rem] font-bold">
                    <span className="text-india-post-red uppercase tracking-tighter">● Pending Action</span>
                    <span className="text-india-post-red">{stats.pending}</span>
                 </div>
                 <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    {/* Fix: Added explicit casting and fallback for division to resolve arithmetic type errors */}
                    <div className="h-full bg-india-post-red" style={{ width: `${stats.total > 0 ? ((stats.pending as number) / (stats.total as number || 1)) * 100 : 0}%` }}></div>
                 </div>
                 <div className="flex justify-between items-center text-[0.6875rem] font-bold">
                    <span className="text-emerald-600 uppercase tracking-tighter">● Resolved Solution</span>
                    <span className="text-emerald-600">{stats.solved}</span>
                 </div>
                 <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    {/* Fix: Added explicit casting and fallback for division to resolve arithmetic type errors */}
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.total > 0 ? ((stats.solved as number) / (stats.total as number || 1)) * 100 : 0}%` }}></div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#003366] text-white p-6 rounded-sm shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-india-post-red/10 -ml-12 -mb-12 rounded-full blur-2xl"></div>
               <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <h3 className="text-[0.625rem] font-black uppercase tracking-widest text-[#FFCC00]">Regional Stress (Inbound Circles)</h3>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-india-post-red animate-pulse"></div>
                     <span className="text-[0.5rem] font-bold text-white/40 uppercase">Real-time Feed</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <p className="text-[0.5625rem] font-black text-white/40 uppercase tracking-widest mb-3">Highest Complaining State</p>
                     {highestLocation ? (
                       <div className="flex flex-col gap-1">
                          <span className="text-xl font-black uppercase text-india-post-red tracking-tight leading-none">{highestLocation[0]}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[0.625rem] font-black bg-india-post-red px-2 py-0.5 rounded-sm">{highestLocation[1]} Hits</span>
                             <span className="text-[0.5rem] font-bold text-white/20 uppercase tracking-widest">Inundated</span>
                          </div>
                       </div>
                     ) : <span className="text-xs text-white/20 italic">No Data Collected</span>}
                  </div>
                  <div className="border-l border-white/10 pl-8">
                     <p className="text-[0.5625rem] font-black text-white/40 uppercase tracking-widest mb-3">Lowest Complaining State</p>
                     {lowestLocation ? (
                       <div className="flex flex-col gap-1">
                          <span className="text-xl font-black uppercase text-[#FFCC00] tracking-tight leading-none">{lowestLocation[0]}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[0.625rem] font-black bg-[#FFCC00] text-[#003366] px-2 py-0.5 rounded-sm">{lowestLocation[1]} Hits</span>
                             <span className="text-[0.5rem] font-bold text-white/20 uppercase tracking-widest">Stable</span>
                          </div>
                       </div>
                     ) : <span className="text-xs text-white/20 italic">No Data Collected</span>}
                  </div>
               </div>
               <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[0.5rem] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Distribution Spectrum</p>
                  <div className="space-y-3">
                     {topCircles.map(([name, count]) => (
                       <div key={name} className="flex items-center gap-4">
                          <span className="w-24 text-[0.5625rem] font-black text-white/60 uppercase truncate">{name}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                             {/* Fix: Explicitly ensure count and highestLocation are numbers for arithmetic operations */}
                             <div className="h-full bg-india-post-red/60" style={{ width: `${((count as number) / ((highestLocation?.[1] as number) || 1)) * 100}%` }}></div>
                          </div>
                          <span className="text-[0.5625rem] font-black text-white/60">{count}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-4 bg-white border-2 border-slate-100 p-6 rounded-sm shadow-sm flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 bg-india-post-red text-white text-[0.5rem] font-black uppercase -mr-2 mt-2 rotate-45 w-24 text-center">Alert Active</div>
                <div>
                  <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Priority Escalations</p>
                  <div className="flex items-center gap-4">
                     <span className="text-6xl font-black text-india-post-red">{stats.urgent}</span>
                     <div className="flex flex-col">
                        <span className="text-[0.625rem] font-black text-india-post-red uppercase tracking-widest">Urgent (Red-Level)</span>
                        <span className="text-[0.5rem] font-bold text-slate-400 uppercase mt-1 leading-relaxed">Requiring Post Master Sign-off</span>
                     </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-sm">
                   <p className="text-[0.5625rem] font-bold text-india-post-red leading-relaxed uppercase italic">
                      All urgent cases are currently being analyzed by the NLP engine for fast-track resolution.
                   </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border-2 border-slate-100 rounded-sm overflow-hidden flex flex-col h-full shadow-sm">
              <div className="flex border-b border-slate-100 bg-slate-50">
                <button onClick={() => {setAdminSource('portal'); setCurrentRecord(null);}} className={`flex-1 py-4 text-[0.5625rem] font-black uppercase tracking-widest border-r border-slate-100 ${adminSource === 'portal' ? 'bg-india-post-red text-white' : 'text-slate-400 hover:text-slate-600'}`}>{t.portalSource}</button>
                <button onClick={() => {setAdminSource('gmail'); setCurrentRecord(null);}} className={`flex-1 py-4 text-[0.5625rem] font-black uppercase tracking-widest ${adminSource === 'gmail' ? 'bg-india-post-red text-white' : 'text-slate-400 hover:text-slate-600'}`}>{t.gmailSource}</button>
              </div>
              <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-[0.625rem] font-black uppercase text-slate-400">{adminSource === 'gmail' ? t.gmailInbox : 'Citizen Portal Feed'}</h3>
                  <span className="text-[0.5625rem] font-bold text-slate-800">{adminSource === 'gmail' ? 'official.support@indiapost.gov.in' : 'Active Submissions'}</span>
                </div>
                {adminSource === 'gmail' && (
                  <button onClick={handleSyncGmail} disabled={isSyncing} className={`p-2.5 rounded-sm transition-all shadow-sm ${isSyncing ? 'animate-spin bg-slate-100 text-slate-300' : 'bg-white text-india-post-red border border-slate-100 hover:bg-india-post-red hover:text-white'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2.5}/></svg>
                  </button>
                )}
              </div>
              <div className="flex border-b border-slate-100 bg-white">
                <button onClick={() => setActiveTab('inbox')} className={`flex-1 py-4 text-[0.625rem] font-black uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-3 ${activeTab === 'inbox' ? 'border-india-post-red text-india-post-red bg-red-50/20' : 'border-transparent text-slate-400'}`}>
                  {t.incoming}
                  <span className="bg-india-post-red text-white px-1.5 py-0.5 rounded text-[0.5rem]">{history.filter(h => h.source === adminSource && (h.status === 'pending' || h.status === 'drafted')).length}</span>
                </button>
                <button onClick={() => setActiveTab('sent')} className={`flex-1 py-4 text-[0.625rem] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sent' ? 'border-india-post-red text-india-post-red bg-red-50/20' : 'border-transparent text-slate-400'}`}>{t.dispatched}</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px] bg-slate-50/40">
                {adminFilteredHistory.length === 0 ? (
                  <div className="text-center py-32 opacity-20 flex flex-col items-center gap-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" strokeWidth={1}/></svg>
                    <p className="text-[0.625rem] font-black uppercase tracking-widest">{t.noActivity}</p>
                  </div>
                ) : (
                  adminFilteredHistory.map((item) => (
                    <div key={item.id} onClick={() => handleSelectRecord(item)} className={`p-5 rounded-sm border-2 cursor-pointer transition-all hover:translate-x-1 ${currentRecord?.id === item.id ? 'border-india-post-red bg-white shadow-xl' : 'border-slate-50 bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[0.5625rem] font-black text-slate-400 uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.status === 'sent' ? (
                          <div className="text-[0.5rem] font-black text-emerald-600 uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>{t.resolved}</div>
                        ) : item.priority === PriorityLevel.HIGH ? (
                          <div className="text-[0.5rem] font-black text-india-post-red uppercase flex items-center gap-1 animate-pulse"><span role="img" aria-label="angry">😡</span> ESCALATED</div>
                        ) : null}
                      </div>
                      <h3 className="text-[0.6875rem] font-black text-slate-800 line-clamp-1 uppercase tracking-tight">{item.customerId}</h3>
                      <p className="text-[0.625rem] text-slate-400 font-bold line-clamp-1 mt-1">{item.subject}</p>
                      <p className="text-[0.5rem] text-govt-blue font-black uppercase mt-2 tracking-widest opacity-60">{item.location || 'Unspecified Circle'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            {!currentRecord ? (
              <div className="h-full flex flex-col items-center justify-center bg-white border-2 border-slate-50 p-16 text-center rounded-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={1.5}/></svg>
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">{t.selectMessage}</h3>
                <p className="text-xs text-slate-400 mt-3 max-w-xs mx-auto leading-relaxed">{t.selectPrompt}</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                <div className="bg-white border-2 border-slate-100 rounded-sm p-8 shadow-sm">
                  <div className="mb-8 overflow-x-auto">
                      <div className="flex items-center justify-between min-w-[600px] px-2">
                        {[
                          { step: 1, label: 'Collection', icon: '💾' },
                          { step: 2, label: 'Preprocessing', icon: '🧹' },
                          { step: 3, label: 'NLP Engine', icon: '🔍' },
                          { step: 4, label: 'Classification', icon: '🏷️' },
                          { step: 5, label: 'Sentiment', icon: '⚖️' }
                        ].map((s) => (
                          <div key={s.step} className="flex flex-col items-center relative flex-1">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all z-10 ${Number(processingStep) >= Number(s.step) ? 'bg-india-post-red border-india-post-red text-white' : 'bg-white border-slate-200 text-slate-300'}`}>{Number(processingStep) > Number(s.step) ? '✓' : s.step}</div>
                             <span className={`text-[0.5rem] font-black uppercase mt-2 tracking-widest ${Number(processingStep) >= Number(s.step) ? 'text-india-post-red' : 'text-slate-300'}`}>{s.label}</span>
                             {Number(s.step) < 5 && <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${Number(processingStep) > Number(s.step) ? 'bg-india-post-red' : 'bg-slate-100'}`}></div>}
                          </div>
                        ))}
                      </div>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 pb-6 border-b border-slate-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[0.5625rem] font-black px-2 py-1 rounded-sm uppercase tracking-widest ${currentRecord.source === 'gmail' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{currentRecord.source === 'gmail' ? 'Gmail Inbound' : 'Portal Submission'}</span>
                          {currentRecord.confidenceScore !== undefined && <Badge label={t.confidence} type="confidence" value={currentRecord.confidenceScore.toFixed(2)} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight">{currentRecord.subject}</h2>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-india-post-red border-b border-india-post-red/20">{currentRecord.customerId}</span>
                          <span className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest">• {currentRecord.location || 'Unspecified Circle'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Badge label={t.category} type="category" value={currentRecord.category || t.pending} />
                        <Badge label={t.priority} type="priority" value={currentRecord.priority || t.pending} />
                      </div>
                  </div>
                  <div className="pt-8">
                      <h4 className="text-[0.625rem] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">{t.grievanceContent}</h4>
                      <div className="p-8 bg-slate-50/50 border-2 border-slate-100 text-slate-600 italic text-sm font-medium leading-[1.8] rounded-sm relative">{currentRecord.originalText}</div>
                  </div>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-sm shadow-2xl overflow-hidden relative">
                  {isAnalyzing && <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center"><div className="flex gap-4 items-center mb-6"><div className="w-4 h-4 rounded-full bg-india-post-red animate-ping"></div><div className="w-4 h-4 rounded-full bg-govt-blue animate-ping" style={{animationDelay: '0.2s'}}></div></div><p className="text-[0.625rem] font-black text-slate-800 uppercase tracking-[0.3em]">Processing Sequence Active</p></div>}
                  <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-full"><img src="https://cdn-icons-png.flaticon.com/512/4712/4712139.png" className="w-8 h-8 opacity-60" alt="Robot" /></div>
                      <div><h3 className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.3em]">AI Generates Response</h3><p className="text-xs font-bold text-slate-800 uppercase tracking-tighter">{currentRecord.priority === PriorityLevel.HIGH ? 'Officer escalation required for final sign-off' : 'Automated queue candidate'}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      {currentRecord.status !== 'sent' && !isEditing && <button onClick={startEditing} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-600 text-[0.625rem] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-govt-blue hover:text-white transition-all">{t.editResponse}</button>}
                      {currentRecord.status === 'sent' ? <div className="px-8 py-4 bg-emerald-600 text-white rounded-sm text-[0.625rem] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">{t.dispatchedSuccess}</div> : isEditing ? <div className="flex items-center gap-3"><button onClick={() => setIsEditing(false)} className="px-6 py-4 text-slate-400 text-[0.625rem] font-black uppercase tracking-[0.2em]">{t.cancel}</button><button onClick={saveEditedDraft} className="px-8 py-4 bg-govt-blue text-white text-[0.625rem] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl">{t.saveChanges}</button></div> : <button onClick={handleDispatchResponse} disabled={isSending || !currentRecord.formalEmailDraft} className={`px-12 py-4 rounded-sm font-black text-[0.625rem] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${isSending || !currentRecord.formalEmailDraft ? 'bg-slate-100 text-slate-300' : 'bg-india-post-red text-white hover:bg-red-700'}`}>{isSending ? t.transmitting : t.transmit}</button>}
                    </div>
                  </div>
                  <div className="bg-white leading-[2.2] font-serif text-slate-800 text-lg min-h-[450px] border-b-[16px] border-india-post-red shadow-inner relative">{isEditing ? <textarea value={editedDraft} onChange={(e) => setEditedDraft(e.target.value)} className="w-full h-[450px] p-16 outline-none bg-yellow-50/20 font-serif leading-[2.2] resize-none border-0 block relative z-10" /> : <div className="p-16 whitespace-pre-wrap relative z-10">{currentRecord.formalEmailDraft || 'Waiting for workflow engine to initialize...'}</div>}</div>
                  <div className="bg-slate-50 p-4 text-center border-t border-slate-100"><p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>Response Processing Protocol Verified</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout 
      lang={lang} 
      onLanguageChange={setLang} 
      currentFontSize={fontSize} 
      onFontSizeChange={setFontSize}
      onToggleStats={() => setShowPublicStats(!showPublicStats)}
      isAdmin={session?.role === 'admin'}
    >
      {session && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-5 border-2 border-slate-100 rounded-sm shadow-sm gap-4">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-india-post-red text-white flex items-center justify-center font-black text-xl rounded-sm shadow-inner">
                 {session.name[0]}
              </div>
              <div>
                 <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.3em]">{t.welcome}</p>
                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                   {session.name} • <span className="text-india-post-red">{session.role === 'admin' ? t.officialAccess : t.citizenAccess}</span>
                 </h2>
                 <p className="text-[0.625rem] text-slate-400 font-bold">{session.customerId}</p>
              </div>
           </div>
           
           <div className="flex gap-4">
              {session.role === 'admin' && (
                <div className="hidden xl:flex items-center gap-6 px-6 border-r border-slate-100">
                   <div className="text-center">
                      <p className="text-[0.5rem] font-black text-slate-400 uppercase">Load Avg</p>
                      <p className="text-xs font-black text-emerald-500">0.12ms</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[0.5rem] font-black text-slate-400 uppercase">Efficiency</p>
                      <p className="text-xs font-black text-india-post-red">94.2%</p>
                   </div>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="px-6 py-2 bg-slate-50 border border-slate-200 text-[0.625rem] font-black text-slate-500 uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all rounded-sm"
              >
                {t.logout}
              </button>
           </div>
        </div>
      )}

      {renderContent()}

      {/* DakMitra AI Assistant - ONLY visible for citizen users */}
      {session?.role === 'user' && <ChatWidget lang={lang} />}
    </Layout>
  );
};

export default App;
