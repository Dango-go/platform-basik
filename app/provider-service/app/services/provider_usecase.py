from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.service_client import ServiceClient  
from app.services.cloud_validator import ValidationFactory
from app.repository.provider_repository import ProviderRepository


class provider_usecase:
    def __init__ (self, db_session: Session, json_data: Dict[str, Any], vault_client: ServiceClient):
        self.db_session = db_session
        self.data = json_data
        self.vault_client = vault_client

        # Fields from json_data
        self.user_id = self.data.get("user_id")
        self.alias = self.data.get("alias") #don't used get() bcs Pydantic haven't get() method. So used '.' for get field.  
        self.provider_type = self.data.get("provider_type")
        self.credentials = self.data.get("credentials")

    async def add_provider_creds(self) -> bool:
        if not self.data:
            return False
 
        # Check if provider credentials already exist
        existing_provider = await ProviderRepository.check(db = self.db_session, user_id = self.user_id, alias = self.alias)
    
        if existing_provider:
            return False


        # Validation creds in cloud provider
        try:
            validator = await ValidationFactory.validating_creds(provider_type = self.provider_type, credentials = self.credentials)
            if not validator:
                return False

        except Exception:
            return False

        # Request to store credentials in vault-service
        saver = await self.vault_client.store_creds(self.data)
        if not saver:
            return False

        # save in provider database
        try:
            provider = await ProviderRepository.create_provider_creds(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias,
                provider_type = self.provider_type,
                credentials_status = "active"
            )

            if not provider:
                return False
            return True

        except Exception:
            return False

        
    # get provider credentials from vault-service by alias for another services
    async def get_provider_credentials(self) -> Optional[Dict[str, Any]]:
        if not self.data:
            return None
        
        try:
            credentials = await self.vault_client.get_creds(alias = self.alias)

            return credentials

        except Exception:
            return None

 
    # Return list of all providers for a given user_id. (name, status, provider type)
    async def list_providers(self):
        if not self.data:
            return []

        try:
            providers_object = await ProviderRepository.get_all_accounts_by_user(db = self.db_session, user_id = self.user_id)

            return providers_object

        except Exception:
            return []

    async def delete_provider(self):
        if not self.data:
            return False

        try:
            # Delete from provider database
            deleted = await ProviderRepository.delete_account(db = self.db_session, user_id = self.user_id, alias = self.alias)
            if not deleted:
                return False

            # Delete from vault-service
            deleted_from_vault = await self.vault_client.delete_creds(alias = self.alias)
            if not deleted_from_vault:
                return False

            return True

        except Exception:
            return False