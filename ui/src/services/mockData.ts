import { DatabaseCatalogItem, DeployedDatabase, CloudCredential, K8sCluster, DatabaseMetrics } from '../types';

// Crisp inline SVG Data URIs matching user-provided logo images
const CLICKHOUSE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="5" y="70" width="14" height="20" fill="%23FF0000"/><rect x="27" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="49" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="71" y="10" width="14" height="80" fill="%23FFCC00"/><rect x="91" y="40" width="7" height="25" fill="%23FFCC00"/></svg>`;

const QUESTDB_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 A35 35 0 1 0 75 75 L90 90 L75 75 A35 35 0 0 0 50 10 Z M50 28 A17 17 0 1 1 33 45 A17 17 0 0 1 50 28 Z" fill="%23D93672"/><path d="M40 50 L85 90 L95 80 L50 40 Z" fill="%23D93672"/></svg>`;

const DRAGONFLY_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 15 C44 15 40 22 40 28 L45 50 L45 85 L50 92 L55 85 L55 50 L60 28 C60 22 56 15 50 15 Z" fill="%23FFFFFF"/><path d="M45 30 C28 15 8 22 14 34 C20 42 40 40 45 42 Z" fill="%23FFFFFF"/><path d="M55 30 C72 15 92 22 86 34 C80 42 60 40 55 42 Z" fill="%23FFFFFF"/><path d="M45 46 C28 38 10 46 16 54 C22 60 40 54 45 52 Z" fill="%23FFFFFF"/><path d="M55 46 C72 38 90 46 84 54 C78 60 60 54 55 52 Z" fill="%23FFFFFF"/></svg>`;

