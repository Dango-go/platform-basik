from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_SERVICE_NAME: str = "Vault Service"
    API_V1: str = "/api/v1"
    POSTGRES_USER: str = "vault-admin"
    POSTGRES_PASSWORD: str = "vault-admin"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB_NAME: str = "vault_storage"

    @property
    def DB_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB_NAME}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Default attributes 
settings = Settings()




