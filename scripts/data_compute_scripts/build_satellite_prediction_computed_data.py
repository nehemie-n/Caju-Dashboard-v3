# -*- coding: utf-8 -*-

import collections
import collections
import collections.abc

collections.Callable = collections.abc.Callable
import argparse
import json
import os
from area import area
import time
import django
import folium
import math
import shapely
from django.db.models import Avg
from dotenv import load_dotenv
from math import floor, log10
from shapely.geometry import shape
from shapely.ops import unary_union
import traceback
import sys

load_dotenv()
BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

from apps.dashboard.earthengine import ee_client as ee
from apps.dashboard.utils import replace_occurrence
from apps.dashboard.models import BeninYield
from apps.dashboard import models
from apps.dashboard import utils


def create_deforestation_and_afforestation_image(country: str):
    # Load the dataset
    dataset = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")

    # Filter for the specified feature
    clip = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(
        ee.Filter.eq("country_na", "Cote d'Ivoire")
    )
    ivoryCoast_forestchange = dataset.select(
        ["loss", "gain", "lossyear"]
    ).clipToCollection(clip)
    # Filter the image collection for deforestation after 2020
    deforestation_after_2020 = ivoryCoast_forestchange.select("loss").updateMask(
        ivoryCoast_forestchange.select("lossyear").gt(20)
    )

    afforestantion_area = ivoryCoast_forestchange.select("gain")

    return deforestation_after_2020, afforestantion_area


def calculate_deforestation_area(feature, deforestation_image):
    """
    @returns deforestation area in ha
    Checks if the geometry type is either MultiPolygon or Polygon and loads it
    """
    geometry = ee.Geometry.MultiPolygon(feature["geometry"]["coordinates"])
    # Calculate loss in terms of hectares
    loss_area = deforestation_image.multiply(ee.Image.pixelArea()).divide(1e4)
    # Reduce the region using a sum reducer
    reduction = (
        loss_area.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=geometry,
            scale=30.92,  # pixel per 30.92 ~30
            maxPixels=1e9,
        )
        .get("loss")
        .getInfo()
    )
    return reduction  # in ha


def calculate_afforestation_area(feature, afforestantion_image):
    geometry = ee.Geometry.MultiPolygon(feature["geometry"]["coordinates"])
    # Calculate gain in terms of hectares
    gain_area = afforestantion_image.multiply(ee.Image.pixelArea()).divide(1e4)
    # Reduce the region using a sum reducer
    gain = (
        gain_area.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=geometry,
            scale=30.92,  # pixel per 30.92 ~30
            maxPixels=1e9,
        )
        .get("gain")
        .getInfo()
    )
    return gain  # in ha


def __get_cashew_tree_cover_within_protected_areas__(
    protected_area_features, zones, country, deforestation_image, afforestantion_image
):
    protected_area_data_dictionary = {}
    for protected_area_feature in protected_area_features:
        protected_area_polygon = shape(protected_area_feature["geometry"])
        features = [
            {
                "type": "Feature",
                "properties": {},
                "geometry": shapely.geometry.mapping(protected_area_polygon),
            }
        ]
        protected_area_ftcollection = ee.FeatureCollection(features)

        dist_stats = zones.multiply(ee.Image.pixelArea()).reduceRegions(
            collection=protected_area_ftcollection,
            reducer=ee.Reducer.sum(),
            scale=10,
        )
        dist_stats = dist_stats.select(
            ["sum"], ["Cashew Tree Cover"], retainGeometry=False
        ).getInfo()
        try:
            protected_area_data_dictionary[
                protected_area_feature["properties"]["NAME"]
            ] = {
                "type": protected_area_feature["properties"].get("DESIG_ENG"),
                "name": protected_area_feature["properties"]["NAME"],
                "area_ha": math.ceil(
                    area(protected_area_feature["geometry"]) / 1e4
                ),  # originally in m2 now in ha
                "cashew_tree_cover": float(
                    dist_stats["features"][0]["properties"]["Cashew Tree Cover"]
                )
                / 10000,
                "deforested_area": calculate_deforestation_area(
                    protected_area_feature, deforestation_image
                ),
                "afforested_area": calculate_afforestation_area(
                    protected_area_feature, afforestantion_image
                ),
            }
        except Exception as e:
            # put an empty dictionary for the country
            print(
                "Error in protected areas "
                + protected_area_feature["properties"]["NAME"]
                + str(e)
            )
            protected_area_data_dictionary[
                protected_area_feature["properties"]["NAME"]
            ] = {
                "name": protected_area_feature["properties"]["NAME"],
                "area_ha": 0,
                "cashew_tree_cover": 0,
                "deforested_area": 0,
                "afforested_area": 0,
            }
    json_object = json.dumps(
        protected_area_data_dictionary, indent=4, sort_keys=True, ensure_ascii=False
    )

    # Writing to sample.json
    with open(
        f"staticfiles/{country}/protected_area_data.json",
        mode="w",
        encoding="utf8",
        errors="ignore",
    ) as outfile:
        outfile.write(json_object)
        print("New json file is created")


