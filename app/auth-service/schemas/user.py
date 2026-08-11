from pydantic import BaseModel, EmailStr
import uuid
# Schemas for user registration and response

class UserCreate(BaseModel):
    email: EmailStr
    password: str

# User response
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str