import argparse
from pathlib import Path

from src.database.session import SessionLocal
from src.utils.import_dinos import import_dinos_for_map

def main() -> None:
    parser = argparse.ArgumentParser(description="Importa dinos tameables para un mapa desde un TXT.")
    parser.add_argument("map_name", help="Nombre visible del mapa.")
    parser.add_argument("txt_path", help="Ruta al TXT con dinos tameables del mapa.")
    args = parser.parse_args()

    db = SessionLocal()

    try:
        stats = import_dinos_for_map(db, args.map_name, Path(args.txt_path))
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
