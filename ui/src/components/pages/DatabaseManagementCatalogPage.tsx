import React, { useState } from 'react';
import { DatabaseCatalogItem } from '../../types';
import { INITIAL_DEPLOYED_DBS } from '../../services/mockData';
import { 
  ArrowLeft, 
  Terminal as TerminalIcon, 
  Layers, 
  Sliders, 
  History, 
  ShieldCheck, 
  Server,
  Database,
  CheckCircle,
  Copy,
  Check,
  X,
  Play,
  Code2,
  Cpu,
  HardDrive,
  Globe,
  Lock,
  Puzzle,
  ExternalLink,
  Activity
} from 'lucide-react';

interface DatabaseManagementCatalogPageProps {
  item: DatabaseCatalogItem;
  onBack: () => void;
  onNavigateCreate: (engineType: string) => void;
}

// Engine-specific plugins & extensions configuration dictionary
const ENGINE_EXTENSIONS: Record<string, Array<{ name: string; tag: string; description: string }>> = {
  postgresql: [
    { name: 'pgvector', tag: 'AI Vector', description: 'Vector similarity search for AI embeddings & LLM RAG pipelines.' },
    { name: 'PostGIS', tag: 'GIS Maps', description: 'Geographic objects support allowing location queries in SQL.' },
    { name: 'TimescaleDB', tag: 'Time-Series', description: 'Scalable time-series SQL data engine built on PostgreSQL.' },
    { name: 'pg_stat_statements', tag: 'Performance', description: 'Tracks execution statistics of all SQL statements executed by a server.' }
  ],
  redis: [
    { name: 'RedisJSON', tag: 'JSON Documents', description: 'Native JSON data type support with JSONPath querying.' },
    { name: 'RedisSearch', tag: 'Full-Text Search', description: 'Secondary indexing, full-text search, and vector indexing.' },
    { name: 'RedisTimeSeries', tag: 'Telemetry', description: 'Time-series data structure with downsampling and aggregation.' },
    { name: 'RedisBloom', tag: 'Probabilistic', description: 'Bloom and Cuckoo filters for high-speed existence checks.' }
  ],
  clickhouse: [
    { name: 'ClickHouse Keeper', tag: 'Consensus', description: 'Raft-based alternative to Apache ZooKeeper for cluster replication.' },
    { name: 'S3 Object Storage', tag: 'Cold Storage', description: 'Direct querying and tiering of historical data on S3/GCS buckets.' },
    { name: 'Kafka Engine', tag: 'Streaming', description: 'Native integration with Apache Kafka for real-time log ingestion.' }
  ],
  mongodb: [
    { name: 'Vector Search', tag: 'AI Embeddings', description: 'Native vector similarity search integrated into MQL queries.' },
    { name: 'Time Series Collections', tag: 'Telemetry', description: 'Optimized storage for sequences of measurements and metrics.' },
    { name: 'Atlas Search', tag: 'Full-Text', description: 'Lucene-powered full-text search directly on document fields.' }
  ],
  scylladb: [
    { name: 'Cassandra CQL API', tag: 'NoSQL API', description: '100% CQL compatibility for ultra-low latency reads/writes.' },
    { name: 'Alternator (DynamoDB)', tag: 'AWS Compatible', description: 'Drop-in Amazon DynamoDB API compatible interface.' }
  ],
  qdrant: [
    { name: 'Rust Core Engine', tag: 'High-Perf', description: 'Written in Rust for SIMD-accelerated vector distance calculations.' },
    { name: 'HNSW Indexing', tag: 'ANN Search', description: 'Hierarchical Navigable Small World graphs for fast vector search.' }
  ],
  milvus: [
    { name: 'Knowhere Engine', tag: 'Vector Core', description: 'SIMD and GPU-accelerated vector execution engine.' },
    { name: 'GPU Acceleration', tag: 'NVIDIA CUDA', description: 'CUDA-accelerated indexing and batch similarity search.' }
  ],
  chroma: [
    { name: 'DuckDB Backend', tag: 'Embedded OLAP', description: 'In-process analytical query engine for fast local vector storage.' },
    { name: 'Sentence Transformers', tag: 'Embeddings', description: 'Built-in embedding function wrappers for HuggingFace models.' }
  ],
  weaviate: [
    { name: 'GraphQL API', tag: 'Search API', description: 'Native GraphQL interface for hybrid keyword & vector search.' },
    { name: 'Cross-Modal Search', tag: 'Multi-Modal', description: 'Simultaneous vector search over text, images, and audio.' }
  ],
  mysql: [
    { name: 'InnoDB Cluster', tag: 'High Availability', description: 'Native Group Replication and MySQL Router topology.' },
    { name: 'X Plugin', tag: 'Document Store', description: 'NoSQL Document Store API for JSON document CRUD operations.' }
  ],
  mariadb: [
    { name: 'ColumnStore', tag: 'OLAP Analytics', description: 'Columnar storage engine designed for big data analytics.' },
    { name: 'Galera Cluster', tag: 'Multi-Primary', description: 'Synchronous multi-master cluster replication engine.' }
  ],
  cockroach: [
    { name: 'Distributed SQL', tag: 'Global HA', description: 'Consensus-driven distributed ACID transactions across regions.' },
    { name: 'Multi-Region Sharding', tag: 'Locality', description: 'Row-level data pinning to regional data centers for low latency.' }
  ],
  influxdb: [
    { name: 'IOx Storage Engine', tag: 'Apache Arrow', description: 'In-memory columnar engine based on Apache Arrow and DataFusion.' },
    { name: 'Flux Engine', tag: 'Functional SQL', description: 'Functional data scripting language for complex time-series queries.' }
  ],
  timescaledb: [
    { name: 'Hypertables', tag: 'Auto-Partitioning', description: 'Automatic time and space partitioning of time-series data.' },
    { name: 'Continuous Aggregates', tag: 'Real-Time OLAP', description: 'Automatically refreshed materialized views for metrics.' }
  ],
  questdb: [
    { name: 'ILP Protocol', tag: 'Ingestion', description: 'InfluxDB Line Protocol for high-throughput streaming ingestion.' },
    { name: 'Vectorized SQL', tag: 'Parallel Query', description: 'SIMD-accelerated SQL queries over time-series columns.' }
  ]
};

