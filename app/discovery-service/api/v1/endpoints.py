from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import db_session
from api.v1.schemas import DiscoveryRequest, ClusterResponse, TokenCreateResponse
from services.scanner import ClusterScannerService
from typing import List

router = APIRouter(prefix="/api/v1/discovery", tags=["discovery"])


@router.post("/discover", response_model=List[ClusterResponse])
async def discover_clusters(
    request: DiscoveryRequest,
    db: AsyncSession = Depends(db_session)
):
    try:
        scanner = ClusterScannerService(db=db)  
        clusters = await scanner.discover_and_save(request)
        return clusters #-> dict with data for each cluster
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Discovery failed: {str(e)}")


@router.get("/clusters/{user_id}", response_model=List[ClusterResponse])
async def get_user_clusters(
    user_id: int,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)
    return await scanner.get_clusters_by_user(user_id)

@router.post("clusters/create_token/{cluster_name}", response_model=List[TokenCreateResponse])
async def create_token_for_cluster(
    db: AsyncSession = Depends(db_session),
    
):
    pass
