from functools import partial
import sys
import os
import json
import operator
import time
import traceback
import folium
import geojson
import math
import unidecode
from django.utils.translation import gettext
from apps.dashboard import utils

heroku = False


def __define_rgb_ints__(country):
    satellite_prediction_computed_data_json = open(
        f"staticfiles/{country}/satellite_prediction_computed_data.json",
        encoding="utf8",
        errors="ignore",
    )
    data_dictionary = json.load(satellite_prediction_computed_data_json)
    with open(
        f"staticfiles/{country}/plantation_recommendation.json",
        encoding="utf8",
        errors="ignore",
    ) as plantation_recommendation_json:
        plantation_recommendations = json.load(plantation_recommendation_json)
    departments = plantation_recommendations["properties"]["training"]["department"]
    departments = dict(
        sorted(departments.items(), key=operator.itemgetter(1), reverse=True)
    )
    count = 0
    for key, value in departments.items():
        if value != 0:
            count += 1
    try:
        step = 255 / count
    except Exception:
        step = 255
    max_int = 255
    for key in departments.keys():
        departments[key] = max_int
        max_int = math.ceil(max_int - step)
        count = count - 1
        if count <= 0:
            break
    return departments


def __highlight_function__(feature, color_values):
    """
    Function to define the layer highlight style
    """

    department = unidecode.unidecode(feature["properties"]["NAME_1"]).lower()
    # fix: if department not found just choose 0
    RGBint = color_values.get(department, 0)
    color = "transparent"
    border = "transparent"
    if RGBint != 0:
        Red = RGBint & 255
        Green = (RGBint >> 8) & 255
        Blue = (RGBint >> 16) & 255
        color = "#%02x%02x%02x" % (Red, Green, Blue)
        border = "black"

    return {
        "fillColor": color,
        "color": border,
        "weight": 3,
        "dashArray": "1, 1",
        "opacity": 0.35,
        "fillOpacity": 0.8,
        "interactive": False,
    }


def create_country_colored_department(country: str):
    """
    Adding the shapefiles with popups for the country Republic departments
    Add country republic departments data to the parent layer
    """
    try:
        # Load the country Departments shapefile
        country_adm1_json = utils.Fetcher.GAUL1(country=country).geo
        country_colored_departments_layer = folium.FeatureGroup(
            name=gettext("Departments Training Recommendations"),
            show=False,
            overlay=True,
            z_index_offset=10,
        )
        color_values = __define_rgb_ints__(country)
        geojson_list = []
        for feature in country_adm1_json["features"]:
            department = unidecode.unidecode(feature["properties"]["NAME_1"]).lower()
            value = color_values.get(department, 0)
            # For now departments in Ivory coast are also supposed to be dynamic
            if value == 0:
                continue
            custom_style_function = partial(
                __highlight_function__,
                color_values=color_values,
            )
            department_partial_layer = folium.GeoJson(
                feature,
                zoom_on_click=False,
                style_function=custom_style_function,
            )
            # consolidate individual features back into the main layer
            folium.GeoJsonTooltip(
                fields=["NAME_1"],
                aliases=["Department:"],
                labels=True,
                sticky=False,
                style=(
                    "background-color: white; color: black; font-family: sans-serif; font-size: 12px; "
                    "padding: 4px;"
                ),
            ).add_to(department_partial_layer)
            geojson_list.append(department_partial_layer)

            department_partial_layer.add_to(country_colored_departments_layer)
        return country_colored_departments_layer, geojson_list
    except Exception as e:
        print("error while generating department training recommendation layer")
        traceback.print_exc()
        return None
