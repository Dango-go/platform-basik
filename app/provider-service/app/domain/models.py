from dataclasses import dataclass
from app.core.db import Base
from sqlalchemy import Column, Integer, String



class Provider_DB(Base):
    __tablename__ = "providers"
    user_id = Column(Integer, primary_key=True)
    alias = Column(String, nullable=False)
    provider_type = Column(String, nullable=False)
    credentials_status = Column(String, nullable=False)
    
