# 🧠 Dango-go Platform / DB IDP — Project Memory & Architecture Context

> **IMPORTANT FOR AGENT**: Read this file at the start of any new session or after IDE re-installation to instantly catch up on the entire platform architecture, microservices state, design rules, and key technical decisions.

---

## 📌 1. General Project Overview

- **Project Name**: Dango-go Platform / Database IDP (Internal Developer Platform).
- **Target Operational Model**: Single-user / Self-hosted / Team IDP.
- **Core Value Proposition**: Automated database provisioning, Day-2 live scaling (CPU, RAM, PVC Storage expansion), runtime parameter tuning (`custom-values.yaml` hot-reload), in-browser K8s web terminal execution, multi-cloud cost forecasting, and multi-cluster Kubernetes orchestration.

---

## 🏗️ 2. Microservices Architecture (`/app`)

### 1. `db-provisioning-service` (`app/db-provisioning-service`) — Port 8002
- **Role**: **Pure Day-2 Management & Lifecycle Service**. Manages metadata, status tracking, Day-2 resource scaling, configuration tuning, stop/start lifecycle, and safe deletion.
- **Storage**: System PostgreSQL (`Platform DB`). Table `database_instances` stores metadata, CPU/RAM/Disk specs, and live `values_yaml` as `TEXT`.
- **Key Models**:
  - `DatabaseInstanceDB` (`models/db_models.py`): `id`, `name`, `engine_type`, `version`, `cluster_id`, `namespace`, `cpu`, `ram`, `disk`, `status`, `chart_name`, `values_yaml` (`Text`).
  - `DeploymentLogDB`: Audit log of scaling, config tuning, stop/start actions.
- **API Endpoints (`api/v1/endpoints/endpoints.py`)**:
  - `GET /api/v1/databases` — Active database instances list.
  - `GET /api/v1/databases/{id}` — Full database instance passport.
  - `PATCH /api/v1/databases/{id}/scale` — Day-2 Live Scaling (`ScaleRequest`: `cpu`, `ram`, `disk`).
  - `PUT /api/v1/databases/{id}/config` — Parameter editing & `custom-values.yaml` hot-reload (`ConfigRequest`).
  - `POST /api/v1/databases/{id}/stop` & `/start` — Pause and resume database instance.
  - `DELETE /api/v1/databases/{id}` — Safe database deletion.

### 2. `helm-deployer` (`app/helm-deployer`) — Port 8003
- **Role**: **Stateless Helm CLI v3 Execution Worker**.
- **System Binary**: `helm v3.21.0` installed on host system PATH.
- **Kubeconfig**: `KubeconfigBuilder.fast_creating(...)` dynamically generates temporary isolated `/tmp/kubeconfigs/kubeconfig_{release_name}.yaml` files with automatic cleanup.
- **API Endpoints (`api/v1/endpoints/endpoints.py`)**:
  - `POST /api/v1/helm/pull` — Pull and unpack Helm chart.
  - `POST /api/v1/helm/template` — Render manifests (Dry run).
  - `POST /api/v1/helm/apply` — Deploy chart using target cluster Kubeconfig credentials.
  - `DELETE /api/v1/helm/release/{release_name}` — Uninstall Helm release.
  - `GET /api/v1/helm/status/{release_name}` — Live release status inspection.

### 3. `operator-service` (`app/operator-service`) — Port 8005
- **Role**: **100% Stateless Kubernetes Operator & Dynamic CRD Manager** (CloudNativePG, Redis Operator, ClickHouse Operator).
- **Architecture**: Completely database-free (Stateless). Uses `K8sClientFactory.create_client(api_server_url, auth_token, ca_cert_data)` on the fly.
- **API Endpoints (`api/v1/endpoints/endpoints.py`)**:
  - `POST /api/v1/operator/apply` — Dynamic CRD manifest apply via `CRDRunner`.
  - `POST /api/v1/operator/status` — Live resource status retrieval.
  - `POST /api/v1/operator/delete` — Dynamic CRD deletion.