def __get_cashew_tree_cover_within_protected_areas_within_zone__(
    zone_feature, protected_area_features, zones
):
    """
    Loops within all protected areas whil getting intersection with the provided feature geometry
    Appends the intersection in an array and
    does a shapely union and reduces based on the unified geometry
    """
    zone_polygon = shape(zone_feature["geometry"])
    shape_list = []
    for feature in protected_area_features:
        current_protected_area_polygon = shape(feature["geometry"])
        if zone_polygon.intersects(current_protected_area_polygon):
            try:
                intersection = zone_polygon.intersection(current_protected_area_polygon)
                shape_list.append(intersection)
            except Exception as e:
                print("ERROR: ", e)

    union = unary_union([s for s in shape_list])
    features = [
        {
            "type": "Feature",
            "properties": {},
            "geometry": shapely.geometry.mapping(union),
        }
    ]
    dist_stats = zones.multiply(ee.Image.pixelArea()).reduceRegions(
        collection=ee.FeatureCollection(features),
        reducer=ee.Reducer.sum(),
        scale=10,  # 10
    )
    dist_stats = dist_stats.select(
        ["sum"], ["Cashew Tree Cover"], retainGeometry=False
    ).getInfo()

    return float(dist_stats["features"][0]["properties"]["Cashew Tree Cover"]) / 10000


def __get_protected_areas_within_zone__(zone_feature, protected_area_features):
    """
    TODO (DONE) This is misleading in terms of computations
    TODO: Merge it with get cashew cover in protected areas in zone to avoid looping twice in protected areas
    """
    zone_polygon = shape(zone_feature["geometry"])
    shape_list = []
    for feature in protected_area_features:
        current_protected_area_polygon = shape(feature["geometry"])
        if zone_polygon.intersects(current_protected_area_polygon):
            try:
                intersection = zone_polygon.intersection(current_protected_area_polygon)
                shape_list.append(intersection)
            except Exception as e:
                print("ERROR: ", e)

    union = unary_union([s for s in shape_list])
    return area(shapely.geometry.mapping(union)) / 1e4  # originally in m2 now in ha


def __get_cashew_tree_cover_within_zone__(
    zone_feature, commune_features, dist_stats, zones
):
    """
    zone_feature is basically district feature (Level 3)
    """
    zone_polygon = shape(zone_feature["geometry"])

    commune_feature = None
    commune_feat = None
    for feature in commune_features:
        if zone_feature["properties"]["NAME_2"] == feature["properties"]["NAME_2"]:
            commune_feature = shape(feature["geometry"])
            commune_feat = feature
            break

    district_area_pixel = zone_polygon.area
    commune_area_pixel = commune_feature.area

    # TODO: (Done) Changed to area() calculation
    # originally in square meters now in km2
    commune_area_km = area(commune_feat["geometry"]) / 1e6
    zone_total_area_km = (district_area_pixel / commune_area_pixel) * commune_area_km

    for dist in dist_stats["features"]:
        if dist["properties"]["Districts"] == zone_feature["properties"]["NAME_3"]:
            return (
                dist["properties"]["Cashew Tree Cover"] / 10000,
                zone_total_area_km * 100,
            )

    intersection_area_pixel = 0.0

    # Convert the zones of the thresholded predictions to vectors.
    prediction_vectors = zones.reduceToVectors(
        **{
            "scale": 25,
            "geometryType": "polygon",
            "reducer": ee.Reducer.countEvery(),
            "bestEffort": True,
        }
    )
    prediction_polygon = shape(prediction_vectors.geometry().getInfo())
    if zone_polygon.intersects(prediction_polygon):
        try:
            intersection_polygon = zone_polygon.intersection(prediction_polygon)
            intersection_area_pixel = intersection_polygon.area
        except Exception as e:
            print("ERROR: ", e)
    try:
        area_percentage = intersection_area_pixel / district_area_pixel
    except Exception as e:
        print("ERROR: ", e)
        area_percentage = 0.0

    return area_percentage * zone_total_area_km * 100, zone_total_area_km * 100


