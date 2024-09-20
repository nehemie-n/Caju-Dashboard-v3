import hashlib
import locale
import os
import traceback
import time
from django.conf import settings
import folium
from django.utils.translation import gettext
from folium import FeatureGroup, plugins
import joblib
from apps.dashboard.maps_builders.shared_fn import map_home_btn
from apps.dashboard.custom_layer_control import CustomLayerControl
from apps.dashboard.map_legend import macro_en, macro_fr
from apps.dashboard.maps_builders.map_utils import (
    MAP_LAYER_TYPE,
    calculate_hash,
    create_serialized_layer_list,
    load_map_datas,
)
from apps.dashboard.models import Country, Dataset

# Use '' for auto, or force e.g. to 'en_US.UTF-8'
locale.setlocale(locale.LC_ALL, "")


def ordering_layers(cashew_map, layers):
    order = [
        "country_border_layer",
        "country_layer",
        "country_dept_layer",
        "country_commune_layer",
        "country_district_layer",
        "country_colored_dept_layer",
        "country_colored_commune_layer",
        "country_protected_layer",
        "country_plantation_layer",
        "training_layer",
        "qar_layer",
        "nursery_layer",
    ]
    for layer_name in order:
        if layer_name in layers:
            layer = layers[layer_name]
            cashew_map.keep_in_front(layer)
    return cashew_map


def add_layers_to_map(cashew_map, layers):
    order = [
        "country_border_layer",
        "country_layer",
        "country_dept_layer",
        "country_commune_layer",
        "country_district_layer",
        "country_colored_dept_layer",
        "country_colored_commune_layer",
        "country_protected_layer",
        "country_plantation_layer",
        "qar_layer",
        "training_layer",
        "nursery_layer",
        "predictions_layer",
        "tree_density_estimation_layer",
        "deforestation",
        "aforestation",
    ]
    for layer_name in order:
        if layer_name in layers:
            try:
                layer = layers[layer_name]
                layer.add_to(cashew_map)
            except Exception as e:
                print(layers["deforestation"])
                print(f"Error adding layer {layer_name}")
                traceback.print_exc()
                pass
    return cashew_map


