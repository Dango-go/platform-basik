from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class ResourcePresetEntity(Base):
    __tablename__ = "resource_presets"

    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, ForeignKey("database_engines.id"), nullable=False)  # engine_id == database_engines.id 
    preset_name = Column(String, nullable=False)  # e.g., "Small", "Medium", "Large"
    cpu_cores = Column(Float, nullable=False)  # e.g., 1.0
    ram_gb = Column(Float, nullable=False)  # e.g., 2.0
    storage_gb = Column(Integer, nullable=False)  # e.g., 10

    # Resources
    

    engine = relationship("DatabaseEngineEntity", back_populates="presets")
