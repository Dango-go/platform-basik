from base64 import b64encode, b64decode
from datetime import datetime, timezone
import hvac
import json
from app.domain.db_models import Encrypt_DB
from app.domain.exceptions import CredentialNotFoundError, EncryptionError


class Crypting:
    def __init__(self, hvac_client: hvac.Client): # Type Hint for hvac client
        self.vault = hvac_client

    def encrypt(self, user_id: int, provider_type: str, alias: str, credentials: dict):
        json_data = json.dumps(credentials)

        try: 
            try:
                self.vault.sys.enable_secrets_engine(backend_type='transit', mount_point='transit') # transit engine to encrypt/decrypt (AES-256-GCM)
            except Exception:
                pass

            try:
                self.vault.secrets.transit.create_key(name='cloud-keys') # cloud key for encryption
            except Exception:
                pass

            b64_plaintext = b64encode(json_data.encode("utf-8")).decode("utf-8")

            encrypting = self.vault.secrets.transit.encrypt_data(
                name='cloud-keys',
                plaintext=b64_plaintext
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
            decrypted_b64 = decrypting['data']['plaintext'] # get decrypted b64 string
            decrypted_json = b64decode(decrypted_b64).decode('utf-8')

            return json.loads(decrypted_json)
    
        except Exception as e:
            raise CredentialNotFoundError(f"Failed to decrypt data via Vault from DB: {str(e)}")


        












