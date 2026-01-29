
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScriptOutput } from '../types';

interface TeleprompterProps {
  script: ScriptOutput;
}

const Teleprompter: React.FC<TeleprompterProps> = ({ script }) => {
  const [speed, setSpeed] = useState(2);
  const [isScrolling, setIsScrolling] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const fullText = useMemo(() => `
[SYSTEM_BOOT]
[LINK_ESTABLISHED]

${script.intro}

${script.newsSegments.map((seg, i) => `
>> DATA_STREAM_${i + 1}: ${seg.title.toUpperCase()}
${seg.script}

[TRANSITION_MARK]
${seg.transition}`).join('\n')}

[CLOSING_TRANSMISSION]
${script.outro}
[END_OF_LINE]
  `, [script]);

  useEffect(() => {
    setVisibleCount(0);
    let current = 0;
    const typingInterval = setInterval(() => {
      current += 8;
      if (current >= fullText.length) {
        setVisibleCount(fullText.length);
        clearInterval(typingInterval);
      } else {
        setVisibleCount(current);
      }
    }, 12);
    return () => clearInterval(typingInterval);
  }, [fullText]);

  useEffect(() => {
    if (isScrolling && scrollRef.current) {
      const scroll = () => {
        if (scrollRef.current) scrollRef.current.scrollTop += speed / 10;
        animationRef.current = requestAnimationFrame(scroll);
      };
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isScrolling, speed]);

  return (
    <div className="relative w-full h-[680px] border border-slate-200 rounded-[3rem] overflow-hidden bg-white shadow-[0_32px_100px_rgba(0,0,0,0.08)] flex">
      {/* Holographic Side Panel */}
      <div className="w-20 border-r border-slate-100 bg-slate-50/50 flex flex-col justify-between py-12 items-center">
        <div className="font-orbitron text-[9px] font-black -rotate-90 origin-center whitespace-nowrap tracking-[0.5em] text-cyan-600/60 uppercase">Stream_Telemetry</div>
        <div className="flex flex-col gap-6 items-center">
           {[...Array(6)].map((_, i) => (
             <div key={i} className={`w-1 h-6 rounded-full transition-all duration-1000 ${i === (Math.floor(visibleCount/100)%6) ? 'bg-cyan-500 scale-y-150' : 'bg-slate-200'}`}></div>
           ))}
        </div>
        <div className="font-mono text-[8px] text-slate-400 font-bold">NS_V3</div>
      </div>

      <div className="relative flex-grow h-full overflow-hidden">
        {/* Optical Overlays */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
        
        {/* Focus Sector Mask */}
        <div className="absolute top-1/2 left-0 right-0 h-32 -translate-y-1/2 bg-cyan-500/[0.03] backdrop-blur-[2px] border-y border-cyan-500/10 z-20 pointer-events-none flex items-center justify-between px-12">
           <div className="flex flex-col gap-1">
             <div className="text-[8px] font-orbitron font-black text-cyan-600 tracking-widest uppercase">Reading_Target</div>
             <div className="w-24 h-0.5 bg-cyan-500/30"></div>
           </div>
           <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
           </div>
        </div>

        {/* Text Container */}
        <div ref={scrollRef} className="w-full h-full overflow-y-auto px-20 py-96 text-center no-scrollbar">
          <pre className="whitespace-pre-wrap font-orbitron text-3xl md:text-5xl text-slate-900 leading-[1.7] uppercase tracking-wide font-black">
            {fullText.slice(0, visibleCount)}
            {visibleCount < fullText.length && (
              <span className="inline-block w-4 h-10 md:h-14 bg-cyan-500 shadow-[0_0_15px_rgba(14,165,233,0.8)] animate-pulse align-middle ml-2"></span>
            )}
          </pre>
        </div>
      </div>

      {/* Control Module */}
      <div className="absolute bottom-12 right-12 flex flex-col items-end gap-6 z-30">
        <div className="flex items-center gap-8 bg-white/95 backdrop-blur-2xl p-6 rounded-[2rem] border border-slate-100 shadow-2xl transition-all hover:border-cyan-200">
          <div className="flex flex-col">
            <span className="text-[9px] font-orbitron font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Warp_Speed</span>
            <div className="flex items-center gap-4">
              <span className="text-base font-mono font-bold text-cyan-600">{speed.toString().padStart(2, '0')}</span>
              <input
                type="range" min="1" max="10" value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-36 accent-cyan-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          {visibleCount < fullText.length && (
            <button
              onClick={() => setVisibleCount(fullText.length)}
              className="px-8 py-5 rounded-full font-orbitron font-black text-[10px] tracking-[0.3em] bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xl uppercase"
            >
              Skip_Sync
            </button>
          )}
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className={`px-14 py-5 rounded-full font-orbitron font-black text-xs tracking-[0.3em] transition-all shadow-2xl flex items-center gap-5 ripple-btn ${
              isScrolling ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600' : 'bg-slate-900 text-white shadow-slate-300 hover:bg-slate-800'
            }`}
          >
            {isScrolling ? (
              <><span className="w-2 h-2 bg-white rounded-full"></span> PAUSE_STREAM</>
            ) : (
              <><span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span> START_STREAM</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Teleprompter;
