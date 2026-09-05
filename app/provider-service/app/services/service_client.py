import httpx
import logging
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

# api_key in headers for authentication
# used data_json like dict bcs httpx require it

class ServiceClient:
    def __init__ (self, url: str, apikey: str, data_json: Optional[Dict] = None):
        if url and not (url.startswith("http://") or url.startswith("https://")):
            url = f"http://{url}"
        self.url = url
        self.apikey = {}
        self.payload = data_json  # full json data from provider service

        if apikey:
            self.apikey["Authorization"] = apikey

    # store in vault-service by alias
    async def store_creds(self, data_json: Optional[Dict]) -> bool:

        url = f"{self.url}/api/v1/secrets"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data_json, headers=self.apikey, timeout=5.0)
                if response.status_code in (200, 201):
                    return True
                logger.error(f"Vault service returned status {response.status_code} on store_creds: {response.text}")
                return False
            except httpx.RequestError as e:
                logger.error(f"Request to vault-service failed ({url}): {e}")
                return False

    # get from vault-service by alias
    async def get_creds(self, alias: str) -> Optional[Dict[str, Any]]:

        url = f"{self.url}/api/v1/secrets/{alias}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.apikey, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("credentials")
                logger.error(f"Vault service returned status {response.status_code} on get_creds: {response.text}")
                return None

            except httpx.RequestError as e:
                logger.error(f"Request to vault-service failed ({url}): {e}")
                return None


    # delete from vault-service by alias
    async def delete_creds(self, alias: str) -> bool:
        
        url = f"{self.url}/api/v1/secrets/{alias}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(url, headers=self.apikey, timeout=5.0)
                if response.status_code == 200:
                    return True
                logger.error(f"Vault service returned status {response.status_code} on delete_creds: {response.text}")
                return False

            except httpx.RequestError as e:
                logger.error(f"Request to vault-service failed ({url}): {e}")
                return False