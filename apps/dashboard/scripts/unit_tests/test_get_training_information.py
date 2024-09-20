import os
import sys
import unittest
from unittest.mock import patch, MagicMock
import geojson

import django
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

from apps.dashboard.scripts.get_training_information import (
    TrainingObject,
    __get_department_from_coord__,
    __get_commune_from_coord__,
    __get_module__,
    __get_trainer__,
    __get_items__,
    get_training_data_from_db,
)


class TestGetTrainingInformation(unittest.TestCase):
    def setUp(self):
        self.cursor_mock = MagicMock()

    def test_training_object(self):
        data = {
            "latitude": 12.34,
            "longitude": 56.78,
            "number_of_participant": 10,
            "datetime": "2023-06-04",
            "module": {"title": "Module A", "category": "Category A"},
            "trainer": {
                "firstname": "John",
                "lastname": "Doe",
                "institution": "ABC Institution",
            },
            "department": "Department A",
            "commune": "Commune A",
        }
        training_obj = TrainingObject(**data)

        self.assertEqual(training_obj.latitude, 12.34)
        self.assertEqual(training_obj.longitude, 56.78)
        self.assertEqual(training_obj.number_of_participant, 10)
        self.assertEqual(training_obj.datetime, "2023-06-04")
        self.assertEqual(
            training_obj.module, {"title": "Module A", "category": "Category A"}
        )
        self.assertEqual(
            training_obj.trainer,
            {"firstname": "John", "lastname": "Doe", "institution": "ABC Institution"},
        )
        self.assertEqual(training_obj.department, "Department A")
        self.assertEqual(training_obj.commune, "Commune A")

    def test_get_department_from_coord(self):
        latitude = 12.34
        longitude = 56.78
        country = "Benin"

        with patch("builtins.open"), patch("geojson.load"):
            department = __get_department_from_coord__(latitude, longitude, country)
            self.assertEqual(department, "Unknown")

    def test_get_commune_from_coord(self):
        latitude = 12.34
        longitude = 56.78
        country = "Benin"

        with patch("builtins.open"), patch("geojson.load"):
            commune = __get_commune_from_coord__(latitude, longitude, country)
            self.assertEqual(commune, "Unknown")

    def test_get_module(self):
        module_id = 1

        self.cursor_mock.fetchall.return_value = [("Module A", "Category A")]

        module = __get_module__(self.cursor_mock, module_id)
        self.assertEqual(module, {"title": "Module A", "category": "Category A"})

    def test_get_trainer(self):
        trainer_id = 1

        self.cursor_mock.fetchall.return_value = [("John", "Doe", "ABC Institution")]

        trainer = __get_trainer__(self.cursor_mock, trainer_id)
        self.assertEqual(
            trainer,
            {"firstname": "John", "lastname": "Doe", "institution": "ABC Institution"},
        )

    def test_get_items(self):
        self.cursor_mock.fetchall.return_value = [
            (12.34, 56.78, 10, 1, 1, "2023-06-04"),
            (23.45, 67.89, 5, 2, 2, "2023-06-05"),
        ]

        with patch("apps.dashboard.scripts.get_training_information.__get_department_from_coord__"), patch(
                "apps.dashboard.scripts.get_training_information.__get_commune_from_coord__"
        ), patch("apps.dashboard.scripts.get_training_information.__get_module__"), patch(
            "apps.dashboard.scripts.get_training_information.__get_trainer__"
        ):
            items = __get_items__(self.cursor_mock, "Benin")
            self.assertEqual(len(items), 2)
            self.assertIsInstance(items[0], TrainingObject)
            self.assertIsInstance(items[1], TrainingObject)

    @patch("apps.dashboard.scripts.get_training_information.mysql_connect")
    @patch("apps.dashboard.scripts.get_training_information.mysql_disconnect")
    def test_get_training_data_from_db(self, disconnect_mock, connect_mock):
        connect_mock.return_value.cursor.return_value = self.cursor_mock
        self.cursor_mock.fetchall.return_value = [
            (12.34, 56.78, 10, 1, 1, "2023-06-04"),
            (23.45, 67.89, 5, 2, 2, "2023-06-05"),
        ]

        with patch("apps.dashboard.scripts.get_training_information.__get_department_from_coord__"), patch(
                "apps.dashboard.scripts.get_training_information.__get_commune_from_coord__"
        ), patch("apps.dashboard.scripts.get_training_information.__get_module__"), patch(
            "apps.dashboard.scripts.get_training_information.__get_trainer__"
        ):
            trainings = get_training_data_from_db("Benin")
            self.assertEqual(len(trainings), 2)
            self.assertIsInstance(trainings[0], TrainingObject)
            self.assertIsInstance(trainings[1], TrainingObject)

        connect_mock.assert_called_once()
        disconnect_mock.assert_called_once()


if __name__ == "__main__":
    unittest.main()