def __get_number_of_trees_within_zone__(feature, zones):
    number_of_trees = 0
    zone_prediction_vectors = zones.reduceToVectors(
        **{
            "geometry": feature["geometry"],
            "scale": 50,
            "geometryType": "polygon",
            "reducer": ee.Reducer.countEvery(),
            "bestEffort": True,
            "maxPixels": 1e50,
        }
    )
    zone_prediction_polygon = shape(zone_prediction_vectors.geometry().getInfo())
    if zone_prediction_polygon.geom_type == "MultiPolygon":
        number_of_trees += len(list(zone_prediction_polygon.geoms))
    return round(number_of_trees * 12.308816780102923)


# yield_haC = BeninYield.objects.using(country).filter(country_id__country_name='Ivory Coast', commune='Gbeke').aggregate(Avg("total_yield_per_ha_kg"))
# yield_haC = BeninYield.objects.using(country).filter(country_id__country_name='Ivory Coast', commune='Gbeke').aggregate(Avg("total_yield_per_ha_kg"))
# yield_haC = BeninYield.objects.using(country).filter(country_id__country_name='Ivory Coast', district='Bouake').aggregate(Avg("total_yield_per_ha_kg"))


def __get_district_yield_per_hectare_from_survey(feature, district: str, country: str):
    district = feature["properties"]["NAME_3"]
    yield_haC = (
        BeninYield.objects.using(country)
        .filter(country_id__country_name=country, district=district)
        .aggregate(Avg("total_yield_per_ha_kg"))
    )
    try:
        yield_haC = int(round(yield_haC["total_yield_per_ha_kg__avg"], 2))
    except Exception:
        yield_haC = 0
    try:
        r_yield_haC = (
            round(yield_haC, 1 - int(floor(log10(abs(yield_haC)))))
            if yield_haC < 90000
            else round(yield_haC, 2 - int(floor(log10(abs(yield_haC)))))
        )
    except Exception:
        r_yield_haC = yield_haC
    yield_per_hectare = r_yield_haC
    return yield_per_hectare


def __get_commune_yield_per_hectare_from_survey(feature, country):
    commune = feature["properties"]["NAME_2"]
    yield_haC = (
        BeninYield.objects.using(country)
        .filter(country_id__country_name=country, commune=commune)
        .aggregate(Avg("total_yield_per_ha_kg"))
    )
    try:
        yield_haC = int(round(yield_haC["total_yield_per_ha_kg__avg"], 2))
    except Exception:
        yield_haC = 0
    try:
        r_yield_haC = (
            round(yield_haC, 1 - int(floor(log10(abs(yield_haC)))))
            if yield_haC < 90000
            else round(yield_haC, 2 - int(floor(log10(abs(yield_haC)))))
        )
    except Exception:
        r_yield_haC = yield_haC
    yield_per_hectare = r_yield_haC
    return yield_per_hectare


def __get_department_yield_per_hectare_from_survey(department: str, country):
    yield_per_hectare = (
        BeninYield.objects.using(country)
        .filter(country_id__country_name=country, department=department)
        .aggregate(Avg("total_yield_per_ha_kg"))
    )
    print(department + ": " + str(yield_per_hectare))
    try:
        yield_per_hectare = int(
            round(yield_per_hectare["total_yield_per_ha_kg__avg"], 2)
        )
    except Exception as e:
        # traceback.print_exc()
        yield_per_hectare = 0
    return yield_per_hectare


def __get_benin_yield_per_hectare_from_survey(country: str):
    yield_haC = (
        BeninYield.objects.using(country)
        .filter(country_id__country_name=country)
        .aggregate(Avg("total_yield_per_ha_kg"))
    )
    try:
        yield_haC = int(round(yield_haC["total_yield_per_ha_kg__avg"], 2))
    except Exception:
        yield_haC = 0
    try:
        r_yield_haC = (
            round(yield_haC, 1 - int(floor(log10(abs(yield_haC)))))
            if yield_haC < 90000
            else round(yield_haC, 2 - int(floor(log10(abs(yield_haC)))))
        )
    except Exception:
        r_yield_haC = yield_haC
    yield_per_hectare = r_yield_haC
    return yield_per_hectare


