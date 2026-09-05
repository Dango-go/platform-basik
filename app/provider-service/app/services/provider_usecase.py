import logging
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.service_client import ServiceClient  
from app.services.cloud_validator import ValidationFactory
from app.repository.provider_repository import ProviderRepository

logger = logging.getLogger(__name__)


class provider_usecase:
    def __init__ (self, db_session: AsyncSession, json_data: Dict[str, Any], vault_client: ServiceClient):
        self.db_session = db_session
        self.data = json_data
        self.vault_client = vault_client

        self.user_id = self.data.get("user_id") or 1
        self.alias = self.data.get("alias")
        self.provider_type = (self.data.get("provider_type") or "").strip().lower()
        self.credentials = self.data.get("credentials")

    async def add_provider_creds(self) -> Tuple[bool, str]:
        if not self.data:
            return False, "Empty payload received"
 
        # Check if provider credentials already exist
        try:
            existing_provider = await ProviderRepository.check(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias
            )
            if existing_provider:
                logger.warning(f"Provider credentials with alias '{self.alias}' already exist for user {self.user_id}")
                return False, f"Credentials with alias '{self.alias}' already exist"
        except Exception as e:
            logger.error(f"Error checking existing provider in DB: {e}", exc_info=True)
            return False, f"Database check error: {str(e)}"

        # Validation creds in cloud provider
        try:
            validator = await ValidationFactory.validating_creds(
                provider_type = self.provider_type,
                credentials = self.credentials
            )
            if not validator:
                logger.error(f"Cloud provider authentication failed for alias '{self.alias}'")
                return False, "Cloud provider authentication failed. Check key validity."

        except Exception as e:
            logger.error(f"Cloud validation error for '{self.alias}': {e}", exc_info=True)
            return False, f"Cloud validation error: {str(e)}"

        # Request to store credentials in vault-service
        saver = await self.vault_client.store_creds(self.data)
        if not saver:
            logger.error(f"Failed to store credentials in vault-service for alias '{self.alias}'")
            return False, "Failed to store credentials in vault service"

        # Save in provider database
        try:
            provider = await ProviderRepository.create_provider_creds(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias,
                provider_type = self.provider_type,
                credentials_status = "active"
            )

            if not provider:
                return False, "Failed to save provider metadata in DB"
            return True, "Success"

        except Exception as e:
            logger.error(f"Database insertion error for '{self.alias}': {e}", exc_info=True)
            return False, f"Database error: {str(e)}"

        
    # get provider credentials from vault-service by alias for another services
    async def get_provider_credentials(self) -> Optional[Dict[str, Any]]:
        if not self.data:
            return None
        
        try:
            credentials = await self.vault_client.get_creds(alias = self.alias)
            return credentials

        except Exception as e:
            logger.error(f"Error getting credentials for '{self.alias}': {e}")
            return None

 
    # Return list of all providers for a given user_id. (name, status, provider type)
    async def list_providers(self):
        if not self.data:
            return []

        try:
            providers_object = await ProviderRepository.get_all_accounts_by_user(
                db = self.db_session,
                user_id = self.user_id
            )
            return providers_object

        except Exception as e:
            logger.error(f"Error listing providers for user {self.user_id}: {e}")
            return []

    async def delete_provider(self):
        if not self.data:
            return False

        try:
            # Delete from provider database
            deleted = await ProviderRepository.delete_account(
                db = self.db_session,
                user_id = self.user_id,
                alias = self.alias
            )
            if not deleted:
                return False

            # Delete from vault-service
            deleted_from_vault = await self.vault_client.delete_creds(alias = self.alias)
            if not deleted_from_vault:
                return False

            return True

        except Exception as e:
            logger.error(f"Error deleting provider '{self.alias}': {e}")
            return False