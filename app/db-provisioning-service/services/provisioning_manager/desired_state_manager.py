import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class DesiredStateManager:
    """Менеджер розрахунку різниці (Diff) між поточним та бажаним станом бази даних."""

    @staticmethod
    def calculate_resource_diff(current_spec: Dict[str, Any], desired_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Розраховує різницю ресурсів для скейлінгу."""
        diff = {}
        for key in ['cpu', 'ram', 'disk']:
            if key in desired_spec and desired_spec[key] != current_spec.get(key):
                diff[key] = {
                    'from': current_spec.get(key),
                    'to': desired_spec[key]
                }
        return diff
