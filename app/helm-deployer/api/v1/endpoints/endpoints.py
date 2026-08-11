from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from api.v1.endpoints.schemas import InstallRequest, FileSaveRequest, ClusterdataRequest, ApplyRequest, ClusterResponse
from core.database import db_session
from fastapi import Query

router = APIRouter(prefix="/api/v1/helm", tags=["helm"])

# install connect in cluster
@router.post("register/", response_model=ClusterResponse)
async def register_cluster(
    request: ClusterdataRequest
):
    pass

#  POST /api/v1/helm/pull  (install and show target file from chart repository)
@router.post("/install", response_model=List[ClusterResponse])
async def pull_chart(
    request: InstallRequest,
    db: AsyncSession = Depends(db_session)
):
    pass


# GET /api/v1/helm/file?release_name=my-postgres&file_path=values.yaml
# query parameters: release_name, file_path 
@router.get("/file") 
async def get_file(
    release_name: str = Query(..., description="Release name"),
    file_path: str = Query(..., description="File path"),
    helm_service: HelmDeployerService = Depends(get_helm_deployer_service)
):
    file_content = await helm_service.read_chart_file(
        release_name=release_name,
        file_path=file_path
    )
    return {
        "file_path": file_path,
        "release_name": file_content 
    }

# PUT /api/v1/helm/file (save target file)
@router.put("/file", response_model=List[ClusterResponse])
async def save_chart_file(
    request: FileSaveRequest
):
    pass

# POST /api/v1/helm/install  (apply chart)
@router.post("/apply", response_model=List[ClusterResponse])
async def deploy_chart(
    request: ApplyRequest
):
    pass
