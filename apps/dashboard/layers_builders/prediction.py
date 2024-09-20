import os
import locale
import folium
from apps.dashboard.earthengine import ee_client as ee
from django.utils.translation import gettext
from apps.dashboard.utils import replace_occurrence

# Use '' for auto, or force e.g. to 'en_US.UTF-8'
locale.setlocale(locale.LC_ALL, "")


def create_predictions(country: str):
    print(f"Creating predictions layer {country}")

    def build_predictions_layer(ee_image_object, vis_params, name):
        map_id_dict = ee.Image(ee_image_object).getMapId(vis_params)
        tile_layer = folium.raster_layers.TileLayer(
            tiles=map_id_dict["tile_fetcher"].url_format,
            attr='Map Data &copy; <a href="https://earthengine.google.com/">Google Earth Engine</a>',
            name=name,
            overlay=True,
            control=True,
            show=True,
            zIndex=-10,
        )
        return tile_layer, [tile_layer]

    try:
        country_image_name = country.replace(" ", "_")
        alldept = ee.Image(
            f'{replace_occurrence(os.getenv("EE_CAJU_PREDICTION"), "cajusupport", f"cajusupport/{country_image_name}", 1)}'
        )
        zones = alldept.eq(1)
        zones = zones.updateMask(zones.neq(0))
        predictions_layer = build_predictions_layer(
            zones, {"palette": "red"}, gettext("Cashew Growing Areas")
        )
    except Exception as e:
        predictions_layer = None, None
        print(e)
    return predictions_layer
