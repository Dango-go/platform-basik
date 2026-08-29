import logging
from kubernetes_asyncio import client
from typing import Optional

logger = logging.getLogger(__name__)


class K8sClientFactory:

    @staticmethod
    def create_client(
        api_server_url: str, 
        auth_token: str,
        verify_ssl: bool = False,
        ssl_ca_cert: Optional[str] = None,
    ) -> client.ApiClient:
        configuration = client.Configuration()
        configuration.host = api_server_url
        configuration.api_key = {"authorization": f"Bearer {auth_token}"}
        configuration.verify_ssl = verify_ssl
        if ssl_ca_cert:
            configuration.ssl_ca_cert = ssl_ca_cert
        return client.ApiClient(configuration=configuration)