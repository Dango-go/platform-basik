from typing import Optional, Any, Dict
from datetime import datetime, timedelta


class MemoryCacheService:
    def __init__(self, ttl_seconds: int = 300):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(seconds=ttl_seconds)

    def get(self, key: str) -> Optional[Any]:
        # any info
        item = self._cache.get(key)
        if not item:
            return None
        if datetime.utcnow() > item["expires_at"]:
            del self._cache[key]
            return None
        return item["value"]

    def set(self, key: str, value: Any):
        self._cache[key] = {
            "value": value,
            "expires_at": datetime.utcnow() + self.ttl
        }


cache_service = MemoryCacheService()
