import logging
from kubernetes_asyncio import client
from typing import Optional
import os
import base64
import tempfile

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
        if ssl_ca_cert and verify_ssl:
            if os.path.exists(ssl_ca_cert):
                configuration.ssl_ca_cert = ssl_ca_cert
            else:
                try:
                    ca_cert_data = ssl_ca_cert
                    if not ca_cert_data.startwith("-----BEGIN"):
                        try:
                            ca_data = base64.b64decode(ssl_ca_cert).decode("utf-8")
                        except Exception as e:
                            logger.error(f"Invalid base64 CA cert: {e}")
                            raise ValueError("Invalid base64 CA cert")
                    
                    tmp_ca = tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".crt")
                    tmp_ca.write(ca_data)
                    tmp_ca.flush()

                    configuration.ssl_ca_cert = tmp_ca.name
                except Exception as e:
                    logger.warning("Failed to parse ca_cert data into temp file: %s", e)

                    configuration.verify_ssl = False
                        
        return client.ApiClient(configuration=configuration)