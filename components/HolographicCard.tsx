
import React from 'react';
import { NewsArticle } from '../types';

interface HolographicCardProps {
  article: NewsArticle;
  delay: number;
}

const HolographicCard: React.FC<HolographicCardProps> = ({ article, delay }) => {
  return (
    <div
      className="relative glass-card tech-border p-7 rounded-3xl transition-all duration-500 overflow-hidden group hover:scale-[1.02] hover:shadow-2xl hover:border-cyan-300/50 animate-fade-in"
      style={{ animation: `fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${delay}s both` }}
    >
      <div className="absolute top-0 right-0 p-3 opacity-20 font-mono text-[8px] tracking-widest pointer-events-none">
        REF_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
      </div>

      <div className="flex justify-between items-center mb-5">
        <span className="text-[9px] font-orbitron font-black text-white bg-slate-900 px-3 py-1 rounded-md uppercase tracking-widest">
          {article.source}
        </span>
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
          {article.timestamp}
        </span>
      </div>

      <h3 className="font-orbitron text-base md:text-lg text-slate-900 mb-5 leading-tight tracking-tight font-black group-hover:text-cyan-600 transition-colors">
        {article.title}
      </h3>

      {article.summary && (
        <div className="relative pl-6 py-1">
           <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-indigo-500 rounded-full"></div>
           <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {article.summary}
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="flex gap-1">
             <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
             <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
           </div>
           <span className="text-[8px] font-mono font-bold text-slate-300 tracking-widest uppercase">Validated</span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-orbitron font-bold text-slate-400 hover:text-cyan-600 transition-all flex items-center gap-2"
        >
          VIEW_SOURCE <span className="text-xs">→</span>
        </a>
      </div>
    </div>
  );
};

export default HolographicCard;
