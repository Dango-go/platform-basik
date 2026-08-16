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
  Database,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Boxes
} from 'lucide-react';

interface CreateDatabaseWizardPageProps {
  initialEngineType?: string;
  onSuccess: () => void;
}

// Helm chart mapping default for each engine
const ENGINE_HELM_CHARTS: Record<string, string> = {
  postgresql: 'bitnami/postgresql (v15.5.2)',
  mysql: 'bitnami/mysql (v10.2.1)',
  mariadb: 'bitnami/mariadb (v19.0.1)',
  cockroach: 'cockroachdb/cockroachdb (v11.1.5)',
  mongodb: 'bitnami/mongodb (v15.4.0)',
  cassandra: 'bitnami/cassandra (v11.0.3)',
  couchbase: 'couchbase/couchbase-operator (v2.6.0)',
  scylladb: 'scylla-operator/scylla (v1.11.0)',
  qdrant: 'qdrant/qdrant (v0.6.4)',
  milvus: 'milvus/milvus (v4.1.14)',
  chroma: 'chroma/chromadb (v0.1.2)',
  weaviate: 'weaviate/weaviate (v1.24.1)',
  redis: 'bitnami/redis (v18.1.5)',
  keydb: 'enapter/keydb (v0.4.2)',
  dragonfly: 'dragonflydb/dragonfly (v0.8.0)',
  clickhouse: 'bitnami/clickhouse (v5.1.0)',
  influxdb: 'influxdata/influxdb (v2.1.2)',
  timescaledb: 'timescale/timescaledb (v0.32.0)',
  questdb: 'questdb/questdb (v0.3.1)'
};

// Default Custom Resource Manifests for Mode 3 (Operator Service CRD)
const DEFAULT_CRD_MANIFESTS: Record<string, string> = {
  postgresql: `apiVersion: postgresql.cnpg.io/v1\nkind: Cluster\nmetadata:\n  name: my-postgres-db\n  namespace: databases\nspec:\n  instances: 3\n  storage:\n    size: 50Gi\n  postgresql:\n    parameters:\n      max_connections: "250"\n      shared_buffers: "2GB"`,
  redis: `apiVersion: redis.redis.opstreelabs.in/v1beta1\nkind: Redis\nmetadata:\n  name: my-redis-cache\n  namespace: databases\nspec:\n  kubernetesConfig:\n    image: redis:7.2\n  redisExporter:\n    enabled: true`,
  clickhouse: `apiVersion: clickhouse.altinity.com/v1\nkind: ClickHouseInstallation\nmetadata:\n  name: my-clickhouse-analytics\n  namespace: databases\nspec:\n  configuration:\n    clusters:\n      - name: "prod-cluster"\n        layout:\n          shardsCount: 2\n          replicasCount: 2`,
  mongodb: `apiVersion: mongodbcommunity.mongodb.com/v1\nkind: MongoDBCommunity\nmetadata:\n  name: my-mongodb-cluster\n  namespace: databases\nspec:\n  members: 3\n  type: ReplicaSet\n  version: "7.0.5"`
};

