from fastapi import FastAPI, APIRouter
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from app.api.v1.routers import router_v1
from fastapi.responses import Response
from app.core.db import engine, Base
import app.domain.db_models

app = FastAPI(title="vault-service")

router = APIRouter()

app.include_router(router_v1)


@app.on_event("startup")
def init_tables():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def root():
    return {"status": "success"}

# Added new endpoint for Prometheus metrics
app.get("/metrics", include_in_schema=False)
def metrics_endpoint():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

