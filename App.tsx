
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Badge } from './components/Badge';
import { Login } from './components/Login';
import { UserDashboard } from './components/UserDashboard';
import { geminiService } from './services/geminiService';
import { emailService } from './services/emailService';
// Added PriorityLevel to the imports from types
import { AnalysisResult, ComplaintRecord, UserSession, PriorityLevel } from './types';
import { Language, translations } from './translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [session, setSession] = useState<UserSession | null>(null);
  
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
    const saved = localStorage.getItem('dak_seva_gmail_sync_v3');
    const savedLang = localStorage.getItem('dak_seva_lang') as Language;
    const savedSession = localStorage.getItem('dak_seva_session');
    
    if (savedLang) setLang(savedLang);
    if (savedSession) setSession(JSON.parse(savedSession));
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dak_seva_gmail_sync_v3', JSON.stringify(history));
    localStorage.setItem('dak_seva_lang', lang);
    if (session) localStorage.setItem('dak_seva_session', JSON.stringify(session));
    else localStorage.removeItem('dak_seva_session');
  }, [history, lang, session]);

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const incoming = await emailService.fetchIncomingComplaints();
      const newMails = incoming.map(mail => ({...mail, source: 'gmail'})).filter(mail => !history.find(h => h.id === mail.id));
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
    
    setIsAnalyzing(true);
    setError(null);
    setProcessingStep(1); // 1: Collection

    try {
      // Workflow Simulation based on Image
      await new Promise(r => setTimeout(r, 600)); setProcessingStep(2); // 2: Preprocessing
      await new Promise(r => setTimeout(r, 800)); setProcessingStep(3); // 3: NLP Engine
      
      const analysis = await geminiService.analyzeComplaint(record.originalText);
      await new Promise(r => setTimeout(r, 400)); setProcessingStep(4); // 4: Classification
      await new Promise(r => setTimeout(r, 400)); setProcessingStep(5); // 5: Sentiment
      
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
        status: analysis.requiresReview ? 'drafted' : 'sent',
        formalEmailDraft: formalDraft,
        timestamp: analysis.requiresReview ? record.timestamp : Date.now()
      };

      if (!analysis.requiresReview && record.source === 'gmail') {
        await emailService.sendAutomatedResponse(
          record.customerEmail,
          `[Auto-Response] ${record.subject}`,
          formalDraft
        );
      }

      setCurrentRecord(updatedRecord);
      setHistory(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
    } catch (err) {
      console.error(err);
      setError("Workflow engine encountered an error during NLP processing.");
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
          currentRecord.customerEmail,
          currentRecord.subject,
          currentRecord.formalEmailDraft
        );
      }
      
      const updatedRecord: ComplaintRecord = {
        ...currentRecord,
        status: 'sent',
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
      customerEmail: session.email,
      timestamp: Date.now(),
      status: 'pending',
      type: type,
      orderId: orderId,
      source: 'portal'
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

      const finalStatus: ComplaintRecord['status'] = analysis.requiresReview ? 'pending' : 'sent';

      const completedRecord: ComplaintRecord = {
        ...initialRecord,
        ...analysis,
        status: finalStatus,
        formalEmailDraft: instantAiResponse
      };

      setHistory(prev => [completedRecord, ...prev]);
    } catch (err) {
      console.error("Citizen Submission Analysis Failed:", err);
      setHistory(prev => [initialRecord, ...prev]);
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentRecord(null);
    setIsEditing(false);
    localStorage.removeItem('dak_seva_session');
  };

  const adminFilteredHistory = history.filter(r => 
    r.source === adminSource && (activeTab === 'inbox' ? r.status !== 'sent' : r.status === 'sent')
  );

  return (
    <Layout lang={lang} onLanguageChange={setLang}>
      {session && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-5 border-2 border-slate-100 rounded-sm shadow-sm gap-4">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-india-post-red text-white flex items-center justify-center font-black text-xl rounded-sm shadow-inner">
                 {session.name[0]}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t.welcome}</p>
                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                   {session.name} • <span className="text-india-post-red">{session.role === 'admin' ? t.officialAccess : t.citizenAccess}</span>
                 </h2>
                 <p className="text-[10px] text-slate-400 font-bold">{session.email}</p>
              </div>
           </div>
           
           <div className="flex gap-4">
              {session.role === 'admin' && (
                <div className="hidden xl:flex items-center gap-6 px-6 border-r border-slate-100">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Load Avg</p>
                      <p className="text-xs font-black text-emerald-500">0.12ms</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Efficiency</p>
                      <p className="text-xs font-black text-india-post-red">94.2%</p>
                   </div>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="px-6 py-2 bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all rounded-sm"
              >
                {t.logout}
              </button>
           </div>
        </div>
      )}

      {!session ? (
        <Login lang={lang} onLogin={setSession} />
      ) : session.role === 'user' ? (
        <UserDashboard 
          lang={lang} 
          session={session} 
          history={history} 
          onAddComplaint={handleUserAddComplaint}
          isSubmitting={isUserSubmitting}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[750px] animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Sidebar with Stats Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Admin Dashboard Sidebar Top Stats as per Image */}
            <div className="bg-white border-2 border-slate-100 p-5 rounded-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                   <svg className="w-4 h-4 text-govt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth={2}/></svg>
                   <h3 className="text-[10px] font-black text-govt-blue uppercase tracking-widest">Admin Dashboard</h3>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                         <div className="w-1.5 h-1.5 rounded-full bg-govt-blue"></div>
                         Complaint Analytics
                      </div>
                      <span className="text-[10px] font-black text-slate-800">89%</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                         <div className="w-1.5 h-1.5 rounded-full bg-india-post-red"></div>
                         Priority Alerts
                      </div>
                      {/* Fixed comparison using PriorityLevel.HIGH instead of string literal 'Urgent' */}
                      <span className="text-[10px] font-black text-india-post-red">{history.filter(h => h.priority === PriorityLevel.HIGH && h.status !== 'sent').length}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                         Performance Monitoring
                      </div>
                      <span className="text-[10px] font-black text-emerald-600">Stable</span>
                   </div>
                </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-sm overflow-hidden flex flex-col h-full shadow-sm">
              <div className="flex border-b border-slate-100 bg-slate-50">
                <button 
                  onClick={() => {setAdminSource('portal'); setCurrentRecord(null);}} 
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-r border-slate-100 ${adminSource === 'portal' ? 'bg-india-post-red text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t.portalSource}
                </button>
                <button 
                  onClick={() => {setAdminSource('gmail'); setCurrentRecord(null);}} 
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${adminSource === 'gmail' ? 'bg-india-post-red text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t.gmailSource}
                </button>
              </div>

              <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                   <h3 className="text-[10px] font-black uppercase text-slate-400">{adminSource === 'gmail' ? t.gmailInbox : 'Citizen Portal Feed'}</h3>
                   <span className="text-[9px] font-bold text-slate-800">{adminSource === 'gmail' ? 'official.support@indiapost.gov.in' : 'Active Submissions'}</span>
                </div>
                {adminSource === 'gmail' && (
                  <button 
                    onClick={handleSyncGmail} 
                    disabled={isSyncing} 
                    className={`p-2.5 rounded-sm transition-all shadow-sm ${isSyncing ? 'animate-spin bg-slate-100 text-slate-300' : 'bg-white text-india-post-red border border-slate-100 hover:bg-india-post-red hover:text-white'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2.5}/></svg>
                  </button>
                )}
              </div>
              
              <div className="flex border-b border-slate-100 bg-white">
                <button onClick={() => setActiveTab('inbox')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-3 ${activeTab === 'inbox' ? 'border-india-post-red text-india-post-red bg-red-50/20' : 'border-transparent text-slate-400'}`}>
                  {t.incoming}
                  <span className="bg-india-post-red text-white px-1.5 py-0.5 rounded text-[8px]">{history.filter(h => h.source === adminSource && (h.status === 'pending' || h.status === 'drafted')).length}</span>
                </button>
                <button onClick={() => setActiveTab('sent')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sent' ? 'border-india-post-red text-india-post-red bg-red-50/20' : 'border-transparent text-slate-400'}`}>
                  {t.dispatched}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px] bg-slate-50/40">
                {adminFilteredHistory.length === 0 ? (
                  <div className="text-center py-32 opacity-20 italic flex flex-col items-center gap-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" strokeWidth={1}/></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest">{t.noActivity}</p>
                  </div>
                ) : (
                  adminFilteredHistory.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleSelectRecord(item)} 
                      className={`p-5 rounded-sm border-2 cursor-pointer transition-all hover:translate-x-1 ${currentRecord?.id === item.id ? 'border-india-post-red bg-white shadow-xl' : 'border-slate-50 bg-white shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.status === 'sent' ? (
                          <div className="text-[8px] font-black text-emerald-600 uppercase flex items-center gap-1">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                             {t.resolved}
                          </div>
                        // Fixed comparison using PriorityLevel.HIGH instead of string literal 'Urgent'
                        ) : item.priority === PriorityLevel.HIGH ? (
                          <div className="text-[8px] font-black text-india-post-red uppercase flex items-center gap-1 animate-pulse">
                             <span role="img" aria-label="angry">😡</span> ESCALATED
                          </div>
                        ) : null}
                      </div>
                      <h3 className="text-[11px] font-black text-slate-800 line-clamp-1 uppercase tracking-tight">{item.customerEmail}</h3>
                      <p className="text-[10px] text-slate-400 font-bold line-clamp-1 mt-1">{item.subject}</p>
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
                
                {/* Workflow Stepper as per Image */}
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
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all z-10 ${
                               processingStep >= s.step ? 'bg-india-post-red border-india-post-red text-white' : 'bg-white border-slate-200 text-slate-300'
                             }`}>
                                {processingStep > s.step ? '✓' : s.step}
                             </div>
                             <span className={`text-[8px] font-black uppercase mt-2 tracking-widest ${
                               processingStep >= s.step ? 'text-india-post-red' : 'text-slate-300'
                             }`}>{s.label}</span>
                             {s.step < 5 && (
                               <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                                 processingStep > s.step ? 'bg-india-post-red' : 'bg-slate-100'
                               }`}></div>
                             )}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 pb-6 border-b border-slate-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-widest ${currentRecord.source === 'gmail' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {currentRecord.source === 'gmail' ? 'Gmail Inbound' : 'Portal Submission'}
                           </span>
                           {currentRecord.confidenceScore !== undefined && (
                             <Badge label={t.confidence} type="confidence" value={currentRecord.confidenceScore.toFixed(2)} />
                           )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight">{currentRecord.subject}</h2>
                        <span className="text-xs font-bold text-india-post-red border-b border-india-post-red/20">{currentRecord.customerEmail}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         <Badge label={t.category} type="category" value={currentRecord.category || t.pending} />
                         <Badge label={t.priority} type="priority" value={currentRecord.priority || t.pending} />
                         {/* Fixed comparison using PriorityLevel.HIGH instead of string literal 'Urgent' */}
                         {currentRecord.priority === PriorityLevel.HIGH && (
                           <div className="flex flex-col gap-1 min-w-[80px]">
                              <span className="text-[9px] uppercase font-black tracking-widest text-india-post-red">Urgency Branch</span>
                              <div className="px-3 py-2 bg-red-100 text-india-post-red rounded-sm text-[9px] font-black border border-red-200 uppercase tracking-widest flex items-center justify-center gap-1">
                                😡 ESCALATION
                              </div>
                           </div>
                         )}
                         {/* Fixed comparison using PriorityLevel.NORMAL instead of string literal 'Normal' */}
                         {currentRecord.priority === PriorityLevel.NORMAL && (
                           <div className="flex flex-col gap-1 min-w-[80px]">
                              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600">Urgency Branch</span>
                              <div className="px-3 py-2 bg-emerald-100 text-emerald-600 rounded-sm text-[9px] font-black border border-emerald-200 uppercase tracking-widest flex items-center justify-center gap-1">
                                😊 AUTO-QUEUE
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="pt-8">
                      <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">{t.grievanceContent}</h4>
                      <div className="p-8 bg-slate-50/50 border-2 border-slate-100 text-slate-600 italic text-sm font-medium leading-[1.8] rounded-sm relative">
                         {currentRecord.originalText}
                      </div>
                   </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-sm shadow-2xl overflow-hidden relative">
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                       <div className="flex gap-4 items-center mb-6">
                          <div className="w-4 h-4 rounded-full bg-india-post-red animate-ping"></div>
                          <div className="w-4 h-4 rounded-full bg-govt-blue animate-ping" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-4 h-4 rounded-full bg-india-post-yellow animate-ping" style={{animationDelay: '0.4s'}}></div>
                       </div>
                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Processing Sequence Active</p>
                       <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Step {processingStep}: Running Diagnostics...</p>
                    </div>
                  )}
                  
                  <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712139.png" className="w-8 h-8 opacity-60" alt="Robot" />
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Generates Response</h3>
                        <p className="text-xs font-bold text-slate-800">
                          {/* Fixed comparison using PriorityLevel.HIGH instead of string literal 'Urgent' */}
                          {currentRecord.priority === PriorityLevel.HIGH ? 'Officer escalation required for final sign-off' : 'Automated queue candidate'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {currentRecord.status !== 'sent' && !isEditing && (
                        <button 
                          onClick={startEditing}
                          className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-govt-blue hover:text-white transition-all"
                        >
                          {t.editResponse}
                        </button>
                      )}

                      {currentRecord.status === 'sent' ? (
                        <div className="px-8 py-4 bg-emerald-600 text-white rounded-sm text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                           {t.dispatchedSuccess}
                        </div>
                      ) : isEditing ? (
                        <div className="flex items-center gap-3">
                           <button onClick={() => setIsEditing(false)} className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{t.cancel}</button>
                           <button onClick={saveEditedDraft} className="px-8 py-4 bg-govt-blue text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl">{t.saveChanges}</button>
                        </div>
                      ) : (
                        <button 
                          onClick={handleDispatchResponse} 
                          disabled={isSending || !currentRecord.formalEmailDraft} 
                          className={`px-12 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${isSending || !currentRecord.formalEmailDraft ? 'bg-slate-100 text-slate-300' : 'bg-india-post-red text-white hover:bg-red-700'}`}
                        >
                          {isSending ? t.transmitting : t.transmit}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white leading-[2.2] font-serif text-slate-800 text-lg min-h-[450px] border-b-[16px] border-india-post-red shadow-inner relative">
                    {isEditing ? (
                      <textarea
                        value={editedDraft}
                        onChange={(e) => setEditedDraft(e.target.value)}
                        className="w-full h-[450px] p-16 outline-none bg-yellow-50/20 font-serif leading-[2.2] resize-none border-0 block relative z-10"
                      />
                    ) : (
                      <div className="p-16 whitespace-pre-wrap relative z-10">
                        {currentRecord.formalEmailDraft || 'Waiting for workflow engine to initialize...'}
                      </div>
                    )}
                  </div>

                  {/* Footing Response sent to Citizen box from image */}
                  <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                        Response Sent to Citizen
                     </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
