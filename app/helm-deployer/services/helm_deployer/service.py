import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from services.helm_deployer.chart_manager import ChartManager
from services.helm_deployer.validator import HelmValidator
from services.helm_deployer.kubeconfig_builder import KubeconfigBuilder
from services.helm_deployer.runner import HelmRunner


class HelmDeployerService:
    def __init__(self, db_session: Optional[AsyncSession] = None):
        self.db = db_session
        self.chart_manager = ChartManager()
        self.kubeconfig_builder = KubeconfigBuilder()
        self.runner = HelmRunner()
        self.validator = HelmValidator()

    async def prepare_and_unpack_chart(
        self,
        chart_repo_url: str,
        chart_name: str,
        chart_version: str,
        release_name: str
    ) -> str:
        """
        Pulls and unpacks the Helm chart into a local temporary directory.
        """
        self.validator.validate_release_name(release_name)
        chart_dir = await self.chart_manager.pull_and_unpack_chart(
            repo_url=chart_repo_url,
            chart_name=chart_name,
            chart_version=chart_version,
            release_name=release_name
        )
        self.validator.validate_chart_directory(chart_dir)
        return chart_dir

    async def read_chart_file(self, release_name: str, file_path: str = "values.yaml") -> str:
        """
        Reads and returns the content of a file from the unpacked chart directory.
        """
        self.validator.validate_release_name(release_name)
        return await self.chart_manager.read_chart_file(release_name=release_name, file_path=file_path)

    async def save_chart_file(self, release_name: str, file_path: str, content: str) -> str:
        """
        Validates YAML syntax and saves/overwrites the file (e.g., values.yaml).
        """
        self.validator.validate_release_name(release_name)
        if file_path.endswith(".yaml") or file_path.endswith(".yml"):
            self.validator.validate_yaml_content(content)

        return await self.chart_manager.save_chart_file(
            release_name=release_name,
            file_path=file_path,
            content=content
        )

    async def dry_run_validate(
        self,
        release_name: str,
        chart_name: str,
        values_file: Optional[str] = None
    ) -> str:
        """
        Performs dry-run template rendering via 'helm template' to validate manifests.
        """
        self.validator.validate_release_name(release_name)
        chart_dir = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_dir.exists():
            chart_dir = self.chart_manager.base_temp_dir / release_name
            
        self.validator.validate_chart_directory(str(chart_dir))
        return await self.runner.template(
            chart_path=str(chart_dir),
            release_name=release_name,
            values_file=values_file
        )

    async def apply_release(
        self,
        cluster_name: str,
        release_name: str,
        chart_name: str,
        api_server_url: str,
        ca_cert_data: str,
        token: str,
        user_name: str = "cluster-admin",
        namespace: str = "default",
        custom_values_file: Optional[str] = None
    ) -> str:
        """
        Validates the release, generates a temporary kubeconfig, and executes 'helm upgrade --install'.
        """
        self.validator.validate_release_name(release_name)
        self.validator.validate_namespace(namespace)

        chart_dir = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_dir.exists():
            chart_dir = self.chart_manager.base_temp_dir / release_name

        self.validator.validate_chart_directory(str(chart_dir))

        # Create temporary kubeconfig file
        kubeconfig_path = await self.kubeconfig_builder.create_kubeconfig_file(
            cluster_name=cluster_name,
            release_name=release_name,
            ca_cert_data=ca_cert_data,
            api_server_url=api_server_url,
            token=token,
            user_name=user_name,
            namespace=namespace
        )

        try:
            # Execute helm upgrade --install
            result = await self.runner.upgrade_install(
                release_name=release_name,
                chart_path=str(chart_dir),
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace,
                values_file=custom_values_file
            )
            return result
        finally:
            # Clean up temporary kubeconfig file
            if kubeconfig_path.exists():
                try:
                    kubeconfig_path.unlink()
                except Exception:
                    pass

    async def delete_release(
        self,
        cluster_name: str,
        release_name: str,
        api_server_url: str,
        ca_cert_data: str,
        token: str,
        user_name: str = "cluster-admin",
        namespace: str = "default"
    ) -> str:
        """
        Uninstalls a release from the Kubernetes cluster and cleans up local temporary chart files.
        """
        self.validator.validate_release_name(release_name)

        kubeconfig_path = await self.kubeconfig_builder.create_kubeconfig_file(
            cluster_name=cluster_name,
            release_name=release_name,
            ca_cert_data=ca_cert_data,
            api_server_url=api_server_url,
            token=token,
            user_name=user_name,
            namespace=namespace
        )

        try:
            result = await self.runner.uninstall(
                release_name=release_name,
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace
            )

            # Clean up unpacked chart folder
            release_dir = self.chart_manager.base_temp_dir / release_name
            if release_dir.exists():
                shutil.rmtree(release_dir, ignore_errors=True)

            return result
        finally:
            if kubeconfig_path.exists():
                try:
                    kubeconfig_path.unlink()
                except Exception:
                    pass