### add district(department)


def __add_district_properties__(
    districts_features,
    data_dictionary,
    communes_features,
    dist_stats,
    zones,  # Zone iz the earthe engine image of prediction
    protected_area_features,
    deforestation_image,
    afforestation_image,
):
    for feature in districts_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        commune_name = feature["properties"]["NAME_2"]
        district_name = feature["properties"]["NAME_3"]

        current_state = data_dictionary[country_name][department_name][commune_name][
            district_name
        ]

        # TODO: Make this threads
        cashew_tree_cover, total_area = __get_cashew_tree_cover_within_zone__(
            feature, communes_features, dist_stats, zones
        )

        protected_area = __get_protected_areas_within_zone__(
            feature, protected_area_features
        )
        cashew_tree_cover_within_protected_area = (
            __get_cashew_tree_cover_within_protected_areas_within_zone__(
                feature, protected_area_features, zones
            )
        )
        try:
            deforested_area = calculate_deforestation_area(feature, deforestation_image)
            afforested_area = calculate_afforestation_area(feature, afforestation_image)
        except Exception as e:
            print("Error doing calcs for district " + str(e))
            deforested_area = 0
            afforested_area = 0

        try:
            # yield_per_hectare = (number_of_trees / cashew_tree_cover) * yield_per_tree
            yield_per_hectare = __get_district_yield_per_hectare_from_survey(
                feature, district_name, country_name
            )
        except Exception:
            yield_per_hectare = 0

        total_cashew_yield = cashew_tree_cover * yield_per_hectare

        number_of_trees = __get_number_of_trees_within_zone__(feature, zones)
        # TODO Cashew yield per tree compute
        try:
            yield_per_tree = total_cashew_yield / number_of_trees
        except Exception as e:
            yield_per_tree = 0

        current_state.update(
            {
                "total area": total_area,
                "total cashew yield": total_cashew_yield,
                "cashew tree cover": cashew_tree_cover,
                "protected area": protected_area,
                "deforested area": deforested_area,
                "afforested area": afforested_area,
                "cashew tree cover within protected area": cashew_tree_cover_within_protected_area,
                "yield per hectare": yield_per_hectare,
                "yield per tree": yield_per_tree,  # TODO Compute this
                "number of trees": number_of_trees,  # TODO Compute this
            },
        )


## new commune properties


def __add_communes_properties__(data_dictionary, country, communes_features):
    for feature in communes_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        commune_name = feature["properties"]["NAME_2"]

        current_state = data_dictionary[country_name][department_name][commune_name]

        total_area = area(feature["geometry"]) / 1e4  # originally in m2 now in ha

        cashew_tree_cover = sum(
            current_state[district]["cashew tree cover"] for district in current_state
        )

        total_cashew_yield = sum(
            current_state[district]["total cashew yield"] for district in current_state
        )

        protected_area = sum(
            current_state[district]["protected area"] for district in current_state
        )

        cashew_tree_cover_within_protected_area = sum(
            current_state[district]["cashew tree cover within protected area"]
            for district in current_state
        )

        deforested_area = sum(
            current_state[district]["deforested area"] for district in current_state
        )

        afforested_area = sum(
            current_state[district]["afforested area"] for district in current_state
        )

        ## TODO: Recheck this
        try:
            # yield_per_hectare = (number_of_trees / cashew_tree_cover) * yield_per_tree
            yield_per_hectare = __get_commune_yield_per_hectare_from_survey(
                feature, country
            )
        except Exception:
            yield_per_hectare = 0

        number_of_trees = sum(
            current_state[district]["number of trees"] for district in current_state
        )

        # TODO Cashew yield per tree compute
        try:
            yield_per_tree = total_cashew_yield / number_of_trees
        except Exception as e:
            yield_per_tree = 0

        current_state.update(
            {
                "total area": total_area,
                "total cashew yield": total_cashew_yield,
                "cashew tree cover": cashew_tree_cover,
                "protected area": protected_area,
                "deforested area": deforested_area,
                "afforested area": afforested_area,
                "cashew tree cover within protected area": cashew_tree_cover_within_protected_area,
                "yield per hectare": yield_per_hectare,
                "yield per tree": yield_per_tree,
                "number of trees": number_of_trees,
            }
        )


