
import React, { useState, useRef, useEffect } from 'react';
import { 
  NewsArticle, 
  ScriptOutput, 
  WorkflowStage 
} from './types';
import { 
  fetchNewsArticles, 
  summarizeArticles, 
  generateYouTubeScript,
  generateImage
} from './services/geminiService';
import ParticleBackground from './components/ParticleBackground';
import HolographicCard from './components/HolographicCard';
import Teleprompter from './components/Teleprompter';

declare const html2pdf: any;
declare const window: any;

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [stage, setStage] = useState<WorkflowStage>(WorkflowStage.IDLE);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [script, setScript] = useState<ScriptOutput | null>(null);
  const [systemLog, setSystemLog] = useState<string[]>(['System Ready.', 'Awaiting Vector Input...']);
  const pdfRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setSystemLog(prev => [...prev.slice(-3), `> ${msg}`]);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setStage(WorkflowStage.FETCHING);
    setNews([]);
    setScript(null);
    addLog(`INITIALIZING SCAN: ${topic.toUpperCase()}`);

    try {
      const articles = await fetchNewsArticles(topic);
      if (articles.length === 0) throw new Error("No signal detected.");
      setNews(articles);
      addLog(`DATA POOL LOADED: ${articles.length} UNITS.`);
      
      setStage(WorkflowStage.SUMMARIZING);
      addLog(`SYNTHESIZING NEURAL SUMMARY...`);
      const summarized = await summarizeArticles(articles);
      setNews(summarized);

      setStage(WorkflowStage.GENERATING);
      addLog(`COMPILING SCRIPT NARRATIVE...`);
      const finalScript = await generateYouTubeScript(topic, summarized);
      setScript(finalScript);
      
      setStage(WorkflowStage.GENERATING_IMAGES);
      addLog(`VECTORING VISUAL ASSETS (${imageSize})...`);
      
      const thumb = await generateImage(topic, imageSize);
      const updatedSegments = await Promise.all(
        finalScript.newsSegments.map(async (seg, idx) => {
          if (idx < 2) {
            addLog(`RENDERING SEG_NODE_${idx + 1}...`);
            const img = await generateImage(seg.title, imageSize);
            return { ...seg, imageUrl: img || undefined };
          }
          return seg;
        })
      );

      setScript({
        ...finalScript,
        newsSegments: updatedSegments,
        thumbnailUrl: thumb || undefined
      });

      setStage(WorkflowStage.COMPLETED);
      addLog(`SYNTHESIS COMPLETE. SIGNAL STABLE.`);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_RESET") {
        await window.aistudio.openSelectKey();
      }
      setStage(WorkflowStage.IDLE);
      addLog(`PROTOCOL HALTED: ERROR.`);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col font-inter text-slate-900 overflow-x-hidden">
      <ParticleBackground />

      {/* Futuristic Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 py-4 px-12 flex justify-between items-center">
        <div className="flex items-center gap-5">
           <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] animate-pulse"></div>
           <span className="font-orbitron text-[10px] font-black tracking-[0.3em] text-slate-900 uppercase">SYS_NODE_STATUS: {stage}</span>
        </div>
        <div className="font-mono text-[9px] text-slate-400 font-bold tracking-[0.4em] uppercase opacity-70">NovaScript Neural Interface // v3.1.2</div>
      </nav>

      <main className="relative z-10 flex-grow container mx-auto px-8 max-w-7xl pt-40 pb-48">
        
        {/* Hero Area */}
        <section className="text-center mb-32">
           <div className="relative inline-block mb-8 group">
             <h1 className="text-8xl md:text-[10rem] font-orbitron font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm transition-all group-hover:tracking-normal duration-700">
              NOVASCRIPT
             </h1>
             <div className="absolute -top-6 -right-16 transform rotate-12 bg-slate-900 text-white px-4 py-1.5 rounded-full font-orbitron text-[10px] font-black shadow-xl border-2 border-white tracking-widest group-hover:scale-110 transition-transform">AI_CORE_V3</div>
           </div>
           <p className="font-orbitron text-sm text-slate-400 tracking-[0.8em] uppercase font-black opacity-60">Synthesis Protocol for digital broadcast vectoring</p>
        </section>

        {/* Input Terminal Module */}
        <section className="max-w-4xl mx-auto mb-40">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 rounded-[3rem] blur opacity-10 group-focus-within:opacity-30 transition-all duration-1000"></div>
            <div className="relative bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all group-focus-within:shadow-cyan-100/40">
              <div className="flex flex-col md:flex-row items-stretch">
                <input
                  type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="INITIALIZE SEARCH VECTOR (e.g. GPT-5 RELEASE NEWS)"
                  className="flex-grow bg-transparent px-12 py-10 outline-none font-orbitron text-2xl tracking-tight text-slate-900 placeholder:text-slate-200 font-black border-none"
                />
                <button
                  onClick={handleGenerate} disabled={stage !== WorkflowStage.IDLE}
                  className="bg-slate-900 text-white font-orbitron font-black text-sm px-20 py-10 hover:bg-cyan-600 transition-all disabled:bg-slate-100 relative ripple-btn"
                >
                  <span className="relative z-10 uppercase tracking-[0.3em]">{stage === WorkflowStage.IDLE ? 'GENERATE' : 'SYNTH'}</span>
                  {stage !== WorkflowStage.IDLE && <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-400 animate-progress-indefinite"></div>}
                </button>
              </div>
              
              {/* Settings Tray */}
              <div className="bg-slate-50/50 border-t border-slate-100 px-12 py-5 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
                  <span className="text-[10px] font-orbitron font-black text-slate-400 uppercase tracking-widest">Image_Resolution_Standard</span>
                </div>
                <div className="flex gap-4">
                  {(["1K", "2K", "4K"] as const).map(size => (
                    <button
                      key={size} onClick={() => setImageSize(size)} disabled={stage !== WorkflowStage.IDLE}
                      className={`px-8 py-2.5 rounded-2xl text-[10px] font-orbitron font-black transition-all border-2 ${
                        imageSize === size ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* HUD Diagnostics Logs */}
          <div className="mt-10 flex flex-col gap-2 items-center">
            {systemLog.map((log, i) => (
              <div key={i} className={`font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-3 transition-opacity duration-500 ${i === systemLog.length - 1 ? 'text-cyan-600' : 'text-slate-300'}`}>
                <span className={`w-1 h-1 rounded-full ${i === systemLog.length - 1 ? 'bg-cyan-500 animate-pulse' : 'bg-slate-200'}`}></span>
                {log}
              </div>
            ))}
          </div>
        </section>

        {/* Workflow HUD Progress */}
        {stage !== WorkflowStage.IDLE && (
          <section className="max-w-5xl mx-auto mb-48 animate-fade-in-up">
            <div className="flex justify-between items-center gap-2 relative">
              <div className="absolute top-7 inset-x-0 h-0.5 bg-slate-100 -z-10"></div>
              {[WorkflowStage.FETCHING, WorkflowStage.SUMMARIZING, WorkflowStage.GENERATING, WorkflowStage.GENERATING_IMAGES, WorkflowStage.COMPLETED].map((s, idx) => {
                const stages = [WorkflowStage.FETCHING, WorkflowStage.SUMMARIZING, WorkflowStage.GENERATING, WorkflowStage.GENERATING_IMAGES, WorkflowStage.COMPLETED];
                const activeIdx = stages.indexOf(stage);
                const isActive = stage === s;
                const isPast = idx < activeIdx || stage === WorkflowStage.COMPLETED;
                
                return (
                  <div key={s} className="flex flex-col items-center gap-5 flex-1">
                    <div className={`w-14 h-14 rounded-[1.25rem] border-2 flex items-center justify-center text-[11px] font-orbitron font-black transition-all duration-700 ${
                      isActive ? 'bg-cyan-600 border-cyan-600 text-white scale-125 shadow-2xl shadow-cyan-200' : 
                      isPast ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}>
                      {isActive ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isPast ? '✓' : idx + 1)}
                    </div>
                    <span className={`text-[9px] font-orbitron font-black tracking-[0.2em] text-center whitespace-pre-wrap max-w-[100px] uppercase leading-relaxed ${isActive ? 'text-cyan-600' : isPast ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {s.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Results Stream Area */}
        <div className="space-y-48">
          {/* News Analysis Grid */}
          {news.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-12 mb-20">
                 <h2 className="font-orbitron text-[11px] font-black tracking-[0.7em] text-slate-900 uppercase bg-slate-100 px-8 py-3 rounded-full shadow-sm">Extracted_Data_Nodes</h2>
                 <div className="h-0.5 flex-grow bg-slate-100/50"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {news.map((article, i) => (
                  <HolographicCard key={i} article={article} delay={i * 0.1} />
                ))}
              </div>
            </div>
          )}

          {/* Script & Assets Synthesis */}
          {script && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-12 mb-24">
                 <h2 className="font-orbitron text-[11px] font-black tracking-[0.7em] text-indigo-600 uppercase bg-indigo-50 px-8 py-3 rounded-full shadow-sm">Synthesized_Narrative_Channel</h2>
                 <div className="h-0.5 flex-grow bg-slate-100/50"></div>
              </div>

              <div className="space-y-32">
                {/* Visual Teleprompter Module */}
                <Teleprompter script={script} />

                {/* Main Content Showcase */}
                <div className="grid grid-cols-1 gap-24">
                  {script.thumbnailUrl && (
                    <div className="group relative overflow-hidden rounded-[4rem] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
                      <img src={script.thumbnailUrl} alt="Visual" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-[2s]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-16 left-16 max-w-2xl">
                         <span className="text-[11px] font-orbitron font-black text-cyan-400 tracking-[0.5em] uppercase mb-4 block">Master Visual Asset Synthesis</span>
                         <h3 className="text-white font-orbitron text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">{topic}</h3>
                      </div>
                    </div>
                  )}

                  {/* Comprehensive Script Document */}
                  <div className="glass-card p-20 md:p-28 rounded-[4rem] border-slate-100/50 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-32 gap-10">
                      <div className="flex items-center gap-8">
                         <div className="w-20 h-0.5 bg-slate-900 rounded-full"></div>
                         <h3 className="font-orbitron text-xs font-black tracking-[0.5em] uppercase text-slate-400">Archive_Document_Protocol</h3>
                      </div>
                      <div className="flex flex-wrap gap-5">
                         <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(script, null, 2)); addLog("CACHED."); }} className="px-10 py-4 bg-slate-50 text-[10px] font-orbitron font-black text-slate-500 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100 uppercase tracking-widest">Cache_Stream</button>
                         <button onClick={() => { if(pdfRef.current) html2pdf().from(pdfRef.current).save(); addLog("EXPORTED."); }} className="px-12 py-4 bg-slate-900 text-[10px] font-orbitron font-black text-white rounded-2xl hover:bg-cyan-600 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest">Export_PDF</button>
                      </div>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-32">
                      <section className="relative">
                         <div className="absolute -left-20 top-0 font-orbitron text-[10px] text-cyan-500 font-black -rotate-90 origin-left opacity-30 tracking-widest">PROLOGUE</div>
                         <p className="text-2xl md:text-3xl text-slate-900 leading-[1.7] font-medium pl-14 border-l-4 border-cyan-100">{script.intro}</p>
                      </section>
                      
                      {script.newsSegments.map((seg, i) => (
                        <section key={i} className="relative space-y-16 group/node">
                           <div className="absolute -left-20 top-0 font-orbitron text-[10px] text-indigo-500 font-black -rotate-90 origin-left opacity-30 uppercase tracking-widest">VECTOR_{i+1}</div>
                           <div className="pl-14 border-l-4 border-indigo-100 transition-colors group-hover/node:border-indigo-400 duration-500">
                             <h4 className="font-orbitron text-xl md:text-2xl font-black text-indigo-600 mb-12 uppercase tracking-tight">{seg.title}</h4>
                             <div className="flex flex-col lg:flex-row gap-16 items-start">
                                {seg.imageUrl && (
                                  <div className={`w-full lg:w-[420px] shrink-0 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-700 group-hover/node:scale-[1.02] ${i % 2 === 0 ? 'animate-slide-left' : 'animate-slide-right'}`}>
                                    <img src={seg.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-grow space-y-10">
                                  <p className="text-xl md:text-2xl text-slate-700 leading-[1.8] font-medium">{seg.script}</p>
                                  <div className="bg-slate-50/80 px-8 py-5 rounded-[1.5rem] border border-slate-100 inline-flex items-center gap-5 transition-all group-hover/node:bg-white group-hover/node:shadow-lg">
                                     <span className="text-[10px] font-orbitron font-black text-slate-400 uppercase tracking-[0.4em]">Node_Transition:</span>
                                     <span className="text-sm font-mono font-bold text-slate-600 italic">"{seg.transition}"</span>
                                  </div>
                                </div>
                             </div>
                           </div>
                        </section>
                      ))}

                      <section className="relative">
                         <div className="absolute -left-20 top-0 font-orbitron text-[10px] text-cyan-500 font-black -rotate-90 origin-left opacity-30 uppercase tracking-widest">EPILOGUE</div>
                         <p className="text-2xl md:text-3xl text-slate-900 leading-[1.7] font-medium pl-14 border-l-4 border-cyan-100">{script.outro}</p>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden PDF Engine Block */}
        <div className="hidden">
           <div ref={pdfRef} className="p-24 bg-white text-slate-900 font-inter">
              <div className="border-b-[12px] border-slate-900 pb-16 mb-20 flex justify-between items-end">
                <div>
                  <h1 className="text-7xl font-orbitron font-black tracking-tighter mb-4">NOVASCRIPT</h1>
                  <p className="text-sm font-mono font-bold text-slate-400 tracking-[0.5em] uppercase">Neural Synthesis Report // Sector Vector: {topic}</p>
                </div>
                <div className="text-right font-mono text-xs font-bold text-slate-900 uppercase leading-loose">
                  <div>System_ID: NS-3.1-{Math.floor(Math.random()*100000)}</div>
                  <div>Timestamp: {new Date().toLocaleString()}</div>
                  <div>Protocol: AEON-IV</div>
                </div>
              </div>
              <div className="space-y-24">
                 {script && (
                   <>
                    <p className="text-2xl leading-[1.7] border-l-[12px] border-slate-100 pl-12 font-medium">{script.intro}</p>
                    {script.newsSegments.map((s, i) => (
                      <div key={i} className="space-y-10">
                        <h2 className="text-3xl font-orbitron font-black uppercase text-indigo-600 tracking-tight">Segment_{i+1}: {s.title}</h2>
                        {s.imageUrl && <img src={s.imageUrl} className="w-full rounded-[3rem] shadow-xl mb-8" />}
                        <p className="text-2xl leading-[1.7] text-slate-800">{s.script}</p>
                        <div className="bg-slate-50 p-10 rounded-[2rem] text-sm font-mono italic text-slate-500 border border-slate-100">Transition Marker: {s.transition}</div>
                      </div>
                    ))}
                    <p className="text-2xl leading-[1.7] border-l-[12px] border-slate-100 pl-12 font-medium">{script.outro}</p>
                   </>
                 )}
              </div>
              <div className="mt-40 pt-16 border-t border-slate-100 flex justify-between items-center text-[10px] font-orbitron font-black text-slate-300 uppercase tracking-[0.5em]">
                <span>Validated Synthesis Core</span>
                <span>AI Generated Content</span>
              </div>
           </div>
        </div>
      </main>

      {/* Global Status Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/60 backdrop-blur-xl py-5 px-12 border-t border-slate-100/50 z-50 text-center">
         <div className="flex justify-center gap-14 items-center">
            <div className="flex gap-2">
               {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)}
            </div>
            <span className="text-[9px] font-orbitron font-black text-slate-300 tracking-[0.8em] uppercase">Secure Neural Stream Protocol // Active</span>
         </div>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes progress { 0% { left: -100%; width: 40%; } 50% { left: 0%; width: 100%; } 100% { left: 100%; width: 40%; } }
        .animate-progress-indefinite { animation: progress 2.5s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
