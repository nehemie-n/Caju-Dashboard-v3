import asyncio
from concurrent.futures import ThreadPoolExecutor
import datetime
import hashlib
import importlib
import json
import os
import pathlib
import sys
import time
import traceback
from typing import Any, List, Union
import dill
from folium import GeoJson
import folium
import joblib
import functools
from json import JSONEncoder
from django.conf import settings
from apps.dashboard.map_legend import macro_en, macro_fr
from apps.dashboard.layers_builders.benin_plantations import (
    create_benin_plantation_layer,
)
from apps.dashboard.layers_builders.caju_density import create_caju_density
from apps.dashboard.layers_builders.deforestation_layer import create_deforestation

from apps.dashboard.layers_builders.nursery_information import create_nursery
from apps.dashboard.layers_builders.prediction import create_predictions
from apps.dashboard.layers_builders.qar_informations import create_qar
from apps.dashboard.layers_builders.training_informations import create_training
from apps.dashboard.models import *


class MAP_LAYER_OBJECT_TYPE:
    GEOJSON = "GeoJson"
    MARKER = "Marker"
    TILELAYER = "TileLayer"
    RASTER_TILELAYER = "Raster TileLayer"
    OTHER = "Other"


class MAP_LAYER_TYPE:
    """
    Enumeration class representing different types of map layers.

    Attributes:
        COUNTRY_LAYER: Represents a country layer as a GeoJSON object.
        COUNTRY_BORDER_LAYER: Represents a country border layer as a GeoJSON object.
        COUNTRY_DEPT_LAYER: Represents a country department layer as a GeoJSON object.
        COUNTRY_COLORED_DEPT_LAYER: Represents a country colored department layer as a GeoJSON object.
        COUNTRY_COMMUNE_LAYER: Represents a country commune layer as a GeoJSON object.
        COUNTRY_DISTRICT_LAYER: Represents a country district layer as a GeoJSON object.
        COUNTRY_COLORED_COMMUNE_LAYER: Represents a country colored commune layer as a GeoJSON object.
        COUNTRY_PROTECTED_LAYER: Represents a country protected area layer as a GeoJSON object.
        COUNTRY_PLANTATION_LAYER: Represents a country plantation layer as a GeoJSON object.
        COUNTRY_PLANTATION_MARKER: Represents a country plantation marker as a marker object.
        NURSERY_LAYER: Represents a nursery layer as a marker object.
        QAR_LAYER: Represents a QAR layer as a marker object.
        TRAINING_LAYER: Represents a training layer as a marker object.
        PREDICTIONS_LAYER: Represents a predictions layer as a raster tile layer object.
        TREE_DENSITY_ESTIMATION_LAYER: Represents a tree density estimation layer as a tile layer object.
        DEFORESTATION: Represents a deforestation layer as a raster tile layer object.
        AFORESTATION: Represents an aforestation layer as a raster tile layer object.
    """

    COUNTRY_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_BORDER_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_DEPT_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_COLORED_DEPT_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_COMMUNE_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_DISTRICT_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_COLORED_COMMUNE_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_PROTECTED_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_PLANTATION_LAYER = MAP_LAYER_OBJECT_TYPE.GEOJSON
    COUNTRY_PLANTATION_MARKER = MAP_LAYER_OBJECT_TYPE.MARKER
    NURSERY_LAYER = MAP_LAYER_OBJECT_TYPE.MARKER
    QAR_LAYER = MAP_LAYER_OBJECT_TYPE.MARKER
    TRAINING_LAYER = MAP_LAYER_OBJECT_TYPE.MARKER
    PREDICTIONS_LAYER = MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER
    TREE_DENSITY_ESTIMATION_LAYER = MAP_LAYER_OBJECT_TYPE.TILELAYER
    DEFORESTATION = MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER
    AFORESTATION = MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER


