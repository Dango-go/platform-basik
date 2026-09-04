from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.schemas import VaultRequest
from app.core.db import db_session
from app.services.vault_usecase import Vault_Logic
from app.core.vault import vault_client
 

router_v1 = APIRouter(prefix="/api/v1", tags=["vault"])


@router_v1.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

# Get json from provider service on /crypt or /secrets endpoint, encrypt it and save to the database
@router_v1.post("/crypt")
@router_v1.post("/secrets")
async def encrypt_data(json_data: VaultRequest, session: Session = Depends(db_session)):
    vault_object = Vault_Logic(db_session=session, hvac_client=vault_client)
    result = vault_object.execute_encrypt_and_keep(client_data=json_data)
    return result

# Need for discovery-service & provider-service to search cloud credentials by alias
@router_v1.get("/secrets/{alias}")
@router_v1.get("/cloud-sa-creds/{alias}")
async def get_creds(
    alias: str, 
    user_id: int = 1, 
    session: Session = Depends(db_session)
):
    vault_object = Vault_Logic(db_session=session, hvac_client=vault_client)
    giving_creds = vault_object.execute_get_and_decrypt(user_id=user_id, alias=alias)

    if not giving_creds:
        raise HTTPException(status_code=404, detail=f"Credentials for alias '{alias}' not found")

    return {
        "status": "success",
        "alias": alias,
        "credentials": giving_creds
    }


    
