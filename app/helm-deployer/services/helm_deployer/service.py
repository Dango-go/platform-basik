import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from services.helm_deployer.chart_manager import ChartManager
from services.helm_deployer.validator import HelmValidator
from services.helm_deployer.kubeconfig_builder import KubeconfigBuilder
from services.helm_deployer.runner import HelmRunner



class HelmService:
    def __init__(self, db_session: Optional[AsyncSession] = None):
        self.db_session = db_session
        self.chart_manager = ChartManager()
        self.kubeconfig_builder = KubeconfigBuilder()
        self.helm_runner = HelmRunner()
        self.validator = HelmValidator()

    # INSTALL AND UNPACK CHART
    async def get_and_unpack(
        self,
        chart_repo_url: str,
        chart_name: str,
        chart_version: str,
        release_name: str   
    ):
        self.validator.validate_release_name(release_name)


        chart_dir = await self.chart_manager.pull_and_unpack_chart(
            repo_url=chart_repo_url,
            chart_name=chart_name,
            chart_version=chart_version,
            release_name=release_name
        )
        self.validator.validate_chart_directory(chart_dir)

        return chart_dir

    """read file"""
    async def read_chart_file(self, release_name: str, file_path: str = "values.yaml"):
        self.validator.validate_release_name(release_name)
        return await self.chart_manager.read_chart_file(release_name=release_name, file_path=file_path)



    #SAVE FILE
    async def save_chart_file(self, release_name: str, file_path: str, content: str):
        self.validator.validate_release_name(release_name)

        if file_path.endswith(".yaml") or file_path.endswith(".yml"):
            self.validator.validate_yaml_content(content)

        # SAVE FILE
        return await self.chart_manager.save_chart_file(
            release_name=release_name,
            file_path=file_path,
            content=content
        )

    async def check_template(self, release_name: str, chart_name: str, values_file: Optional[str] = None):
        self.validator.validate_release_name(release_name)
        chart_dir = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_dir.exists():
            chart_dir = self.chart_manager.base_temp_dir / release_name

        self.validator.validate_chart_directory(str(chart_dir))
        return await self.helm_runner.template(
            chart_path=str(chart_dir),
            release_name=release_name,
            values_file=values_file
        )

    """apply and install chart to cluster"""
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
        target_values_file: Optional[str] = None
    ):
        self.validator.validate_release_name(release_name)
        self.validator.validate_namespace(namespace)

        chart_path = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_path.exists():
            chart_path = self.chart_manager.base_temp_dir / release_name

        self.validator.validate_chart_directory(str(chart_path))

        
        """Creating kubeconfig path and generating content in kubeconfig file. After uprgrade chart - delete kubeconfig file"""
        kubeconfig_path = await self.kubeconfig_builder.fast_creating(
        cluster_name=cluster_name,
        release_name=release_name,
        ca_cert_data=ca_cert_data,
        api_server_url=api_server_url,
        token=token,
        user_name=user_name,
        namespace=namespace
        )

        try:
            result = await self.helm_runner.upgrade_install(
                release_name=release_name,
                chart_path=chart_path,
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace,
                values_file=target_values_file
            )
            return result
        finally:
            if kubeconfig_path.exists():
                try:
                    kubeconfig_path.unlink()
                except Exception as e:
                    print(f"Error occurred while unlinking kubeconfig: {e}")


    async def rm_release(
        self,
        cluster_name: str,
        release_name: str,
        ca_cert_data: str, 
        api_server_url: str, 
        token: str,
        user_name: str,
        namespace: str = "default",
    ):

        self.validator.validate_release_name(release_name)
        self.validator.validate_namespace(namespace)

        kubeconfig_path = await self.kubeconfig_builder.fast_creating(
        cluster_name=cluster_name,
        release_name=release_name,
        ca_cert_data=ca_cert_data,
        api_server_url=api_server_url,
        token=token,
        user_name=user_name,
        namespace=namespace
        ) #-> str

        try:
            unistalled = await self.helm_runner.uninstall(
                release_name=release_name,
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace
            )

            reliase_dir = self.chart_manager.base_temp_dir / release_name

            if reliase_dir.exists():
                shutil.rmtree(reliase_dir, ignore_errors=True)

            return unistalled

        finally:
            if kubeconfig_path.exists():
                try:
                    kubeconfig_path.unlink()
                except Exception as e:
                    print(f"Error occurred while unlinking kubeconfig: {e}")