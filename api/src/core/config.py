import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "240"))

    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD")

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS")

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        if not self.CORS_ORIGINS:
            return []
    
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

settings = Settings()

# Validaciones
if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida en el archivo .env")

if not settings.SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está definida en el archivo .env")

if not settings.ADMIN_USERNAME:
    raise RuntimeError("ADMIN_USERNAME no está definido en el archivo .env")

if not settings.ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_PASSWORD no está definido en el archivo .env")