def save_map_datas(
    country: str,
    layer_name: str,
    objs_type: str,
    objs_list: list,
    is_authenticated: bool,
):
    """
    Save map datas to a file.

    Args:
        country (str): The country name.
        layer_name (str): The name of the layer.
        objs_type (str): The type of the layer.
        objs_list (list): The list of objects to be saved.
        is_authenticated (bool): Indicates if the user is authenticated.

    Returns:
        bool: True if the map datas are saved successfully, False otherwise.
    """
    folder_path = os.path.join(
        settings.BASE_DIR, f"staticfiles/{country}/map_datas/public"
    )
    if is_authenticated:
        folder_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/normal"
        )
        second_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/public"
        )
    try:
        if objs_list != None and len(objs_list) > 0:
            file_path = os.path.join(folder_path, f"{layer_name}_objects.joblib")

            # Create the folder to save the layer in the cache if it doesn't exist
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)
            if os.path.exists(file_path):
                os.remove(file_path)

            if objs_type == MAP_LAYER_OBJECT_TYPE.GEOJSON:
                final_objs_list = []
                custom_popup = None
                custom_tooltip = None
                for geojson in objs_list:
                    if geojson._children:
                        for key, value in geojson._children.items():
                            if isinstance(value, folium.Popup):
                                custom_popup = {
                                    "html": (
                                        value.html.render()
                                        if hasattr(value, "html")
                                        else None
                                    ),
                                    "options": (
                                        value.options
                                        if hasattr(value, "options")
                                        else None
                                    ),
                                }
                                custom_popup = {
                                    k: v
                                    for k, v in custom_popup.items()
                                    if v is not None
                                }
                            elif isinstance(value, folium.GeoJsonTooltip):
                                custom_tooltip = {
                                    "fields": (
                                        value.fields
                                        if hasattr(value, "fields")
                                        else None
                                    ),
                                    "aliases": (
                                        value.aliases
                                        if hasattr(value, "aliases")
                                        else None
                                    ),
                                    "labels": (
                                        value.labels
                                        if hasattr(value, "labels")
                                        else None
                                    ),
                                    "localize": (
                                        value.localize
                                        if hasattr(value, "localize")
                                        else None
                                    ),
                                    "style": (
                                        value.style if hasattr(value, "style") else None
                                    ),
                                    "sticky": (
                                        value.sticky
                                        if hasattr(value, "sticky")
                                        else None
                                    ),
                                    "tooltip_options": (
                                        value.tooltip_options
                                        if hasattr(value, "tooltip_options")
                                        else None
                                    ),
                                }
                                custom_tooltip = {
                                    k: v
                                    for k, v in custom_tooltip.items()
                                    if v is not None
                                }
                    attributes = {
                        "data": geojson.data if hasattr(geojson, "data") else None,
                        "style_function": (
                            geojson.style_function
                            if hasattr(geojson, "style_function")
                            else None
                        ),
                        "highlight_function": (
                            geojson.highlight_function
                            if hasattr(geojson, "highlight_function")
                            else None
                        ),
                        "name": geojson.name if hasattr(geojson, "name") else None,
                        "overlay": (
                            geojson.overlay if hasattr(geojson, "overlay") else None
                        ),
                        "control": (
                            geojson.control if hasattr(geojson, "control") else None
                        ),
                        "show": geojson.show if hasattr(geojson, "show") else None,
                        "smooth_factor": (
                            geojson.smooth_factor
                            if hasattr(geojson, "smooth_factor")
                            else None
                        ),
                        "tooltip": (
                            geojson.tooltip if hasattr(geojson, "tooltip") else None
                        ),
                        "popup": geojson.popup if hasattr(geojson, "popup") else None,
                        "marker": (
                            geojson.marker if hasattr(geojson, "marker") else None
                        ),
                        "embed": geojson.embed if hasattr(geojson, "embed") else None,
                        "zoom_on_click": (
                            geojson.zoom_on_click
                            if hasattr(geojson, "zoom_on_click")
                            else None
                        ),
                    }
                    attributes = {k: v for k, v in attributes.items() if v is not None}
                    attributes["custom_popup"] = custom_popup
                    attributes["custom_tooltip"] = custom_tooltip
                    final_objs_list.append(attributes)
            elif objs_type == MAP_LAYER_OBJECT_TYPE.MARKER:
                final_objs_list = []
                for marker in objs_list:
                    icon = (
                        {
                            "_name": (
                                marker.icon._name
                                if hasattr(marker.icon, "_name")
                                else None
                            ),
                            "options": marker.icon.options,
                        }
                        if hasattr(marker, "icon")
                        else None
                    )
                    icon = {k: v for k, v in icon.items() if v is not None}
                    popup = None
                    tooltip = None
                    if marker._children:
                        for key, value in marker._children.items():
                            if isinstance(value, folium.Popup):
                                popup = {
                                    "html": (
                                        value.html.render()
                                        if hasattr(value, "html")
                                        else None
                                    ),
                                    "options": (
                                        value.options
                                        if hasattr(value, "options")
                                        else None
                                    ),
                                }
                                popup = {
                                    k: v for k, v in popup.items() if v is not None
                                }
                            elif isinstance(value, folium.Tooltip):
                                tooltip = {
                                    "_name": (
                                        value._name if hasattr(value, "_name") else None
                                    ),
                                    "text": (
                                        value.text if hasattr(value, "text") else None
                                    ),
                                    "options": (
                                        value.options
                                        if hasattr(value, "options")
                                        else None
                                    ),
                                    "style": (
                                        value.style if hasattr(value, "style") else None
                                    ),
                                }
                                tooltip = {
                                    k: v for k, v in tooltip.items() if v is not None
                                }
                    attributes = {
                        "location": (
                            marker.location if hasattr(marker, "location") else None
                        ),
                        "popup": popup,
                        "tooltip": tooltip,
                    }
                    attributes = {k: v for k, v in attributes.items() if v is not None}
                    attributes["icon"] = icon
                    attributes["icon_class"] = (
                        "folium.features.CustomIcon"
                        if layer_name in ["qar_layer", "training_layer"]
                        else (
                            "folium.Icon"
                            if hasattr(marker, "icon")
                            and isinstance(marker.icon, folium.Icon)
                            else None
                        )
                    )
                    attributes["options"] = (
                        marker.options if hasattr(marker, "options") else None
                    )
                    final_objs_list.append(attributes)
            else:
                final_objs_list = objs_list
            joblib.dump(final_objs_list, file_path)
            return True
        else:
            return False
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
        traceback.print_exc()
        return False


