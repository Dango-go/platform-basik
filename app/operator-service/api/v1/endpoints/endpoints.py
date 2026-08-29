from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from api.v1.endpoints.schemas import ApplyRequest, DeleteRequest, GetResourceRequest
from services.operator_manager.service import ServiceYAMLManager

router = APIRouter(prefix="/api/v1/operator", tags=["operator"])


# POST /api/v1/operator/apply
@router.post("/apply")
async def deploy_manifest(request: ApplyRequest):
    service = ServiceYAMLManager()
    applied = await service.apply_manifest(
        api_server_url=request.api_server_url,
        auth_token=request.auth_token,
        resource_name=request.resource_name,
        target_namespace=request.target_namespace,
        content=request.content,
        ca_cert_data=request.ca_cert_data
    )

    return {
        "status": "success",
        "resource_name": request.resource_name,
        "namespace": request.target_namespace,
        "output": applied
    }


# POST /api/v1/operator/status
@router.post("/status")
async def get_resource_status(request: GetResourceRequest):
    service = ServiceYAMLManager()
    resource_status = await service.get_resource_status(
        api_server_url=request.api_server_url,
        auth_token=request.auth_token,
        group=request.group,
        version=request.version,
        namespace=request.namespace,
        kind=request.kind,
        plural=request.plural,
        name=request.name,
        ca_cert_data=request.ca_cert_data
    )

    return {
        "status": "success",
        "resource_name": request.name,
        "data": resource_status
    }


# POST /api/v1/operator/delete
@router.post("/delete")
async def delete_resource(request: DeleteRequest):
    service = ServiceYAMLManager()
    deleting = await service.delete_manifest(
        api_server_url=request.api_server_url,
        auth_token=request.auth_token,
        group=request.group,
        version=request.version,
        namespace=request.namespace,
        kind=request.kind,
        plural=request.plural,
        name=request.name,
        ca_cert_data=request.ca_cert_data
    )

    return {
        "status": "success",
        "resource_name": request.name,
        "deleted": deleting
    }
