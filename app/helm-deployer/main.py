from fastapi import FastAPI
from api.v1.endpoints.endpoints import router as endpoints_router


app = FastAPI()

app.include_router(endpoints_router)

@app.get("/healtz")
async def healtz():
    return {"status": "ok", "service": "helm deployer"}