def __add_departments_properties__(data_dictionary, country, departments_features):
    for feature in departments_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]

        current_state = data_dictionary[country_name][department_name]

        total_area = area(feature["geometry"]) / 1e4  # originally in m2 now in ha

        cashew_tree_cover = sum(
            current_state[commune]["cashew tree cover"] for commune in current_state
        )

        total_cashew_yield = sum(
            current_state[commune]["total cashew yield"] for commune in current_state
        )

        protected_area = sum(
            current_state[commune]["protected area"] for commune in current_state
        )

        cashew_tree_cover_within_protected_area = sum(
            current_state[commune]["cashew tree cover within protected area"]
            for commune in current_state
        )

        deforested_area = sum(
            current_state[commune]["deforested area"] for commune in current_state
        )

        afforested_area = sum(
            current_state[commune]["afforested area"] for commune in current_state
        )

        yield_per_hectare = __get_department_yield_per_hectare_from_survey(
            department_name, country
        )
        number_of_trees = sum(
            current_state[commune]["number of trees"] for commune in current_state
        )
        # TODO
        # Proabbly 8 is for Benin make one for Ivory Coast
        # yield_per_tree = 0 if number_of_trees == 0 else 8
        # yield_per_tree = sum(
        #     current_state[commune]["yield per tree"] for commune in current_state
        # )
        try:
            yield_per_tree = total_cashew_yield / number_of_trees
        except Exception as e:
            yield_per_tree = 0

        current_state.update(
            {
                "properties": {
                    "total area": total_area,
                    "total cashew yield": total_cashew_yield,
                    "cashew tree cover": cashew_tree_cover,
                    "protected area": protected_area,
                    "deforested area": deforested_area,
                    "afforested area": afforested_area,
                    "cashew tree cover within protected area": cashew_tree_cover_within_protected_area,
                    "yield per hectare": yield_per_hectare,
                    "yield per tree": yield_per_tree,
                    "number of trees": number_of_trees,
                }
            }
        )


def __add_benin_republic_properties__(data_dictionary, country: str, republic_features):
    for feature in republic_features:
        country_name = feature["properties"]["NAME_0"]
        current_state = data_dictionary[country_name]

        total_area = area(feature["geometry"]) / 1e4  # originally in m2 now in ha

        cashew_tree_cover = sum(
            current_state[department]["properties"]["cashew tree cover"]
            for department in current_state
        )

        total_cashew_yield = sum(
            current_state[department]["properties"]["total cashew yield"]
            for department in current_state
        )

        protected_area = sum(
            current_state[department]["properties"]["protected area"]
            for department in current_state
        )

        cashew_tree_cover_within_protected_area = sum(
            current_state[department]["properties"][
                "cashew tree cover within protected area"
            ]
            for department in current_state
        )

        deforested_area = sum(
            current_state[department]["properties"]["deforested area"]
            for department in current_state
        )

        afforested_area = sum(
            current_state[department]["properties"]["afforested area"]
            for department in current_state
        )

        # TODO: Recheck this : Fix for precomputed yield survey data
        yield_per_hectare = __get_benin_yield_per_hectare_from_survey(country)

        number_of_trees = sum(
            current_state[department]["properties"]["number of trees"]
            for department in current_state
        )

        # TODO Recheck
        # yield_per_tree = sum(
        #     current_state[department]["properties"]["yield per tree"]
        #     for department in current_state
        # )
        try:
            yield_per_tree = total_cashew_yield / number_of_trees
        except Exception as e:
            yield_per_tree = 0

        current_state.update(
            {
                "properties": {
                    "total area": total_area,
                    "total cashew yield": total_cashew_yield,
                    "cashew tree cover": cashew_tree_cover,
                    "protected area": protected_area,
                    "deforested area": deforested_area,
                    "afforested area": afforested_area,
                    "cashew tree cover within protected area": cashew_tree_cover_within_protected_area,
                    "yield per hectare": yield_per_hectare,
                    "yield per tree": yield_per_tree,
                    "number of trees": number_of_trees,
                }
            }
        )


## new rankings


def __rank_department_by_production_level(data_dictionary, country):
    dictionary = {}
    for department in data_dictionary[country]:
        if department == "properties":
            continue
        dictionary[department] = data_dictionary[country][department]["properties"][
            "total cashew yield"
        ]
    ranked = [
        s for s in sorted(dictionary.items(), key=lambda item: item[1], reverse=True)
    ]
    current_rank = 1
    previous_value = ranked[0][1]
    for index in range(len(ranked)):
        if previous_value > ranked[index][1]:
            current_rank += 1
        item = ranked[index][0]
        data_dictionary[country][item]["properties"].update({"rank": current_rank})
        previous_value = ranked[index][1]


