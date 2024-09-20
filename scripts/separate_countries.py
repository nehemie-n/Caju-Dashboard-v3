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


# this script takes data from default DB and separates to country by country for all available models
from apps.dashboard import models


def modify_country():
    """
    Because countries already exist we don't  move them we update them
    """
    models.Country.objects.using("default").all()
    objects = models.Country.objects.using("default").all()
    for obj in objects:
        # if connected to IVC move it there if not just benin and delete from default
        if obj.country_name.lower() == "ivory coast":
            country = models.Country.objects.using("Ivory Coast").get(
                country_name="Ivory Coast"
            )
            country.geometry = obj.geometry
            country.level0_name = obj.level0_name
            country.level1_name = obj.level1_name
            country.level2_name = obj.level2_name
            country.level3_name = obj.level3_name
            country.status = 1
            country.save(using="Ivory Coast")
        elif obj.country_name.lower() == "benin":
            country = models.Country.objects.using("Benin").get(country_name="Benin")
            country.geometry = obj.geometry
            country.level0_name = obj.level0_name
            country.level1_name = obj.level1_name
            country.level2_name = obj.level2_name
            country.level3_name = obj.level3_name
            country.status = 1
            country.save(using="Benin")
        else:
            # deletes other countries not available
            obj.delete(using="default")


def move_same_models():
    """
    These models kind of have same structure have 'country_id' column
    aligned models depending on how they rely on each other
    """
    objs_delete: list[models.BeninYield] = []
    __models__: list[models.Nursery] = [
        models.NurseryPlantsHistory,
        models.Nursery,
        models.MotherTree,
        models.Plantation,
        models.BeninYield,
        models.AlteiaData,
        models.DeptSatellite,
        models.CommuneSatellite,
        models.DistrictSatellite,
        models.SpecialTuple,
        models.Trainer,
        models.TrainingModule,
        models.Training,
    ]

    countries = {
        "Ivory Coast": models.Country.objects.using("Ivory Coast").get(
            country_name="Ivory Coast"
        ),
        "Benin": models.Country.objects.using("Benin").get(country_name="Benin"),
    }

    for model in __models__:
        objects = model.objects.using("default").all()
        for obj in objects:
            # if connected to IVC move it there if not just benin and delete from default
            if (
                obj.country_id is not None
                and obj.country_id.country_name.lower() == "ivory coast"
            ):
                obj.country_id = countries.get("Ivory Coast")
                obj.save(using="Ivory Coast")
            else:
                obj.country_id = countries.get("Benin")
                obj.save(using="Benin")

            objs_delete.append(obj)

        print(f"{model} done moving data.")

    # after all models delete the objects

    print("Delete the objects to delete")
    for obj in objs_delete:
        # delete emphasize deleting on all objs from default
        obj.delete(using="default")
    print("Done deleting the objects to delete")

    # sorted on how they realy on each other these have 'country' column
    __models2__: list[models.ProtectedArea] = [
        models.ProtectedArea,
        models.GAUL1,
        models.GAUL2,
        models.GAUL3,
    ]
    objs_delete: list[models.BeninYield] = []
    for model in __models2__:
        objects = model.objects.using("default").all()
        for obj in objects:
            # if connected to IVC move it there if not just benin and delete from default
            if (
                obj.country is not None
                and obj.country.country_name.lower() == "ivory coast"
            ):
                obj.country = countries.get("Ivory Coast")
                obj.save(using="Ivory Coast")
            else:
                obj.country = countries.get("Benin")
                obj.save(using="Benin")

            # delete
            objs_delete.append(obj)

        print(f"{model} done moving data.")

    # delete the objects
    # the reason for models with presentation
    print("Delete the objects to delete")
    for obj in objs_delete:
        # delete emphasize deleting on all objs from default
        obj.delete(using="default")
    print("Done deleting the objects to delete")


from django.db import transaction, IntegrityError, DataError

if __name__ == "__main__":
    with transaction.atomic():
        print("Before move_same_models")
        move_same_models()
        print("After: move_same_models")

        print("Before: move_country")
        modify_country()
        print("AFter: move_country")

#
# python manage.py migrate --database=default --skip-checks
# pipenv run python manage.py migrate --database="Ivory Coast" --skip-checks
# pipenv run python manage.py migrate --database="Benin" --skip-checks
