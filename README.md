# Reto IRk

Aplicación web para organizar y transmitir desafíos de ARK: administra
jugadores, dinos, mapas y zonas de spawn, sortea asignaciones con ruletas y
muestra el progreso en un overlay para OBS que se actualiza en tiempo real.

> **Aviso:** proyecto de fans sin fines comerciales. No está afiliado,
> patrocinado ni aprobado por Studio Wildcard. ARK: Survival Evolved y
> ARK: Survival Ascended son marcas de sus respectivos dueños.

## Stack

- **API:** Python, FastAPI, SQLAlchemy 2, PostgreSQL, JWT y WebSocket.
- **Web:** React 19, Vite, React Router y Tailwind CSS, con pnpm.

## Estructura

```text
reto-irk/
├── api/   # backend FastAPI (ver api/readme.md)
└── web/   # frontend React (ver web/README.md)
```

## Inicio rápido

1. Configura y levanta la API siguiendo [api/readme.md](api/readme.md).
   Necesitas PostgreSQL y un archivo `.env` creado a partir de `.env.example`.
2. Importa el catálogo de mapas, dinos y zonas de spawn (sección
   "Importar el catálogo ARK" del mismo README).
3. Levanta el frontend siguiendo [web/README.md](web/README.md).
4. Opcional: agrega las imágenes (siguiente sección).

## Imágenes

El repositorio **no incluye imágenes** (íconos de dinos, mapas ni logos de los
juegos), porque pertenecen a sus respectivos dueños. Puedes agregarlas de dos
formas:

- **Archivos locales:** colócalos en `web/public/` con la estructura descrita
  en la sección "Imágenes" de [web/README.md](web/README.md).
- **URLs:** desde el panel de administración puedes indicar una URL de imagen
  para cada dino, mapa o jugador.

## Licencia

Código bajo licencia [MIT](LICENSE) © 2026 IRkwu. La licencia cubre solo el
código de este repositorio, no los nombres, imágenes ni otros contenidos de ARK.
