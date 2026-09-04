from sqlalchemy.orm import Session
from app.api.v1.schemas import VaultRequest
from app.core.security import Crypting
from app.services.storage_adapter import StorageAdaption

class Vault_Logic:
    # db_session get real call from the router and will be transmitted in this field
    def __init__(self, db_session: Session, hvac_client):
        self.db_session = db_session
        # Objects
        self.encryptor = Crypting(hvac_client)
        self.storage_adapter = StorageAdaption(db_session = db_session)

    def execute_encrypt_and_keep(self, client_data: VaultRequest):
        # encrypt and save
        encrypted_data = self.encryptor.encrypt(
            user_id=client_data.user_id,
            provider_type=client_data.provider_type,
            alias=client_data.alias,
            credentials=client_data.credentials
        )
        
        storage_adapting = self.storage_adapter.save_creds(encrypted_data)

        return storage_adapting

        
    def execute_get_and_decrypt(self, user_id: int, alias: str):
        # get and decrypt
        searching_creds = self.storage_adapter.get_creds(user_id=user_id, alias=alias)
        if not searching_creds:
            return None
        
        encrypted_creds = searching_creds.credentials["encrypt_key"]
        decrypting_data = self.encryptor.pull_and_decrypt(encrypted_creds)

        return decrypting_data


        
















