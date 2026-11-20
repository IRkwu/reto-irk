# Reto IRk — Backend

Backend de Reto IRk para administrar desafíos de ARK, jugadores, dinos, mapas,
zonas de spawn, eventos de partida y el overlay público para OBS.

## Stack

- Python + FastAPI
- SQLAlchemy 2 y PostgreSQL
- Alembic para migraciones
- JWT para autenticación
- WebSocket para actualizaciones de desafíos

## Requisitos

- Python 3.11 o superior
- PostgreSQL

## Instalación

Desde la raíz del repositorio:

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Configura `.env` antes de iniciar la API. Las variables obligatorias son:

```env
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/nombre_db
SECRET_KEY=clave_segura
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_segura
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

También puedes ajustar `ALGORITHM` y `ACCESS_TOKEN_EXPIRE_MINUTES`.

## Desarrollo

```powershell
cd api
.\.venv\Scripts\Activate.ps1
uvicorn src.main:app --reload
```

La API queda disponible en `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Importar el catálogo ARK

Los CSV se encuentran en `api/import_data/`. Para importar mapas, dinos,
relaciones mapa-dino y zonas de spawn:

```powershell
cd api
.\.venv\Scripts\python.exe -m scripts.import_ark_catalog
```

Puedes indicar otra carpeta de datos con `--data-dir`.

## Grupos principales de endpoints

| Grupo | Prefijo o ruta |
| --- | --- |
| Autenticación | `/auth` |
| Dinos | `/dinos` |
| Mapas y dinos | `/maps` |
| Zonas de spawn | `/maps/{map_id}/spawn-zones` |
| Jugadores | `/players` |
| Desafíos | `/challenges` |
| Jugadores del desafío | `/challenges/{challenge_id}/players` |
| Asignaciones | `/challenges/{challenge_id}/assignments` |
| Ruletas | `/challenges/{challenge_id}/roulette` |
| Gameplay y eventos | `/challenges/{challenge_id}/...` |
| Overlay público | `/public/challenges/{challenge_id}/...` |
| WebSocket | `/ws/challenges/{challenge_id}` |

El overlay público no requiere autenticación. Las rutas administrativas usan
el token JWT obtenido desde `/auth/token`.

## Estructura

```text
api/
├── src/
│   ├── core/          # configuración, seguridad y reglas
│   ├── database/      # engine, sesión e inicialización
│   ├── models/        # modelos SQLAlchemy
│   ├── repositories/  # acceso a datos
│   ├── routers/       # endpoints HTTP y WebSocket
│   └── schemas/       # esquemas Pydantic
├── import_data/       # CSV del catálogo ARK
└── scripts/           # utilidades de importación
```

## Verificación rápida

```powershell
python -m compileall src
```
