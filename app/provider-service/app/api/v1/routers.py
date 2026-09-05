from fastapi import APIRouter, Depends, HTTPException
from app.api.v1.schemas import ProviderRequest
from app.core.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.provider_usecase import provider_usecase
from app.services.service_client import ServiceClient
import os


from app.repository.provider_repository import ProviderRepository


router = APIRouter(prefix="/api/v1/provider", tags=["provider"])

def get_vault_env() -> ServiceClient:
    return ServiceClient(
        url = os.getenv("VAULT_SERVICE_URL", "http://vault-service:8001"),
        apikey = os.getenv("VAULT_API_KEY", "default_api_key")
    )



@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

@router.post("")
@router.post("/")
@router.post("/provider")
@router.post("/credentials")
async def check_validate(json_data: ProviderRequest, db_session: AsyncSession = Depends(db_session), vault_client: ServiceClient = Depends(get_vault_env)):
    resulter = provider_usecase(db_session=db_session, json_data=json_data.model_dump(), vault_client=vault_client)

    action_add, detail_msg = await resulter.add_provider_creds()

    if not action_add:
        raise HTTPException(status_code=400, detail=detail_msg)

    return {"status": "success", "message": "Provider credentials added successfully"}

@router.get("/credentials")
@router.get("/credentials/list")
async def list_user_credentials(
    user_id: int = 1,
    db_session: AsyncSession = Depends(db_session)
):
    providers = await ProviderRepository.get_all_accounts_by_user(db=db_session, user_id=user_id)
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "alias": p.alias,
            "provider_type": p.provider_type,
            "credentials_status": p.credentials_status
        }
        for p in providers
    ]

# request from discovery-service to get provider_type
@router.get("/credentials/{alias}")
async def get_provider_credential_info(
    alias: str,
    user_id: int = 1,
    db_session: AsyncSession = Depends(db_session)
):
    provider = await ProviderRepository.check(db=db_session, user_id=user_id, alias=alias)
    if not provider:
        raise HTTPException(status_code=404, detail=f"Provider credential with alias '{alias}' not found")
    return {
        "id": provider.id,
        "user_id": provider.user_id,
        "alias": provider.alias,
        "provider_type": provider.provider_type,
        "credentials_status": provider.credentials_status
    }


