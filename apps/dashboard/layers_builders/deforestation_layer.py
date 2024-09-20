import os
import folium
from apps.dashboard.earthengine import ee_client as ee
from django.utils.translation import gettext

def create_deforestation(country):
    if country == "Ivory Coast":
        country = "Cote d'Ivoire"

    treeCoverVisParam = {
        "bands": ["gain"],
        "min": 0,
        "max": 1,
        "palette": ["white", "green"],
    }
    treeLossVisParam = {"bands": ["loss"], "min": 0, "max": 1, "palette": ["purple"]}

    def add_deforestation_layers():
        try:
            countries_list = ee.Filter.inList("country_na", [country])
            countries_filter = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(
                countries_list
            )
            map_dict = (
                ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
                .select(["loss", "gain", "lossyear"])
                .clip(countries_filter)
            )
            # Loss
            map_loss = (
                map_dict.updateMask(map_dict.gte(0.0001))
                .updateMask(map_dict.select("lossyear").gt(20))
                .getMapId(treeLossVisParam)
            )
            # map gain
            map_gain = map_dict.updateMask(map_dict.gte(0.0001)).getMapId(
                treeCoverVisParam
            )

            deforestation_layer = folium.raster_layers.TileLayer(
                tiles=map_loss["tile_fetcher"].url_format,
                attr='Map Data &copy; <a href="https://earthengine.google.com/">Google Earth Engine</a>',
                name=gettext("Deforested Area (2021 - 2022) (ha)"),
                overlay=True,
                control=True,
                show=False,
                zIndex=-10,
            )
            aforestation_layer = folium.raster_layers.TileLayer(
                tiles=map_gain["tile_fetcher"].url_format,
                attr='Map Data &copy; <a href="https://earthengine.google.com/">Google Earth Engine</a>',
                name=gettext("Afforested Area (2000 - 2012) (ha)"),
                overlay=True,
                control=True,
                show=False,
                zIndex=-10,
            )

            return (
                deforestation_layer,
                aforestation_layer,
                [aforestation_layer],
                [deforestation_layer],
            )

        except Exception as e:
            print(e)
            return None, None, None, None

    deforestation_layer = add_deforestation_layers()
    return deforestation_layer
