from fastapi import FastAPI
from api.v1.endpoints import router as discovery_router
from core.database import engine, Base
import models.db_models

app = FastAPI(title="Cluster Discovery Service", version="1.0.0")

@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(discovery_router)


@app.get("/health")
def root():
    return {"status": "success"}
