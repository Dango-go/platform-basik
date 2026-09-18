from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import base64

# REST API 

class Saving_cluster_token: 

    @staticmethod
    async def save(
        db: AsyncSession,
        temp_token: str,  
        api_server_url: str, 
    ):
        headers = {
            "Authorization": f"Bearer {temp_token}",
            "Content-Type": "application/json"
        }
        verify_ssl = False

        async with httpx.AsyncClient(verify=verify_ssl, timeout=10.0) as client:
            sa_name = "idp-sa-for-constant-token"
            secret_name = "idp-deployer-sa-token"
            namespace = "kube-system"
            base_url = api_server_url.rstrip("/")

            # Create ServiceAccount
            sa_url = f"{base_url}/api/v1/namespaces/{namespace}/serviceaccounts"
            sa_body = {
                "apiVersion": "v1",
                "kind": "ServiceAccount",
                "metadata": {"name": sa_name, "namespace": namespace}
            }
            await client.post(sa_url, json=sa_body, headers=headers)


            # Create ClusterRoleBinding
            crb_url = f"{base_url}/apis/rbac.authorization.k8s.io/v1/clusterrolebindings"
            crb_body = {
                "apiVersion": "rbac.authorization.k8s.io/v1",
                "kind": "ClusterRoleBinding",
                "metadata": {"name": f"{sa_name}-binding"},
                "subjects": [{
                    "kind": "ServiceAccount",
                    "name": sa_name,
                    "namespace": namespace
                }],
                "roleRef": {
                    "kind": "ClusterRole",
                    "name": "cluster-admin",
                    "apiGroup": "rbac.authorization.k8s.io"
                }
            }
            await client.post(crb_url, json=crb_body, headers=headers)


            # Create Secret (Token)
            secret_url = f"{base_url}/api/v1/namespaces/{namespace}/secrets"
            secret_body = {
                "apiVersion": "v1",
                "kind": "Secret",
                "metadata": {
                    "name": secret_name,
                    "namespace": namespace,
                    "annotations": {"kubernetes.io/service-account-token": sa_name}
                },
                "type": "kubernetes.io/service-account-token"
            }
            await client.post(secret_url, json=secret_body, headers=headers)


            # save generated constant token
            get_secret_url = f"{base_url}/api/v1/namespaces/{namespace}/secrets/{secret_name}"
            resp = await client.get(get_secret_url, headers=headers)
            
            token = temp_token

            if resp.status_code == 200:
                data = resp.json()
                raw_b64_token = data.get("data", {}).get("token")
                if raw_b64_token:
                    token = base64.b64decode(raw_b64_token).decode("utf-8")
                    return token
         
        return token
