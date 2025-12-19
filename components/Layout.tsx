
import React from 'react';
import { Language, translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, lang, onLanguageChange }) => {
  const t = translations[lang];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Utility Bar (NIC Style) */}
      <div className="bg-[#003366] text-white py-1.5 px-4 text-[10px] font-medium flex justify-between items-center border-b border-white/10">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1">
             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
             GOVERNMENT OF INDIA
          </span>
          <span className="opacity-60">|</span>
          <span>MINISTRY OF COMMUNICATIONS</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex gap-3">
             <button onClick={() => onLanguageChange('en')} className={`hover:underline ${lang === 'en' ? 'font-bold text-[#FFCC00]' : ''}`}>ENGLISH</button>
             <button onClick={() => onLanguageChange('hi')} className={`hover:underline ${lang === 'hi' ? 'font-bold text-[#FFCC00]' : ''}`}>हिंदी</button>
             <button onClick={() => onLanguageChange('te')} className={`hover:underline ${lang === 'te' ? 'font-bold text-[#FFCC00]' : ''}`}>తెలుగు</button>
           </div>
           <span className="opacity-60">|</span>
           <button className="hover:opacity-80">A-</button>
           <button className="hover:opacity-80">A</button>
           <button className="hover:opacity-80">A+</button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b-4 border-[#C8102E] py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* National Emblem (Satyamev Jayate) */}
            <div className="hidden md:flex flex-col items-center border-r border-slate-200 pr-6">
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="Emblem of India" className="h-14 mb-1" />
               <span className="text-[8px] font-black tracking-tight text-slate-500 uppercase">Satyamev Jayate</span>
            </div>

            {/* India Post Logo Section */}
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-start">
                  <div className="flex flex-col items-center">
                    <span className="text-[#C8102E] text-lg font-serif font-bold leading-none mb-0.5">भारतीय डाक</span>
                    <div className="relative w-24 h-12 bg-[#C8102E] flex items-center justify-center overflow-hidden rounded-sm shadow-inner">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 50">
                          <path d="M-10,30 Q30,10 60,30 T110,10" fill="none" stroke="#FFCC00" strokeWidth="3" opacity="0.8" />
                          <path d="M-10,36 Q30,16 60,36 T110,16" fill="none" stroke="#FFCC00" strokeWidth="3" opacity="0.8" />
                          <path d="M-10,42 Q30,22 60,42 T110,22" fill="none" stroke="#FFCC00" strokeWidth="3" opacity="0.8" />
                        </svg>
                    </div>
                    <span className="text-[#C8102E] text-lg font-serif font-bold leading-none mt-0.5">India Post</span>
                  </div>
               </div>
               <div className="h-16 w-px bg-slate-200 mx-2 hidden sm:block"></div>
               <div className="flex flex-col">
                  <h1 className="text-2xl font-black text-[#003366] tracking-tight uppercase">
                    e_DakSeva
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Department of Posts • Centralized Grievance Redressal
                  </p>
               </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end">
             <div className="bg-[#C8102E] text-[#FFCC00] px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg border border-[#FFCC00]/20">
                {t.internalPortal}
             </div>
             <p className="text-[10px] font-black text-[#003366] mt-2 uppercase">Official Analytics Dashboard</p>
          </div>
        </div>
      </header>

      {/* News Ticker */}
      <div className="bg-[#FFCC00] text-[#C8102E] py-1 border-b border-[#C8102E]/20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#C8102E] text-white px-2 py-0.5 text-[9px] font-bold uppercase absolute left-4 z-10 shadow-md">Latest</div>
          <div className="animate-marquee pl-20">
             <span className="text-[10px] font-black uppercase tracking-wider mx-10">Integration with PMO Dashboard Active</span>
             <span className="text-[10px] font-black uppercase tracking-wider mx-10">AI-Powered Sentiment Analysis for Fast Track Redressal v3.4</span>
             <span className="text-[10px] font-black uppercase tracking-wider mx-10">New Grievance Guidelines for Digital Dak v2.0 Released</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-[#003366] text-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex flex-col items-start gap-3">
              <span className="text-[#FFCC00] font-black text-xl tracking-tighter uppercase">e_DakSeva</span>
              <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                Official grievance monitoring and resolution portal of the Department of Posts. Serving citizens with integrity and efficiency for over a century.
              </p>
              <div className="flex gap-2 mt-2">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FFCC00] hover:text-[#C8102E] transition-all cursor-pointer">f</div>
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FFCC00] hover:text-[#C8102E] transition-all cursor-pointer">t</div>
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FFCC00] hover:text-[#C8102E] transition-all cursor-pointer">i</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-[#FFCC00] uppercase mb-6 tracking-widest">Portal Navigation</h4>
            <ul className="text-xs text-white/80 space-y-3 font-medium">
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Officer Login</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Citizen Cell</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Track Grievance</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Statistics Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-[#FFCC00] uppercase mb-6 tracking-widest">Legal & Policy</h4>
            <ul className="text-xs text-white/80 space-y-3 font-medium">
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Hyperlinking Policy</a></li>
              <li><a href="#" className="hover:text-[#FFCC00] transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-[#FFCC00] uppercase mb-6 tracking-widest">Contact Support</h4>
            <ul className="text-xs text-white/80 space-y-3 font-medium">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth={2}/></svg>
                1800-11-2011
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={2}/></svg>
                support@indiapost.gov.in
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">© {new Date().getFullYear()} Department of Posts, Ministry of Communications, GOI.</p>
              <p className="text-[8px] font-bold text-white/20 uppercase">Maintained by National Informatics Centre (NIC)</p>
           </div>
           <div className="flex gap-4 items-center">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png" className="h-8 grayscale brightness-200 contrast-200" alt="Digital India" />
              <img src="https://upload.wikimedia.org/wikipedia/hi/4/4e/Make_in_India_logo.png" className="h-8 grayscale brightness-200" alt="Make in India" />
           </div>
        </div>
      </footer>
    </div>
  );
};