def __rank_commune_by_production_level(data_dictionary, country):
    dictionary = {}
    for department in data_dictionary[country]:
        if department == "properties":
            continue
        for commune in data_dictionary[country][department]:
            if commune == "properties":
                continue
            dictionary[department + "|" + commune] = data_dictionary[country][
                department
            ][commune]["total cashew yield"]
    ranked = [
        s for s in sorted(dictionary.items(), key=lambda item: item[1], reverse=True)
    ]
    current_rank = 1
    previous_value = ranked[0][1]

    for index in range(len(ranked)):
        if previous_value > ranked[index][1]:
            current_rank += 1
        item = ranked[index][0]
        department_name = item.split("|")[0]
        commune_name = item.split("|")[1]
        data_dictionary[country][department_name][commune_name].update(
            {"rank": current_rank}
        )
        previous_value = ranked[index][1]


def __rank_districts_by_production_level(data_dictionary, country):
    dictionary = {}
    for department in data_dictionary[country]:
        if department == "properties":
            continue
        for commune in data_dictionary[country][department]:
            if commune == "properties":
                continue
            for district_name, district_data in data_dictionary[country][department][
                commune
            ].items():
                if district_name == "properties":
                    continue
                dictionary[department + "|" + commune + "|" + district_name] = (
                    data_dictionary[country][department][commune][district_name][
                        "total cashew yield"
                    ]
                )

    ranked = [
        s for s in sorted(dictionary.items(), key=lambda item: item[1], reverse=True)
    ]
    current_rank = 1
    previous_value = ranked[0][1]

    for index in range(len(ranked)):
        if previous_value > ranked[index][1]:
            current_rank += 1
        item = ranked[index][0]
        department_name, commune_name, district_name = item.split("|")
        data_dictionary[country][department_name][commune_name][district_name].update(
            {"rank": current_rank}
        )
        previous_value = ranked[index][1]


