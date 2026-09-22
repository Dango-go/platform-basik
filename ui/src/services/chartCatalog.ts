export type DistributionType = 'operator' | 'helm_chart';

export interface ChartCatalogPackage {
  id: string;
  engine_type: string;
  name: string;
  publisher: string;
  package_type: DistributionType;
  chart_repo_url: string;
  chart_name: string;
  default_version: string;
  app_version: string;
  category: 'relational' | 'nosql' | 'inmemory' | 'vector' | 'timeseries';
  description: string;
  tags: string[];
  icon_url: string;
  recommended_for_prod: boolean;
  default_values_yaml: string;
  default_crd_manifest: string;
}

export const CHART_CATALOG_PACKAGES: ChartCatalogPackage[] = [
  // ==========================================
  // POSTGRESQL
  // ==========================================
  {
    id: 'cnpg-postgresql',
    engine_type: 'postgresql',
    name: 'CloudNativePG (CNPG) Operator',
    publisher: 'CloudNativePG / CNCF',
    package_type: 'operator',
    chart_repo_url: 'https://cloudnative-pg.github.io/charts',
    chart_name: 'cnpg/cloudnative-pg',
    default_version: '0.21.0',
    app_version: '16.2',
    category: 'relational',
    description: 'Kubernetes native operator for PostgreSQL with automated failover, synchronous/asynchronous replication, connection pooling, and Barman PITR backups.',
    tags: ['Operator CRD', 'HA Cluster', 'Auto Failover', 'PITR Backups', 'CNCF'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    recommended_for_prod: true,
    default_values_yaml: `crds:\n  create: true\nmonitoring:\n  podMonitorEnabled: true\nreplicaCount: 1`,
    default_crd_manifest: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: prod-postgres-cnpg
  namespace: databases
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/postgresql:16.2
  storage:
    size: 50Gi
    storageClass: gp3
  postgresql:
    parameters:
      max_connections: "300"
      shared_buffers: "2GB"
      work_mem: "16MB"
  backup:
    barmanObjectStore:
      destinationPath: s3://db-backups/postgres
  monitoring:
    enablePodMonitor: true`
  },
  {
    id: 'zalando-postgres',
    engine_type: 'postgresql',
    name: 'Zalando Postgres Operator',
    publisher: 'Zalando Open Source',
    package_type: 'operator',
    chart_repo_url: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator',
    chart_name: 'postgres-operator/postgres-operator',
    default_version: '1.11.0',
    app_version: '16.0',
    category: 'relational',
    description: 'Feature-rich Patroni-based PostgreSQL Operator managing HA clusters with logical backups and Spilo Docker images.',
    tags: ['Operator CRD', 'Patroni HA', 'Spilo', 'Enterprise Ready'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    recommended_for_prod: true,
    default_values_yaml: `configKubernetes:\n  enable_pod_disruption_budget: true\n  storage_resize_mode: "pvc"`,
    default_crd_manifest: `apiVersion: "acid.zalan.do/v1"
kind: postgresql
metadata:
  name: acid-minimal-cluster
  namespace: databases
spec:
  teamId: "acid"
  volume:
    size: 50Gi
  numberOfInstances: 2
  users:
    zalando:
      - superuser
      - createdb
  databases:
    app_db: zalando
  postgresql:
    version: "16"`
  },
  {
    id: 'bitnami-postgresql',
    engine_type: 'postgresql',
    name: 'Bitnami PostgreSQL Standalone / Replicas',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/postgresql',
    default_version: '15.5.2',
    app_version: '16.2.0',
    category: 'relational',
    description: 'Standard packaged Helm chart for rapid single-node or Primary/Read-Replica deployment without custom operators.',
    tags: ['Standalone Chart', 'Bitnami', 'Quick Deploy', 'StatefulSet'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png',
    recommended_for_prod: false,
    default_values_yaml: `global:\n  postgresql:\n    auth:\n      postgresPassword: "DB_ADMIN_PASSWORD"\n      database: "appdb"\nprimary:\n  persistence:\n    enabled: true\n    size: 50Gi\n  resources:\n    requests:\n      cpu: 1000m\n      memory: 4Gi\n    limits:\n      cpu: 2000m\n      memory: 8Gi\nreadReplicas:\n  replicaCount: 2`,
    default_crd_manifest: ``
  },

  // ==========================================
  // REDIS
  // ==========================================
  {
    id: 'opstree-redis',
    engine_type: 'redis',
    name: 'Opstree Redis Operator (OT-Container-Kit)',
    publisher: 'OT-CONTAINER-KIT',
    package_type: 'operator',
    chart_repo_url: 'https://ot-container-kit.github.io/helm-charts',
    chart_name: 'ot-container-kit/redis-operator',
    default_version: '0.16.0',
    app_version: '7.2.4',
    category: 'inmemory',
    description: 'Enterprise Kubernetes operator supporting Standalone, Redis Cluster, Sentinel HA, and ACL security configurations.',
    tags: ['Operator CRD', 'Redis Cluster', 'Sentinel HA', 'Prometheus Exporter'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/redis/redis.png',
    recommended_for_prod: true,
    default_values_yaml: `redisOperator:\n  image:\n    tag: v0.16.0`,
    default_crd_manifest: `apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: prod-redis-cluster
  namespace: databases
spec:
  clusterSize: 3
  clusterVersion: v7
  kubernetesConfig:
    image: redis:7.2.4-alpine
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 1000m
        memory: 4Gi
  redisExporter:
    enabled: true`
  },
  {
    id: 'bitnami-redis',
    engine_type: 'redis',
    name: 'Bitnami Redis (Cluster / Sentinel)',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/redis',
    default_version: '19.6.4',
    app_version: '7.2.5',
    category: 'inmemory',
    description: 'High performance in-memory key-value store with Master-Slave replication and optional Redis Sentinel support.',
    tags: ['Standalone Chart', 'In-Memory Cache', 'Sentinel Ready', 'Bitnami'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/redis/redis.png',
    recommended_for_prod: false,
    default_values_yaml: `architecture: replication\nauth:\n  enabled: true\n  password: "REDIS_SECURE_AUTH"\nmaster:\n  persistence:\n    enabled: true\n    size: 20Gi\nreplica:\n  replicaCount: 2`,
    default_crd_manifest: ``
  },

  // ==========================================
  // CLICKHOUSE
  // ==========================================
  {
    id: 'altinity-clickhouse',
    engine_type: 'clickhouse',
    name: 'Altinity ClickHouse Operator (CHI)',
    publisher: 'Altinity',
    package_type: 'operator',
    chart_repo_url: 'https://altinity.github.io/clickhouse-operator',
    chart_name: 'altinity/clickhouse-operator',
    default_version: '0.23.5',
    app_version: '24.3.2',
    category: 'relational',
    description: 'Standard production operator for ClickHouse analytical database managing sharded and replicated clusters in Kubernetes.',
    tags: ['Operator CRD', 'OLAP BigData', 'Sharding & Replicas', 'Altinity Official'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/clickhouse/clickhouse.png',
    recommended_for_prod: true,
    default_values_yaml: `operator:\n  resources:\n    limits:\n      cpu: 500m\n      memory: 512Mi`,
    default_crd_manifest: `apiVersion: clickhouse.altinity.com/v1
kind: ClickHouseInstallation
metadata:
  name: prod-clickhouse-cluster
  namespace: databases
spec:
  configuration:
    clusters:
      - name: "analytics-cluster"
        layout:
          shardsCount: 2
          replicasCount: 2
    templates:
      podTemplates:
        - name: clickhouse-v24
          spec:
            containers:
              - name: clickhouse
                image: clickhouse/clickhouse-server:24.3`
  },
  {
    id: 'bitnami-clickhouse',
    engine_type: 'clickhouse',
    name: 'Bitnami ClickHouse Standalone Chart',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/clickhouse',
    default_version: '6.1.4',
    app_version: '24.1.8',
    category: 'relational',
    description: 'Pre-packaged Helm chart for single-node or clustered ClickHouse deployment with Keeper integration.',
    tags: ['Standalone Chart', 'Fast Analytics', 'Bitnami'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/clickhouse/clickhouse.png',
    recommended_for_prod: false,
    default_values_yaml: `shards: 2\nreplicas: 2\npersistence:\n  enabled: true\n  size: 100Gi`,
    default_crd_manifest: ``
  },

  // ==========================================
  // MONGODB
  // ==========================================
  {
    id: 'mongodb-community-operator',
    engine_type: 'mongodb',
    name: 'MongoDB Community Operator',
    publisher: 'MongoDB Inc. / Community',
    package_type: 'operator',
    chart_repo_url: 'https://mongodb.github.io/helm-charts',
    chart_name: 'mongodb/mongodb-community-operator',
    default_version: '0.9.0',
    app_version: '7.0.5',
    category: 'nosql',
    description: 'Official Kubernetes operator by MongoDB for managing Community Edition ReplicaSet clusters and users via CRD.',
    tags: ['Operator CRD', 'ReplicaSet', 'Official MongoDB', 'CRD Security'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    recommended_for_prod: true,
    default_values_yaml: `operator:\n  createOperator: true`,
    default_crd_manifest: `apiVersion: mongodbcommunity.mongodb.com/v1
kind: MongoDBCommunity
metadata:
  name: prod-mongo-cluster
  namespace: databases
spec:
  members: 3
  type: ReplicaSet
  version: "7.0.5"
  security:
    authentication:
      modes: ["SCRAM"]
  statefulSet:
    spec:
      template:
        spec:
          containers:
            - name: mongod
              resources:
                limits:
                  cpu: "2"
                  memory: 4Gi`
  },
  {
    id: 'percona-mongodb-operator',
    engine_type: 'mongodb',
    name: 'Percona Server for MongoDB (PSMDB) Operator',
    publisher: 'Percona',
    package_type: 'operator',
    chart_repo_url: 'https://percona.github.io/percona-helm-charts',
    chart_name: 'percona/psmdb-operator',
    default_version: '1.16.0',
    app_version: '7.0',
    category: 'nosql',
    description: 'Enterprise grade MongoDB operator with automated sharding, point-in-time recovery, and zero license costs.',
    tags: ['Operator CRD', 'Percona Enterprise', 'Sharding Ready', 'Automated Backups'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    recommended_for_prod: true,
    default_values_yaml: `pmm:\n  enabled: false`,
    default_crd_manifest: `apiVersion: psmdb.percona.com/v1-16-0
kind: PerconaServerMongoDB
metadata:
  name: psmdb-cluster
  namespace: databases
spec:
  crVersion: 1.16.0
  image: percona/percona-server-mongodb:7.0.5-4
  replsets:
    - name: rs0
      size: 3
      volumeSpec:
        pvc:
          resources:
            requests:
              storage: 50Gi`
  },
  {
    id: 'bitnami-mongodb',
    engine_type: 'mongodb',
    name: 'Bitnami MongoDB Standalone / ReplicaSet',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mongodb',
    default_version: '15.6.2',
    app_version: '7.0.9',
    category: 'nosql',
    description: 'Standard Helm chart for deploying document database with optional ReplicaSet architecture.',
    tags: ['Standalone Chart', 'Document DB', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
    recommended_for_prod: false,
    default_values_yaml: `architecture: replicaset\nreplicaCount: 3\nauth:\n  rootPassword: "ADMIN_ROOT_PASSWORD"\npersistence:\n  size: 40Gi`,
    default_crd_manifest: ``
  },

  // ==========================================
  // MYSQL & MARIADB
  // ==========================================
  {
    id: 'percona-xtradb-mysql',
    engine_type: 'mysql',
    name: 'Percona XtraDB Cluster (PXC) MySQL Operator',
    publisher: 'Percona',
    package_type: 'operator',
    chart_repo_url: 'https://percona.github.io/percona-helm-charts',
    chart_name: 'percona/pxc-operator',
    default_version: '1.14.0',
    app_version: '8.0.35',
    category: 'relational',
    description: 'Synchronous multi-master MySQL cluster operator with automatic failover, ProxySQL / HAProxy load balancing, and XtraBackup.',
    tags: ['Operator CRD', 'Galera Multi-Master', 'HAProxy / ProxySQL', 'Percona'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    recommended_for_prod: true,
    default_values_yaml: `pxc:\n  size: 3\nhaproxy:\n  enabled: true`,
    default_crd_manifest: `apiVersion: pxc.percona.com/v1-14-0
kind: PerconaXtraDBCluster
metadata:
  name: prod-mysql-pxc
  namespace: databases
spec:
  crVersion: 1.14.0
  pxc:
    size: 3
    image: percona/percona-xtradb-cluster:8.0.35-27.1
    volumeSpec:
      pvc:
        resources:
          requests:
            storage: 50Gi
  haproxy:
    enabled: true
    size: 2`
  },
  {
    id: 'bitnami-mysql',
    engine_type: 'mysql',
    name: 'Bitnami MySQL Enterprise / Primary-Replica',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mysql',
    default_version: '11.1.18',
    app_version: '8.0.36',
    category: 'relational',
    description: 'Packaged MySQL deployment with configurable primary/secondary topology and metrics exporter.',
    tags: ['Standalone Chart', 'Bitnami', 'Primary-Secondary'],
    icon_url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png',
    recommended_for_prod: false,
    default_values_yaml: `architecture: replication\nauth:\n  rootPassword: "DB_ROOT_PASSWORD"\nprimary:\n  persistence:\n    size: 50Gi\nsecondary:\n  replicaCount: 2`,
    default_crd_manifest: ``
  },
  {
    id: 'bitnami-mariadb',
    engine_type: 'mariadb',
    name: 'Bitnami MariaDB Server / Galera',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/mariadb',
    default_version: '19.0.8',
    app_version: '11.2.3',
    category: 'relational',
    description: 'Community fork of MySQL optimized for performance with optional Galera cluster synchronous replication.',
    tags: ['Standalone Chart', 'Galera Ready', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/mariadb/mariadb-icon.svg',
    recommended_for_prod: false,
    default_values_yaml: `auth:\n  rootPassword: "MARIADB_ROOT_PASSWORD"\nprimary:\n  persistence:\n    size: 40Gi`,
    default_crd_manifest: ``
  },

  // ==========================================
  // SCYLLADB & CASSANDRA
  // ==========================================
  {
    id: 'scylla-operator',
    engine_type: 'scylladb',
    name: 'ScyllaDB Kubernetes Operator',
    publisher: 'ScyllaDB Inc.',
    package_type: 'operator',
    chart_repo_url: 'https://operator.scylladb.com/charts',
    chart_name: 'scylla-operator/scylla',
    default_version: '1.12.0',
    app_version: '5.4.0',
    category: 'nosql',
    description: 'C++ Cassandra-compatible NoSQL database operator providing microsecond latency, multi-datacenter replication, and node repair automation.',
    tags: ['Operator CRD', 'Ultra-Low Latency', 'C++ NoSQL', 'ScyllaDB Official'],
    icon_url: '/scylladb.png',
    recommended_for_prod: true,
    default_values_yaml: `operator:\n  replicaCount: 1`,
    default_crd_manifest: `apiVersion: scylla.scylladb.com/v1
kind: ScyllaCluster
metadata:
  name: prod-scylladb
  namespace: databases
spec:
  version: 5.4.0
  datacenter:
    name: us-east-1
    racks:
      - name: rack-a
        members: 3
        storage:
          capacity: 200Gi`
  },
  {
    id: 'bitnami-cassandra',
    engine_type: 'cassandra',
    name: 'Bitnami Apache Cassandra Chart',
    publisher: 'Bitnami / VMware Tanzu',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.bitnami.com/bitnami',
    chart_name: 'bitnami/cassandra',
    default_version: '11.0.3',
    app_version: '4.1.4',
    category: 'nosql',
    description: 'Wide-column distributed NoSQL store for handling petabytes of data across multiple nodes.',
    tags: ['Standalone Chart', 'Wide-Column', 'Bitnami'],
    icon_url: 'https://www.vectorlogo.zone/logos/apache_cassandra/apache_cassandra-icon.svg',
    recommended_for_prod: false,
    default_values_yaml: `replicaCount: 3\npersistence:\n  size: 100Gi\nresources:\n  requests:\n    cpu: 2000m\n    memory: 8Gi`,
    default_crd_manifest: ``
  },

  // ==========================================
  // VECTOR DATABASES
  // ==========================================
  {
    id: 'qdrant-official',
    engine_type: 'qdrant',
    name: 'Qdrant Official Vector Database Chart',
    publisher: 'Qdrant Team',
    package_type: 'helm_chart',
    chart_repo_url: 'https://qdrant.github.io/qdrant-helm',
    chart_name: 'qdrant/qdrant',
    default_version: '0.9.0',
    app_version: '1.8.2',
    category: 'vector',
    description: 'Production vector search engine for AI embeddings with distributed Raft consensus and HNSW indexing.',
    tags: ['Vector Search', 'AI & Embeddings', 'Raft Clustering', 'Official'],
    icon_url: 'https://raw.githubusercontent.com/qdrant/qdrant/master/docs/logo.svg',
    recommended_for_prod: true,
    default_values_yaml: `replicaCount: 3\nconfig:\n  cluster:\n    enabled: true\npersistence:\n  size: 50Gi`,
    default_crd_manifest: ``
  },
  {
    id: 'milvus-operator',
    engine_type: 'milvus',
    name: 'Milvus Operator (Linux Foundation)',
    publisher: 'Milvus / LF AI & Data',
    package_type: 'operator',
    chart_repo_url: 'https://zilliztech.github.io/milvus-operator',
    chart_name: 'milvus-operator/milvus-operator',
    default_version: '0.9.15',
    app_version: '2.3.10',
    category: 'vector',
    description: 'Cloud-native vector database operator capable of scaling to trillions of vectors for LLM and GenAI applications.',
    tags: ['Operator CRD', 'Trillion Vectors', 'LLM / RAG', 'LF AI & Data'],
    icon_url: 'https://raw.githubusercontent.com/milvus-io/milvus/master/assets/milvus_logo.svg',
    recommended_for_prod: true,
    default_values_yaml: `operator:\n  replicaCount: 1`,
    default_crd_manifest: `apiVersion: milvus.io/v1beta1
kind: Milvus
metadata:
  name: prod-milvus-cluster
  namespace: databases
spec:
  mode: cluster
  components:
    image: milvusdb/milvus:v2.3.10`
  },
  {
    id: 'weaviate-official',
    engine_type: 'weaviate',
    name: 'Weaviate Official Helm Chart',
    publisher: 'Weaviate B.V.',
    package_type: 'helm_chart',
    chart_repo_url: 'https://weaviate.github.io/weaviate-helm',
    chart_name: 'weaviate/weaviate',
    default_version: '16.8.6',
    app_version: '1.24.8',
    category: 'vector',
    description: 'Open-source AI-first vector database with hybrid search (BM25 + Dense Vectors) and multi-modal embeddings.',
    tags: ['Vector Search', 'Hybrid Search', 'Multi-Modal', 'AI Ready'],
    icon_url: 'https://raw.githubusercontent.com/weaviate/weaviate/master/docs/assets/weaviate-logo.png',
    recommended_for_prod: true,
    default_values_yaml: `replicas: 3\nstorage:\n  size: 50Gi\nmodules:\n  text2vec-transformers:\n    enabled: false`,
    default_crd_manifest: ``
  },

  // ==========================================
  // IN-MEMORY & TIME-SERIES SPECIALIZED
  // ==========================================
  {
    id: 'dragonfly-official',
    engine_type: 'dragonfly',
    name: 'Dragonfly Operator & High-Throughput In-Memory',
    publisher: 'DragonflyDB Inc.',
    package_type: 'operator',
    chart_repo_url: 'https://dragonflydb.github.io/helm-charts',
    chart_name: 'dragonfly/dragonfly-operator',
    default_version: '1.1.2',
    app_version: '1.16.0',
    category: 'inmemory',
    description: 'Next-generation in-memory data store delivering 25x Redis throughput with multi-threaded share-nothing architecture.',
    tags: ['Operator CRD', '25x Throughput', 'Multi-Threaded', 'Redis Replacement'],
    icon_url: 'https://raw.githubusercontent.com/dragonflydb/dragonfly/main/docs/images/logo-dark.png',
    recommended_for_prod: true,
    default_values_yaml: `dragonfly:\n  replicas: 2\n  resources:\n    requests:\n      cpu: "4"\n      memory: 16Gi`,
    default_crd_manifest: `apiVersion: dragonflydb.io/v1alpha1
kind: Dragonfly
metadata:
  name: prod-dragonfly-store
  namespace: databases
spec:
  replicas: 2
  image: docker.dragonflydb.io/dragonflydb/dragonfly:v1.16.0
  resources:
    requests:
      cpu: 2000m
      memory: 8Gi`
  },
  {
    id: 'timescaledb-official',
    engine_type: 'timescaledb',
    name: 'TimescaleDB Ha Chart',
    publisher: 'Timescale Inc.',
    package_type: 'helm_chart',
    chart_repo_url: 'https://charts.timescale.com',
    chart_name: 'timescale/timescaledb-single',
    default_version: '0.34.0',
    app_version: '2.14.2',
    category: 'timeseries',
    description: 'PostgreSQL engine enhanced with time-series hyper-tables, continuous aggregates, and columnar compression.',
    tags: ['Time-Series SQL', 'Hypertables', 'Compression', 'Timescale Official'],
    icon_url: 'https://www.vectorlogo.zone/logos/timescale/timescale-icon.svg',
    recommended_for_prod: true,
    default_values_yaml: `replicaCount: 2\npersistence:\n  size: 100Gi\npatroni:\n  enabled: true`,
    default_crd_manifest: ``
  }
];
