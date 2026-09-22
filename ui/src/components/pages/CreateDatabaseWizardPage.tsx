import React, { useState, useEffect, useRef } from 'react';
import { CATALOG_ITEMS, K8S_CLUSTERS as MOCK_CLUSTERS } from '../../services/mockData';
import { CHART_CATALOG_PACKAGES, ChartCatalogPackage } from '../../services/chartCatalog';
import { apiClient } from '../../services/apiClient';
import { K8sCluster } from '../../types';
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
  Boxes,
  FolderTree,
  Save,
  Download,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Wand2,
  Lock,
  X,
  FileText,
  Tag,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  Zap,
  Globe,
  Check
} from 'lucide-react';

interface CreateDatabaseWizardPageProps {
  initialEngineType?: string;
  onSuccess: () => void;
}

interface HelmChartFileItem {
  name: string;
  path: string;
  content: string;
}

// Pre-defined Helm Chart File tree for each database engine
const HELM_CHART_FILES: Record<string, HelmChartFileItem[]> = {
  postgresql: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `primary:\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 2GB\n    work_mem = 16MB\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n    limits:\n      cpu: 2000m\n      memory: 8Gi\n  persistence:\n    enabled: true\n    size: 50Gi\nreadReplicas:\n  replicaCount: 2`
    },
    {
      name: 'templates/primary/statefulset.yaml',
      path: 'templates/primary/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}\n  labels:\n    app.kubernetes.io/component: primary\nspec:\n  replicas: 1\n  serviceName: {{ include "postgresql.primary.fullname" . }}-headless\n  template:\n    spec:\n      containers:\n        - name: postgresql\n          image: docker.io/bitnami/postgresql:16.2.0`
    },
    {
      name: 'templates/configmap.yaml',
      path: 'templates/configmap.yaml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}-configuration\ndata:\n  postgresql.conf: |\n    max_connections = 250\n    shared_buffers = 2GB\n    work_mem = 16MB\n    maintenance_work_mem = 256MB`
    },
    {
      name: 'templates/secrets.yaml',
      path: 'templates/secrets.yaml',
      content: `apiVersion: v1\nkind: Secret\nmetadata:\n  name: {{ include "postgresql.primary.fullname" . }}\ntype: Opaque\nstringData:\n  postgres-password: "CHANGE_ME_IN_VAULT"\n  password: "SECURE_APP_DB_PASSWORD"`
    },
    {
      name: 'Chart.yaml',
      path: 'Chart.yaml',
      content: `apiVersion: v2\nname: postgresql\ndescription: Bitnami Helm chart for PostgreSQL database\nversion: 15.5.2\nappVersion: 16.2.0`
    }
  ],
  redis: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `architecture: replication\nmaster:\n  persistence:\n    enabled: true\n    size: 20Gi\n  resources:\n    requests:\n      cpu: 500m\n      memory: 2Gi\nreplica:\n  replicaCount: 3`
    },
    {
      name: 'templates/master/statefulset.yaml',
      path: 'templates/master/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "redis.master.fullname" . }}\nspec:\n  replicas: 1\n  serviceName: {{ include "redis.master.fullname" . }}-headless`
    },
    {
      name: 'templates/configmap.yaml',
      path: 'templates/configmap.yaml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "redis.fullname" . }}-configuration\ndata:\n  redis.conf: |\n    maxmemory-policy allkeys-lru\n    appendonly yes\n    save 60 1`
    }
  ],
  clickhouse: [
    {
      name: 'values.yaml',
      path: 'values.yaml',
      content: `shards: 2\nreplicas: 2\nresources:\n  requests:\n    cpu: 2000m\n    memory: 8Gi\npersistence:\n  size: 200Gi`
    },
    {
      name: 'templates/statefulset.yaml',
      path: 'templates/statefulset.yaml',
      content: `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: {{ include "clickhouse.fullname" . }}\nspec:\n  serviceName: {{ include "clickhouse.fullname" . }}-headless`
    },
    {
      name: 'templates/configmap-users.xml',
      path: 'templates/configmap-users.xml',
      content: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ include "clickhouse.fullname" . }}-users\ndata:\n  users.xml: |\n    <clickhouse>\n      <users>\n        <default>\n          <password></password>\n        </default>\n      </users>\n    </clickhouse>`
    }
  ]
};

export const CreateDatabaseWizardPage: React.FC<CreateDatabaseWizardPageProps> = ({
  initialEngineType = 'postgresql',
  onSuccess
}) => {
  // Initialize initial package from Catalog
  const initialPkg = CHART_CATALOG_PACKAGES.find(
    (pkg) => pkg.engine_type === initialEngineType && pkg.recommended_for_prod
  ) || CHART_CATALOG_PACKAGES.find(
    (pkg) => pkg.engine_type === initialEngineType
  ) || CHART_CATALOG_PACKAGES[0];

  const [selectedPackage, setSelectedPackage] = useState<ChartCatalogPackage>(initialPkg);
  const [selectedEngine, setSelectedEngine] = useState(
    CATALOG_ITEMS.find((item) => item.engine_type === initialPkg.engine_type) || CATALOG_ITEMS[0]
  );
  const [selectedVersion, setSelectedVersion] = useState(initialPkg.app_version || selectedEngine.versions[0]);
  const [dbName, setDbName] = useState(`my-${initialPkg.engine_type}-${initialPkg.package_type === 'operator' ? 'cluster' : 'db'}`);

  // Catalog Search & Filter States
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'all' | 'operator' | 'helm_chart'>('all');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const catalogContainerRef = useRef<HTMLDivElement>(null);

  // Cascading Dependent Selects for Provider -> Cluster
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');

  // Custom resource values input state
  const [customCpu, setCustomCpu] = useState<string>('2');
  const [customRam, setCustomRam] = useState<string>('8');
  const [customDisk, setCustomDisk] = useState<string>('50');

  // Selected preset for resources: 'Custom' | 'Small' | 'Medium' | 'Large'
  const [selectedPreset, setSelectedPreset] = useState<'Custom' | 'Small' | 'Medium' | 'Large'>('Medium');

  // 2 INSTALLATION MODES: 'helm' (Helm values.yaml) or 'crd' (Operator Service CRD Manifest)
  const [installMode, setInstallMode] = useState<'helm' | 'crd'>(
    initialPkg.package_type === 'operator' ? 'crd' : 'helm'
  );

  // Selected File inside Helm Chart & Load/Installed state
  const [selectedHelmFile, setSelectedHelmFile] = useState<string>('values.yaml');
  const [isChartLoaded, setIsChartLoaded] = useState<boolean>(true);
  const [isChartInstalled, setIsChartInstalled] = useState<boolean>(false);
  const [deployErrorMsg, setDeployErrorMsg] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let res = '';
    for (let i = 0; i < 20; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res + 'Secured';
  };

  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [dbPassword, setDbPassword] = useState<string>(generateRandomPassword());
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // YAML editor content for Helm (Mode 1)
  const [yamlContent, setYamlContent] = useState<string>(initialPkg.default_values_yaml || '');
  
  // Modal & User custom YAML files state
  const [showAddCustomFileModal, setShowAddCustomFileModal] = useState<boolean>(false);
  const [newCustomFileName, setNewCustomFileName] = useState<string>('my-custom-values.yaml');
  const [userCustomFiles, setUserCustomFiles] = useState<Array<{ name: string; path: string; content: string }>>([]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [helmChartNameInput, setHelmChartNameInput] = useState<string>(initialPkg.chart_name);
  const [helmChartVersionInput, setHelmChartVersionInput] = useState<string>(initialPkg.default_version);
  const [helmActionStatus, setHelmActionStatus] = useState<string>('');
  const [isExecutingHelmAction, setIsExecutingHelmAction] = useState<boolean>(false);

  // CRD Manifest content & Namespace for Operator Service (Mode 2)
  const [crdManifestContent, setCrdManifestContent] = useState<string>(initialPkg.default_crd_manifest || '');
  const [crdNamespace, setCrdNamespace] = useState<string>('default (specified in manifest)');

  const [isDeploying, setIsDeploying] = useState(false);
  const [clustersList, setClustersList] = useState<K8sCluster[]>(MOCK_CLUSTERS);

  // Close catalog dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (catalogContainerRef.current && !catalogContainerRef.current.contains(e.target as Node)) {
        setIsCatalogOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    apiClient.getUserClusters(1).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setClustersList([...fetched, ...MOCK_CLUSTERS.filter((m) => !fetched.some((f) => f.id === m.id))]);
      }
    }).catch((e) => {
      console.warn('Failed to load user clusters for wizard:', e);
    });
  }, []);

  // Filtered packages according to user query and type/category tabs
  const filteredPackages = CHART_CATALOG_PACKAGES.filter((pkg) => {
    if (catalogTypeFilter !== 'all' && pkg.package_type !== catalogTypeFilter) {
      return false;
    }
    if (catalogCategoryFilter !== 'all' && pkg.category !== catalogCategoryFilter) {
      return false;
    }
    if (!catalogSearchQuery.trim()) return true;
    const query = catalogSearchQuery.toLowerCase();
    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.engine_type.toLowerCase().includes(query) ||
      pkg.publisher.toLowerCase().includes(query) ||
      pkg.chart_name.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      pkg.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const handleSelectPackage = (pkg: ChartCatalogPackage) => {
    setSelectedPackage(pkg);
    const foundEngine = CATALOG_ITEMS.find((item) => item.engine_type === pkg.engine_type);
    if (foundEngine) {
      setSelectedEngine(foundEngine);
    }
    setSelectedVersion(pkg.app_version || foundEngine?.versions[0] || '16');
    setDbName(`my-${pkg.engine_type}-${pkg.package_type === 'operator' ? 'cluster' : 'db'}`);
    
    if (pkg.package_type === 'operator') {
      setInstallMode('crd');
      if (pkg.default_crd_manifest) {
        setCrdManifestContent(pkg.default_crd_manifest);
      }
    } else {
      setInstallMode('helm');
      setHelmChartNameInput(pkg.chart_name);
      setHelmChartVersionInput(pkg.default_version);
      if (pkg.default_values_yaml) {
        setYamlContent(pkg.default_values_yaml);
        setIsChartLoaded(true);
      }
    }
    setIsCatalogOpen(false);
  };

  const handleCreateCustomFile = () => {
    let cleanName = newCustomFileName.trim();
    if (!cleanName) return;
    if (!cleanName.endsWith('.yaml') && !cleanName.endsWith('.yml')) {
      cleanName = `${cleanName}.yaml`;
    }

    const initialContent = `# ${cleanName} — Custom Helm Configuration Overrides\n# Type or paste your custom YAML values below:\n\n`;
    const newFileObj = {
      name: cleanName,
      path: cleanName,
      content: initialContent
    };

    setUserCustomFiles((prev) => [...prev, newFileObj]);
    setSelectedHelmFile(cleanName);
    setYamlContent(initialContent);
    setShowAddCustomFileModal(false);
    setNewCustomFileName('');
  };

  const handleSelectHelmFile = async (filePath: string) => {
    setSelectedHelmFile(filePath);
    try {
      const realContent = await apiClient.getHelmFile(dbName, filePath);
      if (realContent) {
        setYamlContent(realContent);
        return;
      }
    } catch (err) {
      console.warn('Backend file not found, falling back to local template:', err);
    }

    const chartFiles = HELM_CHART_FILES[selectedEngine.engine_type] || HELM_CHART_FILES['postgresql'];
    const allFiles = [...chartFiles, ...userCustomFiles];
    const found = allFiles.find((f) => f.path === filePath);
    if (found) {
      setYamlContent(found.content);
    }
  };

  const handleSaveChart = async () => {
    try {
      await apiClient.saveHelmFile(dbName, selectedHelmFile || 'values.yaml', yamlContent);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      setHelmActionStatus(`⚠️ Save error: ${err.message || 'Failed to save file'}`);
      setTimeout(() => setHelmActionStatus(''), 5000);
    }
  };

  const handleExecuteHelmAction = async (action: 'install' | 'upgrade') => {
    setIsExecutingHelmAction(true);
    setHelmActionStatus(`Executing 'helm ${action} ${dbName} ${helmChartNameInput}'...`);
    try {
      if (action === 'install') {
        const fullChart = helmChartNameInput.trim() || `bitnami/${selectedEngine.engine_type}`;
        const chartParts = fullChart.split('/');
        const repoName = chartParts.length > 1 ? chartParts[0] : 'bitnami';
        const chartName = chartParts.length > 1 ? chartParts[1] : chartParts[0];

        await apiClient.pullHelmChart({
          chart_repo_url: selectedPackage.chart_repo_url || `https://charts.bitnami.com/${repoName}`,
          chart_name: chartName,
          chart_version: helmChartVersionInput.trim() || '15.5.2',
          release_name: dbName
        });

        setIsChartLoaded(true);
        setIsChartInstalled(true);
        const targetFile = selectedHelmFile || 'values.yaml';
        setSelectedHelmFile(targetFile);

        try {
          const fetchedContent = await apiClient.getHelmFile(dbName, targetFile);
          if (fetchedContent) {
            setYamlContent(fetchedContent);
          }
        } catch (e) {
          console.warn('Could not auto-fetch pulled chart file:', e);
        }
      } else {
        const curCluster = clustersList.find((cls) => cls.name === selectedCluster || cls.id === selectedCluster);
        await apiClient.applyHelmRelease({
          cluster_name: selectedCluster || 'default-prod',
          release_name: dbName,
          chart_name: selectedEngine.engine_type,
          api_server_url: curCluster?.api_url,
          ca_cert_data: curCluster?.ca_cert_data,
          token: curCluster?.token,
          user_name: curCluster?.user_name,
          namespace: 'databases'
        });
      }
      setHelmActionStatus(
        `✓ Successfully executed 'helm ${action} ${dbName}' on cluster ${selectedCluster || 'default'}`
      );
    } catch (err: any) {
      setHelmActionStatus(`⚠️ Helm action error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsExecutingHelmAction(false);
      setTimeout(() => setHelmActionStatus(''), 7000);
    }
  };

  // Filter clusters based on selected Cloud Provider
  const availableClusters = selectedProvider
    ? clustersList.filter((cls) => {
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
    setSelectedCluster('');
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployErrorMsg(null);
    setHelmActionStatus('');
    try {
      let cpuM = (parseInt(customCpu, 10) || 2) * 1000;
      let ramMb = (parseInt(customRam, 10) || 8) * 1024;
      let storageGb = parseInt(customDisk, 10) || 50;

      const targetClusterName = selectedCluster || (clustersList[0]?.name ?? 'onprem-prod-k8s');

      if (installMode === 'crd') {
        await apiClient.applyOperatorManifest({
          resource_name: dbName,
          target_namespace: 'databases',
          content: crdManifestContent
        });
      } else {
        const curCluster = clustersList.find((cls) => cls.name === targetClusterName || cls.id === targetClusterName);
        await apiClient.applyHelmRelease({
          cluster_name: targetClusterName,
          release_name: dbName,
          chart_name: selectedEngine.engine_type,
          api_server_url: curCluster?.api_url,
          ca_cert_data: curCluster?.ca_cert_data,
          token: curCluster?.token,
          user_name: curCluster?.user_name,
          namespace: 'databases'
        });
      }

      await apiClient.deployDatabase({
        name: dbName,
        engine_type: selectedEngine.engine_type,
        version: selectedVersion,
        cluster_name: targetClusterName,
        namespace: 'databases',
        cpu_usage_m: cpuM,
        memory_usage_mb: ramMb,
        storage_gb: storageGb,
        monthly_cost: (cpuM / 1000) * 15.0 + (ramMb / 1024) * 4.0 + storageGb * 0.15,
        values_yaml: installMode === 'crd' ? crdManifestContent : yamlContent
      });

      onSuccess();
    } catch (err: any) {
      const errMsg = err?.message || 'Error occurred during provisioning deployment';
      setDeployErrorMsg(errMsg);
      throw err;
    } finally {
      setIsDeploying(false);
    }
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
            Search and select from standardized Kubernetes Operators (CloudNativePG, Zalando, Altinity, Opstree, Percona) or official Helm Charts.
          </p>
        </div>

        {/* ======================================================== */}
        {/* ARTIFACTHUB / CHART CATALOG SEARCH & SELECTION DISCOVERY */}
        {/* ======================================================== */}
        <div ref={catalogContainerRef} className="relative space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              ArtifactHub & Operator Catalog Search
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {CHART_CATALOG_PACKAGES.length} standardized packages available
            </span>
          </div>

          {/* Search Box Input Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-brand-sky absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={catalogSearchQuery}
                onFocus={() => setIsCatalogOpen(true)}
                onChange={(e) => {
                  setCatalogSearchQuery(e.target.value);
                  setIsCatalogOpen(true);
                }}
                placeholder="Search operators and charts by name, publisher, repo, tags (e.g., CloudNativePG, Zalando, Altinity, Redis, Bitnami, HA)..."
                className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/60 focus:border-brand-sky text-white text-sm rounded-xl pl-12 pr-28 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 shadow-inner font-semibold transition-all"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {catalogSearchQuery && (
                  <button
                    onClick={() => setCatalogSearchQuery('')}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                  className="px-3 py-1.5 bg-brand-blue/20 hover:bg-brand-blue/40 border border-brand-sky/30 rounded-lg text-xs font-bold text-brand-sky flex items-center gap-1 transition-all"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Catalog
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatalogOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* CATALOG DROPDOWN / SEARCH RESULTS MODAL */}
          {isCatalogOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 space-y-4 max-h-[520px] overflow-y-auto animate-fadeIn">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                {/* Type Filter */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCatalogTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      catalogTypeFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Packages ({CHART_CATALOG_PACKAGES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTypeFilter('operator')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      catalogTypeFilter === 'operator'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    ⚡ Operators ({CHART_CATALOG_PACKAGES.filter((p) => p.package_type === 'operator').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTypeFilter('helm_chart')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      catalogTypeFilter === 'helm_chart'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PackageCheck className="w-3 h-3 text-sky-200" />
                    📦 Helm Charts ({CHART_CATALOG_PACKAGES.filter((p) => p.package_type === 'helm_chart').length})
                  </button>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1 flex-wrap">
                  {['all', 'relational', 'nosql', 'inmemory', 'vector', 'timeseries'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                        catalogCategoryFilter === cat
                          ? 'bg-slate-800 text-brand-sky border-brand-sky/40'
                          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Package Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  const isOperator = pkg.package_type === 'operator';
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={pkg.icon_url}
                              alt={pkg.name}
                              className="w-7 h-7 object-contain rounded bg-slate-950 p-1 border border-slate-800"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div>
                              <span className="font-bold text-xs text-white block group-hover:text-brand-sky transition-colors">
                                {pkg.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {pkg.publisher} • {pkg.chart_name}
                              </span>
                            </div>
                          </div>

                          {/* Type Badge */}
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              isOperator
                                ? 'bg-purple-900/50 text-purple-300 border-purple-500/40'
                                : 'bg-sky-900/50 text-sky-300 border-sky-500/40'
                            }`}
                          >
                            {isOperator ? '⚡ Operator CRD' : '📦 Helm Chart'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-3">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pkg.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-slate-400">
                          App: v{pkg.app_version}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPackages.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No matching operators or charts found</p>
                  <p className="text-xs">Try searching for generic names like PostgreSQL, Redis, ClickHouse, or Altinity</p>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SELECTED PACKAGE SUMMARY CARD */}
          <div className="p-4 bg-gradient-to-r from-purple-950/30 via-slate-900/80 to-sky-950/30 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedPackage.icon_url}
                alt={selectedPackage.name}
                className="w-10 h-10 object-contain rounded-xl bg-slate-950 p-1.5 border border-purple-500/30 shadow-inner"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">
                    {selectedPackage.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      selectedPackage.package_type === 'operator'
                        ? 'bg-purple-900/60 text-purple-200 border-purple-400/50'
                        : 'bg-sky-900/60 text-sky-200 border-sky-400/50'
                    }`}
                  >
                    {selectedPackage.package_type === 'operator' ? '⚡ Kubernetes Operator' : '📦 Standalone Helm'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                  <span>Repo: <strong>{selectedPackage.chart_name}</strong></span>
                  <span>•</span>
                  <span>Publisher: <strong className="text-purple-300">{selectedPackage.publisher}</strong></span>
                  <span>•</span>
                  <span>Default App: <strong>v{selectedPackage.app_version}</strong></span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-brand-sky flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Search className="w-3.5 h-3.5" /> Switch Operator / Chart
            </button>
          </div>
        </div>

        {/* TWO INSTALLATION MODE BUTTONS: Helm Chart vs Operator CRD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* MODE 1: YAML Editor (Helm Chart) */}
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
              <span className="font-bold text-sm block text-white">1. YAML Editor (Helm Chart)</span>
              <span className="text-xs text-slate-400 leading-normal">
                Direct editing of `values.yaml` and option to add custom configuration files.
              </span>
            </div>
          </button>

          {/* MODE 2: K8s Custom Resource (Operator Service CRD) */}
          <button
            onClick={() => setInstallMode('crd')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              installMode === 'crd'
                ? 'bg-purple-900/30 border-purple-500 ring-2 ring-purple-500/30 text-white shadow-lg'
                : 'bg-bg-main border-accent-darkBorder text-slate-400 hover:bg-accent-darkHover'
            }`}
          >
            <Boxes className={`w-6 h-6 mt-0.5 shrink-0 ${installMode === 'crd' ? 'text-purple-400' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block text-white">2. Custom Resource (Operator CRD)</span>
              <span className="text-xs text-slate-400 leading-normal">
                Kubernetes Operator CRD Manifest ({selectedPackage.name} via operator-service).
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* Main Configuration Form Container */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* ======================================================== */}
        {/* STEP 1: INITIAL MANDATORY FIELDS FOR BOTH MODES */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <div className="border-b border-accent-darkBorder pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-sky flex items-center gap-2">
                <Database className="w-4 h-4" /> Instance Configuration & Target Placement
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Specify instance ID, cloud provider, and target cluster</p>
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
            
            {/* FIELD 1: Database Name (Release name) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Database Instance Name (Release name)
              </label>
              <input
                type="text"
                required
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="e.g., my-app-db"
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block leading-relaxed">
                Unique identifier for this deployment release on the target cluster.
              </span>
            </div>

            {/* FIELD 2: Cloud Provider / Environment */}
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

            {/* FIELD 3: Target Kubernetes Cluster */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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

          {/* DATABASE SECURITY & CREDENTIALS CARD */}
          <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4 shadow-md mt-6">
            <div className="flex items-center justify-between border-b border-accent-darkBorder/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-sky" /> Database Security & Credentials Setup
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Automatically injected during DB initialization
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Password Mode Toggle Buttons */}
              <div className="lg:col-span-5 space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Password Generation Mode <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode('auto');
                      if (!dbPassword) {
                        setDbPassword(generateRandomPassword());
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      passwordMode === 'auto'
                        ? 'bg-brand-blue/20 text-brand-sky border-brand-sky ring-1 ring-brand-sky/30'
                        : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Auto-Generated
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode('custom');
                      setDbPassword('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      passwordMode === 'custom'
                        ? 'bg-brand-blue/20 text-brand-sky border-brand-sky ring-1 ring-brand-sky/30'
                        : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Custom Password
                  </button>
                </div>
              </div>

              {/* Password Input & Generation Controls */}
              <div className="lg:col-span-7 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Database Admin Password <span className="text-rose-400">*</span>
                  </label>
                  {passwordMode === 'auto' && (
                    <button
                      type="button"
                      onClick={() => setDbPassword(generateRandomPassword())}
                      className="text-[11px] text-brand-sky font-semibold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-generate Random
                    </button>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="Enter database admin password..."
                    className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky font-semibold selection:bg-brand-sky/50 selection:text-white"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {!dbPassword && (
                  <span className="text-[10px] text-rose-400 font-semibold block pt-1">
                    ⚠️ Password is required before deploying database
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* MODE 1: HELM CHART YAML EDITOR */}
        {/* ======================================================== */}
        {installMode === 'helm' && (
          <div className="space-y-5 pt-4 border-t border-accent-darkBorder">
            
            {/* HELM CHART NAME INPUT & INSTALL / UPGRADE BUTTONS TOOLBAR */}
            <div className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                {/* Inputs for Specific Helm Chart Name & Version */}
                <div className="flex-1 w-full space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-brand-sky" /> Target Helm Chart Repository & Name
                    </label>
                    <input
                      type="text"
                      value={helmChartNameInput}
                      onChange={(e) => setHelmChartNameInput(e.target.value)}
                      placeholder="e.g., bitnami/postgresql or oci://registry-1.docker.io/bitnamicharts/postgresql"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-sky" /> Chart Version
                    </label>
                    <input
                      type="text"
                      value={helmChartVersionInput}
                      onChange={(e) => {
                        setHelmChartVersionInput(e.target.value);
                        setIsChartInstalled(false);
                      }}
                      placeholder="e.g., 15.5.2"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-semibold"
                    />
                  </div>
                </div>

                {/* Install Chart Action Button */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0 relative group">
                  {isChartInstalled ? (
                    <button
                      onClick={() => handleExecuteHelmAction('install')}
                      disabled={isExecutingHelmAction}
                      title="Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes."
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white fill-emerald-600" /> Chart Installed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExecuteHelmAction('install')}
                      disabled={isExecutingHelmAction}
                      title="Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes."
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-brand-blue/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 fill-white" /> Install Chart
                    </button>
                  )}

                  {/* Hover Tooltip Warning */}
                  <div className="absolute right-0 bottom-full mb-2.5 hidden group-hover:block w-72 p-2.5 bg-slate-900/95 border border-amber-500/40 text-slate-200 text-[11px] rounded-xl shadow-2xl backdrop-blur-md z-30 pointer-events-none transition-all animate-fadeIn leading-relaxed">
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <span>⚠️ Overwrite Warning</span>
                    </div>
                    Re-downloading a chart with the same name and version will completely overwrite all existing files and reset previous custom changes.
                  </div>
                </div>
              </div>

              {/* Notification status for Helm actions */}
              {helmActionStatus && (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
                  <span>{helmActionStatus}</span>
                  <span className="text-[10px] text-slate-400">Target cluster: {selectedCluster || 'default'}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-brand-sky" />
                Helm Chart Editor ({selectedHelmFile || 'values.yaml'})
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {/* SELECT FILE FROM HELM CHART DROPDOWN */}
                <div className="flex items-center gap-1.5 bg-bg-main border border-accent-darkBorder rounded-lg px-2.5 py-1">
                  <FolderTree className="w-3.5 h-3.5 text-brand-sky" />
                  <select
                    value={selectedHelmFile || 'values.yaml'}
                    onChange={(e) => handleSelectHelmFile(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-mono font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="values.yaml" className="bg-bg-card text-brand-sky font-bold">
                      📄 values.yaml
                    </option>
                    {userCustomFiles.map((file) => (
                      <option key={file.path} value={file.path} className="bg-bg-card text-emerald-400 font-bold">
                        ⚡ {file.name} (Custom)
                      </option>
                    ))}
                  </select>
                </div>

                {/* ADD CUSTOM FILE BUTTON & SAVE / UPGRADE ACTIONS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button 
                    onClick={() => setShowAddCustomFileModal(true)}
                    className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FilePlus className="w-3.5 h-3.5" /> Add Custom File
                  </button>

                  <button 
                    onClick={handleSaveChart}
                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-md"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" /> Save Chart
                  </button>

                  <button
                    onClick={() => handleExecuteHelmAction('upgrade')}
                    disabled={isExecutingHelmAction}
                    className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isExecutingHelmAction ? 'animate-spin' : ''}`} /> Upgrade Chart
                  </button>

                  {saveSuccessMsg && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1 animate-pulse font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Chart saved!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              placeholder={
                !isChartLoaded
                  ? "Terminal is empty. Click 'Install Chart' above to pull and inspect Helm chart configuration files..."
                  : "Type or edit YAML configuration values here..."
              }
              rows={12}
              className="w-full bg-brand-dark text-sky-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-sky leading-relaxed selection:bg-brand-sky/50 selection:text-white font-semibold placeholder:text-slate-600 placeholder:italic"
            ></textarea>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: KUBERNETES CUSTOM RESOURCE (OPERATOR SERVICE CRD) */}
        {/* ======================================================== */}
        {installMode === 'crd' && (
          <div className="space-y-6 pt-4 border-t border-accent-darkBorder">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-400" /> 2. Kubernetes Custom Resource Deployment (Operator Service)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standardized Custom Resource definition for {selectedPackage.name} applied directly via operator-service
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                ● Operator Service API Ready
              </span>
            </div>

            {/* CRD Manifest Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Custom Resource Manifest (YAML)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPackage.default_crd_manifest) {
                      setCrdManifestContent(selectedPackage.default_crd_manifest);
                    }
                  }}
                  className="text-xs text-brand-sky font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Default Operator CRD
                </button>
              </div>
              <textarea
                value={crdManifestContent}
                onChange={(e) => setCrdManifestContent(e.target.value)}
                placeholder="Paste your Kubernetes Operator Custom Resource YAML manifest here..."
                rows={14}
                className="w-full bg-brand-dark text-purple-200 font-mono text-xs p-4 rounded-xl border border-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-semibold selection:bg-purple-500/40 selection:text-white placeholder:text-slate-600"
              ></textarea>
            </div>
          </div>
        )}

        {/* Deploy Error Message Banner */}
        {deployErrorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Deployment Failure</span>
              <span>{deployErrorMsg}</span>
            </div>
          </div>
        )}

        {/* PROVISION DATABASE SUBMIT BUTTON */}
        <div className="pt-6 border-t border-accent-darkBorder flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying || !dbName || !dbPassword}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer ${
              isDeploying || !dbName || !dbPassword
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blue/90 hover:to-purple-500 text-white shadow-brand-blue/30 active:scale-[0.98]'
            }`}
          >
            {isDeploying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Database...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Provision Database Instance
              </>
            )}
          </button>
        </div>

      </div>

      {/* MODAL: ADD CUSTOM FILE */}
      {showAddCustomFileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-brand-sky" /> Add Custom Configuration File
              </h4>
              <button
                onClick={() => setShowAddCustomFileModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase">File Name (.yaml)</label>
              <input
                type="text"
                value={newCustomFileName}
                onChange={(e) => setNewCustomFileName(e.target.value)}
                placeholder="e.g., custom-replicas.yaml"
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomFileModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomFile}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