def __satellite_prediction_computed_data_file__(
    country: str, deforestation_image, afforestation_image
):
    ### add district features

    benin_adm3_json = utils.Fetcher.GAUL3(country=country).geo

    benin_adm2_json = utils.Fetcher.GAUL2(country=country).geo

    benin_adm1_json = utils.Fetcher.GAUL1(country=country).geo

    benin_adm0_json = utils.Fetcher.country(country=country).geo

    # For now using image for Benin only {country_image_name}
    country_image_name = country.replace(" ", "_")
    nl2012 = ee.Image(
        f'{replace_occurrence(os.getenv("EE_CAJU_PREDICTION"), "cajusupport", f"cajusupport/{country_image_name}", 1)}'
    )
    print(nl2012.getInfo())
    print("=== Loaded nl2012 = ee.Image ", type(nl2012))
    zones = nl2012.eq(1)
    zones = zones.updateMask(zones.neq(0))

    print("=== Selected  ", type(benin_adm2_json))
    benin_adm2 = ee.FeatureCollection(benin_adm2_json)

    print("=== reduceRegions  ", type(benin_adm2_json))
    dist_stats = zones.multiply(ee.Image.pixelArea()).reduceRegions(
        collection=benin_adm2,
        reducer=ee.Reducer.sum(),
        scale=10,  # scale
    )

    print("=== dist_stats  ", type(benin_adm2))
    dist_stats = dist_stats.select(
        ["NAME_0", "NAME_1", "NAME_2", "sum"],
        ["Country", "Districts", "Communes", "Cashew Tree Cover"],
        retainGeometry=False,
    ).getInfo()

    # Load the Benin Protected_areas shapefile
    geojsons = [utils.Fetcher.protected_areas(country=country).geo]

    protected_area_features = []
    for geo in geojsons:
        for feature in geo["features"]:
            protected_area_features.append(feature)

    temp_geojson_4 = folium.GeoJson(
        data=benin_adm0_json,
        name="Benin Republic",
    )

    temp_geojson_5 = folium.GeoJson(
        data=benin_adm1_json,
        name="Benin Department",
    )

    temp_geojson_6 = folium.GeoJson(
        data=benin_adm2_json,
        name="Benin Communes",
    )

    ### add district features

    temp_geojson_7 = folium.GeoJson(
        data=benin_adm3_json,
        name="Benin District",
    )
    data_dictionary = {}

    benin_republic_features = temp_geojson_4.data["features"]

    for feature in benin_republic_features:
        country_name = feature["properties"]["NAME_0"]
        data_dictionary[country_name] = {}

    departments_features = temp_geojson_5.data["features"]

    for feature in departments_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        if department_name not in data_dictionary[country_name]:
            data_dictionary[country_name][department_name] = {}

    communes_features = temp_geojson_6.data["features"]

    for feature in communes_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        commune_name = feature["properties"]["NAME_2"]
        if commune_name not in data_dictionary[country_name][department_name]:
            data_dictionary[country_name][department_name][commune_name] = {}

    district_features = temp_geojson_7.data["features"]

    for feature in district_features:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        commune_name = feature["properties"]["NAME_2"]
        district_name = feature["properties"]["NAME_3"]
        if (
            district_name
            not in data_dictionary[country_name][department_name][commune_name]
        ):
            data_dictionary[country_name][department_name][commune_name][
                district_name
            ] = {}

    start_time = time.time()
    __add_district_properties__(
        district_features,
        data_dictionary,
        communes_features,
        dist_stats,
        zones,
        protected_area_features,
        deforestation_image,
        afforestation_image,
    )
    print("Done with __add_district_properties__")

    __add_communes_properties__(data_dictionary, country, communes_features)
    print(
        "TOTAL LOADING TIME __add_communes_properties__ --- %s seconds ---"
        % (time.time() - start_time)
    )
    start_time = time.time()
    __add_departments_properties__(data_dictionary, country, departments_features)
    print(
        "TOTAL LOADING TIME __add_departments_properties__ --- %s seconds ---"
        % (time.time() - start_time)
    )
    start_time = time.time()
    __add_benin_republic_properties__(data_dictionary, country, benin_republic_features)
    print(
        "TOTAL LOADING TIME __add_benin_republic_properties__ --- %s seconds ---"
        % (time.time() - start_time)
    )
    start_time = time.time()
    __rank_department_by_production_level(data_dictionary, country)
    print(
        "TOTAL LOADING TIME __rank_department_by_production_level --- %s seconds ---"
        % (time.time() - start_time)
    )
    start_time = time.time()
    __rank_commune_by_production_level(data_dictionary, country)
    # __rank_districts_by_production_level(data_dictionary, country)
    print(
        "TOTAL LOADING TIME __rank_commune_by_production_level --- %s seconds ---"
        % (time.time() - start_time)
    )
    start_time = time.time()
    __get_cashew_tree_cover_within_protected_areas__(
        protected_area_features,
        zones,
        country,
        deforestation_image,
        afforestation_image,
    )
    print(
        "TOTAL LOADING TIME __get_cashew_tree_cover_within_protected_areas__ --- %s seconds ---"
        % (time.time() - start_time)
    )
    # print(json.dumps(data_dictionary, indent=4, sort_keys=True, ensure_ascii=False))

    # Serializing json
    json_object = json.dumps(
        data_dictionary, indent=4, sort_keys=True, ensure_ascii=False
    )

    # Writing to sample.json
    with open(
        f"staticfiles/{country}/satellite_prediction_computed_data.json",
        mode="w",
        encoding="utf-8",
        errors="ignore",
    ) as outfile:
        outfile.write(json_object)
        print("New json file is created")


def create_temporaly(country: str):
    """
    Helps create this file if it doesn't exist but when need to start the application
    """
    with open(
        f"staticfiles/{country}/satellite_prediction_computed_data.json",
        mode="w",
        encoding="utf-8",
        errors="ignore",
    ) as outfile:
        outfile.write(json.dumps({}))


def satellite_prediction_computed_data_file(args):
    (
        deforestation_image,
        afforestantion_image,
    ) = create_deforestation_and_afforestation_image(args.country)
    __satellite_prediction_computed_data_file__(
        args.country, deforestation_image, afforestantion_image
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="A script to compute the satellite predictions datas."
    )
    parser.add_argument("country", help="Country name")
    args = parser.parse_args()
    for i in range(0, 1):
        while True:
            try:
                # do stuff
                satellite_prediction_computed_data_file(args)
            except Exception:
                traceback.print_exc()
                print("Error computing")
            break
