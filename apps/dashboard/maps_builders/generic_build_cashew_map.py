import hashlib
import locale
import os
import time
from django.conf import settings

from django.utils.translation import gettext
from folium import FeatureGroup
from folium.plugins import MarkerCluster
import joblib

from apps.dashboard.models import Country, Dataset
import traceback
from apps.dashboard.maps_builders.map_utils import (
    calculate_hash,
    create_serialized_layer_list,
)

# Use '' for auto, or force e.g. to 'en_US.UTF-8'
locale.setlocale(locale.LC_ALL, "")


class GenericMap:
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
            name=gettext("Training Recommendations Level 2"),
            show=False,
            overlay=True,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(country_colored_communes_layer)
        self.country_colored_commune_layer = country_colored_communes_layer
        return country_colored_communes_layer

    def generate_country_colored_dept_layer(self, countries_layer_list):
        country_colored_departments_layer = FeatureGroup(
            name=gettext("Training Recommendations Level 1"),
            show=False,
            overlay=True,
            z_index_offset=10,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(country_colored_departments_layer)
        self.country_colored_dept_layer = country_colored_departments_layer
        return country_colored_departments_layer

    def generate_country_commune_layer(self, countries_layer_list):
        country_commune_layer = FeatureGroup(
            name=gettext(f"Administrative Level 2"),
            show=False,
            overlay=True,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(country_commune_layer)
        self.country_commune_layer = country_commune_layer
        return country_commune_layer

    def generate_country_dept_layer(self, countries_layer_list):
        benin_departments_layer = FeatureGroup(
            name=gettext(f"Administrative Level 1"),
            show=False,
            overlay=True,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(benin_departments_layer)
        self.country_dept_layer = benin_departments_layer
        return benin_departments_layer

    def generate_country_district_layer(self, countries_layer_list):
        benin_district_layer = FeatureGroup(
            name=gettext(f"Administrative Level 3"),
            show=False,
            overlay=True,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(benin_district_layer)
        self.country_district_layer = benin_district_layer
        return benin_district_layer

    def generate_country_plantation_layer(
        self, countries_layer_list, countries_marker_list
    ):
        plantation_cluster = MarkerCluster(name=gettext("Plantations"))
        benin_plantation_layer = FeatureGroup(
            name=gettext("Plantation Locations"), show=True, overlay=True
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(benin_plantation_layer)
        for obj in countries_marker_list if countries_marker_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(plantation_cluster)
        plantation_cluster.add_to(benin_plantation_layer)
        self.country_plantation_layer = benin_plantation_layer
        return benin_plantation_layer

    def generate_country_protected_layer(self, countries_layer_list):
        country_protected_layer = FeatureGroup(
            name=gettext("Protected Areas"), show=False, overlay=True
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(country_protected_layer)
        self.country_protected_layer = country_protected_layer
        return country_protected_layer

    def generate_country_layer(self, countries_layer_list):
        benin_layer = FeatureGroup(
            name=gettext("Administrative Level 0"), show=False, overlay=True
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(benin_layer)
        self.country_layer = benin_layer
        return benin_layer

    def generate_country_border_layer(self, countries_layer_list):
        benin_border_layer = FeatureGroup(
            name=gettext("Administrative Boundaries Level 0"),
            show=True,
            overlay=False,
            control=False,
        )
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(benin_border_layer)
        self.country_border_layer = benin_border_layer
        return benin_border_layer

    def generate_nursery_layer(self, countries_layer_list):
        marker_cluster = MarkerCluster(name=gettext("Nursery Information"), show=True)
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(marker_cluster)
        self.nursery_layer = marker_cluster
        return marker_cluster

    def generate_qar_layer(self, countries_layer_list):
        marker_cluster = MarkerCluster(name=gettext("Warehouse Location"), show=True)
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(marker_cluster)
        self.qar_layer = marker_cluster
        return marker_cluster

    def generate_training_layer(self, countries_layer_list):
        marker_cluster = MarkerCluster(name=gettext("Training Information"), show=False)
        for obj in countries_layer_list if countries_layer_list is not None else []:
            for elmt in obj if obj is not None else []:
                elmt.add_to(marker_cluster)
        self.training_layer = marker_cluster
        return marker_cluster

    def generate_tree_density_estimation_layer(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Tree Density Satellite Estimation"), show=False
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            for obj in elmt if elmt is not None else []:
                feature_group.add_child(obj)
        self.tree_density_estimation_layer = feature_group
        return feature_group

    def generate_predictions_layer(self, countries_layer_list):
        feature_group = FeatureGroup(name=gettext("Cashew Growing Areas"), show=True)
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            for obj in elmt if elmt is not None else []:
                feature_group.add_child(obj)
        self.predictions_layer = feature_group
        return feature_group

    def generate_deforestation(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Deforested Area (2021 - 2022) (ha)"), show=False
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            for obj in elmt if elmt is not None else []:
                feature_group.add_child(obj)
        self.deforestation = feature_group
        return feature_group

    def generate_aforestation(self, countries_layer_list):
        feature_group = FeatureGroup(
            name=gettext("Afforested Area (2000 - 2012) (ha)"), show=False
        )
        for elmt in countries_layer_list if countries_layer_list is not None else []:
            for obj in elmt if elmt is not None else []:
                feature_group.add_child(obj)
        self.aforestation = feature_group
        return feature_group


def generic_map(lang):
    start_time = time.time()
    active_countries = Country.objects.filter(status=1)

    try:
        generic_map_obj = GenericMap()

        layers_name_list = ["country_plantation_marker"]

        generic_map_obj_attributes = dir(generic_map_obj)
        for attribute in generic_map_obj_attributes:
            if not attribute.startswith("__") and not getattr(
                generic_map_obj, attribute
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

        initial_serialized_layer = {
            country.country_name: {lang: {}} for country in active_countries
        }

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
                for elmt in Dataset.objects.filter(
                    country_id__country_name__in=[
                        country.country_name for country in active_countries
                    ]
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
                for country in active_countries
                for gee_layer_name in gee_layer_list
                if not country == "Ivory Coast"
                and not gee_layer_name == "tree_density_estimation_layer"
            ]
        ]
        hash_obj = hashlib.sha256()
        hash_obj.update("".join(map_layers_hashes).encode("utf-8"))
        map_hash = hash_obj.hexdigest()
        print("TOTAL LOADING TIME--- %s seconds ---" % (time.time() - start_time))
        print(
            "serialized_layer generic",
            serialized_layer.get("Ivory Coast").get("en").keys(),
        )
        return serialized_layer, map_hash
    except Exception as e:
        traceback.print_exc()
        return None
