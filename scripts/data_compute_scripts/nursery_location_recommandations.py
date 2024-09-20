#!/usr/bin/env python3

import json
import os
import sys
import time
from pathlib import Path
import math
import shapely
import unidecode as unidecode
from alteia import SDK
from dotenv import load_dotenv
from shapely.geometry import shape, Point
import argparse
import traceback
import django

load_dotenv()
BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

from django.core.cache import cache
from apps.dashboard.utils import replace_occurrence
from apps.dashboard import utils
from apps.dashboard.earthengine import ee_client as ee


def calculate_plantation_surface_ha(plantation, feature, img):
    area = img.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=feature["geometry"],
        scale=30,
    )
    plantation_surface_km = ee.Number(area.get("area")).getInfo()
    plantation["plantation_surface_ha"] = plantation_surface_km * 100
    return plantation


def calculate_cashew_tree_surface_ha(
    plantation, plantation_polygon, prediction_polygon, intersection_polygon, img
):
    if not plantation_polygon.intersects(prediction_polygon):
        plantation["nursery_needed"] = True
        plantation["training_needed"] = True
        cashew_tree_surface_ha = 0
    else:
        geometry = shapely.geometry.mapping(intersection_polygon)
        area = img.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=geometry,
            scale=30,
        )
        cashew_tree_surface_ha = ee.Number(area.get("area")).getInfo() * 100

    plantation["cashew_tree_surface_ha"] = cashew_tree_surface_ha
    return plantation


def calculate_min_and_max(plantation):
    min_recommended_number_of_cashew_trees = (
        round(plantation["plantation_surface_ha"], 2) * 100
    )
    plantation["min_recommended_number_of_cashew_trees"] = (
        min_recommended_number_of_cashew_trees
    )

    max_recommended_number_of_cashew_trees = (
        round(plantation["plantation_surface_ha"], 2) * 177
    )
    plantation["max_recommended_number_of_cashew_trees"] = (
        max_recommended_number_of_cashew_trees
    )
    return plantation


def calculate_trees_cover(plantation, tree_crowns_json):
    area = 0
    for feature in tree_crowns_json["features"]:
        area += feature["properties"]["CRN_SURF"]
    plantation["total_trees_cover"] = area
    return plantation


def calculate_cashew_trees_cover(plantation, tree_crowns_json, intersection_polygon):
    area = 0
    for feature in tree_crowns_json["features"]:
        if intersection_polygon.contains(shape(feature["geometry"])):
            area += feature["properties"]["CRN_SURF"]
    plantation["total_cashew_trees_cover"] = area
    return plantation


def calculate_total_number_of_trees(plantation, tree_tops_density_json):
    total_number_of_trees = len(tree_tops_density_json["features"])
    plantation["total_number_of_trees"] = total_number_of_trees
    return plantation


def calculate_total_number_of_cashew_trees(
    plantation, tree_tops_density_json, intersection_polygon
):
    total_number_of_cashew_trees = len(
        list(
            filter(
                lambda feature: intersection_polygon.contains(
                    Point(
                        feature["geometry"]["coordinates"][0],
                        feature["geometry"]["coordinates"][1],
                    )
                ),
                tree_tops_density_json["features"],
            )
        )
    )
    plantation["total_number_of_cashew_trees"] = total_number_of_cashew_trees
    return plantation


def find_location(
    plantation, feature, plantation_polygon, communes_shapes, benin_adm2_json
):
    for commune_shape, commune, department in communes_shapes:
        intersection = plantation_polygon.intersection(commune_shape)
        percentage = intersection.area / plantation_polygon.area
        inside = percentage > 0.5
        if inside:
            plantation["commune"] = unidecode.unidecode(commune).lower()
            plantation["department"] = unidecode.unidecode(department).lower()
            return plantation
    commune = unidecode.unidecode(feature["properties"]["admin_level_2"]).lower()
    department = ""
    for f in benin_adm2_json["features"]:
        if unidecode.unidecode(f["properties"]["NAME_2"].lower()) == commune:
            department = unidecode.unidecode(f["properties"]["NAME_1"].lower())
            break
    plantation["commune"] = unidecode.unidecode(commune).lower()
    plantation["department"] = department
    return plantation


