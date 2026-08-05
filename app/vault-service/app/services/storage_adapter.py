from sqlalchemy.orm import Session
from app.domain.db_models import Encrypt_DB


class StorageAdaption:
    def __init__(self, db_session: Session):
        self.db_session = db_session

    def save_creds(self, user_id: int, provider_type: str, alias: str, credentials: dict):
        new_creds = Encrypt_DB(
            user_id=user_id,
            provider_type=provider_type,
            alias=alias,
            credentials=credentials
        )

        self.db_session.add(new_creds)
        self.db_session.commit()
        self.db_session.refresh(new_creds)
        return new_creds

    def get_creds(self, user_id: int, alias: str):
        credentials_row = self.db_session.query(Encrypt_DB).filter(
            Encrypt_DB.user_id == user_id,
            Encrypt_DB.alias == alias
        ).first()
        return credentials_row