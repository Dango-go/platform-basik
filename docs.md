# IDP Platform Architecture - Microservices & Infrastructure

## 1. Edge & Gateway
* **`api-gateway`** — Single entry point web gateway (Reverse Proxy / Routing / Rate Limiting) that authenticates and routes requests from UI/CLI to the appropriate microservices.

## 2. Identity & Security
* **`auth-service`** — User management, sessions, roles, and issuance of access JWT tokens.
* **`rbac-service`** — Fine-grained access control and permissions (RBAC/ABAC) for databases, clusters, and environments (Dev/Staging/Prod).
* **`vault-service`** — Secure storage (HashiCorp Vault) for storing cloud API keys and system secrets.
* **`db-credentials-service`** — Automated generation, provision, and rotation of passwords, TLS certificates, and database connection strings.
* **`audit-service`** — Logging and immutable storage of all user actions and system events (Audit Log).

## 3. Cloud & Infrastructure
* **`provider-service`** — Cloud provider integration (AWS, GCP, DigitalOcean), connection verification, and secret forwarding to `vault-service`.
* **`discovery-service`** — Automated scanning and discovery of active Kubernetes clusters in users' clouds.
* **`kubeconfig-manager`** — Dynamic generation and rotation of secure `kubeconfig` files and access tokens for target K8s clusters.
* **`dns-routing-service`** — Dynamic DNS record creation (Route53/Cloudflare/CoreDNS) and network access configuration (Ingress / NetworkPolicy / Service).
* **`resource-quota-service`** — Monitoring and limiting resource consumption (CPU, RAM, Storage, database count) per team and cluster.

## 4. Database Catalog, Provisioning & Day-2
* **`db-catalog-service`** — Catalog of available database types (PostgreSQL, Redis, ClickHouse, MongoDB, etc.), versions, and configuration presets (Small/Medium/Large).
* **`db-provisioning-service`** — Metadata and business logic for the database lifecycle (creation, parameter editing, Day-2 scaling, deletion).
* **`workflow-engine` / `task-worker`** — Asynchronous orchestrator for long-running tasks (DB deployment, backups, restore) supporting retries and rollbacks (Saga pattern).
* **`backup-restore-service`** — Management of backup schedules, snapshots, and data recovery for deployed databases (Point-in-Time Recovery).

## 5. Deployment Engine
* **`chart-service`** — Downloading, caching, validation, and configuration generation (`values.yaml`) for Helm charts.
* **`helm-deployer`** — Execution of atomic Helm commands (install, upgrade, rollback, uninstall) in target Kubernetes clusters.
* **`operator-service`** — Management of Kubernetes Custom Resources (CRD) and integration with database operators (CloudNativePG, KubeDB, Percona Operator, etc.).

## 6. Observability, FinOps & Alerts
* **`metrics-monitoring-service`** — Collection and analysis of performance metrics for deployed databases (CPU, RAM, Disk IOPS, Connections) via Prometheus.
* **`cost-management-service`** — Cost calculation and analytics (FinOps), budget forecasting for maintaining each database in the cloud.
* **`notification-service`** — Centralized dispatch of notifications (Slack, Telegram, Email, Webhooks) regarding deployment statuses, backup failures, resource alerts, or budgets.

---

## Infrastructure Layer
* **Event Bus** *(NATS / RabbitMQ / Kafka)* — Event-driven messaging bus for asynchronous communication between microservices.
* **Vault Storage** *(HashiCorp Vault)* — Encrypted secrets storage.
* **Platform DB** *(PostgreSQL)* — Primary database for the IDP platform's internal metadata.