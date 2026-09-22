import React, { useState, useEffect } from 'react';
import { INITIAL_DEPLOYED_DBS, K8S_CLUSTERS, CATALOG_ITEMS } from '../../services/mockData';
import { DeployedDatabase, K8sCluster, CategoryType } from '../../types';
import { apiClient } from '../../services/apiClient';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Zap, 
  Clock, 
  Database, 
  BarChart3,
  Search,
  Filter,
  Check,
  Globe,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowUpRight,
  Wifi,
  Sliders,
  CheckCircle2,
  X,
  PieChart,
  LineChart
} from 'lucide-react';

type DatabaseTypeFilter = 'ALL' | 'RELATIONAL' | 'NOSQL' | 'INMEMORY' | 'VECTOR' | 'TIMESERIES';
type CloudProviderFilter = 'ALL' | 'AWS' | 'GCP' | 'AZURE' | 'DIGITALOCEAN' | 'ONPREMISE';

export const MonitoringPage: React.FC = () => {
  const [deployedDbs, setDeployedDbs] = useState<DeployedDatabase[]>([]);
  const [clustersList, setClustersList] = useState<K8sCluster[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  
  // Left Panel Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<DatabaseTypeFilter>('ALL');
  const [cloudFilter, setCloudFilter] = useState<CloudProviderFilter>('ALL');
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | '7d'>('1h');
  const [isLiveAutoRefresh, setIsLiveAutoRefresh] = useState<boolean>(true);

  // Fetch deployed databases and clusters
  useEffect(() => {
    apiClient.getDeployedDatabases().then((dbs) => {
      if (dbs && dbs.length > 0) {
        setDeployedDbs(dbs);
        setSelectedDbId((prev) => prev || dbs[0].id);
      }
    }).catch((err) => {
      console.warn('Could not fetch deployed DBs:', err);
    });

    apiClient.getUserClusters(1).then((cls) => {
      if (cls && cls.length > 0) {
        setClustersList(cls);
      }
    }).catch((err) => {
      console.warn('Could not fetch user clusters:', err);
    });
  }, []);

  const allDbs = deployedDbs.length > 0 ? deployedDbs : INITIAL_DEPLOYED_DBS;
  const allClusters = clustersList.length > 0 ? clustersList : K8S_CLUSTERS;

  const fallbackDb: DeployedDatabase = {
    id: '1',
    name: 'prod-postgres-main',
    engine_type: 'postgresql',
    version: '16',
    cluster_name: 'lenovo-prod-k8s',
    namespace: 'databases',
    status: 'running',
    cpu_usage_m: 2000,
    memory_usage_mb: 4096,
    storage_gb: 50,
    monthly_cost: 69.50,
    created_at: new Date().toISOString(),
    values_yaml: ''
  };

  // Helper to find category of any engine
  const getCategoryForEngine = (engineType: string): string => {
    const catalogItem = CATALOG_ITEMS.find(
      (item) => item.engine_type.toLowerCase() === engineType.toLowerCase()
    );
    if (catalogItem) return catalogItem.category.toUpperCase();
    if (['postgresql', 'mysql', 'mariadb', 'cockroach', 'clickhouse'].includes(engineType.toLowerCase())) {
      return 'RELATIONAL';
    }
    if (['mongodb', 'cassandra', 'couchbase', 'scylladb'].includes(engineType.toLowerCase())) {
      return 'NOSQL';
    }
    if (['redis', 'keydb', 'dragonfly'].includes(engineType.toLowerCase())) {
      return 'INMEMORY';
    }
    if (['qdrant', 'milvus', 'chroma', 'weaviate'].includes(engineType.toLowerCase())) {
      return 'VECTOR';
    }
    if (['influxdb', 'timescaledb', 'questdb'].includes(engineType.toLowerCase())) {
      return 'TIMESERIES';
    }
    return 'RELATIONAL';
  };

  // Helper to map cluster name to Cloud Provider
  const getCloudProviderForCluster = (clusterName: string): { name: string; key: CloudProviderFilter; iconColor: string } => {
    const cluster = allClusters.find((c) => c.name === clusterName);
    if (!cluster) {
      return { name: 'On-Premise', key: 'ONPREMISE', iconColor: 'text-amber-400' };
    }
    const prov = cluster.provider.toUpperCase();
    if (prov.includes('AWS') || prov.includes('EKS')) {
      return { name: 'AWS EKS', key: 'AWS', iconColor: 'text-amber-500' };
    }
    if (prov.includes('GCP') || prov.includes('GKE')) {
      return { name: 'GCP GKE', key: 'GCP', iconColor: 'text-rose-400' };
    }
    if (prov.includes('AZURE') || prov.includes('AKS')) {
      return { name: 'Azure AKS', key: 'AZURE', iconColor: 'text-sky-400' };
    }
    if (prov.includes('DIGITALOCEAN') || prov.includes('DOKS')) {
      return { name: 'DigitalOcean', key: 'DIGITALOCEAN', iconColor: 'text-blue-400' };
    }
    return { name: 'On-Premise', key: 'ONPREMISE', iconColor: 'text-emerald-400' };
  };

  // Helper to find engine icon
  const getEngineIconUrl = (engineType: string): string => {
    const item = CATALOG_ITEMS.find((c) => c.engine_type.toLowerCase() === engineType.toLowerCase());
    return item?.icon_url || 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png';
  };

  // Filter databases
  const filteredDbs = allDbs.filter((db) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = db.name.toLowerCase().includes(q);
      const matchEngine = db.engine_type.toLowerCase().includes(q);
      const matchCluster = db.cluster_name.toLowerCase().includes(q);
      if (!matchName && !matchEngine && !matchCluster) return false;
    }

    // 2. Database Type Filter
    if (typeFilter !== 'ALL') {
      const dbCategory = getCategoryForEngine(db.engine_type);
      if (dbCategory !== typeFilter) return false;
    }

    // 3. Cloud Provider Filter
    if (cloudFilter !== 'ALL') {
      const provInfo = getCloudProviderForCluster(db.cluster_name);
      if (provInfo.key !== cloudFilter) return false;
    }

    return true;
  });

  const selectedDb: DeployedDatabase = 
    filteredDbs.find((db) => db.id === selectedDbId) ||
    allDbs.find((db) => db.id === selectedDbId) ||
    filteredDbs[0] ||
    allDbs[0] ||
    fallbackDb;

  const currentCategory = getCategoryForEngine(selectedDb.engine_type);
  const currentProvider = getCloudProviderForCluster(selectedDb.cluster_name);

  // List of placeholder graph cards for the charts dashboard
  const PLACEHOLDER_CHARTS = [
    {
      id: 'cpu_usage',
      title: 'CPU Utilization',
      subtitle: 'Percentage of allocated cores requested vs limit',
      unit: '% cores',
      icon: Cpu,
      color: 'text-sky-400'
    },
    {
      id: 'memory_usage',
      title: 'Memory Working Set',
      subtitle: 'Resident set memory size (RSS) & Cache consumption',
      unit: 'MB / GB',
      icon: HardDrive,
      color: 'text-purple-400'
    },
    {
      id: 'iops_throughput',
      title: 'Disk I/O & IOPS Throughput',
      subtitle: 'Read/Write operations per second & Volume bandwidth',
      unit: 'IOPS / MBps',
      icon: Activity,
      color: 'text-emerald-400'
    },
    {
      id: 'qps_operations',
      title: 'Queries Per Second (QPS)',
      subtitle: 'Total query volume, read transactions and mutate ops',
      unit: 'req/sec',
      icon: Zap,
      color: 'text-amber-400'
    },
    {
      id: 'active_connections',
      title: 'Active Client Connections',
      subtitle: 'Established client sockets vs max allowed pool limit',
      unit: 'connections',
      icon: Server,
      color: 'text-indigo-400'
    },
    {
      id: 'query_latency',
      title: 'Query Latency (p95 / p99)',
      subtitle: 'Response time percentiles & slow query execution',
      unit: 'ms',
      icon: Clock,
      color: 'text-rose-400'
    },
    {
      id: 'cache_hit_ratio',
      title: 'Buffer Cache Hit Ratio',
      subtitle: 'Efficiency of shared buffers and memory page cache',
      unit: '% hit rate',
      icon: PieChart,
      color: 'text-cyan-400'
    },
    {
      id: 'network_traffic',
      title: 'Network Ingress / Egress',
      subtitle: 'Bandwidth utilization across database network interface',
      unit: 'KB/s / MB/s',
      icon: Wifi,
      color: 'text-teal-400'
    }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header Card */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-blue/20 text-brand-sky flex items-center justify-center font-bold border border-brand-sky/30 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Monitoring & Performance Metrics</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select deployed database instances to inspect metrics, health status and performance telemetry
            </p>
          </div>
        </div>

        {/* Global Controls: Time Range & Live Switch */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-bg-main p-1 rounded-xl border border-accent-darkBorder">
            {(['15m', '1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLiveAutoRefresh(!isLiveAutoRefresh)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isLiveAutoRefresh
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-bg-main border-accent-darkBorder text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveAutoRefresh ? 'animate-spin' : ''}`} />
            {isLiveAutoRefresh ? 'Auto 5s' : 'Paused'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2-COLUMN MAIN LAYOUT: LEFT SELECTOR PANEL + RIGHT GRAPHS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* 1. LEFT PANEL: DEPLOYED DATABASES SELECTOR & FILTERS */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-accent-darkBorder/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-sky" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Deployed Databases
              </span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-brand-blue/20 text-brand-sky border border-brand-sky/20">
              {filteredDbs.length} of {allDbs.length}
            </span>
          </div>

          {/* Search Box Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search database by name..."
              className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky/50 focus:border-brand-sky text-white text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 transition-all font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* DATABASE TYPE FILTER BAR (MATCHING USER SCREENSHOT) */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Database Type
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold tracking-wider">
              {(['ALL', 'RELATIONAL', 'NOSQL', 'INMEMORY', 'VECTOR', 'TIMESERIES'] as DatabaseTypeFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTypeFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap uppercase transition-all border ${
                    typeFilter === tab
                      ? 'bg-brand-blue/30 text-brand-sky border-brand-sky/50 shadow-md font-extrabold'
                      : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CLOUD PROVIDER FILTER BAR */}
          {/* ======================================================== */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cloud Provider
            </label>
            <div className="flex items-center gap-1 flex-wrap text-[11px] font-semibold">
              {[
                { label: 'All Clouds', key: 'ALL' },
                { label: 'AWS', key: 'AWS' },
                { label: 'GCP', key: 'GCP' },
                { label: 'Azure', key: 'AZURE' },
                { label: 'DigitalOcean', key: 'DIGITALOCEAN' },
                { label: 'On-Premise', key: 'ONPREMISE' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCloudFilter(c.key as CloudProviderFilter)}
                  className={`px-2.5 py-1 rounded-lg transition-all border text-[10px] font-bold ${
                    cloudFilter === c.key
                      ? 'bg-slate-800 text-white border-brand-sky/50 shadow-sm'
                      : 'bg-bg-main/60 text-slate-400 border-accent-darkBorder/60 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* DATABASE INSTANCES CARDS LIST */}
          {/* ======================================================== */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredDbs.map((db) => {
              const isSelected = selectedDb.id === db.id;
              const prov = getCloudProviderForCluster(db.cluster_name);
              const iconUrl = getEngineIconUrl(db.engine_type);
              const cat = getCategoryForEngine(db.engine_type);

              return (
                <div
                  key={db.id}
                  onClick={() => setSelectedDbId(db.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-blue/15 border-brand-sky ring-1 ring-brand-sky/40 shadow-lg shadow-brand-blue/10'
                      : 'bg-bg-main/70 border-accent-darkBorder hover:border-slate-700 hover:bg-bg-main'
                  }`}
                >
                  {/* Left Accent indicator when active */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-sky rounded-r"></div>
                  )}

                  <img
                    src={iconUrl}
                    alt={db.name}
                    className="w-8 h-8 object-contain rounded-lg bg-slate-950 p-1 border border-accent-darkBorder shrink-0 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {db.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {db.status || 'running'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-300">{db.engine_type} {db.version ? `v${db.version}` : ''}</span>
                      <span>•</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800/80 rounded text-slate-400">{cat}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-800/60 font-mono">
                      <span className={`truncate flex items-center gap-1 ${prov.iconColor}`}>
                        <Globe className="w-3 h-3 shrink-0" />
                        {prov.name} ({db.cluster_name})
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {db.storage_gb ? `${db.storage_gb}GB` : '50GB'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDbs.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-accent-darkBorder rounded-xl">
                <Database className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No matching databases</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search query or filters</p>
              </div>
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* 2. RIGHT PANEL: SELECTED DB DETAILS & LARGE CHARTS PANEL */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ACTIVE DATABASE DETAILS BANNER CARD */}
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={getEngineIconUrl(selectedDb.engine_type)}
                  alt={selectedDb.name}
                  className="w-12 h-12 object-contain rounded-xl bg-slate-950 p-2 border border-accent-darkBorder shadow-inner shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedDb.name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Healthy
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {currentCategory}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                    <span>Engine: <strong className="text-white capitalize">{selectedDb.engine_type} {selectedDb.version}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className={`w-3.5 h-3.5 ${currentProvider.iconColor}`} />
                      <span>{currentProvider.name}</span>
                      <strong className="text-slate-300">({selectedDb.cluster_name})</strong>
                    </span>
                    <span>•</span>
                    <span>Namespace: <strong className="text-slate-300">{selectedDb.namespace || 'databases'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Resource Badges */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 text-xs font-mono">
                <div className="bg-bg-main px-3 py-1.5 rounded-xl border border-accent-darkBorder text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">CPU</span>
                  <span className="font-bold text-sky-400">{selectedDb.cpu_usage_m ? `${selectedDb.cpu_usage_m}m` : '2000m'}</span>
                </div>
                <div className="bg-bg-main px-3 py-1.5 rounded-xl border border-accent-darkBorder text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">RAM</span>
                  <span className="font-bold text-purple-400">{selectedDb.memory_usage_mb ? `${selectedDb.memory_usage_mb}MB` : '4096MB'}</span>
                </div>
                <div className="bg-bg-main px-3 py-1.5 rounded-xl border border-accent-darkBorder text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">Disk</span>
                  <span className="font-bold text-emerald-400">{selectedDb.storage_gb ? `${selectedDb.storage_gb}GB` : '50GB'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* LARGE PERFORMANCE GRAPHS CONTAINER PANEL */}
          {/* ======================================================== */}
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Charts Section Header */}
            <div className="flex items-center justify-between border-b border-accent-darkBorder/80 pb-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-brand-sky" />
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Metrics & Telemetry Visualizer
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time metric telemetry channels for instance <span className="font-mono text-brand-sky font-bold">"{selectedDb.name}"</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 bg-bg-main px-3 py-1 rounded-lg border border-accent-darkBorder">
                  Range: <strong className="text-white">{timeRange}</strong>
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* GRID OF PLACEHOLDER CHARTS (READY FOR INTEGRATION) */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLACEHOLDER_CHARTS.map((chart) => {
                const IconComponent = chart.icon;
                return (
                  <div
                    key={chart.id}
                    className="p-5 bg-bg-main/80 border border-accent-darkBorder hover:border-slate-700 rounded-2xl space-y-4 transition-all shadow-inner group"
                  >
                    {/* Chart Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${chart.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">
                            {chart.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {chart.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {chart.unit}
                      </span>
                    </div>

                    {/* Chart Area Wireframe Placeholder */}
                    <div className="h-36 w-full rounded-xl bg-slate-950/60 border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2 relative overflow-hidden">
                      {/* Subdued Background Grid Lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

                      <LineChart className="w-6 h-6 text-slate-600 stroke-[1.5]" />
                      <div>
                        <span className="text-[11px] font-mono font-semibold text-slate-400 block">
                          Waiting for metric stream ({chart.id})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Telemetry channel configured • Ready for graph visualization
                        </span>
                      </div>
                    </div>

                    {/* Bottom stats footer */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/40">
                      <span>Avg: <strong className="text-slate-300">--</strong></span>
                      <span>Min: <strong className="text-slate-300">--</strong></span>
                      <span>Max: <strong className="text-slate-300">--</strong></span>
                      <span>Current: <strong className="text-emerald-400">● Live</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Telemetry Status Banner */}
            <div className="p-4 bg-slate-900/60 border border-brand-sky/20 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-sky shrink-0" />
                <span>
                  Telemetry pipeline is active for cluster <strong>{selectedDb.cluster_name}</strong>. Graphs will render dynamically once metric collectors are configured.
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 shrink-0 font-semibold">
                ✓ Ready
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