export const DatabaseManagementCatalogPage: React.FC<DatabaseManagementCatalogPageProps> = ({
  item,
  onBack,
  onNavigateCreate
}) => {
  // Filter active running instances for this specific engine
  const runningInstances = INITIAL_DEPLOYED_DBS.filter(
    (db) => db.engine_type === item.engine_type || item.engine_type === 'postgresql'
  );

  // Active Snippet Tab: 'cli' | 'python' | 'node' | 'go'
  const [activeSnippetTab, setActiveSnippetTab] = useState<'cli' | 'python' | 'node' | 'go'>('cli');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Interactive Web Terminal Modal State
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [selectedInstanceForTerminal, setSelectedInstanceForTerminal] = useState(
    runningInstances[0]?.name || `prod-${item.engine_type}-main-0`
  );

  // Day-2 Instance Management Modal state (Day-2 Operations: Scale, Config Tuning, Pause/Resume)
  const [activeDay2Instance, setActiveDay2Instance] = useState<any | null>(null);
  const [scaleCpu, setScaleCpu] = useState<number>(2.0);
  const [scaleRam, setScaleRam] = useState<number>(8.0);
  const [scaleDisk, setScaleDisk] = useState<number>(100);
  const [isScaling, setIsScaling] = useState<boolean>(false);

  // Config Tuning state
  const [maxConnections, setMaxConnections] = useState<number>(500);
  const [sharedBuffers, setSharedBuffers] = useState<string>('4GB');
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);

  // Lifecycle status: 'Running' | 'Stopped'
  const [instanceStatus, setInstanceStatus] = useState<'Running' | 'Stopped'>('Running');
  const [day2Notification, setDay2Notification] = useState<string | null>(null);

  // Top-level Day-2 Live Scaling Panel state
  const [selectedScaleInstanceId, setSelectedScaleInstanceId] = useState<string>(
    runningInstances[0]?.id || '1'
  );
  const selectedInstance = runningInstances.find(db => db.id === selectedScaleInstanceId) || runningInstances[0] || INITIAL_DEPLOYED_DBS[0];

  const [topCpu, setTopCpu] = useState<number>(
    selectedInstance ? (selectedInstance.cpu_usage_m || 1000) / 1000 : 2.0
  );
  const [topRam, setTopRam] = useState<number>(
    selectedInstance ? Math.round((selectedInstance.memory_usage_mb || 4096) / 1024) : 8.0
  );
  const [topDisk, setTopDisk] = useState<number>(
    selectedInstance ? selectedInstance.storage_gb || 50 : 100
  );
  const [topScaleStatus, setTopScaleStatus] = useState<'Running' | 'Scaling'>('Running');
  const [topScaleNotification, setTopScaleNotification] = useState<string | null>(null);

  // Live Config Tuning & custom-values.yaml Terminal Editor State
  const defaultYamlContent = `# custom-values.yaml — Live Runtime Engine Configuration Overrides
# Target Database: ${selectedInstance?.name || 'prod-postgres-main'} (${selectedInstance?.namespace || 'databases'})
# Service Endpoint: PUT /api/v1/databases/${selectedInstance?.id || '1'}/config

postgresql:
  max_connections: 500
  shared_buffers: "2GB"
  effective_cache_size: "6GB"
  maintenance_work_mem: "512MB"
  work_mem: "32MB"
  min_wal_size: "1GB"
  max_wal_size: "4GB"
  checkpoint_completion_target: 0.9
  wal_buffers: "16MB"
  default_statistics_target: 100
  random_page_cost: 1.1
  effective_io_concurrency: 200

auth:
  enablePostgreSQLPassword: true
  database: "app_production"

metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: "30s"
`;

  const [customValuesYaml, setCustomValuesYaml] = useState<string>(defaultYamlContent);
  const [yamlConfigStatus, setYamlConfigStatus] = useState<'idle' | 'applying' | 'success' | 'error'>('idle');
  const [yamlConfigNotification, setYamlConfigNotification] = useState<string | null>(null);

  const handleApplyCustomYamlConfig = async () => {
    setYamlConfigStatus('applying');
    setYamlConfigNotification(
      `[PUT /api/v1/databases/${selectedInstance?.id || '1'}/config]: Transmitted custom-values.yaml to helm-deployer & operator-service (helm upgrade --install)...`
    );
    await new Promise((res) => setTimeout(res, 1400));
    setYamlConfigStatus('success');
    setYamlConfigNotification(
      `✓ custom-values.yaml configuration successfully applied for ${selectedInstance?.name || 'prod-postgres-main'}! StatefulSet updated without downtime.`
    );
    setTimeout(() => {
      setYamlConfigStatus('idle');
      setYamlConfigNotification(null);
    }, 5000);
  };

  const handleTopApplyScale = async () => {
    setTopScaleStatus('Scaling');
    setTopScaleNotification(
      `[PATCH /api/v1/databases/${selectedInstance?.id}/scale]: Transmitted StatefulSet resource update command to helm-deployer & operator-service...`
    );
    await new Promise((res) => setTimeout(res, 1500));
    setTopScaleStatus('Running');
    setTopScaleNotification(
      `✓ Day-2 Scaling successfully executed for ${selectedInstance?.name}! New specs: ${topCpu} Cores CPU, ${topRam} GB RAM, ${topDisk} GB PVC Storage.`
    );
    setTimeout(() => setTopScaleNotification(null), 5000);
  };

  const handleOpenDay2 = (db: any) => {
    setActiveDay2Instance(db);
    setScaleCpu((db.cpu_usage_m || 1000) / 1000);
    setScaleRam((db.memory_usage_mb || 4096) / 1024);
    setScaleDisk(db.storage_gb || 50);
    setInstanceStatus(db.status === 'Stopped' ? 'Stopped' : 'Running');
  };

  const handleApplyScale = async () => {
    setIsScaling(true);
    setDay2Notification(`[PATCH /api/v1/databases/${activeDay2Instance?.id || 1}/scale]: Scaling CPU to ${scaleCpu} Cores, RAM to ${scaleRam} GB, Storage to ${scaleDisk} GB...`);
    await new Promise((res) => setTimeout(res, 1200));
    setIsScaling(false);
    setDay2Notification(`✓ Resource Scaling successfully applied via helm upgrade for ${activeDay2Instance?.name}!`);
    setTimeout(() => setDay2Notification(null), 4000);
  };

  const handleApplyConfig = async () => {
    setIsConfiguring(true);
    setDay2Notification(`[PUT /api/v1/databases/${activeDay2Instance?.id || 1}/config]: Applying max_connections=${maxConnections}, shared_buffers=${sharedBuffers}...`);
    await new Promise((res) => setTimeout(res, 1200));
    setIsConfiguring(false);
    setDay2Notification(`✓ Config tuning values.yaml applied via helm upgrade for ${activeDay2Instance?.name}!`);
    setTimeout(() => setDay2Notification(null), 4000);
  };

  const handleToggleStopStart = () => {
    const newStatus = instanceStatus === 'Running' ? 'Stopped' : 'Running';
    setInstanceStatus(newStatus);
    const action = newStatus === 'Stopped' ? 'stop (scale replicas: 0)' : 'start (scale replicas: 1)';
    setDay2Notification(`✓ Executed POST /api/v1/databases/${activeDay2Instance?.id || 1}/${action}. Instance status updated to ${newStatus}.`);
    setTimeout(() => setDay2Notification(null), 4000);
  };

  // Terminal Command Line State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'cmd' | 'output' | 'info'; text: string }>>([
    { type: 'info', text: `[K8S-EXEC-SERVICE]: Establishing secure mTLS tunnel to pod ${selectedInstanceForTerminal}...` },
    { type: 'info', text: `[RBAC-CHECK]: User 'bodya@databasik.io' authorized with ClusterAdmin role.` },
    { type: 'info', text: `[POD-EXEC]: Interactive shell initialized inside container namespace 'databases'.` },
    { type: 'output', text: `Connected to ${item.name} v${item.versions[0]} engine.` },
    { type: 'output', text: `Type \\h or SELECT * for help or click sample query buttons below.` }
  ]);

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1500);
  };

  const handleSendTerminalCommand = (cmdStr?: string) => {
    const cmd = cmdStr || terminalInput;
    if (!cmd.trim()) return;

    const newLogs = [
      ...terminalLogs,
      { type: 'cmd' as const, text: `${item.engine_type === 'redis' ? '127.0.0.1:6379>' : `${item.engine_type}=#`} ${cmd}` }
    ];

    const lowerCmd = cmd.toLowerCase().trim();

    // Simulated CLI responses depending on engine type & command
    if (lowerCmd.includes('\\l') || lowerCmd.includes('show databases')) {
      newLogs.push({
        type: 'output',
        text: `List of databases:\n  Name          | Owner    | Encoding | Collate\n  --------------+----------+----------+------------\n  app_production| postgres | UTF8     | en_US.UTF-8\n  analytics_db  | postgres | UTF8     | en_US.UTF-8\n  postgres      | postgres | UTF8     | en_US.UTF-8\n(3 rows)`
      });
    } else if (lowerCmd.includes('\\dt') || lowerCmd.includes('show tables')) {
      newLogs.push({
        type: 'output',
        text: `List of relations:\n  Schema | Name             | Type  | Owner\n  -------+------------------+-------+----------\n  public | users            | table | postgres\n  public | orders           | table | postgres\n  public | audit_logs       | text  | postgres\n  public | payment_intents  | table | postgres\n(4 rows)`
      });
    } else if (lowerCmd.includes('select') || lowerCmd.includes('get')) {
      newLogs.push({
        type: 'output',
        text: `id | username   | email               | status | created_at\n---+------------+---------------------+--------+--------------------\n 1 | alex_dev   | alex@company.io     | active | 2026-08-01 10:12:00\n 2 | bodya_admin| bodya@databasik.io  | active | 2026-08-02 11:45:00\n 3 | maria_lead | maria@company.io    | active | 2026-08-05 14:20:00\n(3 rows in set - 0.002 sec)`
      });
    } else if (lowerCmd.includes('max_connections') || lowerCmd.includes('config')) {
      newLogs.push({
        type: 'output',
        text: `name            | setting | unit\n----------------+---------+------\nmax_connections | 250     | \nshared_buffers  | 262144  | 8kB\n(1 row)`
      });
    } else {
      newLogs.push({
        type: 'output',
        text: `Query OK, 0 rows affected. Command executed successfully inside pod container.`
      });
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  // Connection code snippets per language
  const snippets = {
    cli: item.engine_type === 'redis'
      ? `redis-cli -h redis-session-cache.cache.svc.cluster.local -p 6379 -a "$REDIS_PASSWORD"`
      : `psql -h ${runningInstances[0]?.name || 'prod-db-main'}.databases.svc.cluster.local -U admin -d app_db`,
    python: item.engine_type === 'redis'
      ? `import redis\n\nr = redis.Redis(\n    host='redis-session-cache.cache.svc.cluster.local',\n    port=6379,\n    password='SECRET_VAULT_TOKEN'\n)\nprint(r.ping())`
      : `import psycopg2\n\nconn = psycopg2.connect(\n    host="${runningInstances[0]?.name || 'prod-db-main'}.databases.svc.cluster.local",\n    database="app_db",\n    user="admin",\n    password="SECRET_VAULT_TOKEN"\n)`,
    node: item.engine_type === 'redis'
      ? `const { createClient } = require('redis');\nconst client = createClient({ url: 'redis://:SECRET@redis-service:6379' });\nawait client.connect();`
      : `const { Pool } = require('pg');\nconst pool = new Pool({\n  host: '${runningInstances[0]?.name || 'prod-db-main'}.databases.svc.cluster.local',\n  user: 'admin',\n  database: 'app_db',\n  port: 5432,\n});`,
    go: item.engine_type === 'redis'
      ? `rdb := redis.NewClient(&redis.Options{\n    Addr: "redis-service:6379",\n    Password: "SECRET_VAULT_TOKEN",\n})`
      : `conn, err := pgx.Connect(ctx, "postgres://admin:SECRET@${runningInstances[0]?.name || 'prod-db-main'}.databases.svc.cluster.local:5432/app_db")`
  };

  // Extensions list for current engine
  const currentExtensions = ENGINE_EXTENSIONS[item.engine_type] || ENGINE_EXTENSIONS['postgresql'];

  const managementBlocks = [
    {
      id: 'cli',
      title: 'Interactive Web Terminal (Pod Exec)',
      description: 'Connect directly into container pods via kubectl exec, query tables, inspect databases & debug live.',
      icon: TerminalIcon,
      badge: 'Live Terminal',
      action: () => setShowTerminalModal(true)
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
      title: 'Resource Allocation Presets',
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
      <div className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-accent-darkBorder"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>
          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
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
              <p className="text-xs text-slate-400">Detailed management modules, active running pods, and connection snippets</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* QUICK WEBPOD TERMINAL BUTTON */}
          <button
            onClick={() => setShowTerminalModal(true)}
            className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-accent-darkBorder hover:border-brand-sky shadow-md flex items-center gap-2 transition-all"
          >
            <TerminalIcon className="w-4 h-4 text-brand-sky" />
            <span>⚡ Interactive Web Terminal</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🚀 DAY-2 LIVE SCALING & RESOURCE ALLOCATION PANEL */}
      {/* (PATCH /api/v1/databases/{id}/scale) */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-r from-bg-card via-bg-main to-bg-card border border-brand-blue/40 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header & Instance Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-accent-darkBorder pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/30 text-brand-sky flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                📈 Day-2 Live Scaling & Resource Allocation
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-blue/20 text-brand-sky border border-brand-blue/30">
                  PATCH /api/v1/databases/{'{id}'}/scale
                </span>
              </h3>
              <p className="text-xs text-slate-400">Zero-downtime hot scaling of CPU, RAM, and PVC Storage for active Kubernetes StatefulSets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-bg-main text-brand-sky border border-brand-sky/30 flex items-center gap-2 shadow-sm">
              <Database className="w-4 h-4 text-brand-sky" />
              <span className="font-extrabold text-white">{selectedInstance.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({selectedInstance.cluster_name})</span>
            </span>
          </div>
        </div>

        {/* Live Notification Bar if any */}
        {topScaleNotification && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
            topScaleStatus === 'Scaling'
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}>
            {topScaleStatus === 'Scaling' ? (
              <Activity className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            <span>{topScaleNotification}</span>
          </div>
        )}

        {/* 3 Columns: CPU, RAM, STORAGE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. CPU Cores */}
          <div className="bg-bg-main border border-accent-darkBorder p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-sky" /> CPU Cores
              </span>
              <span className="text-xs font-bold text-slate-400">
                Current: <strong className="text-white">{(selectedInstance.cpu_usage_m / 1000).toFixed(1)} Cores</strong>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">New Desired CPU:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="64"
                    value={topCpu}
                    onChange={(e) => setTopCpu(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-20 bg-bg-card border border-accent-darkBorder rounded-lg px-2 py-1 text-right text-xs font-bold text-brand-sky focus:outline-none focus:border-brand-sky shadow-inner"
                  />
                  <span className="text-brand-sky font-extrabold text-xs">Cores</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[0.5, 1.0, 2.0, 4.0].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTopCpu(c)}
                    className={`py-1.5 rounded-lg border transition-all ${
                      topCpu === c
                        ? 'bg-brand-blue text-white border-brand-sky shadow-md'
                        : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:text-white'
                    }`}
                  >
                    {c}C
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0.1"
                max="16.0"
                step="0.05"
                value={topCpu}
                onChange={(e) => setTopCpu(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-sky mt-2"
              />
            </div>
          </div>

          {/* 2. RAM Memory */}
          <div className="bg-bg-main border border-accent-darkBorder p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-cyan" /> RAM Memory
              </span>
              <span className="text-xs font-bold text-slate-400">
                Current: <strong className="text-white">{Math.round(selectedInstance.memory_usage_mb / 1024)} GB</strong>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">New Desired RAM:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="256"
                    value={topRam}
                    onChange={(e) => setTopRam(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                    className="w-20 bg-bg-card border border-accent-darkBorder rounded-lg px-2 py-1 text-right text-xs font-bold text-brand-cyan focus:outline-none focus:border-brand-cyan shadow-inner"
                  />
                  <span className="text-brand-cyan font-extrabold text-xs">GB</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[2, 4, 8, 16].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTopRam(r)}
                    className={`py-1.5 rounded-lg border transition-all ${
                      topRam === r
                        ? 'bg-brand-cyan text-slate-950 border-brand-cyan font-extrabold shadow-md'
                        : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:text-white'
                    }`}
                  >
                    {r}GB
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0.5"
                max="64"
                step="0.5"
                value={topRam}
                onChange={(e) => setTopRam(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan mt-2"
              />
            </div>
          </div>

          {/* 3. PVC Storage SSD */}
          <div className="bg-bg-main border border-accent-darkBorder p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" /> Storage (PVC SSD)
              </span>
              <span className="text-xs font-bold text-slate-400">
                Current: <strong className="text-white">{selectedInstance.storage_gb} GB</strong>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">New Desired Disk Size:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="10000"
                    value={topDisk}
                    onChange={(e) => setTopDisk(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-20 bg-bg-card border border-accent-darkBorder rounded-lg px-2 py-1 text-right text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                  <span className="text-emerald-400 font-extrabold text-xs">GB</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[50, 100, 200, 500].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTopDisk(d)}
                    className={`py-1.5 rounded-lg border transition-all ${
                      topDisk === d
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md'
                        : 'bg-bg-card text-slate-400 border-accent-darkBorder hover:text-white'
                    }`}
                  >
                    {d}GB
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="20"
                max="1000"
                step="20"
                value={topDisk}
                onChange={(e) => setTopDisk(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2"
              />
            </div>
          </div>
        </div>

        {/* Action Trigger Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-accent-darkBorder">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">StatefulSet Scale Target:</span>
            <span className="text-xs font-mono font-bold text-white bg-bg-main px-3 py-1.5 rounded-lg border border-accent-darkBorder">
              {selectedInstance.name} ({selectedInstance.namespace})
            </span>
          </div>

          <button
            onClick={handleTopApplyScale}
            disabled={topScaleStatus === 'Scaling'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
              topScaleStatus === 'Scaling'
                ? 'bg-amber-500 text-slate-950 cursor-wait shadow-amber-500/30'
                : 'bg-gradient-to-r from-brand-blue via-brand-sky to-brand-cyan hover:opacity-90 text-white shadow-brand-blue/30'
            }`}
          >
            <Activity className={`w-4 h-4 ${topScaleStatus === 'Scaling' ? 'animate-spin' : ''}`} />
            <span>
              {topScaleStatus === 'Scaling'
                ? 'Scaling StatefulSet...'
                : '📈 Apply Day-2 Scale (PATCH /api/v1/databases/scale)'}
            </span>
          </button>
        </div>
      </section>



      {/* ======================================================== */}
      {/* 2. ⚙️ LIVE CONFIG TUNING & custom-values.yaml TERMINAL EDITOR */}
      {/* ======================================================== */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center border border-brand-sky/30 text-brand-sky">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Live Config Tuning & custom-values.yaml Terminal Editor
              </h4>
              <p className="text-xs text-slate-400">
                Modify engine parameters in custom-values.yaml for real-time hot-reload / rolling deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomValuesYaml(defaultYamlContent)}
              className="px-3.5 py-2 rounded-xl bg-bg-main hover:bg-slate-800 text-slate-300 hover:text-white border border-accent-darkBorder text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Chart Defaults (values.yaml from chart)</span>
            </button>

            <button
              onClick={() => {
                setYamlConfigNotification(`[Template]: Rendered Helm template manifest successfully against custom-values.yaml!`);
                setTimeout(() => setYamlConfigNotification(null), 4000);
              }}
              className="px-3.5 py-2 rounded-xl bg-bg-main hover:bg-slate-800 text-slate-300 hover:text-white border border-accent-darkBorder text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-brand-cyan" />
              <span>template</span>
            </button>

            <button
              onClick={handleApplyCustomYamlConfig}
              disabled={yamlConfigStatus === 'applying'}
              className={`px-5 py-2 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 ${
                yamlConfigStatus === 'applying'
                  ? 'bg-amber-500 text-slate-950 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Sliders className={`w-4 h-4 ${yamlConfigStatus === 'applying' ? 'animate-spin' : ''}`} />
              <span>
                {yamlConfigStatus === 'applying' ? 'Upgrading...' : 'upgrade'}
              </span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION FEEDBACK BANNER */}
        {yamlConfigNotification && (
          <div className="p-3 bg-brand-blue/10 border border-brand-sky/30 rounded-xl text-xs text-brand-sky font-mono font-bold flex items-center justify-between animate-fadeIn">
            <span>{yamlConfigNotification}</span>
            <button onClick={() => setYamlConfigNotification(null)} className="hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CODE TERMINAL EDITOR WINDOW */}
        <div className="relative bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs text-slate-200">
          <div className="bg-[#161b22] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="ml-2 text-slate-300 font-bold font-mono">custom-values.yaml</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">YAML Editor • Hot-Reload Supported</span>
          </div>

          <div className="p-4 bg-[#0d1117]">
            <textarea
              value={customValuesYaml}
              onChange={(e) => setCustomValuesYaml(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-brand-blue selection:text-white"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. 🧩 SUPPORTED EXTENSIONS & PLUGINS */}
      {/* ======================================================== */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-brand-sky" /> 3. Supported Extensions & Engine Plugins
            </h4>
            <p className="text-xs text-slate-400">Pre-packaged modules, vector search engines, and spatial GIS extensions supported for {item.name}</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-bg-main px-3 py-1 rounded-lg border border-accent-darkBorder">
            {currentExtensions.length} Available Extensions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentExtensions.map((ext, idx) => (
            <div 
              key={idx}
              className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-2 hover:border-brand-sky/60 transition-all flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-extrabold text-white text-sm">{ext.name}</h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                    {ext.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ext.description}
                </p>
              </div>

              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" /> Ready
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* INTERACTIVE IN-BROWSER K8S POD EXEC TERMINAL MODAL */}
      {/* ======================================================== */}
      {showTerminalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-accent-darkBorder rounded-3xl w-full max-w-4xl p-6 shadow-2xl space-y-4 relative text-slate-100 flex flex-col max-h-[85vh]">
            
            {/* TERMINAL MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/20 flex items-center justify-center border border-brand-sky/30 text-brand-sky">
                  <TerminalIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    In-Browser K8s Pod Web Terminal
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ● CONNECTED
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Pod: <strong className="text-brand-sky">{selectedInstanceForTerminal}-0</strong> | Cluster: <strong className="text-slate-300">onprem-prod-k8s</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTerminalModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-accent-darkHover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QUICK QUERY SAMPLE BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-slate-400 font-bold text-[11px] uppercase">Quick Exec:</span>
              <button
                onClick={() => handleSendTerminalCommand('\\l')}
                className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky border border-accent-darkBorder px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all"
              >
                \l (Databases)
              </button>
              <button
                onClick={() => handleSendTerminalCommand('\\dt')}
                className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky border border-accent-darkBorder px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all"
              >
                \dt (Tables)
              </button>
              <button
                onClick={() => handleSendTerminalCommand('SELECT * FROM users LIMIT 5;')}
                className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky border border-accent-darkBorder px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all"
              >
                SELECT * FROM users
              </button>
              <button
                onClick={() => handleSendTerminalCommand('SHOW max_connections;')}
                className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky border border-accent-darkBorder px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all"
              >
                SHOW max_connections
              </button>
            </div>

            {/* DARK TERMINAL CONSOLE WINDOW */}
            <div className="bg-brand-dark border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2 overflow-y-auto flex-1 min-h-[300px] shadow-inner">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">
                  {log.type === 'info' && (
                    <span className="text-slate-500 font-semibold">{log.text}</span>
                  )}
                  {log.type === 'cmd' && (
                    <span className="text-blue-500 font-bold">{log.text}</span>
                  )}
                  {log.type === 'output' && (
                    <span className="text-sky-300 font-semibold">{log.text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* TERMINAL INPUT COMMAND LINE */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTerminalCommand();
              }}
              className="flex items-center gap-2 pt-2 border-t border-accent-darkBorder"
            >
              <span className="text-blue-500 font-mono font-bold text-xs">
                {item.engine_type === 'redis' ? '127.0.0.1:6379>' : `${item.engine_type}=#`}
              </span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  const target = e.currentTarget;
                  if (e.key === ' ' && target.selectionStart !== null && target.selectionEnd !== null && target.selectionStart !== target.selectionEnd) {
                    e.preventDefault();
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const newVal = terminalInput.substring(0, start) + terminalInput.substring(end);
                    setTerminalInput(newVal);
                    setTimeout(() => {
                      target.setSelectionRange(start, start);
                    }, 0);
                  }
                }}
                placeholder="Type SQL query or CLI command (e.g. \dt, SELECT * FROM users;) and press Enter..."
                className="flex-1 bg-bg-main border border-accent-darkBorder text-sky-300 text-xs font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky selection:bg-brand-sky/50 selection:text-white font-semibold"
              />
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Run
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DAY-2 OPERATIONS MODAL (Scale, Parameter Tuning, Stop/Start) */}
      {/* ======================================================== */}
      {activeDay2Instance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-bg-card border border-accent-darkBorder rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-sky" /> Day-2 Operations & Controls: {activeDay2Instance.name}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    instanceStatus === 'Running' 
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' 
                      : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                  }`}>
                    ● {instanceStatus.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target Cluster: <span className="text-slate-200 font-mono">{activeDay2Instance.cluster_name}</span> | Namespace: <span className="text-slate-200 font-mono">{activeDay2Instance.namespace}</span>
                </p>
              </div>
              <button 
                onClick={() => setActiveDay2Instance(null)}
                className="p-2 hover:bg-accent-darkHover rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banner */}
            {day2Notification && (
              <div className="p-3 bg-brand-blue/20 border border-brand-sky/40 text-brand-sky rounded-xl text-xs font-mono font-semibold animate-pulse">
                {day2Notification}
              </div>
            )}

            {/* SECTION 4: Day-2 Resource Scaling (PATCH /scale) */}
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-sky flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> 4. 📈 Day-2 Resource Scaling (PATCH /api/v1/databases/{activeDay2Instance.id || 1}/scale)
                </h4>
                <span className="text-[10px] text-slate-400 bg-bg-card px-2 py-0.5 rounded border border-accent-darkBorder">
                  Rolling Update (No Downtime)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-bg-card p-3 rounded-xl border border-accent-darkBorder">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">CPU Cores</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.5"
                      min="0.5"
                      max="64"
                      value={scaleCpu} 
                      onChange={(e) => setScaleCpu(parseFloat(e.target.value))}
                      className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sky"
                    />
                    <span className="text-xs text-slate-500 font-bold">Cores</span>
                  </div>
                </div>

                <div className="bg-bg-card p-3 rounded-xl border border-accent-darkBorder">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">RAM Memory</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="1"
                      min="1"
                      max="256"
                      value={scaleRam} 
                      onChange={(e) => setScaleRam(parseFloat(e.target.value))}
                      className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sky"
                    />
                    <span className="text-xs text-slate-500 font-bold">GB</span>
                  </div>
                </div>

                <div className="bg-bg-card p-3 rounded-xl border border-accent-darkBorder">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Persistent Disk (PVC)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="10"
                      min="10"
                      max="5000"
                      value={scaleDisk} 
                      onChange={(e) => setScaleDisk(parseInt(e.target.value, 10))}
                      className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sky"
                    />
                    <span className="text-xs text-slate-500 font-bold">GB SSD</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleApplyScale}
                disabled={isScaling}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-brand-blue/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> 
                {isScaling ? 'Scaling via helm upgrade...' : 'Apply Resource Scaling (helm upgrade)'}
              </button>
            </div>

            {/* SECTION 5: Parameter Editing & Config Tuning (PUT /config) */}
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-sky flex items-center gap-2">
                <Code2 className="w-4 h-4" /> 5. ⚙️ Parameter Editing & Tuning (PUT /api/v1/databases/{activeDay2Instance.id || 1}/config)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-card p-3 rounded-xl border border-accent-darkBorder">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Max Connections (max_connections)</label>
                  <input 
                    type="number" 
                    value={maxConnections} 
                    onChange={(e) => setMaxConnections(parseInt(e.target.value, 10))}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sky"
                  />
                </div>
                <div className="bg-bg-card p-3 rounded-xl border border-accent-darkBorder">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Shared Buffers (shared_buffers)</label>
                  <input 
                    type="text" 
                    value={sharedBuffers} 
                    onChange={(e) => setSharedBuffers(e.target.value)}
                    className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sky"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyConfig}
                disabled={isConfiguring}
                className="bg-emerald-600 hover:bg-emerald-600/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isConfiguring ? 'Applying values.yaml tuning...' : 'Apply Config Tuning (values.yaml)'}
              </button>
            </div>

            {/* SECTION 6: Lifecycle Pause/Resume & Delete (POST /stop & /start) */}
            <div className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> 6. ⏹️ Lifecycle Controls (POST /stop & /start & DELETE)
              </h4>

              <div className="flex items-center gap-3 flex-wrap">
                {instanceStatus === 'Running' ? (
                  <button
                    onClick={handleToggleStopStart}
                    className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    ⏸️ Pause Database (Scale replicas to 0)
                  </button>
                ) : (
                  <button
                    onClick={handleToggleStopStart}
                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    ▶️ Resume Database (Scale replicas to 1)
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${activeDay2Instance.name}? A final snapshot will be created.`)) {
                      setActiveDay2Instance(null);
                      alert(`✓ Final snapshot created and database ${activeDay2Instance.name} deleted.`);
                    }
                  }}
                  className="bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                >
                  🗑️ Delete Database Instance (Safe Removal)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
