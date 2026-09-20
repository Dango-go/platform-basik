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
    session = get_session()
    client = session.create_client(
        'sts',
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token
    )
    signer = client._request_signer
    request_params = {
        'method': 'GET',
        'url': f'https://sts.{region}.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15',  # REST API of server AWS STS
        'body': {},
        'headers': {
            'x-k8s-aws-id': cluster_name
        },
        'context': {}
    }
    signed_url = signer.generate_presigned_url( # signed by aws_secret_access_key (HMAC-SHA256)
        request_dict=request_params,
        expires_in=900,
        operation_name='GetCallerIdentity'
    )

    # convert string to base64 for valid token in request header
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
                        "ca_cert": c_data.get("certificateAuthority", {}).get("data"),
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

    async def authorize_access_entry(self, credentials: Dict[str, Any], cluster_name: str, region: str = None) -> Dict[str, Any]:
        access_key = credentials.get("aws_access_key_id") or credentials.get("access_key_id") or credentials.get("access_key")
        secret_key = credentials.get("aws_secret_access_key") or credentials.get("secret_access_key") or credentials.get("secret_key")
        session_token = credentials.get("aws_session_token")

        cred_region = credentials.get("aws_region") or credentials.get("region")
        target_region = (region if region and str(region).strip() else None) or (cred_region if cred_region and str(cred_region).strip() else None) or "us-east-1"

        if not access_key or not secret_key:
            raise ValueError("AWS Access Key and Secret Key required for authorizing access entry.")

        session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token,
            region_name=target_region
        )

        async with session.client("sts") as sts_client:
            caller = await sts_client.get_caller_identity()
            principal_arn = caller.get("Arn")

        if not principal_arn:
            raise ValueError("Failed to retrieve IAM Principal ARN from AWS STS.")

        if ":sts::" in principal_arn and ":assumed-role/" in principal_arn:
            parts = principal_arn.split(":assumed-role/")
            if len(parts) == 2:
                account = parts[0].split(":")[-1] # account id
                role_name = parts[1].split("/")[0] # role_name
                principal_arn = f"arn:aws:iam::{account}:role/{role_name}"

        async with session.client("eks") as eks_client:
            try:
                cluster_desc = await eks_client.describe_cluster(name=cluster_name)
                auth_mode = cluster_desc.get("cluster", {}).get("accessConfig", {}).get("authenticationMode")
                if auth_mode == "CONFIG_MAP":
                    try:
                        await eks_client.update_cluster_config(
                            name=cluster_name,
                            accessConfig={"authenticationMode": "API_AND_CONFIG_MAP"}
                        )
                    except Exception:
                        pass
            except Exception:
                pass

            # create access entry for IAM user in target cluster
            try:
                await eks_client.create_access_entry(
                    clusterName=cluster_name,
                    principalArn=principal_arn,
                    type="STANDARD"
                )
            except Exception as e:
                err_msg = str(e)
                if "ResourceInUseException" not in err_msg and "already exists" not in err_msg.lower() and "already in use" not in err_msg.lower():
                    raise RuntimeError(f"Failed to create EKS Access Entry: {err_msg}")

            # associate access policy for iam user
            try:
                await eks_client.associate_access_policy(
                    clusterName=cluster_name,
                    principalArn=principal_arn, # iam user arn 
                    policyArn="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
                    accessScope={"type": "cluster"}
                )
            except Exception as e:
                err_msg = str(e)
                if "ResourceInUseException" not in err_msg and "already associated" not in err_msg.lower():
                    raise RuntimeError(f"Failed to associate cluster admin policy: {err_msg}")

        return {
            "status": "success",
            "principal_arn": principal_arn,
            "cluster_name": cluster_name,
            "policy_arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
            "message": f"Successfully authorized access entry for {principal_arn} in cluster {cluster_name} with ClusterAdmin permissions."
        }