### 4. `cost-management-service` (`app/cost-management-service`) — Port 8006
- **Role**: Real-time cost calculation, budget forecasting (30/60/90 days), multi-cloud multipliers (AWS x1.0, GCP x1.05, Azure x1.08, DigitalOcean x0.85, On-Premises x0.50).
- **API Endpoints**: `POST /api/v1/cost/estimate`, `GET /summary`, `GET /instances`, `GET /forecast`, `GET /pricing-matrix`.

---

## 💻 3. Frontend & UI Architecture (`/ui`)

- **Tech Stack**: React, TypeScript, Vite (`npm run dev` on port 3000), Tailwind-style Vanilla CSS utilities, Lucide React icons.
- **Core Navigation & Pages**:
  1. **`DatabasesCatalogPage.tsx`**: Active installed databases list + engine catalog grid (PostgreSQL, Redis, ClickHouse, MongoDB, ScyllaDB, Qdrant, Milvus, Chroma, Weaviate, MySQL, MariaDB, CockroachDB, InfluxDB, TimescaleDB, QuestDB).
  2. **`DatabaseEngineOverviewPage.tsx`**: Engine overview page with 3 tabs:
     - `➕ Provisioning & Overview`: Wizard launcher, container image specs, default ports (`5432`, `6379`, etc.).
     - `📋 Active [Engine] Instances`: Filtered active database list for the selected engine type.
     - `📖 Engine Documentation & Architecture`: Architecture, HA topology, backup strategies.
  3. **`DatabaseManagementCatalogPage.tsx`**: Dedicated Database Management Console (Header: `"Management Database Console"`).
     - **Day-2 Live Scaling Panel**: Exact numeric inputs (`step=0.05` for CPU, `step=0.5` for RAM, `step=5` for Storage) + quick preset buttons + live PATCH status.
     - **Live Config Tuning & custom-values.yaml Terminal Editor**: Dark theme (`#0d1117`) YAML code editor for runtime parameter hot-reload (`PUT /api/v1/databases/{id}/config`).
     - **Supported Extensions & Engine Plugins**: Engine-specific plugins (`pgvector`, `PostGIS`, `RedisJSON`, `ClickHouse Keeper`, etc.).
     - **In-Browser K8s Pod Exec Web Terminal Modal**: Direct command execution on running pods.
  4. **`CreateDatabaseWizardPage.tsx`**:
     - `Database Instance Name (Release name)` input.
     - Password Generation Mode (`Auto-Generated` vs `Custom Password`).
     - `Automatically injected during DB initialization` security badge.

---

## 🔑 4. Key Architectural Rules & Decisions

1. **No Preset Deployment Mode**: Completely removed per user directive.
2. **No Browser Auto-Launch**: Do NOT invoke `browser_subagent` or open browser windows automatically.
3. **No `Select Instance:` Dropdown in Console**: The management console is dedicated to ONE specific database chosen from the running list.
4. **No Mandatory Redis**: Platform relies on native Python `asyncio` & PostgreSQL without adding unnecessary Redis containers.
5. **Helm Chart vs custom-values.yaml Separation**:
   - Official charts (`bitnami/postgresql`) are cached on disk (`/tmp/helm_charts/`) or pulled from Helm OCI registries.
   - Only user configuration overrides (`custom-values.yaml`) are stored in PostgreSQL `values_yaml` (`TEXT` column).

---

## 🚀 5. Compilation & Verification Status

- `helm-deployer`: 100% compiled & tested (`python3 -m py_compile` -> 0 errors).
- `operator-service`: 100% compiled & converted to pure Stateless mode (`python3 -m py_compile` -> 0 errors).
- `cost-management-service`: 100% compiled & ready (`python3 -m py_compile` -> 0 errors).
- `db-provisioning-service`: 100% compiled & updated (`python3 -m py_compile` -> 0 errors).
- `ui`: Vite production build passed cleanly (`npm run build` -> 0 errors).

---

*File generated automatically for session persistence across IDE reinstallations.*
