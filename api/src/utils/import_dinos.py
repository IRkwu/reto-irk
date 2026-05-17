from pathlib import Path

from sqlalchemy.orm import Session

from src.models.dino import Dino
from src.models.dino_map import DinoMap
from src.models.map import Map
from src.utils.dino_normalizer import normalize_dino_slug, normalize_map_slug

def _read_txt_lines(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"Archivo TXT no encontrado: {path}")

    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

def _map_name_from_file(path: Path) -> str:
    stem = path.stem.strip().lower()

    return " ".join(word.capitalize() for word in stem.split("-"))

def _display_name_from_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.replace("_", "-").split("-") if part) or slug

def _should_replace_dino_name(current_name: str, candidate_name: str) -> bool:
    current_slug = normalize_dino_slug(current_name)
    candidate_slug = normalize_dino_slug(candidate_name)

    if current_slug != candidate_slug:
        return False

    if current_name == current_name.lower() and candidate_name != candidate_name.lower():
        return True

    return " " not in current_name and " " in candidate_name

def _get_or_create_map(db: Session, map_name: str) -> tuple[Map, bool]:
    map_slug = normalize_map_slug(map_name)
    map_item = db.query(Map).filter(Map.slug == map_slug).one_or_none()

    if map_item:
        if not map_item.is_active:
            map_item.is_active = True

        return map_item, False

    map_item = Map(
        slug=map_slug,
        name=map_name,
        is_active=True,
    )

    db.add(map_item)
    db.flush()

    return map_item, True

def _get_or_create_dino(
    db: Session,
    name: str,
    image_url: str | None = None,
) -> tuple[Dino, bool, bool]:
    slug = normalize_dino_slug(name)
    dino = db.query(Dino).filter(Dino.slug == slug).one_or_none()
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

        return dino, False, updated

    dino = Dino(
        name=name,
        slug=slug,
        is_active=True,
        game="ark_survival_evolved",
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

def load_dino_image_urls(catalog_path: str | Path, image_path: str | Path) -> dict[str, str]:
    catalog_lines = _read_txt_lines(Path(catalog_path))
    image_lines = _read_txt_lines(Path(image_path))

    if len(catalog_lines) != len(image_lines):
        raise ValueError(
            "Los archivos de dinos e imagenes deben tener la misma cantidad de lineas "
            f"({len(catalog_lines)} dinos vs {len(image_lines)} imagenes)."
        )

    return {
        normalize_dino_slug(name): image_url
        for name, image_url in zip(catalog_lines, image_lines, strict=True)
    }

def import_dinos_for_map(db: Session, map_name: str, txt_path: str | Path) -> dict[str, int]:
    map_item, _ = _get_or_create_map(db, map_name)

    created_dinos = 0
    linked_dinos = 0
    reactivated_links = 0

    for name in _read_txt_lines(Path(txt_path)):
        dino, created, _ = _get_or_create_dino(db, name)
        linked, reactivated = _link_dino_to_map(db, dino, map_item)

        created_dinos += int(created)
        linked_dinos += int(linked)
        reactivated_links += int(reactivated)

    db.commit()

    return {
        "created_dinos": created_dinos,
        "linked_dinos": linked_dinos,
        "reactivated_links": reactivated_links,
    }

def import_ark_catalog(
    db: Session,
    data_dir: str | Path,
) -> dict[str, int]:
    data_path = Path(data_dir)
    catalog_path = data_path/"tameable-dinos-ark.txt"
    image_path = data_path/"images-tameable-dinos-ark.txt"
    maps_path = data_path/"tameable-dinos-per-map"

    if not maps_path.exists():
        raise FileNotFoundError(f"Carpeta de dinos por mapa no encontrada: {maps_path}")

    image_urls_by_slug = load_dino_image_urls(catalog_path, image_path)

    stats = {
        "created_dinos": 0,
        "updated_dinos": 0,
        "created_maps": 0,
        "linked_dinos": 0,
        "reactivated_links": 0,
        "map_only_dinos": 0,
    }
    map_only_slugs: set[str] = set()

    for catalog_name in _read_txt_lines(catalog_path):
        slug = normalize_dino_slug(catalog_name)
        dino_name = _display_name_from_slug(catalog_name)
        _, created, updated = _get_or_create_dino(
            db,
            name=dino_name,
            image_url=image_urls_by_slug.get(slug),
        )

        stats["created_dinos"] += int(created)
        stats["updated_dinos"] += int(updated)

    for map_file in sorted(maps_path.glob("*.txt")):
        map_item, map_created = _get_or_create_map(db, _map_name_from_file(map_file))
        stats["created_maps"] += int(map_created)

        for dino_name in _read_txt_lines(map_file):
            slug = normalize_dino_slug(dino_name)
            if slug not in image_urls_by_slug:
                map_only_slugs.add(slug)

            dino, created, updated = _get_or_create_dino(
                db,
                name=dino_name,
                image_url=image_urls_by_slug.get(slug),
            )
            linked, reactivated = _link_dino_to_map(db, dino, map_item)

            stats["created_dinos"] += int(created)
            stats["updated_dinos"] += int(updated)
            stats["linked_dinos"] += int(linked)
            stats["reactivated_links"] += int(reactivated)

    stats["map_only_dinos"] = len(map_only_slugs)

    db.commit()

    return stats
