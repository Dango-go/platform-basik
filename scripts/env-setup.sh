#!/usr/bin/env bash
# ==============================================================================
# IDP PLATFORM INTERACTIVE ENVIRONMENT SETUP SCRIPT
# Usage: source ./scripts/env-setup.sh  (to export directly into active shell)
#    or: ./scripts/env-setup.sh         (to generate .env file)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

echo "========================================================"
echo "IDP Platform Interactive Environment Setup"
echo "Press [ENTER] to accept the default value shown in brackets"
echo "========================================================"

# 1. DOCKER & CLOUD
read -p "🔹 Enter Docker Hub Username [bodya123]: " IN_DOCKERHUB_USERNAME  # stdin (read -p)
DOCKERHUB_USERNAME=${IN_DOCKERHUB_USERNAME:-bodya123}

read -p "🔹 Enter GCP Project ID [coredb-idp]: " IN_GCP_PROJECT_ID
GCP_PROJECT_ID=${IN_GCP_PROJECT_ID:-coredb-idp}

read -p "🔹 Enter GCP Region [europe-west3]: " IN_GCP_REGION
GCP_REGION=${IN_GCP_REGION:-europe-west3}

# 2. POSTGRESQL DATABASE
read -p "🔹 Enter Postgres Host [postgres]: " IN_POSTGRES_HOST
POSTGRES_HOST=${IN_POSTGRES_HOST:-postgres}

read -p "🔹 Enter Postgres Port [5432]: " IN_POSTGRES_PORT
POSTGRES_PORT=${IN_POSTGRES_PORT:-5432}

read -p "🔹 Enter Postgres User [bohdan-root]: " IN_POSTGRES_USER
POSTGRES_USER=${IN_POSTGRES_USER:-bohdan-root}

read -s -p "🔹 Enter Postgres Password [bohdan-key]: " IN_POSTGRES_PASSWORD
echo ""
POSTGRES_PASSWORD=${IN_POSTGRES_PASSWORD:-bohdan-key}

read -p "🔹 Enter Postgres DB Name [idp_platform]: " IN_POSTGRES_DB
POSTGRES_DB=${IN_POSTGRES_DB:-idp_platform}

# 3. JWT & SECURITY
JWT_KEY=$(openssl rand -hex 32 2>/dev/null || echo "super-secret-jwt-key-change-in-production-2026")
read -p "🔹 Enter JWT Secret Key [auto-generated]: " IN_JWT_KEY
JWT_SECRET_KEY=${IN_JWT_KEY:-$JWT_KEY}

echo "========================================================"
echo "Writing configurations to $ENV_FILE ..."

# Write .env file
cat <<EOF > "$ENV_FILE"
# ========================================================
# DOCKER & CLOUD SETTINGS
# ========================================================
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME}
GCP_PROJECT_ID=${GCP_PROJECT_ID}
GCP_REGION=${GCP_REGION}

# ========================================================
# 🗄️ PRIMARY PLATFORM DATABASE (POSTGRESQL)
# ========================================================
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# ========================================================
# AUTH & VAULT SECURITY SETTINGS
# ========================================================
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
VAULT_ADDR=http://vault-service:8000
VAULT_MASTER_KEY=idp_transit_master_encryption_key_2026

# ========================================================
# MICROSERVICES PORTS & INTERNAL URLs
# ========================================================
AUTH_SERVICE_URL=http://auth-service:8001
PROVISIONING_SERVICE_URL=http://db-provisioning-service:8002
HELM_DEPLOYER_URL=http://helm-deployer:8003
COST_SERVICE_URL=http://cost-management-service:8004
OPERATOR_SERVICE_URL=http://operator-service:8005
DISCOVERY_SERVICE_URL=http://discovery-service:8007
INFO_SERVICE_URL=http://db-info-service:8008
PROVIDER_SERVICE_URL=http://provider-service:8009
EOF

# Export variables to current shell session
set -a
source "$ENV_FILE"
set +a

echo "File .env successfully created and configured!"
echo "All environment variables exported!"
echo "========================================================"
