import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  children
}) => {
  const titles: Record<string, string> = {
    create: 'Create Database',
    databases: 'Databases Catalog & Installed List',
    finance: 'Finance & Budget Tracking',
    monitoring: 'Monitoring & Performance Metrics',
    cloud: 'Cloud Credentials & K8s Clusters'
  };

  return (
    <div className="flex min-h-screen bg-bg-main text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTabTitle={titles[activeTab] || 'Data Basik Console'} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
