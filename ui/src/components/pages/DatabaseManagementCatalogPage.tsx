import React from 'react';
import { DatabaseCatalogItem } from '../../types';
import { 
  ArrowLeft, 
  Terminal, 
  Layers, 
  Sliders, 
  History, 
  ShieldCheck, 
  Server,
  Database
} from 'lucide-react';

interface DatabaseManagementCatalogPageProps {
  item: DatabaseCatalogItem;
  onBack: () => void;
  onNavigateCreate: (engineType: string) => void;
}

export const DatabaseManagementCatalogPage: React.FC<DatabaseManagementCatalogPageProps> = ({
  item,
  onBack,
  onNavigateCreate
}) => {
  const managementBlocks = [
    {
      id: 'cli',
      title: 'DataBase Management CLI',
      description: 'Command line tools, psql/redis-cli terminals, and remote script automation wrappers.',
      icon: Terminal,
      badge: 'CLI Tools'
    },
    {
      id: 'topologies',
      title: 'Deployment Topologies',
      description: 'Single-node, Primary-Replica High Availability (HA), and multi-region sharded cluster topologies.',
      icon: Layers,
      badge: 'Topology'
    },
    {
      id: 'sizing',
      title: 'Resource Sizing Presets',
      description: 'Custom CPU/RAM presets, custom values.yaml override templates, and autoscale parameters.',
      icon: Sliders,
      badge: 'Presets'
    },
    {
      id: 'history',
      title: 'Deployment & Audit History',
      description: 'Historical release logs, Helm deployment revisions, rollbacks, and developer access audit logs.',
      icon: History,
      badge: 'Audit Logs'
    },
    {
      id: 'backups',
      title: 'Backup Policies',
      description: 'Automated WAL-G / Velero snapshot schedules, S3 target retention, and point-in-time recovery (PITR).',
      icon: ShieldCheck,
      badge: 'Disaster Recovery'
    }
  ];

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header with Back Button */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-accent-darkBorder"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-main p-2 flex items-center justify-center border border-accent-darkBorder">
              <img src={item.icon_url} alt={item.name} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                {item.name} Management Catalog
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                  v{item.versions[0]}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Detailed management modules, topology profiles, and backup policies</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateCreate(item.engine_type)}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
        >
          <Database className="w-4 h-4" />
          <span>Provision {item.name} Instance</span>
        </button>
      </div>

      {/* 5 SQUARE MANAGEMENT BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementBlocks.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4 hover:border-brand-sky transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-main p-2.5 flex items-center justify-center border border-accent-darkBorder text-brand-sky group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-bg-main text-brand-sky border border-accent-darkBorder">
                    {block.badge}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-brand-sky transition-colors">
                  {block.title}
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {block.description}
                </p>
              </div>

              <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between text-xs font-semibold text-brand-sky">
                <span>Module Status: Ready</span>
                <span className="group-hover:translate-x-1 transition-transform">Configure &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
