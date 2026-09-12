import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

engine = create_async_engine(
    settings.DB_URL,
    json_serializer=lambda obj: json.dumps(obj, default=str)
)

SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()


async def db_session() -> AsyncSession:
    async with SessionLocal() as db:
        yield db