def load_map_datas(
    country: str, layer_name: str, objs_type: str, is_authenticated: bool
):
    """
    Load map datas based on the provided parameters.

    Args:
        country (str): The name of the country.
        layer_name (str): The name of the layer.
        objs_type (str): The type of objects to load.
        is_authenticated (bool): Indicates if the user is authenticated.

    Returns:
        List[Union[GeoJson, folium.Marker]]: The list of loaded map objects.

    Raises:
        Exception: If an error occurs while loading the map datas.
    """

    folder_path = os.path.join(
        settings.BASE_DIR, f"staticfiles/{country}/map_datas/public"
    )
    if is_authenticated:
        folder_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/normal"
        )
    try:
        file_path = os.path.join(folder_path, f"{layer_name}_objects.joblib")
        objs_list = None
        if os.path.exists(file_path):
            if objs_type == MAP_LAYER_OBJECT_TYPE.GEOJSON:
                geojson_list = joblib.load(file_path)
                objs_list = []
                for attributes in geojson_list:
                    obj = GeoJson(**dict(list(attributes.items())[:-2]))
                    if attributes["custom_popup"]:
                        folium.Popup(**attributes["custom_popup"]).add_to(obj)
                    if attributes["custom_tooltip"]:
                        folium.GeoJsonTooltip(**attributes["custom_tooltip"]).add_to(
                            obj
                        )
                    objs_list.append(obj)
            elif objs_type == MAP_LAYER_OBJECT_TYPE.MARKER:
                marker_data_list = joblib.load(file_path)
                objs_list = []
                for attributes in marker_data_list:
                    if attributes.get("icon", None):
                        attributes["icon"] = (
                            folium.Icon(**attributes["icon"]["options"])
                            if attributes["icon_class"] == "folium.Icon"
                            else (
                                folium.CustomIcon(
                                    attributes.get("icon", {})
                                    .get("options", {})
                                    .get("iconUrl", None),
                                    icon_size=attributes.get("icon", {})
                                    .get("options", {})
                                    .get("iconSize", None),
                                )
                                if layer_name in ["qar_layer", "training_layer"]
                                else None
                            )
                        )
                        attributes["icon_class"] = None

                    if attributes.get("popup", None):
                        attributes["popup"] = folium.Popup(**attributes["popup"])
                    if attributes.get("tooltip", None):
                        attributes["tooltip"] = folium.Tooltip(**attributes["tooltip"])
                    options = attributes.get("options", None)
                    attributes = {k: v for k, v in attributes.items() if v is not None}
                    if options:
                        objs_list.append(
                            folium.Marker(
                                **attributes,
                                **options,
                            )
                        )
                    else:
                        objs_list.append(folium.Marker(**attributes))
            else:
                objs_list = joblib.load(file_path)
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
        print(f"OPENING {file_path}")
        traceback.print_exc()

    return objs_list


def calculate_hash(data: Any):
    """
    Calculate the MD5 hash of the provided data.

    Args:
        data: The data to calculate the hash for.

    Returns:
        str: The MD5 hash of the data.
    """

    data_pickled = dill.dumps(data, protocol=0)
    return hashlib.md5(data_pickled).hexdigest()


