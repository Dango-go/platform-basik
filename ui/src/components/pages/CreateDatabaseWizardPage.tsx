import React, { useState } from 'react';
import { CATALOG_ITEMS, K8S_CLUSTERS } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';
import { 
  PlusCircle, 
  Settings, 
  FileCode2, 
  Server, 
  HardDrive, 
  Cpu, 
  Play, 
  FilePlus, 
  ShieldCheck 
} from 'lucide-react';

interface CreateDatabaseWizardPageProps {
  initialEngineType?: string;
  onSuccess: () => void;
}

export const CreateDatabaseWizardPage: React.FC<CreateDatabaseWizardPageProps> = ({
  initialEngineType = 'postgresql',
  onSuccess
}) => {
  const [selectedEngine, setSelectedEngine] = useState(
    CATALOG_ITEMS.find((item) => item.engine_type === initialEngineType) || CATALOG_ITEMS[0]
  );
  const [selectedVersion, setSelectedVersion] = useState(selectedEngine.versions[0]);
  const [dbName, setDbName] = useState(`my-${selectedEngine.engine_type}-db`);
  const [selectedCluster, setSelectedCluster] = useState(K8S_CLUSTERS[0].name);
  const [selectedPreset, setSelectedPreset] = useState<'Small' | 'Medium' | 'Large'>('Medium');

  // TWO INSTALLATION MODE BUTTONS: UI vs Helm Chart
  const [installMode, setInstallMode] = useState<'ui' | 'helm'>('ui');

  // YAML editor content
  const [yamlContent, setYamlContent] = useState<string>(
    `primary:\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 2GB\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n  persistence:\n    size: 50Gi`
  );
  const [customFileName, setCustomFileName] = useState('custom-values.yaml');
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    let cpuM = 500;
    let ramMb = 2000;
    let storageGb = 20;

    if (selectedPreset === 'Medium') {
      cpuM = 1000;
      ramMb = 4000;
      storageGb = 50;
    } else if (selectedPreset === 'Large') {
      cpuM = 2000;
      ramMb = 8000;
      storageGb = 200;
    }

    await apiClient.deployDatabase({
      name: dbName,
      engine_type: selectedEngine.engine_type,
      version: selectedVersion,
      cluster_name: selectedCluster,
      namespace: 'databases',
      cpu_usage_m: cpuM,
      memory_usage_mb: ramMb,
      storage_gb: storageGb,
      monthly_cost: selectedPreset === 'Small' ? 24.50 : selectedPreset === 'Medium' ? 64.50 : 180.00,
      values_yaml: yamlContent
    });

    setIsDeploying(false);
    onSuccess();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-brand-sky" />
          Create New Database Instance
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Select engine parameters and preferred installation mode (UI presets or Helm Chart YAML code)
        </p>

        {/* TWO INSTALLATION MODE BUTTONS */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => setInstallMode('ui')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'ui'
                ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 text-white'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <Settings className={`w-6 h-6 mt-0.5 ${installMode === 'ui' ? 'text-brand-sky' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">1. Install via UI Main Parameters</span>
              <span className="text-xs text-slate-400 leading-normal">
                Visual preset picker (Small/Medium/Large), version dropdown & instance naming.
              </span>
            </div>
          </button>

          <button
            onClick={() => setInstallMode('helm')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'helm'
                ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 text-white'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <FileCode2 className={`w-6 h-6 mt-0.5 ${installMode === 'helm' ? 'text-brand-sky' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">2. Install Helm Chart (YAML Editor)</span>
              <span className="text-xs text-slate-400 leading-normal">
                Direct editing of `values.yaml` and option to add custom configuration files.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Configuration Form Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Step 1: General fields */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Database Instance Name</label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Target Kubernetes Cluster</label>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
            >
              {K8S_CLUSTERS.map((cls) => (
                <option key={cls.id} value={cls.name}>{cls.name} ({cls.provider})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Engine version picker */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Engine Version ({selectedEngine.name})</label>
          <div className="flex items-center gap-3">
            {selectedEngine.versions.map((ver) => (
              <button
                key={ver}
                onClick={() => setSelectedVersion(ver)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedVersion === ver
                    ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                    : 'bg-bg-main text-slate-300 border-accent-darkBorder hover:bg-accent-darkHover'
                }`}
              >
                v{ver} {ver === selectedEngine.versions[0] ? '(Recommended)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* MODE 1: UI PRESETS */}
        {installMode === 'ui' ? (
          <div className="space-y-6 pt-4 border-t border-accent-darkBorder">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Select Resource Preset
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Small', cpu: '1 Core', ram: '2.0 GB', disk: '10 GB SSD', cost: '$24.50/mo' },
                  { name: 'Medium', cpu: '2 Cores', ram: '8.0 GB', disk: '50 GB SSD', cost: '$64.50/mo' },
                  { name: 'Large', cpu: '4 Cores', ram: '16.0 GB', disk: '200 GB SSD', cost: '$180.00/mo' },
                ].map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => setSelectedPreset(preset.name as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPreset === preset.name
                        ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 shadow-md'
                        : 'bg-bg-main border-accent-darkBorder hover:bg-accent-darkHover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{preset.name}</span>
                      <span className="text-xs font-extrabold text-brand-sky">{preset.cost}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-slate-500" /> {preset.cpu}</div>
                      <div className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-slate-500" /> {preset.ram}</div>
                      <div className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-slate-500" /> {preset.disk}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: HELM CHART YAML EDITOR */
          <div className="space-y-4 pt-4 border-t border-accent-darkBorder">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-brand-sky" />
                Interactive YAML Editor (values.yaml)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="bg-bg-main border border-accent-darkBorder text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono"
                />
                <button className="bg-brand-blue/20 text-brand-sky hover:bg-brand-blue/30 border border-brand-sky/30 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1">
                  <FilePlus className="w-3.5 h-3.5" /> Add Custom File
                </button>
              </div>
            </div>

            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              rows={10}
              className="w-full bg-brand-dark text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-sky leading-relaxed"
            ></textarea>
          </div>
        )}

        {/* Deploy Action Bar */}
        <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-end">
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
          >
            {isDeploying ? (
              <span>Deploying to Cluster...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Deploy to K8s Cluster</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