export const CATALOG_ITEMS: DatabaseCatalogItem[] = [
  // Relational Databases
  {
    id: 'pg',
    name: 'PostgreSQL',
    engine_type: 'postgresql',
    category: 'relational',
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    description: 'Advanced open-source relational database supporting SQL & JSON queries.',
    badge: 'SQL',
    versions: ['16', '15', '14']
  },
  {
    id: 'mysql',
    name: 'MySQL Enterprise',
    engine_type: 'mysql',
    category: 'relational',
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    description: 'Reliable, fast multi-threaded relational database management system.',
    badge: 'SQL',
    versions: ['8.0', '5.7']
  },
  {
    id: 'mariadb',
    name: 'MariaDB Server',
    engine_type: 'mariadb',
    category: 'relational',
    icon_url: 'https://www.vectorlogo.zone/logos/mariadb/mariadb-icon.svg',
    description: 'Community-developed fork of MySQL designed for high concurrency.',
    badge: 'SQL',
    versions: ['11.2', '10.11']
  },
  {
    id: 'cockroach',
    name: 'CockroachDB',
    engine_type: 'cockroach',
    category: 'relational',
    icon_url: 'https://www.vectorlogo.zone/logos/cockroachlabs/cockroachlabs-icon.svg',
    description: 'Distributed SQL database built for global cloud applications.',
    badge: 'Distributed SQL',
    versions: ['23.2', '23.1']
  },

  // NoSQL Databases
  {
    id: 'mongo',
    name: 'MongoDB Atlas',
    engine_type: 'mongodb',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    description: 'Flexible document-based NoSQL database with JSON-like documents.',
    badge: 'Document',
    versions: ['7.0', '6.0']
  },
  {
    id: 'cassandra',
    name: 'Apache Cassandra',
    engine_type: 'cassandra',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/apache_cassandra/apache_cassandra-icon.svg',
    description: 'Wide-column NoSQL store designed to handle massive volumes of data.',
    badge: 'Wide-Column',
    versions: ['4.1', '4.0']
  },
  {
    id: 'couchbase',
    name: 'Couchbase Capella',
    engine_type: 'couchbase',
    category: 'nosql',
    icon_url: 'https://www.vectorlogo.zone/logos/couchbase/couchbase-icon.svg',
    description: 'Distributed NoSQL cloud database with built-in full-text search.',
    badge: 'Document / KV',
    versions: ['7.2', '7.1']
  },
  {
    id: 'scylla',
    name: 'ScyllaDB Enterprise',
    engine_type: 'scylladb',
    category: 'nosql',
    icon_url: '/scylladb.png', // EXACT User Uploaded ScyllaDB Cyan Monster Mascot Logo
    description: 'Ultra-low latency C++ drop-in replacement for Apache Cassandra.',
    badge: 'Ultra-Fast NoSQL',
    versions: ['5.4', '5.2']
  },

  // Vector Databases
  {
    id: 'qdrant',
    name: 'Qdrant Vector DB',
    engine_type: 'qdrant',
    category: 'vector',
    icon_url: '/qdrant.png', // EXACT User Uploaded 3D Isometric q-Cube Logo
    description: 'High-performance vector similarity search engine written in Rust.',
    badge: 'AI Vector',
    versions: ['1.8', '1.7']
  },
  {
    id: 'milvus',
    name: 'Milvus Distributed',
    engine_type: 'milvus',
    category: 'vector',
    icon_url: '/milvus.png', // EXACT User Uploaded White Eye/Vector Emblem on Dark Background
    description: 'Open-source vector database built for GenAI and embedding search.',
    badge: 'AI Vector',
    versions: ['2.3', '2.2']
  },
  {
    id: 'chroma',
    name: 'ChromaDB',
    engine_type: 'chroma',
    category: 'vector',
    icon_url: '/chroma.png', // EXACT User Uploaded Chroma Colored Circles Emblem Logo
    description: 'AI-native open-source embedding database for LLM applications.',
    badge: 'LLM Embeddings',
    versions: ['0.4.22']
  },
  {
    id: 'weaviate',
    name: 'Weaviate Cloud',
    engine_type: 'weaviate',
    category: 'vector',
    icon_url: '/weaviate.png', // EXACT User Uploaded Weaviate W Logo on Deep Navy Background
    description: 'Vector search engine with built-in ML models and semantic search.',
    badge: 'Semantic Vector',
    versions: ['1.24', '1.23']
  },

  // In-Memory Databases
  {
    id: 'redis',
    name: 'Redis Enterprise',
    engine_type: 'redis',
    category: 'inmemory',
    icon_url: 'https://www.vectorlogo.zone/logos/redis/redis-icon.svg',
    description: 'In-memory key-value data store used as cache and message broker.',
    badge: 'In-Memory',
    versions: ['7.2', '7.0']
  },
  {
    id: 'keydb',
    name: 'KeyDB High-Perf',
    engine_type: 'keydb',
    category: 'inmemory',
    icon_url: '/keydb.png', // EXACT User Uploaded KeyDB Geometric Yellow Triangle Cube Logo
    description: 'Multi-threaded open-source drop-in replacement for Redis.',
    badge: 'Multi-Threaded',
    versions: ['6.3', '6.2']
  },
  {
    id: 'dragonfly',
    name: 'DragonflyDB',
    engine_type: 'dragonfly',
    category: 'inmemory',
    icon_url: DRAGONFLY_LOGO_SVG,
    description: 'Modern in-memory datastore designed for multi-core hardware.',
    badge: 'Next-Gen Cache',
    versions: ['1.14']
  },

  // Time-Series Databases
  {
    id: 'clickhouse',
    name: 'ClickHouse OLAP',
    engine_type: 'clickhouse',
    category: 'timeseries',
    icon_url: CLICKHOUSE_LOGO_SVG,
    description: 'Column-oriented DBMS for real-time analytics & time-series logs.',
    badge: 'Columnar OLAP',
    versions: ['24.1', '23.8']
  },
  {
    id: 'influx',
    name: 'InfluxDB 3.0',
    engine_type: 'influxdb',
    category: 'timeseries',
    icon_url: '/influxdb.png', // EXACT User Uploaded White Geometric Polyhedron Logo
    description: 'Purpose-built time-series engine for IoT metrics and telemetry.',
    badge: 'Time-Series',
    versions: ['3.0', '2.7']
  },
  {
    id: 'timescale',
    name: 'TimescaleDB',
    engine_type: 'timescaledb',
    category: 'timeseries',
    icon_url: '/timescaledb.png', // EXACT User Uploaded Yellow Circle Black Tiger Silhouette
    description: 'Relational database for time-series data built on PostgreSQL.',
    badge: 'Time-Series SQL',
    versions: ['2.14', '2.13']
  },
  {
    id: 'questdb',
    name: 'QuestDB SQL',
    engine_type: 'questdb',
    category: 'timeseries',
    icon_url: QUESTDB_LOGO_SVG,
    description: 'Fast open-source time-series database with SQL interface.',
    badge: 'High-Throughput',
    versions: ['7.3']
  }
];