def check_outdated_layer(country: str):
    """
    Check for outdated layers in the specified country.

    Args:
        country (str): The name of the country.

    Returns:
        List[Layer]: The list of outdated layers.

    Raises:
        ImportError: If there is an error importing the script module.
        AttributeError: If the script module or function does not exist.
    """

    DATASET = {
        "protected_area_data": {
            "type": "file",
            "path": f"staticfiles/{country}/protected_area_data.json",
        },
        "satellite_prediction_computed_data": {
            "type": "file",
            "path": f"staticfiles/{country}/satellite_prediction_computed_data.json",
        },
        "plantation_recommendation": {
            "type": "file",
            "path": f"staticfiles/{country}/plantation_recommendation.json",
        },
        "nursery_location_details": {
            "type": "file",
            "path": f"staticfiles/{country}/nursery_location_details.json",
        },
        "CommuneSatellite": {
            "type": "Model",
        },
        "DeptSatellite": {
            "type": "Model",
        },
        "BeninYield": {
            "type": "Model",
        },
        "Nursery": {
            "type": "Model",
        },
        "AlteiaData": {
            "type": "Model",
        },
        "SpecialTuple": {
            "type": "Model",
        },
        "Training": {
            "type": "Model",
        },
        # New modesls
        "Plantation": {
            "type": "Model",
        },
        "GAUL1": {
            "type": "Model",
        },
        "GAUL2": {
            "type": "Model",
        },
        "GAUL3": {
            "type": "Model",
        },
        "ProtectedArea": {
            "type": "Model",
        },
        "current_qars": {
            "type": "func",
            "script": os.path.join(settings.BASE_DIR, "apps/dashboard/scripts"),
            "module_name": "get_qar_information",
            "function": "get_qar_data_from_db",
        },
        "plantations_details": {
            "type": "func",
            "script": os.path.join(settings.BASE_DIR, "apps/dashboard/layers_builders"),
            "module_name": "nursery_location_recommandation",
            "function": "get_plantations_details",
        },
        "nursery_number": {
            "type": "func",
            "script": os.path.join(settings.BASE_DIR, "apps/dashboard/layers_builders"),
            "module_name": "nursery_location_recommandation",
            "function": "get_number_of_nurseries",
        },
        "current_trainings": {
            "type": "func",
            "script": os.path.join(settings.BASE_DIR, "apps/dashboard/scripts"),
            "module_name": "get_training_information",
            "function": "get_training_data_from_db",
        },
    }
    #
    # ensure .json datasets are already there
    # If not create them temp
    json_datasets = [
        (DATASET["protected_area_data"], {}),
        (DATASET["satellite_prediction_computed_data"], {}),
        (DATASET["plantation_recommendation"], {}),
        (DATASET["nursery_location_details"], []),
    ]
    for dset, data in json_datasets:
        path = dset.get("path")
        if not os.path.exists(path):
            with open(path, mode="w", encoding="utf-8", errors="ignore") as outfile:
                outfile.write(json.dumps(data))

    # continue building
    current_country = Country.objects.using(country).get(country_name=country)
    dataset_objs = Dataset.objects.using(country).filter(
        country_id__country_name=country
    )
    outdated_dataset = []
    plantations_details = None
    for dataset in dataset_objs:
        current_dataset = DATASET.get(dataset.name, None)
        if current_dataset:
            if current_dataset["type"] == "file":
                print(f"checking: {dataset.name}")
                with open(current_dataset["path"], "r") as e:
                    current_hash = calculate_hash(e)
                    if dataset.hash and dataset.hash == current_hash:
                        pass
                    else:
                        dataset.hash = current_hash
                        dataset.country_id = current_country
                        dataset.save(using=country)
                        outdated_dataset.append(dataset)
                        print(f"{dataset.name}: Outdated")
            elif current_dataset["type"] == "func":
                print(f"checking: {dataset.name}")
                try:
                    sys.path.append(current_dataset["script"])
                    module = importlib.import_module(current_dataset["module_name"])
                    script_function = getattr(module, current_dataset["function"])
                    if current_dataset["function"] == "get_training_data_from_db":
                        output = script_function(country)
                    elif current_dataset["function"] == "get_plantations_details":
                        plantations_details = output = script_function(current_country)
                    elif current_dataset["function"] == "get_number_of_nurseries":
                        output = script_function(current_country, plantations_details)
                    else:
                        output = script_function(current_country)
                    current_hash = calculate_hash(output)
                    if dataset.hash and dataset.hash == current_hash:
                        pass
                    else:
                        dataset.hash = current_hash
                        dataset.country_id = current_country
                        dataset.save(using=country)
                        outdated_dataset.append(dataset)
                        print(f"{dataset.name}: Outdated")
                except (ImportError, AttributeError) as e:
                    print(e)
            else:
                print(f"checking: {dataset.name}")
                model: models.Model = globals()[dataset.name]
                datas = (
                    model.objects.using(country)
                    .filter(
                        country_id=Country.objects.using(country).get(
                            country_name=country
                        )
                    )
                    .values()
                )
                list_datas = [dtas for dtas in datas]
                current_hash = calculate_hash(list_datas)
                if dataset.hash and dataset.hash == current_hash:
                    pass
                else:
                    dataset.hash = current_hash
                    dataset.save(using=country)
                    outdated_dataset.append(dataset)
                    print(f"{dataset.name}: Outdated")

    outdated_layer_only = (
        Layer.objects.using(country)
        .filter(
            models.Q(country_id__country_name=country),
            models.Q(datasets__in=outdated_dataset),
        )
        .distinct()
    )

    outdated_layer = []
    for outdated_layer_obj in outdated_layer_only:
        outdated_layer_dependencies_current = outdated_layer_obj.dependencies.all()
        for obj in outdated_layer_dependencies_current:
            outdated_layer.append(obj)
        outdated_layer.append(outdated_layer_obj)

    outdated_layer = list(set(outdated_layer))

    print("Done checking outdated layers")

    return outdated_layer


def get_key(val, my_dict):
    """
    Returns the key associated with a given value in a dictionary.

    Args:
        val: The value to search for in the dictionary.
        my_dict: The dictionary to search in.

    Returns:
        The key associated with the given value in the dictionary, or "key doesn't exist" if the value is not found.
    """

    return next(
        (key for key, value in my_dict.items() if val == value),
        "key doesn't exist",
    )


