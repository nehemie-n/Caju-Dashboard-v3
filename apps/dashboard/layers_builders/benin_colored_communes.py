from functools import partial
import json
import operator
import folium
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

    communes = plantation_recommendations["properties"]["training"]["commune"]
    communes = dict(sorted(communes.items(), key=operator.itemgetter(1), reverse=True))
    count = 0
    for key, value in communes.items():
        if value != 0:
            count += 1
    try:
        step = 255 / count
    except Exception:
        step = 255
    max_int = 255
    for key in communes.keys():
        communes[key] = max_int
        max_int = math.ceil(max_int - step)
        count = count - 1
        if count <= 0:
            break
    return communes


def __highlight_function__(feature, color_values):
    """
    Function to define the layer highlight style
    """
    commune = unidecode.unidecode(feature["properties"]["NAME_2"]).lower()
    RGBint = color_values[commune]
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
    }


def create_country_colored_commune(country: str):
    """
    Adding the shapefiles with popups for the country communes
    Add country communes data to the parent layer
    """
    try:
        color_values = __define_rgb_ints__(country)
        # Load the country Communes shapefile
        country_adm2_json = utils.Fetcher.GAUL2(country=country).geo

        country_colored_communes_layer = folium.FeatureGroup(
            name=gettext("Communes Training Recommendations"), show=False, overlay=True
        )
        geojson_list = []
        for feature in country_adm2_json["features"]:
            commune = unidecode.unidecode(feature["properties"]["NAME_2"]).lower()
            value = color_values[commune]
            if value == 0:
                continue
            custom_style_function = partial(
                __highlight_function__, color_values=color_values
            )
            commune_partial_layer = folium.GeoJson(
                feature,
                zoom_on_click=False,
                style_function=custom_style_function,
            )
            # consolidate individual features back into the main layer
            folium.GeoJsonTooltip(
                fields=["NAME_2"],
                aliases=["Commune:"],
                labels=True,
                sticky=False,
                style=(
                    "background-color: white; color: black; font-family: sans-serif; font-size: 12px; "
                    "padding: 4px;"
                ),
            ).add_to(commune_partial_layer)
            geojson_list.append(commune_partial_layer)
            commune_partial_layer.add_to(country_colored_communes_layer)

        return country_colored_communes_layer, geojson_list
    except Exception as e:
        print("Colored Commune", e)
        return None
