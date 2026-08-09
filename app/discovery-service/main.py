from fastapi import FastAPI
from api.v1.endpoints import router as discovery_router

app = FastAPI(title="Cluster Discovery Service", version="1.0.0")

app.include_router(discovery_router)


@app.get("/")
async def root():
    return {"message": "Cluster Discovery Service is running"}
