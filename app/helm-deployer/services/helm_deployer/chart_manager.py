import os, shutil, tempfile
from pathlib import Path
import httpx
import tarfile, gzip
import yaml


class ChartManager:
    def __init__(self, base_temp_dir: str = "/tmp/helm_charts"):
        self.base_temp_dir = Path(base_temp_dir)
        self.base_temp_dir.mkdir(parents=True, exist_ok=True)

    async def pull_and_unpack_chart(self, repo_url: str, chart_name: str, chart_version: str, release_name: str):
        # Local path for dir
        release_dir = self.base_temp_dir / release_name
        release_dir.mkdir(parents=True, exist_ok=True)

        #url
        url = repo_url.rstrip("/")
        chart_url = f"{url}/{chart_name}-{chart_version}.tgz"

        # netrequest + install
        async with httpx.client() as client: 
            # response.content had bytes of the .tgz file 
            response = await client.get(chart_url, follow_redirects=True)
            if response.status_code != 200:
                raise Exception(f"Failed to download chart from {chart_url}, status: {response.status_code}")

            archive_path = release_dir / f"{chart_name}.tgz"
            # save response.content in dir of archive_path
            archive_path.write_bytes(response.content)


        with tarfile.open(archive_path, "r:gz") as tar:
            # unpack .tgz
            tar.extractall(path=release_dir)

            # rm .tgz file after unpacking
            archive_path.unlink(missing_ok=True)
 
        chart_extracted_path = release_dir / chart_name
        if chart_extracted_path.exists():
            return str(chart_extracted_path)    
        
        return str(release_dir)
    

    # read and return content of file  
    async def read_chart_file(self, release_name: str, file_path: str) -> str:

        target_file = self.base_temp_dir / release_name / file_path
        if not target_file.exists():
            raise FileNotFoundError(f"File {file_path} from release {release_name} not found.")
        
        return target_file.read_text(encoding="utf-8")

    async def save_chart_file(self, release_name: str, file_path: str, content: str) -> str:
 
        target_file = self.base_temp_dir / release_name / file_path
        if not target_file.parent.exists():
            target_file.parent.mkdir(parents=True, exist_ok=True)

        target_file.write_text(content, encoding="utf-8")
        return str(target_file)
 