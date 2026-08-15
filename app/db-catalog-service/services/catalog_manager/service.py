from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from services.catalog_manager.repository import CatalogRepository
from models.engine import DatabaseEngineEntity
from models.version import DatabaseVersionEntity


class CatalogService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CatalogRepository(db)

    async def get_catalog(self) -> List[Dict[str, Any]]:
        """Get full list of active database engines for showcase cards."""
        engines = await self.repository.get_all_active_engines()
        result = []
        for engine in engines:
            result.append({
                "id": engine.id,
                "name": engine.name,
                "engine_type": engine.engine_type,
                "category": engine.category,
                "icon_url": engine.icon_url,
                "description": engine.description,
                "versions": [v.version for v in engine.versions if not v.is_deprecated],
                "default_version": next((v.version for v in engine.versions if v.is_default), None)
            })
        return result

    async def get_engine_details(self, engine_type: str) -> Dict[str, Any]:
        """Get engine detail with available versions and resource presets (Small/Medium/Large)."""
        engine = await self.repository.get_engine_details(engine_type)
        return {
            "id": engine.id,
            "name": engine.name,
            "engine_type": engine.engine_type,
            "category": engine.category,
            "icon_url": engine.icon_url,
            "description": engine.description,
            "versions": [
                {
                    "version": v.version,
                    "is_default": v.is_default,
                    "is_deprecated": v.is_deprecated
                } for v in engine.versions
            ],
            "presets": [
                {
                    "preset_name": p.preset_name,
                    "cpu_cores": p.cpu_cores,
                    "ram_gb": p.ram_gb,
                    "storage_gb": p.storage_gb
                } for p in engine.presets
            ],
            "json_schema": engine.schemas[0].json_schema if engine.schemas else {}
        }

    async def get_chart_info(self, engine_type: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Get Helm chart repo URL and chart details for deployer service."""
        version_entity: DatabaseVersionEntity = await self.repository.get_chart_info(engine_type, version)
        return {
            "engine_type": engine_type,
            "version": version_entity.version,
            "helm_repo_url": version_entity.helm_repo_url,
            "chart_name": version_entity.chart_name,
            "chart_version": version_entity.chart_version
        }
