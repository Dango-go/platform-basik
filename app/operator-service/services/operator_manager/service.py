from core.dependencies import db_session
from services.operator_manager.validator import Validator
from services.operator_manager.crd_manager import BuilderCRD
from services.operator_manager.runner import CRDRunner

class ServiceYAMLManager:
    def __init__(self, db: db_session):
        self.validator = Validator()
        self.buidler = BuilderCRD()
        self.runner = CRDRunner()

    def 
