import logging
from typing import Dict, Any
from kubernetes_asyncio.client.rest import ApiException
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

        kube_client = client.CustomObjectsApi(api_client)

        try:
            logger.info("Creating CRD object %s/%s in namespace %s", group, name, namespace)
            # CREATE
            result = await kube_client.create_namespaced_custom_object(
                group=group,
                version=version,
                namespace=namespace,
                plural=plural,
                body=body,
            )
            return result
        except ApiException as e:
            if e.status == 409:  # if exists -> patch
                logger.info("CRD object %s already exists. Patching...", name)
                # PATCH
                result = await kube_client.patch_namespaced_custom_object(
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
    async def get(
        api_client: client.ApiClient,
        group: str,
        version: str,
        namespace: str,
        kind: str,
        plural: str,
        name: str,
    ) -> Dict[str, Any]:
        kube_client = client.CustomObjectsApi(api_client)
        result = await kube_client.get_namespaced_custom_object(
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            name=name,
        )
        return result

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
        kube_client = client.CustomObjectsApi(api_client)
        return await kube_client.delete_namespaced_custom_object(
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            name=name,
        )
