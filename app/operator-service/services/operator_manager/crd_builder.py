import yaml
from typing import Dict, Any, Tuple


class CRDBuilder:
    @staticmethod
    def parse_yaml(content: str) -> Dict[str, Any]:
        try:
            return yaml.safe_load(content)
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse YAML content from UI editor: {e}")

    @staticmethod
    def extract_gvk(manifest: Dict[str, Any]) -> Tuple[str, str, str, str]:
 
        api_version = manifest.get("apiVersion", "")
        kind = manifest.get("kind", "")

        if "/" in api_version:
            group, version = api_version.split("/", 1)
        else:
            group, version = "", api_version

        plural_url = f"{kind.lower()}s"   

        return group, version, kind, plural_url

    @staticmethod
    def prepare_manifest(
        manifest: Dict[str, Any],
        resource_name: str,
        target_namespace: str,
    ) -> Dict[str, Any]:
 
        metadata = manifest.setdefault("metadata", {})
        metadata["name"] = resource_name
        metadata["namespace"] = target_namespace

        labels = metadata.setdefault("labels", {})
        labels["app.kubernetes.io/managed-by"] = "db-idp-platform"

        return manifest
