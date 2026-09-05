from datetime import datetime, timezone
from app.core.db import Base
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

class Encrypt_DB(Base):
    __tablename__ = "vault_db"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    provider_type = Column(String, nullable=False)
    alias = Column(String, nullable=False)
    credentials = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))



