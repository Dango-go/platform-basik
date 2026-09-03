from fastapi import FastAPI
from api.v1.endpoints.auth import router 

app = FastAPI(title="Auth Microservice", version="1.0.0")

app.include_router(router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health")
def root():
    return {"status": "success"}

@app.get("/ready")
async def ready_check():
    return {"status": "ok"}