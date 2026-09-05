from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.db_models import ClusterEntity
from api.v1.schemas import DiscoveryRequest
from providers.aws_scanner import AWSClusterScanner
from providers.gcp_scanner import GCPClusterScanner
from providers.digitalocean_scanner import DigitalOceanClusterScanner
from services.cache_service import cache_service
import httpx
from config import settings


class ClusterScannerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scanners = {
            "aws": AWSClusterScanner(),
            "gcp": GCPClusterScanner(),
            "digitalocean": DigitalOceanClusterScanner(),
            "do": DigitalOceanClusterScanner(),
        }

    # Fetch official provider_type from provider-service DB by alias
    async def fetch_provider_type(self, alias: str, user_id: int = 1) -> Optional[str]:
        url = f"{settings.PROVIDER_SERVICE_URL}/api/v1/provider/credentials/{alias}?user_id={user_id}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("provider_type")
            except httpx.RequestError:
                pass
        return None

    # def for get creds from vault service 
    async def fetch_credentials_from_vault(self, alias: str) -> Dict[str, Any]:
        url = f"{settings.VAULT_SERVICE_URL}/api/v1/cloud-sa-creds/{alias}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("credentials", {})
            except httpx.RequestError:
                pass
        return {}


    async def discover_and_save(self, request: DiscoveryRequest) -> List[ClusterEntity]:
        cache_key = f"{request.user_id}:{request.alias}"  # 'uid:cred-alias'
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        # Authoritatively fetch provider_type from provider-service DB if not provided or to verify
        official_provider_type = await self.fetch_provider_type(request.alias, request.user_id)
        provider_type = (official_provider_type or request.provider_type or "gcp").lower()

        scanner = self.scanners.get(provider_type)
        if not scanner:
            raise ValueError(f"Unsupported provider: {provider_type}")

        # get credentials from vault service
        creds = await self.fetch_credentials_from_vault(request.alias)
        if not creds:
            return []

        # SCANNING clusters with creds and region
        try:
            found_clusters = await scanner.scan_clusters(creds, region=request.region)
        except Exception as e:
            logger.error(f"Cluster scan failed for alias '{request.alias}': {e}")
            found_clusters = []


        saved_entities = []
        for c in found_clusters:
            existing = await self.db.execute(
                select(ClusterEntity).where(
                    ClusterEntity.user_id == request.user_id,
                    ClusterEntity.provider_alias == request.alias,
                    ClusterEntity.cluster_name == c["name"]
                )
            )
            entity = existing.scalars().first()

            if entity:
                entity.region = c["region"]
                entity.k8s_version = c.get("version")
                entity.status = c.get("status", "active")
                entity.endpoint = c.get("endpoint")
                entity.raw_data = c.get("raw")
            else:
                entity = ClusterEntity(
                    user_id=request.user_id,
                    provider_type=provider_type,
                    provider_alias=request.alias,
                    cluster_name=c["name"],
                    region=c["region"],
                    k8s_version=c.get("version"),
                    status=c.get("status", "active"),
                    endpoint=c.get("endpoint"),
                    raw_data=c.get("raw")
                )
                self.db.add(entity)

            saved_entities.append(entity)

        await self.db.commit()
        for e in saved_entities:
            await self.db.refresh(e)

        cache_service.set(cache_key, saved_entities)
        return saved_entities # return for saving in ui

    async def get_clusters_by_user(self, user_id: int) -> List[ClusterEntity]:
        result = await self.db.execute(
            select(ClusterEntity).where(ClusterEntity.user_id == user_id)
        )
        return result.scalars().all()
