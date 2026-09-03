from fastapi import FastAPI
from app.api.v1.routers import router

app = FastAPI(title="Provider Service", version="1.0.0")

app.include_router(router)


@app.get("/health")
def root():
    return {"status": "success"}