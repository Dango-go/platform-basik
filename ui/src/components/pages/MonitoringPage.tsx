import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_DEPLOYED_DBS, METRICS_SAMPLE, K8S_CLUSTERS, CATALOG_ITEMS } from '../../services/mockData';
import { DeployedDatabase } from '../../types';
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
  ChevronDown,
  Filter,
  Check,
  Globe,
  ArrowLeft
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const [selectedDbId, setSelectedDbId] = useState(INITIAL_DEPLOYED_DBS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 3 Search Modes: 'menu' | 'filters' | 'name_db' | 'name_cluster'
  const [searchMode, setSearchMode] = useState<'menu' | 'filters' | 'name_db' | 'name_cluster'>('menu');

  // Input queries
  const [dbNameQuery, setDbNameQuery] = useState('');
  const [clusterQuery, setClusterQuery] = useState('');

  // Filters mode drilldown state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEngineType, setSelectedEngineType] = useState<string | null>(null);

  // Selected Cluster state for mode 3
  const [selectedTargetCluster, setSelectedTargetCluster] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDb = INITIAL_DEPLOYED_DBS.find((db) => db.id === selectedDbId) || INITIAL_DEPLOYED_DBS[0];
  const metrics = METRICS_SAMPLE;

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to map cluster name to Provider Name
  const getProviderName = (clusterName: string) => {
    const cluster = K8S_CLUSTERS.find((c) => c.name === clusterName);
    if (!cluster) return 'On-Premise';
    if (cluster.provider.includes('AWS')) return 'AWS EKS';
    if (cluster.provider.includes('Azure')) return 'Azure AKS';
    if (cluster.provider.includes('DigitalOcean')) return 'DigitalOcean';
    return 'Lenovo K8s';
  };

  // Reset drilldown when mode changes
  const handleSelectMode = (mode: 'filters' | 'name_db' | 'name_cluster') => {
    setSearchMode(mode);
    setDbNameQuery('');
    setClusterQuery('');
    setSelectedCategory(null);
    setSelectedEngineType(null);
    setSelectedTargetCluster(null);
  };

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. ADVANCED GOOGLE-LIKE SMART SEARCH HEADER */}
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/20 text-brand-sky flex items-center justify-center font-bold border border-brand-sky/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            {/* TITLE WITH WHITE SEARCH ICON AT THE END */}
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Performance Metrics & Monitoring</span>
              <Search className="w-5 h-5 text-white stroke-[2.5]" />
            </h3>
            <p className="text-xs text-slate-400">Google-like multi-mode smart search for cluster target database instances</p>
          </div>
        </div>

        {/* SMART COMBOBOX DROPDOWN SELECTOR */}
        <div className="relative" ref={dropdownRef}>
          {/* RENAMED TO Selected Target Data Base */}
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Selected Target Data Base:
          </label>

          {/* Trigger Bar Button */}
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              if (!isDropdownOpen) setSearchMode('menu');
            }}
            className="w-full bg-bg-main border border-accent-darkBorder hover:border-brand-sky text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all shadow-md group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Database className="w-4 h-4 text-brand-sky shrink-0" />
              {/* Format: Name: [db_name] • Cluster: [cluster_name] • Provider: [provider_name] */}
              <div className="font-semibold text-sm text-white truncate flex items-center gap-2">
                <span className="font-extrabold">Name: {selectedDb.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">Cluster: {selectedDb.cluster_name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-brand-sky font-bold">Provider: {getProviderName(selectedDb.cluster_name)}</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* COMBOBOX POPUP PANEL WITH 3 MODES */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-bg-card border border-accent-darkBorder rounded-2xl shadow-2xl z-30 overflow-hidden p-4 backdrop-blur-md space-y-4">
              
              {/* MODE MENU: 3 MAIN BUTTONS (Filters, Name Data Base, Name Cluster) */}
              <div className="grid grid-cols-3 gap-2 border-b border-accent-darkBorder pb-3">
                <button
                  onClick={() => handleSelectMode('filters')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    searchMode === 'filters'
                      ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                      : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>

                <button
                  onClick={() => handleSelectMode('name_db')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    searchMode === 'name_db'
                      ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                      : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Name Data Base</span>
                </button>

                <button
                  onClick={() => handleSelectMode('name_cluster')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    searchMode === 'name_cluster'
                      ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                      : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Name Cluster</span>
                </button>
              </div>

              {/* MODE 1: FILTERS */}
              {searchMode === 'filters' && (
                <div className="space-y-3">
                  {!selectedCategory ? (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Step 1: Select Database Category</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'relational', name: 'Relational Databases' },
                          { id: 'nosql', name: 'NoSQL Databases' },
                          { id: 'vector', name: 'Vector Databases' },
                          { id: 'inmemory', name: 'In-Memory Databases' },
                          { id: 'timeseries', name: 'Time-Series Databases' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-left text-xs font-bold text-white hover:border-brand-sky hover:bg-accent-darkHover transition-all flex items-center justify-between"
                          >
                            <span>{cat.name}</span>
                            <ChevronDown className="-rotate-90 w-3.5 h-3.5 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : !selectedEngineType ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Step 2: Select Database Engine</span>
                        <button onClick={() => setSelectedCategory(null)} className="text-xs text-brand-sky hover:underline flex items-center gap-1">
                          <ArrowLeft className="w-3 h-3" /> Back
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CATALOG_ITEMS.filter((item) => item.category === selectedCategory).map((engine) => (
                          <button
                            key={engine.id}
                            onClick={() => setSelectedEngineType(engine.engine_type)}
                            className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-left text-xs font-bold text-white hover:border-brand-sky hover:bg-accent-darkHover transition-all flex items-center gap-2"
                          >
                            <img src={engine.icon_url} alt="" className="w-4 h-4 object-contain" />
                            <span>{engine.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Step 3: Select Active Instance</span>
                        <button onClick={() => setSelectedEngineType(null)} className="text-xs text-brand-sky hover:underline flex items-center gap-1">
                          <ArrowLeft className="w-3 h-3" /> Back to Engines
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {INITIAL_DEPLOYED_DBS.filter((db) => db.engine_type === selectedEngineType).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No active instances for this engine.</div>
                        ) : (
                          INITIAL_DEPLOYED_DBS.filter((db) => db.engine_type === selectedEngineType).map((db) => (
                            <div
                              key={db.id}
                              onClick={() => {
                                setSelectedDbId(db.id);
                                setIsDropdownOpen(false);
                              }}
                              className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-xs font-semibold text-white hover:border-brand-sky hover:bg-accent-darkHover cursor-pointer flex items-center justify-between"
                            >
                              <span>Name: <strong>{db.name}</strong> • Cluster: {db.cluster_name} • Provider: {getProviderName(db.cluster_name)}</span>
                              {db.id === selectedDb.id && <Check className="w-4 h-4 text-brand-sky" />}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: NAME DATA BASE */}
              {searchMode === 'name_db' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={dbNameQuery}
                      onChange={(e) => setDbNameQuery(e.target.value)}
                      placeholder="Type database instance name (e.g. prod-postgres-main)..."
                      className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {INITIAL_DEPLOYED_DBS.filter((db) => db.name.toLowerCase().includes(dbNameQuery.toLowerCase())).map((db) => (
                      <div
                        key={db.id}
                        onClick={() => {
                          setSelectedDbId(db.id);
                          setIsDropdownOpen(false);
                        }}
                        className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-xs font-semibold text-white hover:border-brand-sky hover:bg-accent-darkHover cursor-pointer flex items-center justify-between"
                      >
                        <span>Name: <strong>{db.name}</strong> • Cluster: {db.cluster_name} • Provider: {getProviderName(db.cluster_name)}</span>
                        {db.id === selectedDb.id && <Check className="w-4 h-4 text-brand-sky" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 3: NAME CLUSTER */}
              {searchMode === 'name_cluster' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={clusterQuery}
                      onChange={(e) => {
                        setClusterQuery(e.target.value);
                        setSelectedTargetCluster(null);
                      }}
                      placeholder="Type cluster name (Google regex style auto-suggest)..."
                      className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    />
                  </div>

                  {!selectedTargetCluster ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Matching Clusters:</span>
                      {K8S_CLUSTERS.filter((cls) => cls.name.toLowerCase().includes(clusterQuery.toLowerCase())).map((cls) => (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedTargetCluster(cls.name)}
                          className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-xs font-bold text-white hover:border-brand-sky hover:bg-accent-darkHover cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand-sky" />
                            <span>Cluster: <strong>{cls.name}</strong> ({cls.provider})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Select &rarr;</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-sky uppercase">Instances in Cluster "{selectedTargetCluster}":</span>
                        <button onClick={() => setSelectedTargetCluster(null)} className="text-xs text-brand-sky hover:underline flex items-center gap-1">
                          <ArrowLeft className="w-3 h-3" /> Change Cluster
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {INITIAL_DEPLOYED_DBS.filter((db) => db.cluster_name === selectedTargetCluster).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No databases deployed in this cluster.</div>
                        ) : (
                          INITIAL_DEPLOYED_DBS.filter((db) => db.cluster_name === selectedTargetCluster).map((db) => (
                            <div
                              key={db.id}
                              onClick={() => {
                                setSelectedDbId(db.id);
                                setIsDropdownOpen(false);
                              }}
                              className="p-3 bg-bg-main border border-accent-darkBorder rounded-xl text-xs font-semibold text-white hover:border-brand-sky hover:bg-accent-darkHover cursor-pointer flex items-center justify-between"
                            >
                              <span>Name: <strong>{db.name}</strong> • Cluster: {db.cluster_name} • Provider: {getProviderName(db.cluster_name)}</span>
                              {db.id === selectedDb.id && <Check className="w-4 h-4 text-brand-sky" />}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DEFAULT INITIAL INSTRUCTION */}
              {searchMode === 'menu' && (
                <div className="p-4 text-center text-xs text-slate-400">
                  Select one of the 3 search modes above (<strong>Filters</strong>, <strong>Name Data Base</strong>, or <strong>Name Cluster</strong>).
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 2. GRID OF 7 METRIC DASHBOARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. CPU Usage graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-sky" /> CPU Usage Graphic
            </span>
            <span className="text-xs font-bold text-brand-sky">{metrics.cpu_usage[metrics.cpu_usage.length - 1]}%</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.cpu_usage.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="w-full bg-brand-sky hover:bg-sky-400 transition-all rounded-t-sm"
                title={`CPU: ${val}%`}
              ></div>
            ))}
          </div>
        </div>

        {/* 2. Memory Usage graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-brand-cyan" /> Memory Usage Graphic
            </span>
            <span className="text-xs font-bold text-brand-cyan">{metrics.memory_usage[metrics.memory_usage.length - 1]}%</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.memory_usage.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="w-full bg-brand-cyan hover:bg-cyan-400 transition-all rounded-t-sm"
                title={`Memory: ${val}%`}
              ></div>
            ))}
          </div>
        </div>

        {/* 3. Disk I/O / Storage graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" /> Disk I/O / Storage Graphic
            </span>
            <span className="text-xs font-bold text-amber-400">{metrics.disk_io[metrics.disk_io.length - 1]} MB/s</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.disk_io.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${(val / 500) * 100}%` }}
                className="w-full bg-amber-500 hover:bg-amber-400 transition-all rounded-t-sm"
                title={`Disk I/O: ${val} MB/s`}
              ></div>
            ))}
          </div>
        </div>

        {/* 4. Active Connections graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" /> Active Connections Graphic
            </span>
            <span className="text-xs font-bold text-indigo-400">{metrics.active_connections[metrics.active_connections.length - 1]} conn</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.active_connections.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${(val / 60) * 100}%` }}
                className="w-full bg-indigo-500 hover:bg-indigo-400 transition-all rounded-t-sm"
                title={`Connections: ${val}`}
              ></div>
            ))}
          </div>
        </div>

        {/* 5. QPS (Queries Per Second) graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" /> QPS (Queries Per Second) Graphic
            </span>
            <span className="text-xs font-bold text-emerald-400">{metrics.qps[metrics.qps.length - 1]} qps</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.qps.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${(val / 2500) * 100}%` }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 transition-all rounded-t-sm"
                title={`QPS: ${val}`}
              ></div>
            ))}
          </div>
        </div>

        {/* 6. Cache Hit Ratio graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Cache Hit Ratio Graphic
            </span>
            <span className="text-xs font-bold text-cyan-400">{metrics.cache_hit_ratio[metrics.cache_hit_ratio.length - 1]}%</span>
          </div>
          <div className="h-32 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-1 border border-accent-darkBorder">
            {metrics.cache_hit_ratio.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="w-full bg-cyan-500 hover:bg-cyan-400 transition-all rounded-t-sm"
                title={`Cache Hit: ${val}%`}
              ></div>
            ))}
          </div>
        </div>

        {/* 7. Slow Queries / Transaction Duration graphic */}
        <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-5 shadow-xl space-y-3 col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400" /> Slow Queries / Transaction Duration Graphic (ms)
            </span>
            <span className="text-xs font-bold text-rose-400">{metrics.slow_queries_duration[metrics.slow_queries_duration.length - 1]} ms</span>
          </div>
          <div className="h-28 bg-bg-main rounded-xl p-3 flex items-end justify-between gap-2 border border-accent-darkBorder">
            {metrics.slow_queries_duration.map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${(val / 130) * 100}%` }}
                className="w-full bg-rose-500 hover:bg-rose-400 transition-all rounded-t-sm"
                title={`Slow Query Duration: ${val}ms`}
              ></div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
