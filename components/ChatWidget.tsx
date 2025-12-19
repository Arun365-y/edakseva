
import React, { useState, useRef, useEffect } from 'react';
import { Language, translations } from '../translations';
import { geminiService } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  lang: Language;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Namaste! I am DakMitra, your India Post AI assistant. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const t = translations[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await geminiService.getChatResponse(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {/* AI Chat Window */}
      {isOpen && (
        <div className="bg-white border-2 border-slate-100 rounded-sm shadow-2xl w-80 md:w-96 flex flex-col h-[500px] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#003366] p-4 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-india-post-red rounded-full flex items-center justify-center shadow-md border border-white/20">
                    <img src="https://cdn-icons-png.flaticon.com/512/4712/4712139.png" className="w-5 h-5 brightness-200" alt="Robot" />
                 </div>
                 <div>
                    <h4 className="text-[0.625rem] font-black uppercase tracking-widest text-[#FFCC00]">DakMitra AI</h4>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[0.45rem] font-bold uppercase opacity-60 tracking-tighter">Online Assistance</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            
            {/* Quick Contact Bar */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
               <a href="tel:1800112011" className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[0.5rem] font-black uppercase tracking-widest transition-all">
                  <svg className="w-3 h-3 text-[#FFCC00]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  {t.callUs}
               </a>
               <a href="https://wa.me/911800112011" target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[0.5rem] font-black uppercase tracking-widest transition-all">
                  <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045c0 2.121.54 4.192 1.566 6.041L0 24l6.104-1.602a11.803 11.803 0 005.94 1.601h.005c6.637 0 12.048-5.411 12.051-12.047a11.82 11.82 0 00-3.587-8.451"/></svg>
                  WhatsApp
               </a>
               <a href="mailto:support@indiapost.gov.in" className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[0.5rem] font-black uppercase tracking-widest transition-all">
                  <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                  Email
               </a>
            </div>
          </div>

          {/* Messages List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                 <div className={`max-w-[85%] px-4 py-3 rounded-sm shadow-sm text-xs font-medium leading-relaxed ${
                   m.role === 'user' 
                   ? 'bg-[#003366] text-white rounded-tr-none' 
                   : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                 }`}>
                   {m.text}
                 </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-india-post-red rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-india-post-red rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-india-post-red rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask DakMitra..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold outline-none focus:border-india-post-red transition-all"
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputText.trim()}
              className={`p-3 rounded-sm shadow-lg transition-all active:scale-90 ${
                isLoading || !inputText.trim() ? 'bg-slate-100 text-slate-300' : 'bg-india-post-red text-white hover:brightness-110'
              }`}
            >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
            </button>
          </form>
        </div>
      )}

      {/* Main FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 bg-india-post-red text-white rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all"
        aria-label="Toggle DakMitra"
      >
        <div className="absolute inset-0 bg-india-post-red rounded-full animate-ping opacity-20 pointer-events-none"></div>
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <div className="relative">
            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712139.png" className="w-10 h-10 brightness-200" alt="DakMitra" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        )}
      </button>
    </div>
  );
};