export const INITIAL_DEPLOYED_DBS: DeployedDatabase[] = [
  {
    id: 'db-1',
    name: 'prod-postgres-main',
    engine_type: 'postgresql',
    version: '16',
    status: 'running',
    cluster_name: 'lenovo-prod-k8s',
    namespace: 'databases',
    cpu_usage_m: 450,
    memory_usage_mb: 3200,
    storage_gb: 50,
    monthly_cost: 64.50,
    created_at: '2026-08-10 10:15',
    values_yaml: `primary:\n  extendedConfiguration: |\n    max_connections = 250\n    shared_buffers = 2GB\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n  persistence:\n    size: 50Gi`
  },
  {
    id: 'db-2',
    name: 'redis-session-cache',
    engine_type: 'redis',
    version: '7.2',
    status: 'running',
    cluster_name: 'aws-eks-us-east',
    namespace: 'cache',
    cpu_usage_m: 120,
    memory_usage_mb: 1400,
    storage_gb: 15,
    monthly_cost: 28.10,
    created_at: '2026-08-12 14:30',
    values_yaml: `master:\n  configuration: |\n    maxmemory-policy allkeys-lru\n  resources:\n    requests:\n      cpu: 500m\n      memory: 2Gi\n  persistence:\n    size: 15Gi`
  },
  {
    id: 'db-3',
    name: 'clickhouse-analytics-v1',
    engine_type: 'clickhouse',
    version: '24.1',
    status: 'running',
    cluster_name: 'lenovo-prod-k8s',
    namespace: 'analytics',
    cpu_usage_m: 1850,
    memory_usage_mb: 7800,
    storage_gb: 250,
    monthly_cost: 182.00,
    created_at: '2026-08-14 09:00',
    values_yaml: `clickhouse:\n  profiles:\n    default/max_threads: "8"\n  resources:\n    requests:\n      cpu: 4000m\n      memory: 16Gi\n  persistence:\n    size: 250Gi`
  }
];

export const CLOUD_CREDENTIALS: CloudCredential[] = [
  {
    id: 'cred-1',
    name: 'AWS Primary Production Account',
    provider: 'aws',
    account_id: 'AKIAIOSFODNN7EXAMPLE',
    created_at: '2026-08-01',
    status: 'active',
    aws_access_key_id: 'AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  },
  {
    id: 'cred-2',
    name: 'Azure Enterprise Production Tenant',
    provider: 'azure',
    account_id: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    created_at: '2026-08-03',
    status: 'active',
    azure_tenant_id: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    azure_client_id: 'e2b34a12-8921-4a1b-9f12-321049210214',
    azure_client_secret: 'secret_azure_token_sample',
    azure_subscription_id: 'sub_9012384910239102'
  },
  {
    id: 'cred-3',
    name: 'DigitalOcean Kubernetes Token',
    provider: 'digitalocean',
    account_id: 'do_pat_81923891029102938102',
    created_at: '2026-08-05',
    status: 'active',
    do_personal_access_token: 'dop_v1_819238910291029381023910239'
  },
  {
    id: 'cred-4',
    name: 'GCP Analytics Cloud Project',
    provider: 'gcp',
    account_id: 'gcp-db-idp-prod-2026',
    created_at: '2026-08-11',
    status: 'active'
  }
];

export const K8S_CLUSTERS: K8sCluster[] = [
  {
    id: 'cls-1',
    name: 'onprem-prod-k8s',
    provider: 'On-Premise',
    region: 'EU-Central (Local)',
    nodes_count: 5,
    status: 'active',
    api_url: 'https://192.168.1.50:6443'
  },
  {
    id: 'cls-2',
    name: 'aws-eks-us-east',
    provider: 'AWS EKS',
    region: 'us-east-1 (N. Virginia)',
    nodes_count: 8,
    status: 'active',
    api_url: 'https://eks.us-east-1.amazonaws.com'
  },
  {
    id: 'cls-3',
    name: 'azure-aks-prod',
    provider: 'Azure AKS',
    region: 'westeurope (Amsterdam)',
    nodes_count: 4,
    status: 'active',
    api_url: 'https://aks.westeurope.azure.com'
  },
  {
    id: 'cls-4',
    name: 'doks-staging-cluster',
    provider: 'DigitalOcean',
    region: 'AMS3 (Amsterdam)',
    nodes_count: 3,
    status: 'active',
    api_url: 'https://doks.digitalocean.com'
  },
  {
    id: 'cls-5',
    name: 'gcp-gke-prod-cluster',
    provider: 'GCP GKE',
    region: 'us-central1 (Iowa)',
    nodes_count: 6,
    status: 'active',
    api_url: 'https://container.googleapis.com'
  }
];

export const METRICS_SAMPLE: DatabaseMetrics = {
  db_id: 'db-1',
  cpu_usage: [15, 22, 18, 45, 32, 28, 40, 55, 30, 25, 20, 18],
  memory_usage: [45, 48, 52, 55, 58, 62, 60, 64, 65, 68, 66, 64],
  disk_io: [120, 150, 210, 450, 320, 180, 240, 310, 290, 190, 160, 140],
  active_connections: [14, 18, 25, 42, 38, 30, 45, 52, 48, 35, 28, 22],
  qps: [850, 920, 1100, 2400, 1800, 1400, 1950, 2200, 1750, 1300, 1050, 980],
  cache_hit_ratio: [98.2, 98.5, 97.9, 99.1, 98.8, 98.4, 99.0, 98.7, 98.9, 99.2, 98.6, 98.9],
  slow_queries_duration: [12, 8, 45, 120, 85, 30, 60, 95, 40, 15, 10, 5]
};
