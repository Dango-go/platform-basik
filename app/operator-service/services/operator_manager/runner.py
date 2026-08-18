import logging
from typing import Dict, Any
from kubernetes_asyncio import client
from kubernetes_asyncio.client.rest import ApiException

logger = logging.getLogger(__name__)


class CRDRunner:
    @staticmethod
    async def apply_custom_object(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        plural: str,
        name: str,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
 
        custom_api = client.CustomObjectsApi(api_client)

        try:
            logger.info("Creating CRD object %s/%s in namespace %s", group, name, namespace)
            result = await custom_api.create_namespaced_custom_object(
                group=group,  
                version=version,
                namespace=namespace,
                plural=plural,
                body=body,
            )
            return result
        except ApiException as e:
            if e.status == 409:

                logger.info("CRD object %s already exists. Patching...", name)
                result = await custom_api.patch_namespaced_custom_object(
                    group=group,  
                    version=version,  
                    namespace=namespace,
                    plural=plural,
                    name=name,
                    body=body,
                )
                return result
            logger.error("ApiException during CRD apply: %s", e)
            raise e

    @staticmethod
    async def get_custom_object(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        custom_api = client.CustomObjectsApi(api_client)
        return await custom_api.get_namespaced_custom_object(
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            name=name,
        )

    @staticmethod
    async def delete_custom_object(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        custom_api = client.CustomObjectsApi(api_client)
        return await custom_api.delete_namespaced_custom_object(
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            name=name,
        )
