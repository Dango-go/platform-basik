#!/bin/bash
set -e

#sudo mkfs.ext4
# mdkir /mnt
#sudo mount /dev/xvdh /mnt

echo "📁 Creating directories..."
sudo mkdir -p /mnt/data/vault_data
sudo mkdir -p /mnt/main-data/postgres_data
mkdir -p vault
mkdir -p init-scripts

echo "📝 Generating vault.hcl..."
sudo mkdir -p /mnt/data/vault_data
sudo mkdir -p /mnt/main-data/postgres_data

sudo chmod -R 777 /mnt/data/vault_data

cat << 'EOF' > vault/vault.hcl
storage "file" {
  path = "/vault/main_file"
}
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}
ui = true
disable_mlock = true
EOF


echo "Creating init script for Database..."
cat << 'EOF' > init-scripts/01-init-db.sql
-- Init script for PostgreSQL database
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE provider_db;
CREATE DATABASE provisioning_db;
CREATE DATABASE discovery_db;
CREATE DATABASE vault_db;

CREATE USER auth WITH ENCRYPTED PASSWORD 'auth';
CREATE USER catalog WITH ENCRYPTED PASSWORD 'catalog';
CREATE USER provider WITH ENCRYPTED PASSWORD 'provider';
CREATE USER provisioning WITH ENCRYPTED PASSWORD 'provisioning';
CREATE USER discovery WITH ENCRYPTED PASSWORD 'discovery';
CREATE USER vault WITH ENCRYPTED PASSWORD 'vault';  

-- Provide privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth;
GRANT ALL PRIVILEGES ON DATABASE catalog_db TO catalog;
GRANT ALL PRIVILEGES ON DATABASE provider_db TO provider;
GRANT ALL PRIVILEGES ON DATABASE provisioning_db TO provisioning;
GRANT ALL PRIVILEGES ON DATABASE discovery_db TO discovery;
GRANT ALL PRIVILEGES ON DATABASE vault_db TO vault;

\c auth_db
GRANT ALL ON SCHEMA public TO auth;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auth;

\c catalog_db
GRANT ALL ON SCHEMA public TO catalog;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO catalog;

\c provider_db
GRANT ALL ON SCHEMA public TO provider;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO provider;

\c provisioning_db
GRANT ALL ON SCHEMA public TO provisioning;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO provisioning;

\c discovery_db
GRANT ALL ON SCHEMA public TO discovery;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO discovery;

\c vault_db
GRANT ALL ON SCHEMA public TO vault;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vault;
EOF




echo "📝 Generate docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: idp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: root
      POSTGRES_DB: root
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - /mnt/main-data/postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U root -d root"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - idp-network
    depends_on:
      vault-client:
        condition: service_started

  vault-service:
    image: ${DOCKERHUB_USERNAME}/vault-service:latest
    container_name: idp-vault-service
    restart: unless-stopped
    ports:
      - "8000:8001"
    environment:
      - PORT=8001
      - DATABASE_URL=postgresql+asyncpg://admin:vault@postgres:5432/vault_db
      - VAULT_MASTER_KEY=${VAULT_MASTER_KEY:-idp_transit_master_encryption_key_2026}
    depends_on:
      postgres:
        condition: service_started
      vault-client:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  auth-service:
    image: ${DOCKERHUB_USERNAME}/auth-service:latest
    container_name: idp-auth-service
    restart: unless-stopped
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_started
      vault-client:
        condition: service_started
      vault-service:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  db-provisioning-service:
    image: ${DOCKERHUB_USERNAME}/provisioner-service:latest
    container_name: idp-db-provisioning-service
    restart: unless-stopped
    ports:
      - "8002:8001"
    depends_on:
      postgres:
        condition: service_started
      vault-client:
        condition: service_started
      vault-service:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  helm-deployer:
    image: ${DOCKERHUB_USERNAME}/helm-service:latest
    container_name: idp-helm-deployer
    restart: unless-stopped
    ports:
      - "8003:8001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  cost-management-service:
    image: ${DOCKERHUB_USERNAME}/cost-service:latest
    container_name: idp-cost-management-service
    restart: unless-stopped
    ports:
      - "8004:8001"
    depends_on:
      postgres:
        condition: service_started
      vault-client:
        condition: service_started
      vault-service:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  operator-service:
    image: ${DOCKERHUB_USERNAME}/operator-service:latest
    container_name: idp-operator-service
    restart: unless-stopped
    ports:
      - "8005:8001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  discovery-service:
    image: ${DOCKERHUB_USERNAME}/discovery-service:latest
    container_name: idp-discovery-service
    restart: unless-stopped
    ports:
      - "8007:8001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  db-info-service:
    image: ${DOCKERHUB_USERNAME}/info-service:latest
    container_name: idp-db-info-service
    restart: unless-stopped
    ports:
      - "8008:8001"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  provider-service:
    image: ${DOCKERHUB_USERNAME}/provider-service:latest
    container_name: idp-provider-service
    restart: unless-stopped
    ports:
      - "8009:8001"
    depends_on:
      postgres:
        condition: service_started
      vault-client:
        condition: service_started
      vault-service:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  ui:
    image: ${DOCKERHUB_USERNAME}/ui-service:latest
    container_name: idp-ui
    restart: unless-stopped
    ports:
      - "3000:80"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - idp-network

  vault-client:
    image: hashicorp/vault:1.13.3
    container_name: idp-vault-client
    restart: unless-stopped
    ports:
      - "8200:8200"
    volumes:
      - /mnt/data/vault_data:/vault/main_file
      - ./vault/vault.hcl:/vault/vault.hcl
    command: "server -config=/vault/vault.hcl"
    cap_add:
      - IPC_LOCK
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:8200/v1/sys/health"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - idp-network

