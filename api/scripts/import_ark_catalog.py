import argparse
from pathlib import Path

from src.database.session import SessionLocal
from src.utils.import_dinos import import_ark_catalog


def main() -> None:
    default_data_dir = Path(__file__).resolve().parent.parent / "import_data"

    parser = argparse.ArgumentParser(
        description="Importa mapas, dinos, relaciones y zonas de spawn desde los CSV de api/import_data/."
    )
    parser.add_argument(
        "--data-dir",
        default=default_data_dir,
        type=Path,
        help="Ruta a la carpeta import_data dentro de api.",
    )
    args = parser.parse_args()

    db = SessionLocal()

    try:
        stats = import_ark_catalog(db, args.data_dir)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print("Importacion completada:")
    for key, value in stats.items():
        print(f"- {key}: {value}")

if __name__ == "__main__":
    main()
