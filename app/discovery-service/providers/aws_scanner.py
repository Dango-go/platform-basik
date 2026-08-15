import aioboto3
from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from botocore.exceptions import ClientError


class AWSClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        access_key = credentials.get("aws_access_key_id")
        secret_key = credentials.get("aws_secret_access_key")
        target_region = region or credentials.get("aws_region", "us-east-1")

        session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=target_region
        )

        clusters_data = []
        try:
            async with session.client("eks") as eks_client:
                response = await eks_client.list_clusters()  # in response we get json from aws with key "clusters" and value is list of cluster names
                cluster_names = response.get("clusters", []) # get only list of clusters from key "clusters"

                for name in cluster_names:
                    cluster_info = await eks_client.describe_cluster(name=name) # name - embedded arg
                    c_data = cluster_info.get("cluster", {}) # dict data
                    clusters_data.append({
                        "name": c_data.get("name"),
                        "region": target_region,
                        "version": c_data.get("version"),
                        "status": c_data.get("status", "ACTIVE").lower(),
                        "endpoint": c_data.get("endpoint"),
                        "raw": c_data
                    })
        except ClientError as e:
            raise RuntimeError(f"AWS EKS discovery error: {str(e)}")

        return clusters_data
