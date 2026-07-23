# Reto IRk — Frontend

Frontend de Reto IRk para administrar desafíos de ARK, jugadores,
dinos, mapas y zonas de spawn, además de configurar y visualizar el overlay público para OBS.

## Stack

- React 19
- Vite
- React Router
- Iconify
- Tailwind CSS y CSS por componente/página
- pnpm

## Requisitos

- Node.js compatible con Vite 7
- pnpm
- API de Reto IRk ejecutándose localmente o en una URL accesible

## Instalación

```powershell
cd web
pnpm install
Copy-Item .env.example .env
```

Configura `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_OVERLAY_REFRESH_MS=3000
```

`VITE_WS_URL` puede omitirse si el WebSocket usa el mismo host de la API.

## Desarrollo

```powershell
cd web
pnpm dev
```

La aplicación queda disponible normalmente en `http://localhost:5173`.
Para probar el frontend completo, inicia también la API en `http://localhost:8000`.

## Scripts

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con Vite |
| `pnpm build` | Compilación de producción en `dist/` |
| `pnpm preview` | Servir localmente la compilación |
| `pnpm lint` | Ejecutar ESLint |

## Rutas

### Públicas

- `/login`: inicio de sesión
- `/obs/:challengeId`: overlay público para OBS
- `/overlay/:challengeId`: alias del overlay público

### Protegidas

- `/`: listado y creación de desafíos
- `/challenges/:challengeId`: ejecución de un desafío
- `/challenges/:challengeId/edit`: edición de jugadores y asignaciones
- `/players`: administración de jugadores
- `/dinos`: administración del catálogo de dinos
- `/maps`: administración de mapas, zonas y dinos disponibles
- `/obs/config`: configuración global del overlay OBS

## Estructura

```text
web/src/
├── components/   # componentes reutilizables y renderer del overlay
├── context/      # autenticación y estado compartido
├── hooks/        # hooks de UI y WebSocket
├── i18n/         # diccionarios y traducciones
├── pages/        # pantallas principales
├── routes/       # rutas y guards
├── services/     # llamadas HTTP y WebSocket
├── styles/       # estilos globales y tokens visuales
└── utils/        # settings, filtros, temas y assets
```

Los iconos de juegos y dinos están en `public/assets/`. Las imágenes públicas
se sirven desde la raíz, por ejemplo `/assets/dinos_icons/raptor.webp`.

## Autenticación e integración

El token JWT se guarda en `localStorage` y se añade automáticamente a las
peticiones protegidas mediante `src/services/apiClient.js`. Las rutas públicas
del overlay usan peticiones sin autenticación. Los cambios de un desafío se
sincronizan mediante WebSocket cuando corresponde.
