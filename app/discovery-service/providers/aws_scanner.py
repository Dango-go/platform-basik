import json
import aioboto3
from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from botocore.exceptions import ClientError


class AWSClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        access_key = credentials.get("aws_access_key_id") or credentials.get("access_key_id") or credentials.get("access_key")
        secret_key = credentials.get("aws_secret_access_key") or credentials.get("secret_access_key") or credentials.get("secret_key")

        cred_region = credentials.get("aws_region") or credentials.get("region")
        target_region = (region if region and str(region).strip() else None) or (cred_region if cred_region and str(cred_region).strip() else None) or "us-east-1"

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
                    clean_raw = json.loads(json.dumps(c_data, default=str))
                    clusters_data.append({
                        "name": c_data.get("name"),
                        "region": target_region,
                        "version": c_data.get("version"),
                        "status": c_data.get("status", "ACTIVE").lower(),
                        "endpoint": c_data.get("endpoint"),
                        "raw": clean_raw
                    })
        except Exception as e:
            raise RuntimeError(f"AWS EKS discovery error in region '{target_region}': {str(e)}")

        return clusters_data