def get_base_map(path_link, country_lon, country_lat):
    cashew_map = None
    try:
        # Basemap dictionary
        basemaps = {
            "Google Maps": folium.TileLayer(
                tiles="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                attr=gettext("Google"),
                name="Google Maps",
                max_zoom=25,
                overlay=False,
                control=True,
                show=True,
            ),
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

        # Initialize map object
        cashew_map = folium.Map(
            location=[country_lat, country_lon],
            zoom_start=8,
            prefer_canvas=True,
            tiles=None,
            max_zoom=200,
        )

        if "/en/" in path_link.__str__():
            cashew_map.get_root().add_child(macro_en)
        elif "/fr/" in path_link.__str__():
            cashew_map.get_root().add_child(macro_fr)

        cashew_map.add_child(basemaps["Google Maps"])
        cashew_map.add_child(basemaps["Google Satellite"])
        cashew_map.add_child(basemaps["Mapbox Satellite"])

        plugins.Fullscreen(
            position="topright",
            title="Full Screen",
            title_cancel="Exit Full Screen",
            force_separate_button=False,
        ).add_to(cashew_map)
    except Exception as e:
        traceback.print_exc()
        pass

    return cashew_map


class DefaultMap:
    def __init__(self):
        self.country_colored_commune_layer = None
        self.country_colored_dept_layer = None
        self.country_commune_layer = None
        self.country_dept_layer = None
        self.country_district_layer = None
        self.country_plantation_layer = None
        self.country_protected_layer = None
        self.country_layer = None
        self.country_border_layer = None
        self.nursery_layer = None
        self.qar_layer = None
        self.training_layer = None
        self.tree_density_estimation_layer = None
        self.predictions_layer = None
        self.deforestation = None
        self.aforestation = None

    def generate_country_colored_commune_layer(self, countries_layer_list):
        country_colored_communes_layer = FeatureGroup(
            name=gettext("Communes Training Recommendations"),
            show=False,
            overlay=True,
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(country_colored_communes_layer)
        self.country_colored_commune_layer = country_colored_communes_layer
        return country_colored_communes_layer

    def generate_country_colored_dept_layer(self, countries_layer_list):
        country_colored_departments_layer = FeatureGroup(
            name=gettext("Departments Training Recommendations"),
            show=False,
            overlay=True,
            z_index_offset=10,
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(country_colored_departments_layer)
        self.country_colored_dept_layer = country_colored_departments_layer
        return country_colored_departments_layer

    def generate_country_commune_layer(self, countries_layer_list, country: Country):
        country_commune_layer = FeatureGroup(
            name=gettext(f"{country.country_name} {country.level2_name}"),
            show=False,
            overlay=True,
        )

        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(country_commune_layer)
        self.country_commune_layer = country_commune_layer
        return country_commune_layer

    def generate_country_dept_layer(self, countries_layer_list, country: Country):
        benin_departments_layer = FeatureGroup(
            name=gettext(f"{country.country_name} {country.level1_name}"),
            show=False,
            overlay=True,
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(benin_departments_layer)
        self.country_dept_layer = benin_departments_layer
        return benin_departments_layer

    def generate_country_district_layer(self, countries_layer_list, country: Country):
        benin_district_layer = FeatureGroup(
            name=gettext(f"{country.country_name} {country.level3_name}"),
            show=False,
            overlay=True,
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(benin_district_layer)
        self.country_district_layer = benin_district_layer
        return benin_district_layer

    def generate_country_plantation_layer(
        self, countries_layer_list, countries_marker_list
    ):
        plantation_cluster = plugins.MarkerCluster(name=gettext("Plantations"))
        benin_plantation_layer = FeatureGroup(
            name=gettext("Plantation Locations"), show=True, overlay=True
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(benin_plantation_layer)
        for elmt in countries_marker_list if countries_marker_list is not None else []:
            elmt.add_to(plantation_cluster)
        plantation_cluster.add_to(benin_plantation_layer)
        self.country_plantation_layer = benin_plantation_layer
        return benin_plantation_layer

    def generate_country_protected_layer(self, countries_layer_list):
        country_protected_layer = FeatureGroup(
            name=gettext("Protected Areas"), show=False, overlay=True
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(country_protected_layer)
        self.country_protected_layer = country_protected_layer
        return country_protected_layer

    def generate_country_layer(self, countries_layer_list, country: Country):
        benin_layer = FeatureGroup(
            name=gettext(f"{country.country_name} Republic"), show=False, overlay=True
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(benin_layer)
        self.country_layer = benin_layer
        return benin_layer

    def generate_country_border_layer(self, countries_layer_list, country: Country):
        benin_border_layer = FeatureGroup(
            name=gettext(f"{country.country_name}Republic"),
            show=True,
            overlay=False,
            control=False,
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(benin_border_layer)
        self.country_border_layer = benin_border_layer
        return benin_border_layer

    def generate_nursery_layer(self, countries_layer_list):
        marker_cluster = plugins.MarkerCluster(
            name=gettext("Nursery Information"), show=True
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(marker_cluster)
        self.nursery_layer = marker_cluster
        return marker_cluster

    def generate_qar_layer(self, countries_layer_list):
        marker_cluster = plugins.MarkerCluster(
            name=gettext("Warehouse Location"), show=True
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(marker_cluster)
        self.qar_layer = marker_cluster
        return marker_cluster

    def generate_training_layer(self, countries_layer_list):
        marker_cluster = plugins.MarkerCluster(
            name=gettext("Training Information"), show=False
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            elmt.add_to(marker_cluster)
        self.training_layer = marker_cluster
        return marker_cluster

    def generate_tree_density_estimation_layer(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Tree Density Satellite Estimation"), show=False
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            feature_group.add_child(obj)
        self.tree_density_estimation_layer = feature_group
        return feature_group

    def generate_predictions_layer(self, countries_layer_list):
        feature_group = FeatureGroup(name=gettext("Cashew Growing Areas"), show=True)
        for obj in countries_layer_list if countries_layer_list is not None else []:
            feature_group.add_child(obj)
        self.predictions_layer = feature_group
        return feature_group

    def generate_deforestation(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Deforested Area (2021 - 2022) (ha)"), show=False
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            feature_group.add_child(obj)
        self.deforestation = feature_group
        return feature_group

    def generate_aforestation(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Afforested Area (2000 - 2012) (ha)"), show=False
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            feature_group.add_child(obj)
        self.aforestation = feature_group
        return feature_group


def full_map(lang, country: Country, outdated_layers: dict):
    start_time = time.time()
    active_countries = Country.objects.filter(country_name=country.country_name)

    try:
        default_map_obj = DefaultMap()

        layers_name_list = ["country_plantation_marker"]

        default_map_obj_attributes = dir(default_map_obj)
        for attribute in default_map_obj_attributes:
            if not attribute.startswith("__") and not getattr(
                default_map_obj, attribute
            ):
                layers_name_list.append(attribute)

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

        initial_serialized_layer = {country.country_name: {lang: {}}}

        gee_layer_list = [
            "predictions_layer",
            "tree_density_estimation_layer",
            "deforestation",
            "aforestation",
        ]

        serialized_layer = create_serialized_layer_list(
            layers_names,
            layers_name_list,
            active_countries,
            initial_serialized_layer,
            lang,
            "normal",
            gee_layer_list,
        )

        map_layers_hashes = [
            obj
            for obj in [
                str(elmt.hash)
                for elmt in Dataset.objects.using(country.country_name).filter(
                    country_id__country_name=country.country_name
                )
            ]
            + [
                calculate_hash(
                    joblib.load(
                        os.path.join(
                            os.path.join(
                                settings.BASE_DIR,
                                f"staticfiles/{country.country_name}/map_datas/normal",
                            ),
                            f"{gee_layer_name}_objects.joblib",
                        )
                    )
                )
                for gee_layer_name in gee_layer_list
                if not country == "Ivory Coast"
                and not gee_layer_name == "tree_density_estimation_layer"
            ]
        ]

        hash_obj = hashlib.sha256()
        hash_obj.update("".join(map_layers_hashes).encode("utf-8"))
        map_hash = hash_obj.hexdigest()
        print("TOTAL LOADING TIME--- %s seconds ---" % (time.time() - start_time))
        return serialized_layer, map_hash
    except Exception as e:
        traceback.print_exc()
        return None
