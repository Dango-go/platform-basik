from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession # execute()
from sqlalchemy.future import select
from core.db import get_db
from core.security import verify_password, get_password_hash, create_access_token
from models.user import User_table
from schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

# Registration
@router.post("/register", response_model=UserResponse)
# Depends(get_db) will call get_db() function to create a new session for each request and pass it to the db parameter
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User_table).where(User_table.email == user_in.email))
    if result.scalars().first():  # if first element is not None, means user already exists
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create a new user in db schema
    user = User_table(
        email = user_in.email,
        hashed_password=get_password_hash(user_in.password)
    )
    # Add the new user to the database. All commands did in session AsyncSession in cache
    db.add(user)
    await db.commit() # commit the changes to the database and get status from the db
    await db.refresh(user)  # update the user object with the new data from the db, including the generated id
    return user # Return user json object with id, email, is_active fields.  

# Login
@router.post("/token", response_model=Token)
async def login(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # select(User) == users.id users.email ...   # user    == user request json field email 
    result = await db.execute(select(User_table).where(User_table.email == user_in.email))
    # Get the first user from the response db. If no user found, return None
    user = result.scalars().first() # user = None or user_email, user_hashed_password, user_is_active, user_is_superuser

    # If user is not found or password is incorrect, raise HTTPException with status code 401
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Client program will receive access token and save it in local storage or cookie. Then, for each request to the server, client will send this access token in the Authorization header. Server will verify the access token and allow or deny access to the requested resource.
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}