from pathlib import Path

from sqlalchemy.orm import Session

from src.models.dino import Dino
from src.models.dino_map import DinoMap
from src.models.map import Map
from src.utils.dino_normalizer import (default_dino_image_url, normalize_dino_slug, normalize_map_slug)

def import_dinos_for_map(db: Session, map_name: str, txt_path: str | Path) -> dict[str, int]:
    path = Path(txt_path)

    if not path.exists():
        raise FileNotFoundError(f"Archivo TXT no encontrado: {path}")

    map_slug = normalize_map_slug(map_name)

    map_item = db.query(Map).filter(Map.slug == map_slug).one_or_none()

    if not map_item:
        map_item = Map(
            slug=map_slug,
            name=map_name,
            is_active=True,
        )

        db.add(map_item)
        db.flush()

    created_dinos = 0
    linked_dinos = 0
    reactivated_links = 0

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        name = raw_line.strip()

        if not name:
            continue

        slug = normalize_dino_slug(name)

        dino = db.query(Dino).filter(Dino.slug == slug).one_or_none()

        if not dino:
            dino = Dino(
                name=name,
                slug=slug,
                is_active=True,
                game="ark_survival_evolved",
                image_url=default_dino_image_url(slug),
            )

            db.add(dino)
            db.flush()
            created_dinos += 1

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
                reactivated_links += 1
        else:
            relation = DinoMap(
                map_id=map_item.id,
                dino_id=dino.id,
                is_active=True,
            )

            db.add(relation)
            linked_dinos += 1

    db.commit()

    return {
        "created_dinos": created_dinos,
        "linked_dinos": linked_dinos,
        "reactivated_links": reactivated_links,
    }
