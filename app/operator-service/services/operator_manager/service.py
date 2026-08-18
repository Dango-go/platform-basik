from core.dependencies import db_session
from services.operator_manager.validator import Validator
from services.operator_manager.crd_manager import BuilderCRD
from services.operator_manager.runner import CRDRunner
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any 
from services.k8s.client_factory import K8sClientFactory


logger = logging.getLogger(__name__)

class ServiceYAMLManager:
    def __init__(self, db: AsyncSession = Depends(db_session)):
        self.validator = Validator()
        self.builder = BuilderCRD()
        self.runner = CRDRunner()
        self.db = db

    async def apply_manifest(
        self,
        cluster_id: str,
        resource_name: str,
        target_namespace: str,
        content: str | Dict[str, Any]    
    ):

        cluster = await self.db.get(ClusterDB, cluster_id)

        name = self.validator.validate_name(resource_name)
        namespace = self.validator.validate_namespace(target_namespace)
        
        if isinstance(content, str):
            manifest = self.builder.parse_yaml(content)
        else:
            manifest = content

        group, version, kind, plural = self.builder.extract_gvk(manifest)

        api_net_client = K8sClientFactory.create_from_cluster_entity(cluster)

        return await self.runner.apply(
            api_client=api_net_client,
            kind=kind,
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            name=name,
            body=manifest,
        )

 
    async def get_resource_status(        
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ):
        name = self.validator.validate_name(name)
        namespace = self.validator.validate_namespace(namespace)

        return await self.runner.get(
            api_client=api_client,
            group=group,
            version=version,
            namespace=namespace,
            kind=kind,
            plural=plural,
            name=name,
        )



    async def delete_manifest(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ):
        name = self.validator.validate_name(name)
        namespace = self.validator.validate_namespace(namespace)

        return await self.runner.delete(
            api_client=api_client,
            group=group,
            version=version,
            namespace=namespace,
            kind=kind,
            plural=plural,
            name=name,
        )