export const CreateDatabaseWizardPage: React.FC<CreateDatabaseWizardPageProps> = ({
  initialEngineType = 'postgresql',
  onSuccess
}) => {
  const [selectedEngine, setSelectedEngine] = useState(
    CATALOG_ITEMS.find((item) => item.engine_type === initialEngineType) || CATALOG_ITEMS[0]
  );
  const [selectedVersion, setSelectedVersion] = useState(selectedEngine.versions[0]);
  const [dbName, setDbName] = useState(`my-${selectedEngine.engine_type}-db`);

  // Cascading Dependent Selects for Provider -> Cluster
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');

  // Custom resource values input state
  const [customCpu, setCustomCpu] = useState<string>('2');
  const [customRam, setCustomRam] = useState<string>('8');
  const [customDisk, setCustomDisk] = useState<string>('50');

  // Selected preset for resources: 'Custom' | 'Small' | 'Medium' | 'Large'
  const [selectedPreset, setSelectedPreset] = useState<'Custom' | 'Small' | 'Medium' | 'Large'>('Medium');

  // 3 INSTALLATION MODES: 'ui' (Preset Deployment), 'helm' (Helm values.yaml), 'crd' (Operator Service CRD Manifest)
  const [installMode, setInstallMode] = useState<'ui' | 'helm' | 'crd'>('ui');

  // YAML editor content for Helm (Mode 2)
  const [yamlContent, setYamlContent] = useState<string>(
    `primary:\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 2GB\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n  persistence:\n    size: 50Gi`
  );
  const [customFileName, setCustomFileName] = useState('custom-values.yaml');

  // CRD Manifest content & Namespace for Operator Service (Mode 3)
  const [crdManifestContent, setCrdManifestContent] = useState<string>(
    DEFAULT_CRD_MANIFESTS[selectedEngine.engine_type] || DEFAULT_CRD_MANIFESTS['postgresql']
  );
  const [crdNamespace, setCrdNamespace] = useState<string>('default (specified in manifest)');

  const [isDeploying, setIsDeploying] = useState(false);

  // Filter clusters based on selected Cloud Provider
  const availableClusters = selectedProvider
    ? K8S_CLUSTERS.filter((cls) => {
        const prov = cls.provider.toLowerCase();
        if (selectedProvider === 'aws') return prov.includes('aws') || prov.includes('eks');
        if (selectedProvider === 'gcp') return prov.includes('gcp') || prov.includes('gke');
        if (selectedProvider === 'azure') return prov.includes('azure') || prov.includes('aks');
        if (selectedProvider === 'digitalocean') return prov.includes('digitalocean') || prov.includes('doks');
        if (selectedProvider === 'onprem') return prov.includes('on-premise');
        return true;
      })
    : [];

  const handleProviderChange = (prov: string) => {
    setSelectedProvider(prov);
    setSelectedCluster(''); // Reset dependent cluster selection
  };

  const handleEngineChange = (engineType: string) => {
    const found = CATALOG_ITEMS.find((item) => item.engine_type === engineType);
    if (found) {
      setSelectedEngine(found);
      setSelectedVersion(found.versions[0]);
      setDbName(`my-${found.engine_type}-db`);
      if (DEFAULT_CRD_MANIFESTS[found.engine_type]) {
        setCrdManifestContent(DEFAULT_CRD_MANIFESTS[found.engine_type]);
      }
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    let cpuM = (parseInt(customCpu, 10) || 2) * 1000;
    let ramMb = (parseInt(customRam, 10) || 8) * 1024;
    let storageGb = parseInt(customDisk, 10) || 50;

    const targetClusterName = selectedCluster || (K8S_CLUSTERS[0]?.name ?? 'onprem-prod-k8s');

    await apiClient.deployDatabase({
      name: dbName,
      engine_type: selectedEngine.engine_type,
      version: selectedVersion,
      cluster_name: targetClusterName,
      namespace: 'databases',
      cpu_usage_m: cpuM,
      memory_usage_mb: ramMb,
      storage_gb: storageGb,
      monthly_cost: 64.50,
      values_yaml: installMode === 'crd' ? crdManifestContent : yamlContent
    });

    setIsDeploying(false);
    onSuccess();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-100">
      {/* Header Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-brand-sky" />
            Create New Database Instance
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Select engine parameters and preferred installation mode (UI presets, Helm values.yaml, or K8s Operator CRD)
          </p>
        </div>

        {/* THREE INSTALLATION MODE BUTTONS: UI Presets vs Helm Chart vs Operator CRD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* MODE 1: Preset Deployment */}
          <button
            onClick={() => setInstallMode('ui')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'ui'
                ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 text-white shadow-lg'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <Settings className={`w-6 h-6 mt-0.5 shrink-0 ${installMode === 'ui' ? 'text-brand-sky' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">1. Preset Deployment</span>
              <span className="text-xs text-slate-400 leading-normal">
                Visual preset picker (Small/Medium/Large), version dropdown & instance naming.
              </span>
            </div>
          </button>

          {/* MODE 2: YAML Editor (Helm Chart) */}
          <button
            onClick={() => setInstallMode('helm')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'helm'
                ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 text-white shadow-lg'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <FileCode2 className={`w-6 h-6 mt-0.5 shrink-0 ${installMode === 'helm' ? 'text-brand-sky' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">2. YAML Editor (Helm Chart)</span>
              <span className="text-xs text-slate-400 leading-normal">
                Direct editing of `values.yaml` and option to add custom configuration files.
              </span>
            </div>
          </button>

          {/* MODE 3: K8s Custom Resource (Operator Service CRD) */}
          <button
            onClick={() => setInstallMode('crd')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'crd'
                ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 text-white shadow-lg'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <Boxes className={`w-6 h-6 mt-0.5 shrink-0 ${installMode === 'crd' ? 'text-brand-sky' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">3. Custom Resource (CRD)</span>
              <span className="text-xs text-slate-400 leading-normal">
                Kubernetes Operator CRD Manifest (CloudNativePG / KubeDB via operator-service).
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* Main Configuration Form Container */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* ======================================================== */}
        {/* STEP 1: INITIAL MANDATORY FIELDS FOR MODES 1 & 2 */}
        {/* ======================================================== */}
        {installMode !== 'crd' && (
          <div className="space-y-6">
            <div className="border-b border-accent-darkBorder pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-sky flex items-center gap-2">
                  <Database className="w-4 h-4" /> Instance & Cluster Target Parameters
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Specify instance ID, database engine, cloud provider, and target cluster</p>
              </div>

              {/* Engine Version Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Engine Version:</span>
                {selectedEngine.versions.map((ver) => (
                  <button
                    key={ver}
                    onClick={() => setSelectedVersion(ver)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedVersion === ver
                        ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                        : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover hover:text-white'
                    }`}
                  >
                    v{ver}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* FIELD 1: Database Name (ID) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Database Instance Name (ID)
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g., my-app-db"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Unique identifier inside K8s namespace</span>
              </div>

              {/* FIELD 2: Database Engine Name (Select) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Database Engine Name
                </label>
                <select
                  value={selectedEngine.engine_type}
                  onChange={(e) => handleEngineChange(e.target.value)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                >
                  {CATALOG_ITEMS.map((item) => (
                    <option key={item.id} value={item.engine_type}>
                      {item.name} ({item.badge})
                    </option>
                  ))}
                </select>

                {/* AUTOMATIC HELM CHART MAPPING DISPLAY */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand-sky font-mono bg-brand-blue/10 px-2.5 py-1 rounded-lg border border-brand-sky/20">
                  <PackageCheck className="w-3.5 h-3.5 shrink-0 text-brand-sky" />
                  <span className="truncate">
                    Chart: <strong>{ENGINE_HELM_CHARTS[selectedEngine.engine_type] || `bitnami/${selectedEngine.engine_type}`}</strong>
                  </span>
                </div>
              </div>

              {/* FIELD 3: Cluster Selection (Cascading Dependent Selects) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Cloud Provider / Environment
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  >
                    <option value="">-- Select Cloud Provider --</option>
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="onprem">On-Premise</option>
                  </select>
                </div>

                {/* Target Cluster (Activated only after provider selected) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Kubernetes Cluster
                  </label>
                  <select
                    disabled={!selectedProvider}
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    className={`w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all font-semibold border ${
                      !selectedProvider
                        ? 'bg-bg-main/50 text-slate-600 border-accent-darkBorder/40 cursor-not-allowed'
                        : 'bg-bg-main border-accent-darkBorder text-white focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky'
                    }`}
                  >
                    <option value="">
                      {!selectedProvider ? '⚠️ First select a Cloud Provider' : '-- Select Target Cluster --'}
                    </option>
                    {availableClusters.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} ({cls.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: PRESET DEPLOYMENT (RESOURCE SIZING PANEL) */}
        {/* ======================================================== */}
        {installMode === 'ui' && (
          <div className="space-y-6 pt-6 border-t border-accent-darkBorder">
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-sky" /> Resource Allocation & Presets
                </span>
                <span className="text-xs font-semibold text-slate-400">Specify custom limits or select backend calculated presets</span>
              </div>

              {/* TWO SIDE-BY-SIDE PANELS: CUSTOM INPUTS ON LEFT, 3 PRESET COLUMNS ON RIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT BLOCK: CUSTOM RESOURCE INPUTS */}
                <div className="lg:col-span-5 p-4 bg-bg-card border border-accent-darkBorder rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-sky" /> Custom Resource Allocation
                    </span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">CPU Cores</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="64"
                            value={customCpu}
                            onChange={(e) => {
                              setCustomCpu(e.target.value);
                              setSelectedPreset('Custom');
                            }}
                            placeholder="e.g., 2"
                            className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                          />
                          <Cpu className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">RAM Memory (GB)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="256"
                            value={customRam}
                            onChange={(e) => {
                              setCustomRam(e.target.value);
                              setSelectedPreset('Custom');
                            }}
                            placeholder="e.g., 8"
                            className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                          />
                          <Server className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Storage SSD (GB)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="5000"
                            value={customDisk}
                            onChange={(e) => {
                              setCustomDisk(e.target.value);
                              setSelectedPreset('Custom');
                            }}
                            placeholder="e.g., 50"
                            className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                          />
                          <HardDrive className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 italic block pt-2 border-t border-accent-darkBorder/40">
                    Values specified here will override standard preset configurations.
                  </span>
                </div>

                {/* RIGHT BLOCK: 3 COLUMNS FOR SMALL, MEDIUM, LARGE */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Small', name: 'Small' },
                    { id: 'Medium', name: 'Medium' },
                    { id: 'Large', name: 'Large' },
                  ].map((preset) => {
                    const isSelected = selectedPreset === preset.name;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.name as any)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 shadow-md'
                            : 'bg-bg-card border-accent-darkBorder hover:bg-accent-darkHover'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-sky" />}
                              {preset.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-main text-brand-sky border border-accent-darkBorder">
                              Dynamic
                            </span>
                          </div>

                          <div className="space-y-2 text-xs text-slate-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-slate-500" />
                              <span>__ Cores</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Server className="w-3.5 h-3.5 text-slate-500" />
                              <span>__ GB RAM</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                              <span>__ GB SSD</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-accent-darkBorder/40 text-[10px] text-slate-500 text-center font-mono">
                          Calculated by backend
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: HELM CHART YAML EDITOR */}
        {/* ======================================================== */}
        {installMode === 'helm' && (
          <div className="space-y-4 pt-4 border-t border-accent-darkBorder">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-brand-sky" />
                Interactive Helm Chart YAML Editor (values.yaml)
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

        {/* ======================================================== */}
        {/* MODE 3: KUBERNETES CUSTOM RESOURCE (OPERATOR SERVICE CRD) */}
        {/* ======================================================== */}
        {installMode === 'crd' && (
          <div className="space-y-6 pt-4 border-t border-accent-darkBorder">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand-sky" /> 3. Kubernetes Custom Resource Deployment (Operator Service)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste your ready Custom Resource manifest (Operator CRD, CloudNativePG, KubeDB, Altinity, etc.) to deploy directly via operator-service
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                ● Operator Service API Ready
              </span>
            </div>

            {/* RESOURCE NAME, NAMESPACE & CASCADING CLUSTER SELECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource Name & Target Namespace */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    required
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="e.g., my-custom-operator-cr"
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Custom Resource metadata.name</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Target Namespace
                  </label>
                  <input
                    type="text"
                    value={crdNamespace}
                    onChange={(e) => setCrdNamespace(e.target.value)}
                    placeholder="default (specified in manifest)"
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Kubernetes namespace (default specified in manifest)</span>
                </div>
              </div>

              {/* Cloud Provider & Target Cluster (Cascading Dependent Selects) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Cloud Provider / Environment
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
                  >
                    <option value="">-- Select Cloud Provider --</option>
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="onprem">On-Premise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Kubernetes Cluster
                  </label>
                  <select
                    disabled={!selectedProvider}
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    className={`w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all font-semibold border ${
                      !selectedProvider
                        ? 'bg-bg-main/50 text-slate-600 border-accent-darkBorder/40 cursor-not-allowed'
                        : 'bg-bg-main border-accent-darkBorder text-white focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky'
                    }`}
                  >
                    <option value="">
                      {!selectedProvider ? '⚠️ First select a Cloud Provider' : '-- Select Target Cluster --'}
                    </option>
                    {availableClusters.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} ({cls.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* INTERACTIVE YAML MANIFEST TERMINAL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-brand-sky" /> Interactive Manifest Terminal (YAML)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Schema: <strong className="text-brand-sky">kubectl apply -f</strong>
                </span>
              </div>

              <div className="relative bg-brand-dark border border-slate-800 rounded-2xl p-4 shadow-inner">
                <textarea
                  value={crdManifestContent}
                  onChange={(e) => setCrdManifestContent(e.target.value)}
                  rows={12}
                  placeholder="Paste your Kubernetes Custom Resource YAML manifest here..."
                  className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none leading-relaxed resize-y"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Action Bar */}
        <div className="pt-4 border-t border-accent-darkBorder flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {installMode === 'crd'
                ? `CRD manifest targeted for operator-service on ${selectedCluster || 'cluster'}`
                : `Deployment payload validated for cluster ${selectedCluster || 'target'}`}
            </span>
          </div>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
          >
            {isDeploying ? (
              <span>Deploying via {installMode === 'crd' ? 'Operator Service' : 'Helm Deployer'}...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Deploy via {installMode === 'crd' ? 'Operator CRD' : 'Helm Chart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
