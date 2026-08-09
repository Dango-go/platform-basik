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

    # def for get creds from vault service 
    async def fetch_credentials_from_vault(self, alias: str) -> Dict[str, Any]:
        url = f"{settings.VAULT_SERVICE_URL}/api/v1/secrets/{alias}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("credentials", {})
            except httpx.RequestError:
                pass
        return {}

    # def for get client json and 
    async def discover_and_save(self, request: DiscoveryRequest) -> List[ClusterEntity]:
        cache_key = f"{request.user_id}:{request.alias}"  # 'uid:cred-alias'
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        # get and create object for cloud scanning
        scanner = self.scanners.get(request.provider_type.lower())
        if not scanner:
            raise ValueError(f"Unsupported provider: {request.provider_type}")

        # get credentials from vault service
        creds = await self.fetch_credentials_from_vault(request.alias)

        # SCANNING clusters with creds and region
        found_clusters = await scanner.scan_clusters(creds, region=request.region)  # return list


        saved_entities = []
        for c in found_clusters:
            entity = ClusterEntity(
                user_id=request.user_id,
                provider_type=request.provider_type,
                provider_alias=request.alias,
                cluster_name=c["name"],
                region=c["region"],
                k8s_version=c.get("version"),
                status=c.get("status", "active"),
                endpoint=c.get("endpoint"),
                raw_data=c.get("raw")
            )
            self.db.add(entity)
            saved_entities.append(entity)  # append - added to list object entity for return after commit

        await self.db.commit()
        for e in saved_entities:
            await self.db.refresh(e)

        cache_service.set(cache_key, saved_entities)
        return saved_entities

    async def get_clusters_by_user(self, user_id: int) -> List[ClusterEntity]:
        result = await self.db.execute(
            select(ClusterEntity).where(ClusterEntity.user_id == user_id)
        )
        return result.scalars().all()