def is_training_needed(plantation, training_need_communes, training_need_departments):
    total_cashew_trees = plantation["total_number_of_trees"]
    max_trees = plantation["max_recommended_number_of_cashew_trees"]
    min_trees = plantation["min_recommended_number_of_cashew_trees"]
    plantation["training_needed"] = (
        plantation["tree_spacing"] > 10 or plantation["tree_spacing"] < 7
    )
    plantation["number_of_trees_to_plant"] = [
        0 if (total_cashew_trees > min_trees) else int(min_trees - total_cashew_trees),
        0 if (total_cashew_trees > max_trees) else int(max_trees - total_cashew_trees),
    ]
    plantation["number_of_trees_to_remove"] = (
        0 if (total_cashew_trees < max_trees) else int(total_cashew_trees - max_trees)
    )
    if plantation["training_needed"]:
        training_need_communes[plantation["commune"]] += 1
        training_need_departments[plantation["department"]] += 1

    return plantation


def calculate_tree_spacing(plantation, tree_tops_density_json):
    total = sum(
        [
            feature["properties"]["MEAN_TOP_D"]
            for feature in tree_tops_density_json["features"]
        ]
    )
    average = total / len(tree_tops_density_json["features"])
    total_trees = plantation["total_number_of_trees"]
    total_trees_cover = plantation["total_trees_cover"]
    total_trees = total_trees if total_trees != 0 else 1
    plantation["tree_spacing"] = round(math.sqrt(total_trees_cover / total_trees), 0)
    plantation["tree_spacing2"] = average
    return plantation


def calculate_pruning_needs(plantation, tree_tops_density_json):
    count = 0
    for feature in tree_tops_density_json["features"]:
        if 2 < feature["properties"]["MEAN_CRN_D"] < 4:
            count += 1
    plantation["pruning_needs"] = count
    return plantation


def calculate_thinning_needs(plantation, tree_tops_density_json):
    count = 0
    for feature in tree_tops_density_json["features"]:
        if feature["properties"]["MEAN_CRN_D"] < 2:
            count += 1
    plantation["thinning"] = count
    return plantation


def generate_recommendations(plantation):
    def practice_type():
        if plantation["tree_spacing"] > 10:
            return "bigger than the recommended tree spacing which is between 7 x 7 m and 10 x 10 m"
        elif plantation["tree_spacing"] < 7:
            return "smaller than the recommended tree spacing which is between 7 x 7 m and 10 x 10 m"
        else:
            return "a good practice"

    spacing = plantation["tree_spacing"]
    recommendations = (
        f"""The tree spacing in this plantation is {spacing} x {spacing}"""
    )
    recommendations += f""", which is {practice_type()}"""
    plantation["recommendations"] = recommendations
    return plantation


