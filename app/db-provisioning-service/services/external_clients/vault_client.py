import httpx
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class VaultServiceClient:

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "VAULT_SERVICE_URL", "http://localhost:8000")

    async def get_k8s_credentials(self, cluster_id: str) -> Dict[str, Any]:
        """Fetches decrypted k8s credentials from vault-service by cluster_id."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/v1/vault/k8s/{cluster_id}")
                if response.status_code == 200:
                    return response.json()
            except Exception as exc:
                logger.warning("Failed to fetch k8s credentials from vault-service: %s", str(exc))

        return {
            "api_server_url": getattr(settings, "KUBERNETES_API_URL", "https://kubernetes.default.svc"),
            "bare_token": getattr(settings, "KUBERNETES_AUTH_TOKEN", "default-token")
        }
