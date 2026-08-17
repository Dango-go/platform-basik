from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from api.v1.endpoints.schemas import ApplyRequest
from api.core.database import db_session
from api.services.k8s.client_factory import K8sClientFactory


router = APIRouter(prefix="/api/v1/helm", tags=["helm"])


# POST /api/v1/helm/apply
@router.post("/apply")
async def deploy_chart(
    request: ApplyRequest,
    db: AsyncSession = Depends(db_session)
):
    cluster_info = await db.get(InfoCluster, request.cluster_id)
    service = HelmService(db_session=db)
    applied = await service.apply_release(
        # main data
        content=request.content,
        target_namespace=request.target_namespace,
        resource_name=request.resource_name,
        cloud_name=request.cloud_name,
        cloud_region=request.cloud_region,
        cluster_uid=request.cluster_uid,
        # data from DB
        api_server_url=cluster_info.api_server_url,
        ca_cert_data=cluster_info.ca_cert_data,
        token=cluster_info.token,
    )

    return {
        "status": "success",
        "release_name": request.release_name,
        "namespace": request.namespace,
        "output": applied
    }

