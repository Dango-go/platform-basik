from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "db-catalog-service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://db-info:db-info@postgres:5432/idp_catalog"

    class Config:
        case_sensitive = True


settings = Settings()
