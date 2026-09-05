from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


# If user side clicked on "update clusters" and chose one alias 
class DiscoveryRequest(BaseModel):
    user_id: int = Field(1, description="User ID")
    alias: str = Field(..., description="Connected cloud provider alias")
    provider_type: Optional[str] = Field(..., description="Cloud provider type: aws, gcp, digitalocean")
    region: Optional[str] = Field(None, description="Region for scanning")



class ClusterResponse(BaseModel):
    id: str
    user_id: int
    provider_type: str
    provider_alias: str
    cluster_name: str
    region: str
    k8s_version: Optional[str] = None
    status: str
    endpoint: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
