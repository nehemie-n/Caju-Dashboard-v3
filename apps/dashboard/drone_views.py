import json
import os
from pathlib import Path

import alteia
from apps.dashboard.earthengine import ee_client as ee
import folium
import geojson
import math
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest
from django.template import loader
from django.utils.translation import gettext

# Google service account for the GEE geotiff
from shapely.geometry import Point, shape

# from apps.dashboard.scripts.alteia_trees_data import download_trees_data
from apps.dashboard.utils import replace_occurrence
from apps.dashboard import utils
from apps.dashboard import models

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def __pruning_highlight_function__(feature):
    """
    Function to define the layer highlight style
    """
    try:
        RGBint = math.ceil(feature["extra"]["properties"]["MEAN_CRN_D"])
    except Exception as e:
        RGBint = 0

    if 2 < RGBint < 4:
        Red = 255 & 255
        Green = (255 >> 8) & 255
        Blue = (255 >> 16) & 255
    else:
        Green = 255 & 255
        Blue = (255 >> 8) & 255
        Red = (255 >> 16) & 255

    color = "#%02x%02x%02x" % (Red, Green, Blue)
    border = "black"

    return {
        "fillColor": color,
        "color": border,
        "weight": 1.25,
        "dashArray": "1, 1",
        "opacity": 0.35,
        "fillOpacity": 1,
    }


def __thinning_highlight_function__(feature):
    """
    Function to define the layer highlight style
    """
    try:
        RGBint = math.ceil(feature["extra"]["properties"]["MEAN_CRN_D"])
    except Exception:
        RGBint = 0

    if RGBint < 2:
        Red = 255 & 255
        Green = (255 >> 8) & 255
        Blue = (255 >> 16) & 255
    else:
        Green = 255 & 255
        Blue = (255 >> 8) & 255
        Red = (255 >> 16) & 255

    color = "#%02x%02x%02x" % (Red, Green, Blue)
    border = "black"

    return {
        "fillColor": color,
        "color": border,
        "weight": 1.25,
        "dashArray": "1, 1",
        "opacity": 0.35,
        "fillOpacity": 1,
    }


def get_feature_of_point_cointained_in_geometry(geometry, features):
    polygon = shape(geometry)
    good_feature = None
    for feature in features:
        point = Point(
            feature["geometry"]["coordinates"][0], feature["geometry"]["coordinates"][1]
        )
        if polygon.contains(point):
            good_feature = feature
            break
    return good_feature


