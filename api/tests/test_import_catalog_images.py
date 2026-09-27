import csv
from pathlib import Path
import tempfile
import unittest

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

import src.models
from src.database.base import Base
from src.models.dino import Dino
from src.models.dino_map import DinoMap
from src.models.map import Map
from src.models.spawn_zone import SpawnZone
from src.utils.import_dinos import import_ark_catalog


class ImportCatalogImagesTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.data_dir = Path(self.temporary_directory.name)
        self._write_catalog()

        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine, expire_on_commit=False)()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()
        self.temporary_directory.cleanup()

    def _write_csv(self, filename: str, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
        with (self.data_dir / filename).open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    def _write_catalog(self, map_name: str = "The Island", dino_name: str = "Achatina") -> None:
        self._write_csv(
            "maps.csv",
            ["map_name", "game"],
            [{"map_name": map_name, "game": "ark_survival_ascended"}],
        )
        self._write_csv(
            "dinos.csv",
            ["dino_name", "game"],
            [{"dino_name": dino_name, "game": "ark_survival_ascended"}],
        )
        self._write_csv(
            "map_dinos.csv",
            ["map_name", "dino_name"],
            [{"map_name": map_name, "dino_name": dino_name}],
        )
        self._write_csv(
            "spawn_zones.csv",
            ["map_name", "zone_name"],
            [{"map_name": map_name, "zone_name": "North Beach"}],
        )

    def test_new_catalog_maps_and_dinos_receive_public_image_urls(self):
        stats = import_ark_catalog(self.session, self.data_dir)

        map_item = self.session.query(Map).one()
        dino = self.session.query(Dino).one()
        self.assertEqual(map_item.image_url, "/assets/maps/the_island.webp")
        self.assertEqual(dino.image_url, "/assets/dinos/achatina.webp")
        self.assertEqual(stats["created_maps"], 1)
        self.assertEqual(stats["created_dinos"], 1)
        self.assertEqual(self.session.query(DinoMap).count(), 1)
        self.assertEqual(self.session.query(SpawnZone).count(), 1)

    def test_existing_missing_image_urls_are_filled_and_counted_as_updates(self):
        self.session.add_all(
            [
                Map(name="The Island", game="ark_survival_ascended", image_url=None),
                Dino(name="Achatina", game="ark_survival_ascended", image_url="   "),
            ]
        )
        self.session.commit()

        stats = import_ark_catalog(self.session, self.data_dir)

        self.assertEqual(self.session.query(Map).one().image_url, "/assets/maps/the_island.webp")
        self.assertEqual(self.session.query(Dino).one().image_url, "/assets/dinos/achatina.webp")
        self.assertEqual(stats["updated_maps"], 1)
        self.assertEqual(stats["updated_dinos"], 1)
        self.assertEqual(stats["created_maps"], 0)
        self.assertEqual(stats["created_dinos"], 0)

    def test_existing_empty_image_urls_are_filled_and_counted_as_updates(self):
        self.session.add_all(
            [
                Map(name="The Island", game="ark_survival_ascended", image_url=""),
                Dino(name="Achatina", game="ark_survival_ascended", image_url=""),
            ]
        )
        self.session.commit()

        stats = import_ark_catalog(self.session, self.data_dir)

        self.assertEqual(self.session.query(Map).one().image_url, "/assets/maps/the_island.webp")
        self.assertEqual(self.session.query(Dino).one().image_url, "/assets/dinos/achatina.webp")
        self.assertEqual(stats["updated_maps"], 1)
        self.assertEqual(stats["updated_dinos"], 1)

    def test_existing_custom_image_urls_are_preserved(self):
        self.session.add_all(
            [
                Map(
                    name="The Island",
                    game="ark_survival_ascended",
                    image_url="https://images.example.test/custom-map.webp",
                ),
                Dino(
                    name="Achatina",
                    game="ark_survival_ascended",
                    image_url="https://images.example.test/custom-dino.webp",
                ),
            ]
        )
        self.session.commit()

        stats = import_ark_catalog(self.session, self.data_dir)

        self.assertEqual(
            self.session.query(Map).one().image_url,
            "https://images.example.test/custom-map.webp",
        )
        self.assertEqual(
            self.session.query(Dino).one().image_url,
            "https://images.example.test/custom-dino.webp",
        )
        self.assertEqual(stats["updated_maps"], 0)
        self.assertEqual(stats["updated_dinos"], 0)

    def test_reimport_does_not_duplicate_catalog_rows_or_recount_image_updates(self):
        import_ark_catalog(self.session, self.data_dir)

        stats = import_ark_catalog(self.session, self.data_dir)

        self.assertEqual(stats["created_maps"], 0)
        self.assertEqual(stats["updated_maps"], 0)
        self.assertEqual(stats["created_dinos"], 0)
        self.assertEqual(stats["updated_dinos"], 0)
        self.assertEqual(stats["linked_dinos"], 0)
        self.assertEqual(stats["reactivated_links"], 0)
        self.assertEqual(stats["created_spawn_zones"], 0)
        self.assertEqual(stats["updated_spawn_zones"], 0)
        self.assertEqual(self.session.query(func.count(Map.id)).scalar(), 1)
        self.assertEqual(self.session.query(func.count(Dino.id)).scalar(), 1)
        self.assertEqual(self.session.query(func.count(DinoMap.id)).scalar(), 1)
        self.assertEqual(self.session.query(func.count(SpawnZone.id)).scalar(), 1)

    def test_accented_and_spaced_names_match_public_asset_slug_format(self):
        self._write_catalog(map_name="Fjördur: Île", dino_name="Équus, Night")

        import_ark_catalog(self.session, self.data_dir)

        self.assertEqual(self.session.query(Map).one().image_url, "/assets/maps/fjordur_ile.webp")
        self.assertEqual(self.session.query(Dino).one().image_url, "/assets/dinos/equus_night.webp")


if __name__ == "__main__":
    unittest.main()
