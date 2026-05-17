import argparse
from pathlib import Path

from src.database.session import SessionLocal
from src.utils.import_dinos import import_ark_catalog

def main() -> None:
    default_data_dir = Path(__file__).resolve().parents[2] / "data"

    parser = argparse.ArgumentParser(description="Importa dinos tameables, imagenes y relaciones por mapa desde data/.")
    parser.add_argument(
        "--data-dir",
        default=str(default_data_dir),
        help="Ruta a la carpeta data del proyecto.",
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