@login_required(login_url="/")
def drone(request, plant_id, coordinate_xy=None):
    clean_plant_id = utils.clean_plantation_code(plant_id)

    if request.method != "GET":
        html_template = loader.get_template("dashboard/page-403.html")
        return HttpResponseBadRequest(
            html_template.render({"result": "Invalid request"}, request)
        )

    # TODO Get country from plantation
    for db in utils.Countries.active():
        try:
            plantation = models.Plantation.objects.using(db).get(
                plantation_code=plant_id
            )
            country = plantation.country or plantation.country_id.country_name
            break
        except Exception:
            try:
                country = request.user.remuser.country_id.all()[0].country_name
            except:
                country = "Benin"

    country_name_path = country.replace(" ", "_")
    # Try and formulate the center of the map
    try:
        coordinate_xy = [plantation.geometry.centroid.y, plantation.geometry.centroid.x]
    except:
        coordinate_xy = (
            coordinate_xy.replace("[", "").replace("]", "").replace(" ", "").split(",")
        )
        coordinate_xy = [float(coordinate_xy[0]), float(coordinate_xy[1])]

    def add_country_shape():
        try:
            folium.GeoJson(
                data=plantation.country_id.geometry.geojson,
                name=gettext("Country Shape"),
                show=False,
                zoom_on_click=True,
            ).add_to(cashew_map)
        except Exception:
            pass

    def add_drone_image_layer():
        """ """
        try:
            if country == "Benin":
                image_path = f'{os.getenv("EE_DRONES_GEOTIFF")}/{plant_id}'
            else:
                image_path = f'{replace_occurrence(os.getenv("EE_DRONES_GEOTIFF"), "cajusupport", f"cajusupport/{country_name_path}", 1)}/{plant_id}'

            print("Drone Image Path ", image_path)
            map_id_dict = ee.Image(image_path).getMapId({})
            folium.raster_layers.TileLayer(
                tiles=map_id_dict["tile_fetcher"].url_format,
                attr='Map Data &copy; <a href="https://earthengine.google.com/">Google Earth Engine</a>',
                name=gettext("Drone Image"),
                overlay=True,
                show=True,
                control=True,
                max_zoom=100,
            ).add_to(cashew_map)
        except Exception:
            pass

    def add_predictions_layer():
        """ """
        try:
            country_image_name = country.replace(" ", "_")
            alldept = ee.Image(
                f'{replace_occurrence(os.getenv("EE_CAJU_PREDICTION"), "cajusupport", f"cajusupport/{country_image_name}", 1)}'
            )
            ee_image_object = alldept.eq(1)
            ee_image_object = ee_image_object.updateMask(ee_image_object.neq(0))
            map_id_dict = ee.Image(ee_image_object).getMapId({"palette": "red"})
            folium.raster_layers.TileLayer(
                tiles=map_id_dict["tile_fetcher"].url_format,
                attr='Map Data &copy; <a href="https://earthengine.google.com/">Google Earth Engine</a>',
                name=gettext("Cashew Growing Areas"),
                overlay=True,
                show=False,
                control=True,
            ).add_to(cashew_map)
        except Exception:
            pass

    def add_plantation_shape(country):
        """
        Fetch geometry from the Plantation object model and construct feature using this geometry
        """
        try:
            marker = folium.Marker(
                location=coordinate_xy,
                rise_on_hover=True,
                rise_offset=250,
                icon=folium.Icon(color="green", icon="globe"),
                popup=None,
            )
        except Exception:
            pass
        try:
            shape = folium.GeoJson(
                data=plantation.geometry.geojson,
                name=gettext("Plantation Shape"),
                show=True,
                zoom_on_click=True,
                popup=folium.Popup(
                    f"""
                        Plantation: {plantation.plantation_code} <br/>
                        Owner: {plantation.owner_last_name} {plantation.owner_first_name} <br/>
                        Village: {plantation.village} <br/>
                        Current Area: {plantation.current_area or plantation.geometry.area} <br/>
                    """,
                    max_width=210,
                ),
            )
            marker.add_to(shape)
            shape.add_to(cashew_map)
        except Exception:
            pass

    def add_pruning_layer(country: str):
        """ """
        try:
            country_repo = country.replace(" ", "_")
            tree_crowns_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_CROWNS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_crowns_feature_geojson = ee.FeatureCollection(
                tree_crowns_path
            ).getInfo()

            tree_tops_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_TOPS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_tops_features_geojson = ee.FeatureCollection(tree_tops_path).getInfo()

            pruning_layer = folium.FeatureGroup(
                name=gettext("Pruning recommendations"), show=False, overlay=True
            )

            for feature in tree_crowns_feature_geojson["features"]:
                feature["extra"] = get_feature_of_point_cointained_in_geometry(
                    feature["geometry"], tree_tops_features_geojson["features"]
                )
                tree_crowns_partial_layer = folium.GeoJson(
                    data=feature,
                    zoom_on_click=False,
                    embed=False,
                    name=gettext("Tree Crowns Colored"),
                    show=True,
                    style_function=__pruning_highlight_function__,
                )
                tree_crowns_partial_layer.add_to(pruning_layer)
            pruning_layer.add_to(cashew_map)
        except Exception as e:
            print(e, " Error Prunning")
            pass

    def add_thinning_layer(country: str):
        """ """
        try:
            country_repo = country.replace(" ", "_")
            tree_crowns_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_CROWNS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_crowns_feature_geojson = ee.FeatureCollection(
                tree_crowns_path
            ).getInfo()

            tree_tops_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_TOPS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_tops_features_geojson = ee.FeatureCollection(tree_tops_path).getInfo()

            thinning_layer = folium.FeatureGroup(
                name=gettext("Thinning recommendations"), show=False, overlay=True
            )

            for feature in tree_crowns_feature_geojson["features"]:
                feature["extra"] = get_feature_of_point_cointained_in_geometry(
                    feature["geometry"], tree_tops_features_geojson["features"]
                )
                tree_crowns_partial_layer = folium.GeoJson(
                    data=feature,
                    zoom_on_click=False,
                    embed=False,
                    name=gettext("Tree Crown Colored"),
                    show=True,
                    style_function=__thinning_highlight_function__,
                )
                tree_crowns_partial_layer.add_to(thinning_layer)
            thinning_layer.add_to(cashew_map)
        except Exception:
            pass

    def add_alteia_tree_crowns(country: str):
        try:
            country_repo = country.replace(" ", "_")
            tree_crowns_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_CROWNS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_crowns_collection = ee.FeatureCollection(tree_crowns_path).getInfo()
            tree_crowns_features = tree_crowns_collection
            tree_crowns = folium.GeoJson(
                tree_crowns_features,
                name=gettext("Tree Crowns"),
                zoom_on_click=True,
                embed=False,
                show=False,
            )
            tree_crowns.add_to(cashew_map)
        except Exception:
            pass

    def add_alteia_tree_tops_density(country: str):
        try:
            country_repo = country.replace(" ", "_")
            tree_tops_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_TOPS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
            tree_tops_features_geojson = ee.FeatureCollection(tree_tops_path).getInfo()

            tree_tops_density = folium.GeoJson(
                data=tree_tops_features_geojson,
                zoom_on_click=True,
                embed=False,
                name=gettext("Tree Tops Density"),
                show=False,
                marker=folium.Circle(
                    color="#FFFFFF",
                    opacity=0.9,
                    weight=1,
                    fill=True,
                    fill_color="#FF0000",
                    fill_opacity=1,
                    radius=1.5,
                ),
            )
            tree_tops_density.add_to(cashew_map)
        except Exception:
            pass

    basemaps = {
        "Google Satellite": folium.TileLayer(
            tiles="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            attr="Google",
            name=gettext("Google Satellite"),
            max_zoom=25,
            overlay=False,
            show=False,
            control=True,
        ),
        "Mapbox Satellite": folium.TileLayer(
            tiles="https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{"
            "y}.png?access_token=pk.eyJ1Ijoic2hha2F6IiwiYSI6ImNrczMzNTl3ejB6eTYydnBlNzR0dHUwcnUifQ"
            ".vHqPio3Pe0PehWpIuf5QUg",
            attr="Mapbox",
            name=gettext("Mapbox Satellite"),
            max_zoom=25,
            overlay=False,
            show=False,
            control=True,
        ),
    }

    cashew_map = folium.Map(
        location=coordinate_xy, zoom_start=18, prefer_canvas=True, tiles=None
    )

    cashew_map.add_child(basemaps["Google Satellite"])
    cashew_map.add_child(basemaps["Mapbox Satellite"])

    try:
        add_country_shape()
        add_drone_image_layer()
        add_predictions_layer()
        add_alteia_tree_crowns(country)
        add_alteia_tree_tops_density(country)
        add_pruning_layer(country)
        add_thinning_layer(country)
        add_plantation_shape(country)
    except Exception as e:
        print("Error here something is wrong", e)
        # print("Error: " + e.__str__())
        # continue

    cashew_map.add_child(folium.LayerControl(collapsed=False))
    cashew_map = cashew_map._repr_html_()
    context = {"map": json.dumps(cashew_map), "segment": "map"}
    html_template = loader.get_template("dashboard/index.html")
    render = html_template.render(context, request)
    return HttpResponse(render)
