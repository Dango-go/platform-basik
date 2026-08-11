import logging
from kubernetes_asyncio import client, config
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from db.models.models import ClusterDB

logger = logging.getLogger(__name__)

class K8sClientFactory:
 
    @staticmethod
    def create_client(
        api_server_url: str, 
        auth_token: str,
        verify_ssl: bool = False,
        ssl_ca_cert: Optional[str] = None,
    ):
        config = client.Configuration()  # object 
        config.host = api_server_url
        config.api_key = {"authorization": f"Bearer {auth_token}"}
        config.verify_ssl = verify_ssl
        if ssl_ca_cert:
            config.ssl_ca_cert = ssl_ca_cert
        return client.ApiClient(configuration=config)
    
# Call this method to create a k8s client through the give parameters to create a cluster entity.
    @classmethod
    def create_from_cluster_entity(
        cls,
        cluster: ClusterDB,  # cluster object 
        verify_ssl: bool = False,
    ) -> client.ApiClient:
 
        logger.debug("Creating K8s ApiClient for cluster ID=%s (%s)", cluster.id, cluster.cluster_name)

        return cls.create_client(
            api_server_url=cluster.api_server_url,
            auth_token=cluster.auth_token,
            verify_ssl=verify_ssl,
        )