class CustomEncoder(JSONEncoder):
    """
    Custom JSON encoder that extends the JSONEncoder class.

    This encoder provides custom serialization for certain types of objects. It handles `functools.partial` objects by serializing them as dictionaries with the keys "__partial__", "func", "args", and "keywords". It also handles callable objects by serializing them as dictionaries with the keys "__function__" and "name".

    Args:
        obj: The object to be serialized.

    Returns:
        The serialized representation of the object.
    """

    def default(self, obj):
        """
        Serializes a given object using custom rules.

        This function is used as a method of a JSONEncoder subclass. It provides custom serialization for certain types of objects. If the object is a `functools.partial` instance, it is serialized as a dictionary with the keys "__partial__", "func", "args", and "keywords". If the object is callable, it is serialized as a dictionary with the keys "__function__" and "name". Otherwise, the default serialization method of the JSONEncoder class is used.

        Args:
            obj: The object to be serialized.

        Returns:
            The serialized representation of the object.
        """

        if isinstance(obj, functools.partial):
            return {
                "__partial__": True,
                "func": obj.func.__name__,
                "args": obj.args,
                "keywords": obj.keywords,
            }
        elif callable(obj):
            return {
                "__function__": True,
                "name": obj.__name__,
            }
        return JSONEncoder.default(self, obj)


def extract_tilelayer_data(tile_layer):
    """
    Extracts data from a tile layer object and returns it as a dictionary.

    This function takes a tile layer object and extracts the relevant data, including the tiles and various options such as minZoom, maxZoom, attribution, and opacity. The extracted data is returned as a dictionary.

    Args:
        tile_layer: The tile layer object to extract data from.

    Returns:
        A dictionary containing the extracted data from the tile layer.
    """

    return {
        "tiles": tile_layer.tiles,
        "options": {
            "minZoom": tile_layer.options.get("min_zoom", 0),
            "maxZoom": tile_layer.options.get("max_zoom", 18),
            "maxNativeZoom": tile_layer.options.get("max_native_zoom"),
            "attribution": tile_layer.options.get("attribution"),
            "detectRetina": tile_layer.options.get("detect_retina", False),
            "subdomains": tile_layer.options.get("subdomains", "abc"),
            "tms": tile_layer.options.get("tms", False),
            "opacity": tile_layer.options.get("opacity", 1),
            "noWrap": tile_layer.options.get("no_wrap", False),
            **{
                key: value
                for key, value in tile_layer.options.items()
                if key
                not in [
                    "min_zoom",
                    "max_zoom",
                    "max_native_zoom",
                    "attribution",
                    "detect_retina",
                    "subdomains",
                    "tms",
                    "opacity",
                    "no_wrap",
                ]
            },
        },
    }


def assign_layer(layers, layer_objs, source, key, default_count):
    """
    Assigns a layer and its objects from a source dictionary to the given layers and layer_objs dictionaries.

    Args:
        layers (dict): A dictionary to store the assigned layers.
        layer_objs (dict): A dictionary to store the assigned layer objects.
        source (dict): The source dictionary containing the layer and its objects.
        key (str): The key to access the layer and its objects in the source dictionary.
        default_count (int): The default number of objects to assign if the key is not found in the source dictionary.

    Returns:
        None
    """
    values = source.get(key, (None,) * default_count)
    layers[key] = values[0]
    layer_objs[key] = values[1:]


