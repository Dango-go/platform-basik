from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# DB catalog
class EngineSummaryResponse(BaseModel):
    id: int
    name: str = Field(..., description="Display name e.g., PostgreSQL")
    engine_type: str = Field(..., description="System identifier e.g., postgresql")
    category: str = Field(..., description="Category e.g., Relational SQL")
    icon_url: Optional[str] = Field(None, description="Logo URL")
    description: Optional[str] = Field(None, description="Short summary for UI card")
    versions: List[str] = Field(..., description="Supported active versions") # engines_version
    default_version: Optional[str] = Field(None, description="Default version")


class VersionResponse(BaseModel):
    version: str
    is_default: bool
    is_deprecated: bool


class PresetResponse(BaseModel):
    preset_name: str
    cpu_cores: float
    ram_gb: float
    storage_gb: int


class EngineDetailResponse(BaseModel):
    id: int
    name: str
    engine_type: str
    category: str
    icon_url: Optional[str]
    description: Optional[str]
    versions: List[VersionResponse]
    presets: List[PresetResponse]
    json_schema: Dict[str, Any]


class ChartInfoResponse(BaseModel):
    engine_type: str
    version: str
    helm_repo_url: str
    chart_name: str
    chart_version: str


class EngineCreateRequest(BaseModel):
    name: str = Field(..., description="Display name")
    engine_type: str = Field(..., description="System identifier")
    category: str = Field(..., description="Category")
    icon_url: Optional[str] = None
    description: Optional[str] = None
