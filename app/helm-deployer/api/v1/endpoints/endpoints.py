from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from api.v1.endpoints.schemas import (
    InstallRequest,
    FileSaveRequest,
    ApplyRequest,
    ChartPullResponse,
)
from core.database import db_session
from services.helm_deployer.service import HelmService

router = APIRouter(prefix="/api/v1/helm", tags=["helm"])


# POST /api/v1/helm/pull
@router.post("/pull", response_model=ChartPullResponse)
async def pull_chart(
    request: InstallRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    chart_dir = await service.get_and_unpack(
        chart_repo_url=request.chart_repo_url,
        chart_name=request.chart_name,
        chart_version=request.chart_version,
        release_name=request.release_name
    )
    return ChartPullResponse(
        release_name=request.release_name,
        chart_dir=chart_dir
    )


# GET /api/v1/helm/file?release_name=my-postgres&file_path=values.yaml
@router.get("/file")
async def get_file(
    release_name: str = Query(..., description="Release name"),
    file_path: str = Query("values.yaml", description="File path"),
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    file_content = await service.read_chart_file(
        release_name=release_name,
        file_path=file_path
    )

    return {
        "release_name": release_name,
        "file_path": file_path,
        "content": file_content
    }


# PUT /api/v1/helm/file
@router.put("/file")
async def save_chart_file(
    request: FileSaveRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    save_file = await service.save_chart_file(
        release_name=request.release_name,
        file_path=request.file_path,
        content=request.content
    )
    return {
        "status": "success",
        "message": f"File '{request.file_path}' saved successfully",
        "release_name": request.release_name,
        "file_path": save_file
    }


# POST /api/v1/helm/apply
@router.post("/apply")
async def deploy_chart(
    request: ApplyRequest,
    db: AsyncSession = Depends(db_session)
):
    service = HelmService(db_session=db)
    applied = await service.apply_release(
        cluster_name=request.cluster_name,
        release_name=request.release_name,
        chart_name=request.chart_name,
        api_server_url=request.api_server_url,
        ca_cert_data=request.ca_cert_data,
        token=request.token,
        user_name=request.user_name,
        namespace=request.namespace,
        target_values_file=request.target_values_file
    )

    return {
        "status": "success",
        "release_name": request.release_name,
        "namespace": request.namespace,
        "output": applied
    }
