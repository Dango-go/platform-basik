import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LifecycleStatus:
    PROVISIONING = "Provisioning"
    RUNNING = "Running"
    SCALING = "Scaling"
    UPGRADING = "Upgrading"
    STOPPED = "Stopped"
    DEPROVISIONING = "Deprovisioning"
    FAILED = "Failed"


class LifecycleManager:

    @staticmethod
    def validate_transition(current_status: str, new_status: str) -> bool:
        """Checking for allowed transitions."""
        invalid_transitions = {
            LifecycleStatus.STOPPED: [LifecycleStatus.SCALING, LifecycleStatus.UPGRADING],
            LifecycleStatus.DEPROVISIONING: [LifecycleStatus.RUNNING, LifecycleStatus.SCALING, LifecycleStatus.UPGRADING],
        }
        
        allowed_blocked = invalid_transitions.get(current_status, [])
        if new_status in allowed_blocked:
            logger.error("Invalid status transition from %s to %s", current_status, new_status)
            return False
        return True
