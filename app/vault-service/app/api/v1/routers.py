from fastapi import APIRouter, Depends
from requests import Session
from app.api.v1.schemas import VaultRequest
from app.core.db import db_session
from app.services.vault_usecase import Vault_Logic
from app.core.vault import vault_client
 

router_v1 = APIRouter(prefix="/api/v1", tags=["vault"])


@router_v1.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

# Get json from provider service on /crypt endpoint, encrypt it and save to the database
@router_v1.post("/crypt")
async def encrypt_data(json_data: VaultRequest, session: Session = Depends(db_session)):
    vault_object = Vault_Logic(db_session=session, hvac_client=vault_client)
    result = vault_object.execute_encrypt_and_keep(client_data=json_data)

    return result


    
