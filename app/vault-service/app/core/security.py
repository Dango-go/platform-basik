from datetime import datetime, timezone
import hvac
import json
from app.domain.db_models import Encrypt_DB
from app.domain.exceptions import CredentialNotFoundError, EncryptionError
from app.core.metrics import wrapper_metrics


class Crypting:
    def __init__(self, hvac_client: hvac.Client):
        self.vault = hvac_client

    @wrapper_metrics(operation_name="encrypt")
    def encrypt(self, user_id: int, provider_type: str, alias: str, credentials: dict):
        json_data = json.dumps(credentials)

        try: 
            try:
                self.vault.sys.enable_secrets_engine(backend_type='transit', mount_point='transit')
            except Exception:
                pass

            try:
                self.vault.secrets.transit.create_key(name='cloud-keys')
            except Exception:
                pass

            encrypting = self.vault.secrets.transit.encrypt_data(
                name='cloud-keys',
                plaintext=json_data.encode("utf-8").hex()
            )

        except Exception as e:
            raise EncryptionError(f"Failed to encrypt data via Vault: {str(e)}")

        secure_encrypted_creds = encrypting['data']['ciphertext']

        final_credentials = {
            "encrypt_key": secure_encrypted_creds
        }

        final_structure = Encrypt_DB(
            user_id = user_id,
            provider_type = provider_type,
            alias = alias,
            credentials = final_credentials,
            created_at = datetime.now(timezone.utc)
        )

        
        return final_structure

    @wrapper_metrics(operation_name="decrypt")
    def pull_and_decrypt(self, credentials: str) -> dict: 
        # searching_creds - object
        #searching_creds = self.db_session.query(Encrypt_DB).filter(
            #Encrypt_DB.user_id == user_id,
            #Encrypt_DB.provider_type == provider_type
        #).first()

        #if not searching_creds:
            #raise CredentialNotFoundError()
        try:
            decrypting = self.vault.secrets.transit.decrypt_data(
                name='cloud-keys',
                ciphertext=credentials
            )
            decrypted_hex = decrypting['data']['plaintext'] # get decrypt keys
            decrypted_json = bytes.fromhex(decrypted_hex).decode('utf-8')

            return json.loads(decrypted_json)
    
        except Exception as e:
            raise CredentialNotFoundError(f"Failed to decrypt data via Vault from DB: {str(e)}")


        












