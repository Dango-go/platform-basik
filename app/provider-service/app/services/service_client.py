import httpx
from typing import Dict, Optional, Any
  

# api_key in headers for authentication

class ServiceClient:
    def __init__ (self, url: str, apikey: str, data_json: Optional[Dict] = None):
        # self.base_url = "http://vault-service:8080"
        self.url = url
        self.apikey = {}
        self.payload = data_json  # full json data from provider service

        if apikey:
            self.apikey["Authorization"] = apikey

    # store in vault-service by alias
    async def store_creds(self, data_json: Optional[Dict]):

        url = f"{self.url}/api/v1/secrets"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data_json, headers=self.apikey, timeout=5.0)
                return response.status_code in (200, 201)
            except httpx.RequestError:
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
                return None

            except httpx.RequestError:
                return None


    # delete from vault-service by alias
    async def delete_creds(self, alias: str) -> bool:
        
        url = f"{self.url}/api/v1/secrets/{alias}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(url, headers=self.apikey, timeout=5.0)
                return response.status_code == 200

            except httpx.RequestError:
                return False