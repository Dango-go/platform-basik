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

          <button
            onClick={() => onNavigateCreate(item.engine_type)}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all"
          >
            <Database className="w-4 h-4" />
            <span>Provision {item.name} Instance</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. 🚀 ACTIVE RUNNING INSTANCES WIDGET */}
      {/* ======================================================== */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-cyan" /> 1. Active Running {item.name} Instances
            </h4>
            <p className="text-xs text-slate-400">Live Kubernetes database pods running across connected worker clusters</p>
          </div>
          <span className="text-xs font-bold text-brand-sky px-2.5 py-1 rounded-lg bg-brand-blue/10 border border-brand-sky/20">
            {runningInstances.length} Active Pods
          </span>
        </div>

        {runningInstances.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No active instances currently running for {item.name}. Click "Provision Instance" to deploy one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runningInstances.map((db) => (
              <div 
                key={db.id}
                className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-3 hover:border-brand-sky transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-brand-sky" /> {db.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" /> ● Running
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-accent-darkBorder/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cluster</span>
                    <strong className="text-slate-200">{db.cluster_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Resources</span>
                    <strong className="text-slate-200">{db.cpu_usage_m}m / {db.memory_usage_mb}MB</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Storage</span>
                    <strong className="text-slate-200">{db.storage_gb} GB SSD</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-accent-darkBorder/40">
                  <span className="text-[11px] font-mono text-slate-500">ns: {db.namespace}</span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => alert(`Opening monitoring dashboard for ${db.name}...`)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-brand-sky" />
                      <span>Open Monitoring &rarr;</span>
                    </button>

                    {/* DIRECT TERMINAL CONNECT BUTTON FOR THIS POD */}
                    <button
                      onClick={() => {
                        setSelectedInstanceForTerminal(db.name);
                        setShowTerminalModal(true);
                      }}
                      className="text-xs font-bold text-brand-sky hover:text-white flex items-center gap-1 hover:underline"
                    >
                      <TerminalIcon className="w-3.5 h-3.5" />
                      <span>Connect Terminal ⚡</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 2. ⚡ CONNECTION SNIPPETS GENERATOR */}
      {/* ======================================================== */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-sky" /> 2. Connection Code Snippets Generator
            </h4>
            <p className="text-xs text-slate-400">Copy pre-configured connection code snippets for your preferred programming language</p>
          </div>

          {/* LANGUAGE TABS */}
          <div className="flex items-center gap-1.5 bg-bg-main p-1 rounded-xl border border-accent-darkBorder">
            {[
              { id: 'cli', label: '💻 CLI (psql)' },
              { id: 'python', label: '🐍 Python' },
              { id: 'node', label: '🟨 Node.js' },
              { id: 'go', label: '🟦 Go' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSnippetTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeSnippetTab === tab.id
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CODE SNIPPET DISPLAY CONTAINER */}
        <div className="relative bg-brand-dark border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200">
          <button
            onClick={() => handleCopySnippet(snippets[activeSnippetTab])}
            className="absolute top-3 right-3 bg-bg-card hover:bg-accent-darkHover text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-accent-darkBorder flex items-center gap-1.5 text-xs font-bold transition-all"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <pre className="overflow-x-auto pr-24 leading-relaxed">
            <code>{snippets[activeSnippetTab]}</code>
          </pre>
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
                    <span className="text-blue-400 font-bold">{log.text}</span>
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
              <span className="text-blue-400 font-mono font-bold text-xs">
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

    </div>
  );
};
