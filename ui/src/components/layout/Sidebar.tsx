import React from 'react';
import { 
  Database, 
  PlusCircle, 
  DollarSign, 
  Activity, 
  Cloud, 
  LogOut, 
  Layers,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'create', label: 'Create Database', icon: PlusCircle, highlight: true },
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'store_backups', label: 'Store and Backups', icon: HardDrive },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'cloud', label: 'Cloud', icon: Cloud },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-accent-darkBorder flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Header / Logo */}
        <div className="p-6 border-b border-accent-darkBorder flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-sky to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-white tracking-tight leading-none">Data Basik</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
                    : item.highlight
                    ? 'bg-brand-blue/10 text-brand-sky hover:bg-brand-blue/20 border border-brand-blue/30'
                    : 'text-slate-400 hover:bg-accent-darkHover hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-brand-sky' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-accent-darkBorder bg-bg-main">
        <div className="flex items-center justify-between p-2 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm shadow-md">
              DB
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">bodya@databasik.io</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
