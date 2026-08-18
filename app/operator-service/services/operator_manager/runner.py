import logging
from typing import Dict, Any
from kubernetes_asyncio.client.rest import ApiException
from kubernetes_asyncio.dynamic import DynamicClient
from kubernetes_asyncio import client

logger = logging.getLogger(__name__)


class CRDRunner:
    @staticmethod
    async def apply(
        api_client: client.ApiClient,
        kind: str, 
        group: str,
        version: str,
        namespace: str,
        plural: str,
        name: str,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
 
        init_api = DynamicClient(api_client)

        api_version = f"{group}/{version}" if group else version

        resource_api =await init_api.resources.get(api_version=api_version, kind=kind, plural=plural)

        try:
            logger.info("Creating CRD object %s/%s in namespace %s", group, name, namespace)
            # CREATE
            result = await resource_api.create(
                body=body,
                namespace=namespace,
            )
            return result
        except ApiException as e:
            if e.status == 409: # if existe -> patch

                logger.info("CRD object %s already exists. Patching...", name)
                # PATCH
                result = await resource_api.patch(
                    namespace=namespace,
                    name=name,
                    body=body,
                )
                return result.to_dict() # -> dict
            logger.error("ApiException during CRD apply: %s", e)
            raise e

    @staticmethod
    async def get(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
         
        init_client = DynamicClient(api_client)
        api_version = f"{group}/{version}" if group else version
 
        resource_api = await init_client.resources.get(api_version=api_version, kind=kind, plural=plural)
        result = await resource_api.get(name=name, namespace=namespace)
        return result.to_dict()

    @staticmethod
    async def delete(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        
        init_client = DynamicClient(api_client)
        api_version = f"{group}/{version}" if group else version
        resource_api = await init_client.resources.get(api_version=api_version, kind=kind, plural=plural)

        return await resource_api.delete(
            name=name,
            namespace=namespace,
        )
