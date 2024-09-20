#!/usr/bin/env python3
import os
import sys
import django
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

from apps.dashboard.models import *
from django.db import connections
from django.db.models import Q
from django.core.exceptions import MultipleObjectsReturned


def __create_initial_datasets_db__(alias):
    """ """
    active_countries = Country.objects.using(alias).filter(
        Q(status=1) | Q(country_name=alias)
    )
    for country in active_countries:
        Dataset_list = [
            "protected_area_data",
            "satellite_prediction_computed_data",
            "plantation_recommendation",
            "nursery_location_details",
            "CommuneSatellite",
            "DeptSatellite",
            "BeninYield",
            "Nursery",
            "AlteiaData",
            "SpecialTuple",
            "Training",
            "Plantation",
            "Country",
            "GAUL1",
            "GAUL2",
            "GAUL3",
            "ProtectedArea",
            "current_qars",
            "plantations_details",
            "nursery_number",
            "current_trainings",
        ]
        for obj in Dataset_list:
            dataset = Dataset.objects.using(alias).create(name=obj, country_id=country)

        layer_list = {
            "benin_colored_communes": {
                "dataset": [
                    "GAUL2",
                    "satellite_prediction_computed_data",
                    "plantation_recommendation",
                ],
                "layer": [],
            },
            "benin_colored_departments": {
                "dataset": [
                    "satellite_prediction_computed_data",
                    "plantation_recommendation",
                    "GAUL1",
                ],
                "layer": [],
            },
            "benin_commune": {
                "dataset": [
                    "satellite_prediction_computed_data",
                    "GAUL2",
                    "CommuneSatellite",
                    "BeninYield",
                    "Nursery",
                    "AlteiaData",
                    "SpecialTuple",
                    "GAUL1",
                    "Plantation",
                    "nursery_location_details",
                    "current_qars",
                    "plantations_details",
                    "nursery_number",
                ],
                "layer": [],
            },
            "benin_department": {
                "dataset": [
                    "satellite_prediction_computed_data",
                    "GAUL1",
                    "DeptSatellite",
                    "CommuneSatellite",
                    "BeninYield",
                    "current_qars",
                ],
                "layer": [],
            },
            "benin_district": {
                "dataset": ["satellite_prediction_computed_data", "GAUL3"],
                "layer": [],
            },
            "benin_plantations": {
                "dataset": [
                    "GAUL1",
                    "plantation_recommendation",
                    "Plantation",
                    "AlteiaData",
                    "BeninYield",
                    "SpecialTuple",
                ],
                "layer": ["benin_department"],
            },
            "benin_protected_areas": {
                "dataset": ["protected_area_data", "ProtectedArea"],
                "layer": [],
            },
            "benin_republic": {
                "dataset": [
                    "satellite_prediction_computed_data",
                    "Country",
                    "DeptSatellite",
                    "CommuneSatellite",
                    "BeninYield",
                    "GAUL1",
                    "current_qars",
                ],
                "layer": [],
            },
            "caju_density": {
                "dataset": ["GAUL2", "GAUL1", "Nursery"],
                "layer": [],
            },
            "qar_layer": {"dataset": ["GAUL1", "current_qars"], "layer": []},
            "training_informations": {
                "dataset": ["Training", "GAUL1", "GAUL2", "current_trainings"],
                "layer": [],
            },
            "nursery_layer": {
                "dataset": ["Nursery", "GAUL1", "GAUL2"],
                "layer": [],
            },
        }

        try:
            for key, value in layer_list.items():
                current_layer = Layer.objects.using(alias).create(
                    name=key, country_id=country
                )
                datasets_to_add = [
                    Dataset.objects.using(alias).get(name=layer_dataset, country_id=country)
                    for layer_dataset in value["dataset"]
                ]
                dependencies_to_add = [
                    Layer.objects.using(alias).get(
                        name=layer_dependency, country_id=country
                    )
                    for layer_dependency in value["layer"]
                ]
                current_layer.datasets.add(*datasets_to_add)
                current_layer.dependencies.add(*dependencies_to_add)
        except MultipleObjectsReturned:
            pass

def create_initial_datasets():
    for db in connections:
        __create_initial_datasets_db__(alias=db)


if __name__ == "__main__":
    create_initial_datasets()
