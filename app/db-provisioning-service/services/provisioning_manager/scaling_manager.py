import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ScalingManager:

    @staticmethod
    def format_k8s_resources(cpu: Optional[float], ram: Optional[float], disk: Optional[float]) -> Dict[str, Any]:
        spec = {}
        if cpu is not None:
            spec['cpu_milli'] = f"{int(cpu * 1000)}m" # cpu 0.1 - 128 cores
        if ram is not None:
            spec['memory_gi'] = f"{ram}Gi"
        if disk is not None:
            spec['storage_gi'] = f"{disk}Gi"
        return spec
