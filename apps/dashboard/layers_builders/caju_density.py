import os
import traceback
from apps.dashboard.earthengine import ee_client as ee
import folium
from django.utils.translation import gettext
from apps.dashboard.utils import replace_occurrence


def create_caju_density(country):
    print(f"Creating caju density layer {country}")

    def build_caju_density_layer(ee_image_object, prediction_img, vis_params, name):
        clipGeometry = prediction_img.reduceToVectors(
            geometryType="polygon", eightConnected=False, scale=600, maxPixels=2e10
        )
        zones = ee_image_object.updateMask(ee_image_object.neq(10))
        new_image = zones.clip(clipGeometry)
        vis_image = new_image.visualize(**vis_params)
        map_id_dict = vis_image.getMapId()
        tile_layer = folium.TileLayer(
            tiles=map_id_dict["tile_fetcher"].url_format,
            attr="Google Earth Engine",
            name=name,
            overlay=True,
            control=True,
            show=False,
            zIndex=-20,
        )
        return tile_layer, [tile_layer]

    try:
        image = ee.Image(
            f'{replace_occurrence(os.getenv("EE_CAJU_DENSITY_PREDICTION"), "cajusupport", f"cajusupport/{country}", 1)}'
        )
        prediction_img = ee.Image(
            f'{replace_occurrence(os.getenv("EE_CAJU_PREDICTION"), "cajusupport", f"cajusupport/{country}", 1)}'
        )
        palette = ["FED8A7", "248B46"]
        visParams = {"min": 0, "max": 1, "palette": palette}
        caju_density_layer = build_caju_density_layer(
            image,
            prediction_img,
            visParams,
            gettext("Tree Density Satellite Estimation"),
        )
    except Exception as e:
        caju_density_layer = None, None
        print("Caju Density: ", e)
        traceback.print_exc()

    return caju_density_layer
