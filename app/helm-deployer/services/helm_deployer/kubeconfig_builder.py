import os 
import aiofiles
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

class KubeconfBuilder:
    def __init__(self, base_dir: str = "/tmp/kubeconfigs"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def generating_kubeconfig(
        self, 
        cluster_name: str,
        ca_cert_data: str, 
        api_server_url: str, 
        token: str,
        user_name: str,
        namespace: str = "default"
    ) -> str: 
        config: Dict[str, Any] = {
            "apiVersion": "v1",
            "kind": "Config",
            "clusters": [
                {
                    "name": cluster_name,
                    "cluster": {
                        "server": api_server_url,
                        "certificate-authority-data": ca_cert_data
                    }
                }
            ],
            "users": [
                {
                    "name": user_name,
                    "user": {
                        "token": token
                    }
                }
            ],
            "contexts": [
                {
                    "name": f"{user_name}@{cluster_name}",
                    "context": {
                        "cluster": cluster_name,
                        "user": user_name,
                        "namespace": namespace
                    }
                }
            ],
            "current-context": f"{user_name}@{cluster_name}"
        }
        return yaml.dump(config, default_flow_style=False)  # long string of kubeconfig content 

    def fast_creating(
        self, 
        cluster_name: str,
        release_name: str,
        ca_cert_data: str, 
        api_server_url: str, 
        token: str,
        user_name: str,
        namespace: str = "default"
        ): 
            # CREATING FILE PATH FOR KUBECONFIG
            file_path = self.base_dir / f"kubeconfig_{release_name}.yaml"

            # CREATING KUBECONFIG CONTENT
            yaml_content = self.generating_kubeconfig(
                cluster_name = cluster_name,
                api_server_url =  api_server_url,
                ca_cert_data = ca_cert_data,
                token = token,
                namespace = namespace
            )

            async with aiofiles.open(file_path, mode="w", encoding="utf-8") as f:
                await f.write(yaml_content)

            return file_path  # return "path/to/kubeconfig"


    @asynccontextmanager
    async def contextual_config(self, release_name: str):
        file_path = self.base_dir / f"kubeconfig_{release_name}.yaml"
        try:
            yield file_path
        finally:
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass