from pathlib import Path
import csv
import re

from sqlalchemy.orm import Session

from src.models.dino import Dino
from src.models.dino_map import DinoMap
from src.models.map import Map
from src.models.spawn_zone import SpawnZone

ASSET_IMAGE_EXTENSION = ".webp"
MAP_GAME_VALUES = {"ark_survival_evolved", "ark_survival_ascended"}

def _read_csv_rows(path: Path, required_columns: set[str]) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Archivo CSV no encontrado: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        columns = set(reader.fieldnames or [])
        missing_columns = required_columns - columns

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"Al CSV {path.name} le faltan columnas: {missing}")

        return [
            {key: (value or "").strip() for key, value in row.items()}
            for row in reader
            if any((value or "").strip() for value in row.values())
        ]

def _name_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.strip().lower())

def _asset_file_stem(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")

def _public_asset_url(asset_dir: str, name: str) -> str | None:
    file_stem = _asset_file_stem(name)
    if not file_stem:
        return None

    return f"/assets/{asset_dir}/{file_stem}{ASSET_IMAGE_EXTENSION}"

def _should_replace_dino_name(current_name: str, candidate_name: str) -> bool:
    current_key = _name_key(current_name)
    candidate_key = _name_key(candidate_name)

    if current_key != candidate_key:
        return False

    if current_name == current_name.lower() and candidate_name != candidate_name.lower():
        return True

    return " " not in current_name and " " in candidate_name

def _get_or_create_map(
    db: Session,
    map_name: str,
    game: str,
    image_url: str | None = None,
) -> tuple[Map, bool, bool]:
    map_key = _name_key(map_name)
    map_item = next(
        (
            map_item
            for map_item in db.query(Map).all()
            if _name_key(map_item.name) == map_key
        ),
        None,
    )
    updated = False

    if map_item:
        if not map_item.is_active:
            map_item.is_active = True
            updated = True

        if image_url and map_item.image_url != image_url:
            map_item.image_url = image_url
            updated = True

        if game and map_item.game != game:
            map_item.game = game
            updated = True

        return map_item, False, updated

    map_item = Map(
        name=map_name,
        game=game,
        image_url=image_url,
        is_active=True,
    )

    db.add(map_item)
    db.flush()

    return map_item, True, False

def _get_or_create_dino(
    db: Session,
    name: str,
    game: str,
    image_url: str | None = None,
) -> tuple[Dino, bool, bool]:
    name_key = _name_key(name)
    dino = next(
        (
            dino
            for dino in db.query(Dino).all()
            if _name_key(dino.name) == name_key
        ),
        None,
    )
    updated = False

    if dino:
        if not dino.is_active:
            dino.is_active = True
            updated = True

        if image_url and dino.image_url != image_url:
            dino.image_url = image_url
            updated = True

        if _should_replace_dino_name(dino.name, name):
            dino.name = name
            updated = True

        if game and dino.game != game:
            dino.game = game
            updated = True

        return dino, False, updated

    dino = Dino(
        name=name,
        is_active=True,
        game=game,
        image_url=image_url,
    )

    db.add(dino)
    db.flush()

    return dino, True, False

def _link_dino_to_map(db: Session, dino: Dino, map_item: Map) -> tuple[bool, bool]:
    relation = (
        db.query(DinoMap)
        .filter(
            DinoMap.map_id == map_item.id,
            DinoMap.dino_id == dino.id,
        )
        .one_or_none()
    )

    if relation:
        if not relation.is_active:
            relation.is_active = True
            return False, True

        return False, False

    relation = DinoMap(
        map_id=map_item.id,
        dino_id=dino.id,
        is_active=True,
    )

    db.add(relation)

    return True, False

def _get_or_create_spawn_zone(
    db: Session,
    map_item: Map,
    name: str,
) -> tuple[SpawnZone, bool, bool]:
    zone_key = _name_key(name)
    spawn_zone = next(
        (
            spawn_zone
            for spawn_zone in map_item.spawn_zones
            if _name_key(spawn_zone.name) == zone_key
        ),
        None,
    )
    updated = False

    if spawn_zone:
        if not spawn_zone.is_active:
            spawn_zone.is_active = True
            updated = True

        return spawn_zone, False, updated

    spawn_zone = SpawnZone(
        map_id=map_item.id,
        name=name,
        is_active=True,
    )

    db.add(spawn_zone)
    db.flush()

    return spawn_zone, True, False

def import_ark_catalog(
    db: Session,
    data_dir: str | Path,
) -> dict[str, int]:
    data_path = Path(data_dir)
    maps_path = data_path / "maps.csv"
    dinos_path = data_path / "dinos.csv"
    map_dinos_path = data_path / "map_dinos.csv"
    spawn_zones_path = data_path / "spawn_zones.csv"

    map_rows = _read_csv_rows(maps_path, {"map_name", "game"})
    dino_rows = _read_csv_rows(dinos_path, {"dino_name", "game"})
    map_dino_rows = _read_csv_rows(map_dinos_path, {"map_name", "dino_name"})
    spawn_zone_rows = _read_csv_rows(spawn_zones_path, {"map_name", "zone_name"})

    invalid_map_rows = [
        row["map_name"] or "<sin nombre>"
        for row in map_rows
        if row["game"] not in MAP_GAME_VALUES
    ]
    if invalid_map_rows:
        invalid_maps = ", ".join(invalid_map_rows)
        raise ValueError(f"Mapas con game ausente o no admitido: {invalid_maps}")

    stats = {
        "created_dinos": 0,
        "updated_dinos": 0,
        "created_maps": 0,
        "updated_maps": 0,
        "linked_dinos": 0,
        "reactivated_links": 0,
        "created_spawn_zones": 0,
        "updated_spawn_zones": 0,
        "missing_maps": 0,
        "missing_dinos": 0,
    }
    maps_by_key: dict[str, Map] = {}
    dinos_by_key: dict[str, Dino] = {}
    missing_map_keys: set[str] = set()
    missing_dino_keys: set[str] = set()

    for row in map_rows:
        map_name = row["map_name"]
        if not map_name:
            continue

        map_game = row["game"]
        map_image_url = _public_asset_url("maps", map_name)
        map_item, map_created, map_updated = _get_or_create_map(
            db,
            map_name,
            game=map_game,
            image_url=map_image_url,
        )
        maps_by_key[_name_key(map_name)] = map_item
        stats["created_maps"] += int(map_created)
        stats["updated_maps"] += int(map_updated)

    for row in dino_rows:
        dino_name = row["dino_name"]
        if not dino_name:
            continue

        dino_game = row["game"]
        dino_image_url = _public_asset_url("dinos", dino_name)
        dino, created, updated = _get_or_create_dino(
            db,
            name=dino_name,
            game=dino_game,
            image_url=dino_image_url,
        )
        dinos_by_key[_name_key(dino_name)] = dino
        stats["created_dinos"] += int(created)
        stats["updated_dinos"] += int(updated)

    for row in map_dino_rows:
        map_name = row["map_name"]
        dino_name = row["dino_name"]
        if not map_name or not dino_name:
            continue

        map_key = _name_key(map_name)
        dino_key = _name_key(dino_name)
        map_item = maps_by_key.get(map_key)
        dino = dinos_by_key.get(dino_key)

        if map_item is None:
            missing_map_keys.add(map_key)
            continue

        if dino is None:
            missing_dino_keys.add(dino_key)
            continue

        linked, reactivated = _link_dino_to_map(db, dino, map_item)
        stats["linked_dinos"] += int(linked)
        stats["reactivated_links"] += int(reactivated)

    for row in spawn_zone_rows:
        map_name = row["map_name"]
        zone_name = row["zone_name"]
        if not map_name or not zone_name:
            continue

        map_key = _name_key(map_name)
        map_item = maps_by_key.get(map_key)
        if map_item is None:
            missing_map_keys.add(map_key)
            continue

        _, created, updated = _get_or_create_spawn_zone(
            db,
            map_item,
            zone_name,
        )
        stats["created_spawn_zones"] += int(created)
        stats["updated_spawn_zones"] += int(updated)

    stats["missing_maps"] = len(missing_map_keys)
    stats["missing_dinos"] = len(missing_dino_keys)

    db.commit()

    return stats
