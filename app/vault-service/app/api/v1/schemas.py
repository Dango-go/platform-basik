from pydantic import BaseModel, Field
from typing import Dict, Any

class VaultRequest(BaseModel):
    user_id: int = Field(..., description="The ID of the user who owns the credentials.")
    provider_type: str = Field(..., description="The type of provider for the credentials.")
    alias: str = Field(..., description="Credentials name.")
    credentials: Dict [str, Any] = Field(..., description="The credentials data as a dictionary. Will be encrypted before storing in the database.")

class K8sRequest(BaseModel):
    alias: str = Field(..., description="Cloud provider alias. Must match the alias in the provider-service.")
    url: str = Field(..., description="The URL of the Kubernetes cluster.")
    bare_token: str = Field(..., description="SA token  for cloud provider.")

class  K8sResponse(BaseModel):
    api_server_url: str = Field(..., description="The URL of the Kubernetes API server.")
    auth_token: str = Field(..., description="The ID of the cluster.")

class VaultResponse(BaseModel):
    user_id: int
    provider_type: str
    alias: str
    credentials: Dict[str, Any] = Field(..., description="The credentials data is decrypted.")

class DiscoveryRequest(BaseModel):
    alias: str = Field(..., description="Cloud provider alias. Must match the alias in the provider-service.")


class  DiscoveryResponse(BaseModel):
    credentials: Dict[str, Any] = Field(..., description="The credentials from db. Creds for SA of target provider.")



    class Config:
        from_attributes = True