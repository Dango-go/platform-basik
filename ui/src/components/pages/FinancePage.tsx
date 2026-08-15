import React from 'react';
import { INITIAL_DEPLOYED_DBS } from '../../services/mockData';
import { DollarSign, Cpu, HardDrive, TrendingUp } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const totalCost = INITIAL_DEPLOYED_DBS.reduce((sum, db) => sum + db.monthly_cost, 0);

  return (
    <div className="space-y-8 text-slate-100">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-bg-main via-bg-card to-brand-dark border border-accent-darkBorder p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Monthly Budget</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white mt-2">${totalCost.toFixed(2)} / mo</h3>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4.2% from last month
          </p>
        </div>

        <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">K8s Compute (CPU / RAM)</span>
            <Cpu className="w-5 h-5 text-brand-sky" />
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">${(totalCost * 0.65).toFixed(2)}</h3>
          <span className="text-xs text-slate-400 mt-1 block">65% of overall infrastructure cost</span>
        </div>

        <div className="bg-bg-card border border-accent-darkBorder p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Storage Disks (PVC SSD)</span>
            <HardDrive className="w-5 h-5 text-brand-cyan" />
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">${(totalCost * 0.35).toFixed(2)}</h3>
          <span className="text-xs text-slate-400 mt-1 block">35% of overall cost (315 GB SSD total)</span>
        </div>
      </div>

      {/* 2. Active Instance Cost Breakdown Table */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Active Database Instance Cost Breakdown</h3>
          <p className="text-xs text-slate-400">Detailed monthly resource allocation costs per active database deployment</p>
        </div>

        <div className="space-y-4">
          {INITIAL_DEPLOYED_DBS.map((db) => {
            const computeCost = db.monthly_cost * 0.65;
            const storageCost = db.monthly_cost * 0.35;
            return (
              <div key={db.id} className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl flex items-center justify-between hover:bg-accent-darkHover transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-card border border-accent-darkBorder flex items-center justify-center font-extrabold text-brand-sky shadow-md">
                    ${db.monthly_cost.toFixed(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{db.name}</h4>
                    <p className="text-xs text-slate-400">Cluster: {db.cluster_name} | Namespace: {db.namespace}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">K8s Compute (CPU/RAM)</span>
                    <span className="text-sm font-bold text-white">${computeCost.toFixed(2)}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">PVC Disk ({db.storage_gb}GB SSD)</span>
                    <span className="text-sm font-bold text-white">${storageCost.toFixed(2)}</span>
                  </div>

                  <div className="text-right pl-4 border-l border-slate-800">
                    <span className="text-xs text-slate-400 block">Total Monthly Cost</span>
                    <span className="text-lg font-extrabold text-brand-sky">${db.monthly_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
