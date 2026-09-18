import json
import base64
import aioboto3
from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from botocore.exceptions import ClientError
from botocore.session import get_session
from botocore.credentials import Credentials
from botocore.signers import RequestSigner


def generate_eks_token(cluster_name: str, access_key: str, secret_key: str, region: str, session_token: str = None) -> str:
    """Generate AWS EKS Bearer token via STS GetCallerIdentity presigned URL."""
    credentials = Credentials(
        access_key=access_key,
        secret_key=secret_key,
        token=session_token
    )
    session = get_session()
    signer = RequestSigner(
        service_id='sts',
        region_name=region,
        signing_name='sts',
        signature_version='v4',
        credentials=credentials,
        event_emitter=session.get_component('event_emitter')
    )
    request_params = {
        'method': 'GET',
        'url': f'https://sts.{region}.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15',
        'body': {},
        'headers': {
            'x-k8s-aws-id': cluster_name
        },
        'context': {}
    }
    # cryptographic signing
    signed_url = signer.generate_presigned_url(
        request_dict=request_params,
        expires_in=60,
        operation_name='GetCallerIdentity'
    )
    base64_url = base64.urlsafe_b64encode(signed_url.encode('utf-8')).decode('utf-8').rstrip('=')
    return f"k8s-aws-v1.{base64_url}"


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


    async def creation_token(self, cloud_creds: dict, cluster_name: str) -> str:
        access_key = cloud_creds.get("aws_access_key_id") or cloud_creds.get("access_key_id") or cloud_creds.get("access_key")
        secret_key = cloud_creds.get("aws_secret_access_key") or cloud_creds.get("secret_access_key") or cloud_creds.get("secret_key")
        region = cloud_creds.get("aws_region") or cloud_creds.get("region") or "us-east-1"
        session_token = cloud_creds.get("aws_session_token")

        if not access_key or not secret_key:
            raise ValueError("AWS Access Key and Secret Key required for token creating.")


        token = generate_eks_token(
            cluster_name=cluster_name,
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            session_token=session_token
        )
        return token

    

            
