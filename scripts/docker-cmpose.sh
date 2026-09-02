#!/usr/bin/env bash
set -e

# ========================================================
# 🚀 IDP PLATFORM DEPLOYMENT SCRIPT
# ========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$PROJECT_ROOT/manifests/docker-compose.yml"

echo "========================================================"
echo "🔧 Setting up environment variables..."
echo "========================================================"

# Generate or update .env file if it does not exist
if [ ! -f "$ENV_FILE" ]; then
    echo "📄 Creating default .env file..."
    cat <<EOF > "$ENV_FILE"
# 🐳 Docker Hub Configuration
DOCKERHUB_USERNAME=bodya123

# 🗄️ PostgreSQL Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_pass_2026
POSTGRES_DB=idp_platform

# 🔐 JWT Security Settings
JWT_SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || echo "super-secret-jwt-key-change-in-production-2026")
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF
    echo "✅ .env file successfully created at $ENV_FILE!"
else
    echo "ℹ️ Using existing .env file at $ENV_FILE"
fi

# Export environment variables from .env
set -a
source "$ENV_FILE"
set +a

echo "========================================================"
echo "🚀 Deploying IDP Platform services via Docker Compose..."
echo "========================================================"

if command -v docker-compose &> /dev/null; then
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
else
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
fi

echo "========================================================"
echo "✅ Deployment completed successfully!"
echo "========================================================"