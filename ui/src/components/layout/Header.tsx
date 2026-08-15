import React from 'react';
import { Bell, CheckCircle2, BarChart2 } from 'lucide-react';

interface HeaderProps {
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTabTitle }) => {
  return (
    <header className="h-16 bg-bg-card/80 backdrop-blur-md border-b border-accent-darkBorder px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight">{activeTabTitle}</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-accent-darkHover rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-brand-sky rounded-full absolute top-2 right-2 ring-2 ring-bg-card"></span>
        </button>

        {/* White Chart Emblem Button (Replaced Cluster CPU text) */}
        <button 
          title="Cluster Metrics Overview"
          className="p-2.5 bg-bg-main border border-accent-darkBorder rounded-xl text-white hover:bg-accent-darkHover hover:border-brand-sky transition-colors shadow-md flex items-center justify-center"
        >
          <BarChart2 className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
};
