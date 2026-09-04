from sqlalchemy.orm import Session
from app.domain.db_models import Encrypt_DB


class StorageAdaption:
    def __init__(self, db_session: Session):
        self.db_session = db_session

    def save_creds(self, creds_object: Encrypt_DB):

        self.db_session.add(creds_object)
        self.db_session.commit()
        self.db_session.refresh(creds_object)
        return creds_object

    def get_creds(self, user_id: int, alias: str):
        credentials_row = self.db_session.query(Encrypt_DB).filter(
            Encrypt_DB.user_id == user_id,
            Encrypt_DB.alias == alias
        ).first()
        return credentials_row