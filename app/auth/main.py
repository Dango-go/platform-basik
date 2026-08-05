from fastapi import FastAPI
from auth.api.v1.endpoints import auth

app = FastAPI(title="Auth Microservice", version="1.0.0")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ready")
async def ready_check():
    return {"status": "ok"}