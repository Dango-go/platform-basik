from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_SERVICE_NAME: str = "Provider Service"
    API_V1: str = "/api/v1"
    POSTGRES_USER: str = "provider"
    POSTGRES_PASSWORD: str = "provider"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB_NAME: str = "provider_db"

    @property
    def DB_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB_NAME}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Default attributes 
settings = Settings()