def generate_recommandation_file(country: str):
    country_image_name = country.replace(" ", "_")
    #
    # This function is only supposed to use EE_CAJU_DENSITY_PREDICTION image
    # So I applied the try and catch to use EE_CAJU_PREDICTION if the density one is not available for DEV Purposes only and testing
    try:
        nl2012 = ee.Image(
            f'{replace_occurrence(os.getenv("EE_CAJU_DENSITY_PREDICTION"), "cajusupport", f"cajusupport/{country_image_name}", 1)}'
        )
        zones = nl2012.eq(1)
        zones = zones.updateMask(zones.neq(0))

        prediction_vectors = zones.reduceToVectors(
            **{
                "scale": 30,
                "geometryType": "polygon",
                "reducer": ee.Reducer.countEvery(),
                "bestEffort": True,
            }
        )
        prediction_polygon = shape(prediction_vectors.geometry().getInfo())
    except Exception as e:
        nl2012 = ee.Image(
            f'{replace_occurrence(os.getenv("EE_CAJU_PREDICTION"), "cajusupport", f"cajusupport/{country_image_name}", 1)}'
        )
        zones = nl2012.eq(1)
        zones = zones.updateMask(zones.neq(0))

        prediction_vectors = zones.reduceToVectors(
            **{
                "scale": 30,
                "geometryType": "polygon",
                "reducer": ee.Reducer.countEvery(),
                "bestEffort": True,
            }
        )
        prediction_polygon = shape(prediction_vectors.geometry().getInfo())

    # Read all plantations with GeoJSON
    plantations_json = utils.Fetcher.country_plantations(country=country).geo
    img = ee.Image.pixelArea().divide(1000000)

    # country shapes
    benin_adm0_json = utils.Fetcher.country(country=country).geo
    benin_shape = shape(benin_adm0_json["features"][0]["geometry"])

    # Admin 2
    benin_adm2_json = utils.Fetcher.GAUL2(country=country).geo

    communes_shapes = [
        [
            shape(feature["geometry"]),
            feature["properties"]["NAME_2"],
            feature["properties"]["NAME_1"],
        ]
        for feature in benin_adm2_json["features"]
    ]
    training_need_communes = dict.fromkeys(
        [
            unidecode.unidecode(feature["properties"]["NAME_2"].lower())
            for feature in benin_adm2_json["features"]
        ],
        0,
    )
    training_need_departments = dict.fromkeys(
        [
            unidecode.unidecode(feature["properties"]["NAME_1"].lower())
            for feature in benin_adm2_json["features"]
        ],
        0,
    )

    # resume from where we were by opening the existing recommendation file
    try:
        file = open(
            f"staticfiles/{country}/nursery_plantation_recommendation.json",
            encoding="utf8",
            errors="ignore",
            mode="r",
        )
        plantation_recommendation = json.load(file)
    except Exception as e:
        print(e)
        plantation_recommendation = {}

    # plantation per plantations
    for feature in plantations_json["features"]:
        try:
            code = feature["properties"]["plantation_code"]
            print("plantation : ", code)
            # if previously computed just continue
            if cache.get(f"nursery_recommendations_{code}"):
                continue

            start_time = time.time()
            print(f"""START {code} ---""", end="\t\t")

            # Plantations data
            try:
                plant_data = utils.Fetcher.tree_crowns_tops(country=country, code=code)
                tree_tops_density_json = plant_data.tops
                tree_crowns_json = plant_data.crowns
            except Exception as e:
                continue

            plantation_recommendation[code] = {}
            plantation_polygon = shape(feature["geometry"])
            intersection_polygon: shapely.geometry.geo = (
                plantation_polygon.intersection(prediction_polygon)
            )

            plantation_recommendation[code] = find_location(
                plantation_recommendation[code],
                feature,
                plantation_polygon,
                communes_shapes,
                benin_adm2_json,
            )

            plantation_recommendation[code] = calculate_cashew_tree_surface_ha(
                plantation_recommendation[code],
                plantation_polygon,
                prediction_polygon,
                intersection_polygon,
                img,
            )
            plantation_recommendation[code] = calculate_cashew_trees_cover(
                plantation_recommendation[code], tree_crowns_json, intersection_polygon
            )
            plantation_recommendation[code] = calculate_total_number_of_cashew_trees(
                plantation_recommendation[code],
                tree_tops_density_json,
                intersection_polygon,
            )

            plantation_recommendation[code] = calculate_plantation_surface_ha(
                plantation_recommendation[code], feature, img
            )
            plantation_recommendation[code] = calculate_min_and_max(
                plantation_recommendation[code]
            )
            plantation_recommendation[code] = calculate_trees_cover(
                plantation_recommendation[code], tree_crowns_json
            )
            plantation_recommendation[code] = calculate_total_number_of_trees(
                plantation_recommendation[code], tree_tops_density_json
            )
            plantation_recommendation[code] = calculate_tree_spacing(
                plantation_recommendation[code], tree_tops_density_json
            )
            plantation_recommendation[code] = calculate_pruning_needs(
                plantation_recommendation[code], tree_tops_density_json
            )
            plantation_recommendation[code] = calculate_thinning_needs(
                plantation_recommendation[code], tree_tops_density_json
            )
            plantation_recommendation[code] = is_training_needed(
                plantation_recommendation[code],
                training_need_communes,
                training_need_departments,
            )
            plantation_recommendation[code] = generate_recommendations(
                plantation_recommendation[code]
            )

            cache_time = 3 * 24 * 60 * 60  # 3 days
            cache.set(
                key=f"nursery_recommendations_{code}", value=True, timeout=cache_time
            )
            # write after every plantation
            write_recommendation(plantation_recommendation, country)
            print(
                f"""TOTAL LOADING TIME {code} --- {(time.time() - start_time)} seconds ---"""
            )
        except Exception as e:
            continue

    plantation_recommendation["properties"] = {
        "training": {
            "department": training_need_departments,
            "commune": training_need_communes,
        }
    }
    write_recommendation(plantation_recommendation, country)


def write_recommendation(plantation_recommendation, country):
    json_object = json.dumps(
        plantation_recommendation, indent=4, sort_keys=True, ensure_ascii=False
    )

    # Writing to sample.json
    with open(
        f"staticfiles/{country}/nursery_plantation_recommendation.json",
        mode="w",
        encoding="utf8",
        errors="ignore",
    ) as outfile:
        outfile.write(json_object)
        print("New json file is created")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="A script to compute nursery location recommendations per country specified."
    )
    parser.add_argument("country", help="Country name")
    args = parser.parse_args()
    for i in range(0, 1):
        while True:
            try:
                generate_recommandation_file(args.country)
            except Exception:
                traceback.print_exc()
                print("Error computing")
            break
