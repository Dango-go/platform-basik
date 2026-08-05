from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(settings.DB_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def db_session():
    db = SessionLocal()
    try:
        yield db  # stoping def and return object db in router.py 
    finally:  # Any time
        db.close()