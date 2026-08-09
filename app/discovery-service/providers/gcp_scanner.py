from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from google.cloud import container_v1
from google.oauth2 import service_account


class GCPClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        try:
            creds = service_account.Credentials.from_service_account_info(credentials)
            client = container_v1.ClusterManagerAsyncClient(credentials=creds)

            project_id = credentials.get("project_id")
            location = region or "-"
            parent = f"projects/{project_id}/locations/{location}"

            response = await client.list_clusters(parent=parent)
            clusters_data = []
            for cluster in response.clusters:
                clusters_data.append({
                    "name": cluster.name,
                    "region": cluster.location,
                    "version": cluster.current_master_version,
                    "status": cluster.status.name.lower(),
                    "endpoint": cluster.endpoint,
                    "raw": {"name": cluster.name, "location": cluster.location}
                })
            return clusters_data
        except Exception as e:
            raise RuntimeError(f"GCP GKE discovery error: {str(e)}")
