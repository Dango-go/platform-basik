from pydantic import BaseModel, Field
from typing import Optional, Any


#{
  #"cluster_name": "my-local-lenovo",
  #"api_server_url": "https://192.168.1.50:6443",
  #"auth_token": "eyJhbGciOiJSUzI1NiIs..."
#}
# CLUSTER DATA (need for kubeconfig)
class ClusterLoginRequest(BaseModel):
    cluster_name: str = Field(..., description="Name of the cluster")
    api_server_url: str = Field(..., description="API server URL of the cluster")
    auth_token: Optional[str] = Field(None, description="Authentication token for the cluster (optional)")

# INSTALL IN CLUSTER
class ApplyRequest(BaseModel):
    content: dict[str, Any]
    target_namespace: str = Field(..., description="Namespace")
    resource_name: str = Field(..., description="Name of resource to be created")
    cloud_name: str = Field(..., description="Name of the cloud")
    cloud_region: str = Field(..., description="Name of the region")
    cluster_uid: str = Field(..., description="Unique identifier of the cluster")