def build_outdated_layer(outdated_layers, country: str, lang, is_authenticated: bool):
    """
    Builds outdated layers for a specific country.

    Args:
        outdated_layers (list): A list of outdated layers.
        country (str): The country for which to build the layers.
        lang: The language.
        is_authenticated (bool): Indicates if the user is authenticated.

    Returns:
        dict: A dictionary containing the built outdated layers.
    """

    folder_path = os.path.join(
        settings.BASE_DIR, f"staticfiles/{country}/map_datas/public"
    )
    if is_authenticated:
        folder_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/normal"
        )
    layers = {}
    print(outdated_layers)
    function_mapping = None
    futures_per_country = []
    outdated_layer_dict = {}
    try:
        current_country = Country.objects.using(country).get(country_name=country)

        script_mapping = {
            "current_qars": {
                "type": "func",
                "script": os.path.join(settings.BASE_DIR, "apps/dashboard/scripts"),
                "module_name": "get_qar_information",
                "function": "get_qar_data_from_db",
                "parameters": [current_country],
                "output": None,
            },
            "plantations_details": {
                "type": "func",
                "script": os.path.join(
                    settings.BASE_DIR, "apps/dashboard/layers_builders"
                ),
                "module_name": "nursery_location_recommandation",
                "function": "get_plantations_details",
                "parameters": [current_country],
                "output": None,
            },
            "nursery_number": {
                "type": "func",
                "script": os.path.join(
                    settings.BASE_DIR, "apps/dashboard/layers_builders"
                ),
                "module_name": "nursery_location_recommandation",
                "function": "get_number_of_nurseries",
                "parameters": [current_country],
                "output": None,
            },
            "current_trainings": {
                "type": "func",
                "script": os.path.join(settings.BASE_DIR, "apps/dashboard/scripts"),
                "module_name": "get_training_information",
                "function": "get_training_data_from_db",
                "parameters": [country],
                "output": None,
            },
        }

        outdated_layer_datasets_names = []
        outdated_layer_dependencies_datasets_names = []
        for outdated_layer in outdated_layers:
            for dtaset in outdated_layer.datasets.all():
                outdated_layer_datasets_names.append(dtaset.name)
            for dependency in outdated_layer.dependencies.all():
                for dtaset in dependency.datasets.all():
                    outdated_layer_dependencies_datasets_names.append(dtaset.name)

        for elmt in script_mapping.keys():
            if (
                elmt in outdated_layer_datasets_names
                or elmt in outdated_layer_dependencies_datasets_names
            ):
                script = script_mapping[elmt]
                try:
                    sys.path.append(script["script"])
                    module = importlib.import_module(script["module_name"])
                    script_function = getattr(module, script["function"])
                    if elmt == "nursery_number":
                        script["output"] = {
                            country: script_function(
                                *script["parameters"],
                                script_mapping["plantations_details"]["output"],
                            )
                        }
                    else:
                        script["output"] = {
                            country: script_function(*script["parameters"])
                        }
                except (ImportError, AttributeError) as e:
                    print(e)

        if len(outdated_layers) > 0:
            function_mapping = {
                "benin_colored_communes": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_colored_communes",
                    "function": "create_country_colored_commune",
                    "parameters": [country],
                    "output": None,
                },
                "benin_colored_departments": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_colored_departments",
                    "function": "create_country_colored_department",
                    "parameters": [country],
                    "output": None,
                },
                "benin_commune": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_commune",
                    "function": "create_country_commune",
                    "parameters": [
                        script_mapping.get("current_qars", {})
                        .get("output", {})
                        .get(country, None),
                        current_country,
                        script_mapping.get("plantations_details", {}).get("output", {}),
                        script_mapping.get("nursery_number", {}).get("output", {}),
                        is_authenticated,
                    ],
                    "output": None,
                },
                "benin_department": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_department",
                    "function": "create_benin_department",
                    "parameters": [
                        script_mapping.get("current_qars", {})
                        .get("output", {})
                        .get(country, None),
                        current_country,
                        is_authenticated,
                    ],
                    "output": None,
                },
                "benin_district": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_district",
                    "function": "create_benin_district",
                    "parameters": [current_country],
                    "output": None,
                },
                "benin_plantations": {
                    "type": "future2",
                },
                "benin_protected_areas": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_protected_areas",
                    "function": "create_benin_protected_area",
                    "parameters": [current_country],
                    "output": None,
                },
                "benin_republic": {
                    "type": "func",
                    "script": os.path.join(
                        settings.BASE_DIR, "apps/dashboard/layers_builders"
                    ),
                    "module_name": "benin_republic",
                    "function": "create_benin_republic",
                    "parameters": [
                        script_mapping.get("current_qars", {})
                        .get("output", {})
                        .get(country, None),
                        current_country,
                        is_authenticated,
                    ],
                    "output": None,
                },
                "caju_density": {
                    "type": "future6",
                },
                "qar_layer": {
                    "type": "future4",
                },
                "training_informations": {
                    "type": "future5",
                },
                "nursery_layer": {
                    "type": "future1",
                },
                "predictions_layer": {
                    "type": "future3",
                },
                "deforestation": {
                    "type": "future7",
                },
            }

            for obj in function_mapping.values():
                if "func" == obj["type"] and get_key(obj, function_mapping) in [
                    outdated_layer.name for outdated_layer in outdated_layers
                ]:
                    print(get_key(obj, function_mapping), "Layers")
                    try:
                        sys.path.append(obj["script"])
                        module = importlib.import_module(obj["module_name"])
                        script_function = getattr(module, obj["function"])
                        obj["output"] = {country: script_function(*obj["parameters"])}
                    except Exception as e:
                        print(e)

            futures_per_country_static = {
                "Benin": [
                    "future1",
                    "future2",
                    "future3",
                    "future4",
                    "future5",
                    "future6",
                    "future7",
                ],
                "Ivory Coast": [
                    "future2",
                    "future3",
                    "future7",
                ],
            }

            futures_per_country = [
                obj["type"]
                for obj in function_mapping.values()
                if "future" in obj["type"]
                and get_key(obj, function_mapping)
                in [outdated_layer.name for outdated_layer in outdated_layers]
                and obj["type"] in futures_per_country_static[country]
            ]

        # GEE Layers building too
        # gee_futures = {
        #     "Benin": {
        #         "predictions_layer": "future3",
        #         "tree_density_estimation_layer": "future6",
        #         "deforestation": "future7",
        #         "aforestation": "future7",
        #     },
        #     "Ivory Coast": {
        #         "predictions_layer": "future3",
        #         "deforestation": "future7",
        #         "aforestation": "future7",
        #     },
        # }

        # for key, value in gee_futures[country].items():
        #     path = f'{os.path.join(folder_path, f"{key}_objects.joblib",)}'
        #     if os.path.isfile(path):
        #         path = pathlib.Path(path)
        #         timestamp = path.stat().st_mtime
        #         m_time = datetime.datetime.fromtimestamp(timestamp)
        #         current_existance_timeframe = datetime.datetime.today() - m_time
        #         print(
        #             f"LAST DUMPED TIME OF {key}: {(current_existance_timeframe.seconds / 60)} min"
        #         )
        #         if (current_existance_timeframe.seconds / 60) > 500:
        #             futures_per_country.append(value)
        #     else:
        #         futures_per_country.append(value)

        # futures_per_country = list(set(futures_per_country))

        futures_output = {}
        all_layer_to_build_objs = {}
        all_layers = {}

        try:
            server_url = os.getenv("SERVER_URL")
            if server_url[-1] != "/":
                server_url += "/"
            path_link = server_url + lang + "/dashboard/"

            async def __get_context_data__():
                try:
                    __loop = asyncio.get_event_loop()
                    executor = ThreadPoolExecutor(2)
                    all_futures = {}
                    if "future1" in futures_per_country:
                        all_futures["future1"] = __loop.run_in_executor(
                            executor, create_nursery, country
                        )
                    if "future2" in futures_per_country:
                        all_futures["future2"] = __loop.run_in_executor(
                            executor,
                            create_benin_plantation_layer,
                            path_link,
                            function_mapping["benin_department"]["output"],
                            country,
                        )
                    if "future3" in futures_per_country:
                        all_futures["future3"] = __loop.run_in_executor(
                            executor, create_predictions, country
                        )
                    if "future4" in futures_per_country:
                        all_futures["future4"] = __loop.run_in_executor(
                            executor,
                            create_qar,
                            script_mapping["current_qars"]["output"],
                            country,
                        )
                    if "future5" in futures_per_country:
                        all_futures["future5"] = __loop.run_in_executor(
                            executor,
                            create_training,
                            script_mapping["current_trainings"]["output"],
                            country,
                        )
                    if "future6" in futures_per_country:
                        all_futures["future6"] = __loop.run_in_executor(
                            executor, create_caju_density, country
                        )
                    if "future7" in futures_per_country:
                        all_futures["future7"] = __loop.run_in_executor(
                            executor,
                            create_deforestation,
                            country,
                        )

                    print(f"all_futures is {all_futures}")

                    for future in futures_per_country:
                        if all_futures.get(future, None) is not None:
                            futures_output[future] = await all_futures.get(future)

                    # print(f"futures_output is {futures_output}")

                    if function_mapping:
                        for key, value in function_mapping.items():
                            if value.get("output", None) and value.get(
                                "output", None
                            ).get(country, None):
                                all_layers[key] = value["output"][country]

                    print(all_layers.keys(), "all_layers")

                except Exception as e:
                    exc_type, exc_obj, exc_tb = sys.exc_info()
                    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                    print(exc_type, fname, exc_tb.tb_lineno)
                    traceback.print_exc()
                    print("Error while building the map")
                    pass

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop = asyncio.get_event_loop()
            print(f"Building layers for {country}")
            loop.run_until_complete(__get_context_data__())
            loop.close()

            # keys_defaults = {
            #     "benin_republic": 4,
            #     "benin_department": 3,
            #     "benin_colored_departments": 2,
            #     "benin_commune": 2,
            #     "benin_district": 2,
            #     "benin_colored_communes": 2,
            #     "benin_protected_areas": 2,
            #     "future2": 3,
            #     "future1": 2,
            #     "future4": 2,
            #     "future5": 2,
            #     "future3": 2,
            #     "future6": 2,
            #     "future7": 4,
            # }

            # for key, default_count in keys_defaults.items():
            #     source = all_layers if "benin" in key else futures_output
            #     assign_layer(
            #         layers, all_layer_to_build_objs, source, key, default_count
            #     )

            (
                layers["country_layer"],
                layers["country_border_layer"],
                all_layer_to_build_objs["country_layer"],
                all_layer_to_build_objs["country_border_layer"],
            ) = all_layers.get("benin_republic", (None, None, None, None))

            (
                layers["country_dept_layer"],
                _,
                all_layer_to_build_objs["country_dept_layer"],
            ) = all_layers.get("benin_department", (None, None, None))

            (
                layers["country_colored_dept_layer"],
                all_layer_to_build_objs["country_colored_dept_layer"],
            ) = all_layers.get("benin_colored_departments", (None, None))

            (
                layers["country_commune_layer"],
                all_layer_to_build_objs["country_commune_layer"],
            ) = all_layers.get("benin_commune", (None, None))

            (
                layers["country_district_layer"],
                all_layer_to_build_objs["country_district_layer"],
            ) = all_layers.get("benin_district", (None, None))

            (
                layers["country_colored_commune_layer"],
                all_layer_to_build_objs["country_colored_commune_layer"],
            ) = all_layers.get("benin_colored_communes", (None, None))

            (
                layers["country_protected_layer"],
                all_layer_to_build_objs["country_protected_layer"],
            ) = all_layers.get("benin_protected_areas", (None, None))

            (
                layers["country_plantation_layer"],
                all_layer_to_build_objs["country_plantation_layer"],
                all_layer_to_build_objs["country_plantation_marker"],
            ) = futures_output.get("future2", (None, None, None))

            (
                layers["nursery_layer"],
                all_layer_to_build_objs["nursery_layer"],
            ) = futures_output.get("future1", (None, None))

            (
                layers["qar_layer"],
                all_layer_to_build_objs["qar_layer"],
            ) = futures_output.get("future4", (None, None))

            (
                layers["training_layer"],
                all_layer_to_build_objs["training_layer"],
            ) = futures_output.get("future5", (None, None))

            (
                layers["predictions_layer"],
                all_layer_to_build_objs["predictions_layer"],
            ) = futures_output.get("future3", (None, None))

            (
                layers["tree_density_estimation_layer"],
                all_layer_to_build_objs["tree_density_estimation_layer"],
            ) = futures_output.get("future6", (None, None))

            (
                layers["deforestation"],
                layers["aforestation"],
                all_layer_to_build_objs["aforestation"],
                all_layer_to_build_objs["deforestation"],
            ) = futures_output.get("future7", (None, None, None, None))

            for key, value in all_layer_to_build_objs.items():
                if value:
                    all_layer_to_build_objs[key] = value

        except Exception as e:
            traceback.print_exc()
            return None

        print(f"all_layer_to_build_objs is {all_layer_to_build_objs.keys()}")

        layers_names = [
            "country_layer",
            "country_border_layer",
            "country_dept_layer",
            "country_colored_dept_layer",
            "country_commune_layer",
            "country_district_layer",
            "country_colored_commune_layer",
            "country_protected_layer",
            "country_plantation_layer",
            "country_plantation_marker",
            "nursery_layer",
            "qar_layer",
            "training_layer",
            "predictions_layer",
            "tree_density_estimation_layer",
            "deforestation",
            "aforestation",
        ]

        print("caching layers")

        for obj in layers_names:
            if all_layer_to_build_objs.get(obj, None):
                try:
                    save_map_datas(
                        country,
                        obj,
                        getattr(MAP_LAYER_TYPE, obj.upper()),
                        all_layer_to_build_objs[obj],
                        is_authenticated,
                    )
                    # TODO :: CHECK::  do we need to add language in the path
                    # lang
                    file_path = os.path.join(folder_path, f"{obj}_objects.joblib")
                    if obj in [
                        "predictions_layer",
                        "tree_density_estimation_layer",
                        "deforestation",
                        "aforestation",
                    ]:
                        print(f"We are in {obj}")
                        outdated_layer_dict[obj] = [
                            extract_tilelayer_data(elmt)
                            for elmt in joblib.load(file_path)
                        ]
                    else:
                        print("Layer name is :", obj)
                        outdated_layer_dict[obj] = json.dumps(
                            joblib.load(file_path), cls=CustomEncoder
                        )
                except Exception as e:
                    exc_type, exc_obj, exc_tb = sys.exc_info()
                    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                    print(exc_type, fname, exc_tb.tb_lineno)
                    traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        return None
    return outdated_layer_dict


