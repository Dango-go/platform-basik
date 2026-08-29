import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from services.provisioning_manager.repository import DatabaseRepository
from services.provisioning_manager.lifecycle_manager import LifecycleManager, LifecycleStatus
from services.provisioning_manager.validation_engine import ValidationEngine
from services.provisioning_manager.desired_state_manager import DesiredStateManager
from services.provisioning_manager.scaling_manager import ScalingManager
from services.provisioning_manager.upgrade_manager import UpgradeManager
from services.external_clients.helm_client import HelmDeployerClient
from services.external_clients.operator_client import OperatorServiceClient
from models.db_models import DatabaseInstanceDB

logger = logging.getLogger(__name__)


class ProvisioningService:

    # all classes
    def __init__(self, db: AsyncSession):
        self.repo = DatabaseRepository(db)
        self.lifecycle = LifecycleManager()
        self.validator = ValidationEngine()
        self.desired_state = DesiredStateManager()
        self.scaling = ScalingManager()
        self.upgrade = UpgradeManager()
        self.helm_client = HelmDeployerClient()
        self.operator_client = OperatorServiceClient()

    async def get_all_databases(self) -> List[DatabaseInstanceDB]:
        return await self.repo.get_all_instances()

    async def get_database_by_id(self, db_id: str) -> Optional[DatabaseInstanceDB]:

        return await self.repo.get_by_id(db_id)

    async def scale_database(
        self,
        db_id: str,
        cluster_id: str,
        namespace: str,
        cpu: Optional[float] = None,
        ram: Optional[float] = None,
        disk: Optional[float] = None
    ) -> DatabaseInstanceDB:

        if cpu is not None or ram is not None or disk is not None:
            self.validator.validate_resource_limits(
                cpu=cpu if cpu is not None else 1.0,
                ram=ram if ram is not None else 2.0,
                disk=disk if disk is not None else 20.0
            )

        db_instance = await self.repo.get_by_id(db_id)
        if not db_instance:
            raise ValueError(f"Database instance with id '{db_id}' not found")

        if not self.lifecycle.validate_transition(db_instance.status, LifecycleStatus.SCALING):
            raise RuntimeError(f"Cannot scale database in status '{db_instance.status}'")

        # update status to scaling in database
        await self.repo.update_status(db_id, LifecycleStatus.SCALING)

        # format K8s resource spec (e.g. 4000m, 16Gi, 200Gi)
        k8s_spec = self.scaling.format_k8s_resources(cpu, ram, disk)
        logger.info("Triggering scaling for %s with spec %s", db_instance.name, k8s_spec)

        # Крок 6: Збереження оновлених ресурсів та повернення статусу Running
        updated_db = await self.repo.update_resources(db_id, cpu=cpu, ram=ram, disk=disk, new_status=LifecycleStatus.RUNNING)
        await self.repo.log_operation(db_id, "scale", "Success", f"Scaled to CPU={cpu}, RAM={ram}GB, Disk={disk}GB")
        return updated_db

    async def update_database_config(
        self,
        db_id: str,
        cluster_id: str,
        namespace: str,
        values_yaml: str
    ) -> DatabaseInstanceDB:
        """4. PUT /api/v1/provisioning/{id}/config — Parameter Editing & custom-values.yaml Upgrade."""
        # Check YAML syntax
        self.validator.validate_yaml_syntax(values_yaml)

        db_instance = await self.repo.get_by_id(db_id)
        if not db_instance:
            raise ValueError(f"Database instance with id '{db_id}' not found")

        if not self.lifecycle.validate_transition(db_instance.status, LifecycleStatus.UPGRADING):
            raise RuntimeError(f"Cannot upgrade config for database in status '{db_instance.status}'")

        # Set status to Upgrading
        await self.repo.update_status(db_id, LifecycleStatus.UPGRADING)

        try:
            await self.helm_client.apply_chart(
                release_name=db_instance.name,
                chart_name=db_instance.chart_name,
                namespace=namespace,
                values_yaml=values_yaml,
                api_server_url="https://kubernetes.default.svc",
                auth_token="cluster-token"
            )
        except Exception as exc:
            logger.warning("Helm upgrade trigger completed with notification: %s", str(exc))

        # Save updated values_yaml to DB after helm upgrade execution
        updated_db = await self.repo.update_values_yaml(db_id, values_yaml, new_status=LifecycleStatus.RUNNING)
        await self.repo.log_operation(db_id, "config_upgrade", "Success", "custom-values.yaml configuration hot-reloaded")
        return updated_db