volumes:
  postgres_data:
    driver: local
  vault_data:
    driver: local

networks:
  idp-network:
    driver: bridge
    name: idp-network
EOF


echo "🚀 Start Docker Compose..."
docker compose up -d


echo "⏳ Waiting for Vault to start on http://127.0.0.1:8200..."
until curl -s http://127.0.0.1:8200/v1/sys/health > /dev/null; do
    sleep 1
done

echo "🔍 Checking if Vault is initialized..."
# check init on /v1/sys/init
INIT_RESPONSE=$(curl -s http://127.0.0.1:8200/v1/sys/init)
IS_INIT=$(echo "$INIT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('initialized', False))")

# init vault and save keys
if [ "$IS_INIT" = "False" ]; then
    echo "⚙️ Initializing Vault..."
    INIT_RES=$(curl -s -X POST http://127.0.0.1:8200/v1/sys/init \
      -H "Content-Type: application/json" \
      -d '{"secret_shares": 1, "secret_threshold": 1}')
    
    echo "$INIT_RES" > /mnt/data/vault_data/init-keys.json

    UNSEAL_KEY=$(echo "$INIT_RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['keys_base64'][0])")
    ROOT_TOKEN=$(echo "$INIT_RES" | python3 -c "import sys, json; print(json.load(sys.stdin)['root_token'])")

    # unseal vault
    echo "🔓 Unsealing Vault..."
    curl -s -X POST http://127.0.0.1:8200/v1/sys/unseal \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"$UNSEAL_KEY\"}" > /dev/null

    echo "🔑 Enabling Transit secrets engine..."
    curl -s -X POST http://127.0.0.1:8200/v1/sys/mounts/transit \
      -H "Content-Type: application/json" \
      -H "X-Vault-Token: $ROOT_TOKEN" \
      -d '{"type": "transit"}' > /dev/null

    echo "📦 Creating 'cloud-keys' encryption key..."
    curl -s -X POST http://127.0.0.1:8200/v1/transit/keys/cloud-keys \
      -H "Content-Type: application/json" \
      -H "X-Vault-Token: $ROOT_TOKEN" \
      -d '{}' > /dev/null

  # custom token for vault service
    echo "🔑 Creating custom token for services..."
    curl -s -X POST http://127.0.0.1:8200/v1/auth/token/create \
      -H "Content-Type: application/json" \
      -H "X-Vault-Token: $ROOT_TOKEN" \
      -d '{"id": "personal-hvactoken-051", "policies": ["root"]}' > /dev/null

    echo "✅ Vault successfully initialized and configured!"
else
    echo "ℹ️ Vault is already initialized. Unsealing..."
    if [ -f "/mnt/data/vault_data/init-keys.json" ]; then
        UNSEAL_KEY=$(python3 -c "import json; data = json.load(open('/mnt/data/vault_data/init-keys.json')); print(data['keys_base64'][0])")
        curl -s -X POST http://127.0.0.1:8200/v1/sys/unseal \
          -H "Content-Type: application/json" \
          -d "{\"key\": \"$UNSEAL_KEY\"}" > /dev/null
        echo "✅ Vault unsealed successfully!"
    fi
fi

echo "✅ System is fully deployed and initialized!"



echo "✅ System is deploying and initializing..."