def create_serialized_layer_list(
    layers_names: list,
    layers_name_list: list,
    active_countries: list,
    initial_serialized_layer: dict,
    lang: str,
    map_type: str,
    gee_layer_list: list,
):
    """ """
    layers_builders_path = os.path.join(
        settings.BASE_DIR, "apps/dashboard/layers_builders"
    )
    for obj in layers_names:
        if obj in layers_name_list:
            try:
                for country in active_countries:
                    folder_path = os.path.join(
                        settings.BASE_DIR,
                        f"staticfiles/{country.country_name}/map_datas/{map_type}",
                    )
                    file_path = os.path.join(folder_path, f"{obj}_objects.joblib")
                    sys.path.append(layers_builders_path)
                    if obj in gee_layer_list:
                        initial_serialized_layer[country.country_name][lang][obj] = [
                            extract_tilelayer_data(elmt)
                            for elmt in joblib.load(file_path)
                        ]
                    else:
                        initial_serialized_layer[country.country_name][lang][obj] = (
                            json.dumps(joblib.load(file_path), cls=CustomEncoder)
                        )
            except FileNotFoundError as e:
                print(f"{country} :: Doesn't have layer {obj}")
            except Exception as e:
                exc_type, exc_obj, exc_tb = sys.exc_info()
                fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                print(exc_type, fname, exc_tb.tb_lineno)
                traceback.print_exc()
    if layers_builders_path in sys.path:
        sys.path.remove(layers_builders_path)
    return initial_serialized_layer
