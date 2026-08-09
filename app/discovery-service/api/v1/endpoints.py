from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import db_session
from api.v1.schemas import DiscoveryRequest, ClusterResponse
from services.scanner import ClusterScannerService
from typing import List

router = APIRouter(prefix="/api/v1", tags=["discovery"])


@router.post("/discover", response_model=List[ClusterResponse])
async def discover_clusters(
    request: DiscoveryRequest,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)  # object of ClusterScannerService
    clusters = await scanner.discover_and_save(request)
    return clusters


@router.get("/clusters/{user_id}", response_model=List[ClusterResponse])
async def get_user_clusters(
    user_id: int,
    db: AsyncSession = Depends(db_session)
):
    scanner = ClusterScannerService(db=db)
    return await scanner.get_clusters_by_user(user_id)
