from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from src.core.config import settings
from src.core.security import create_access_token, get_current_admin
from src.schemas.auth import CurrentUser, Token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    if (
        form_data.username != settings.ADMIN_USERNAME
        or form_data.password != settings.ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": form_data.username})
    return Token(access_token=access_token)

@router.get("/me", response_model=CurrentUser)
def get_me(current_user: dict = Depends(get_current_admin)) -> CurrentUser:
    return CurrentUser(username=current_user["username"])
