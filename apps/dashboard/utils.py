import base64
import collections
import os
import sys
import time
import traceback
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import RemRolesList
import gzip
import json
import re
from django.core.serializers import serialize
import json
from geojson import Feature
from .models import *
import brotli
from .db_conn_string import (
    __mysql_disconnect__,
    __close_ssh_tunnel__,
    __open_ssh_tunnel__,
    __mysql_connect__,
)
from apps.dashboard import models
from apps.authentication import models as authmodels
from django.db.models import Q
from apps.dashboard.earthengine import ee_client as ee
from django.db import connections


class Countries:

    @staticmethod
    def active():
        """
        Returns the names of the active countries that can also be used as the DB comnection names
        """
        return [db for db in connections if db != "default"]

    @staticmethod
    def all():
        """ """
        return Country.objects.filter(status=1)

    @staticmethod
    def users(user: authmodels.RemUser, country_search: str = None):
        """ """
        _countries_ = (
            Countries.all()
            if user.role.role_name == RemRolesList.GLOBAL_ADMIN
            else user.country_id.all()
        )
        if country_search and country_search != "all":
            return _countries_.filter(country_name=country_search)
        return _countries_

    @staticmethod
    def default():
        """ """
        return "Ivory Coast"

    @staticmethod
    def default_obj():
        """ """
        try:
            user_country = Country.objects.get(country_name="Ivory Coast")
        except:
            user_country = Country.objects.get(country_name="Benin")
        return user_country


def geometry_to_feature(geometry, properties=None):
    return geometry.geojson


def clean_plantation_code(code):
    """
    Due to GEE refusing spaces and ' in the file names
    We have to replace these characters when fetching anything from google earth engine
    """
    # Remove single quotes and spaces
    return re.sub(r"['\s]", "", code)


def replace_occurrence(path, word, replacement, occurrence):
    components = path.split("/")
    count = 0

    for i in range(len(components)):
        if components[i] == word:
            count += 1
            if count == occurrence:
                components[i] = replacement

    new_path = "/".join(components)
    return new_path


def replace_department_name(name):
    if "Department" in name:
        return name.replace(" Department", "")
    return name


def get_info_from_database(query, params=None):
    cur = __mysql_connect__().cursor()
    if params:
        cur.execute(query, params)
    else:
        cur.execute(query)
    infos = [location for location in cur]
    __mysql_disconnect__()
    return infos


def calculate_average(values):
    total_sum = sum(values)
    return total_sum / len(values)


def extract_unique_names(infos):
    names_with_duplicate = [info[1] for info in infos]
    names_with_duplicate = [
        replace_department_name(name) for name in names_with_duplicate
    ]
    names_sorted = sorted(set(names_with_duplicate))
    return names_sorted, names_with_duplicate


def get_department_sum_list(names_sorted, infos, names_with_duplicate):
    names_init = {name: 0 for name in names_sorted}
    for info in infos:
        for name in names_init:
            if name == info[1] or name + " Department" == info[1]:
                names_init[name] += round(info[0])
    occurence = collections.Counter(names_with_duplicate).items()
    for occur in occurence:
        for name in names_init:
            if name == occur[0]:
                names_init[name] /= occur[1]
    department_sum_list = sorted(
        list(names_init.items()), reverse=True, key=lambda kor_: kor_[1]
    )
    department_names = []
    department_sum = []
    for x in department_sum_list:
        department_names.append(x[0])
        department_sum.append(x[1])
    return department_sum, department_names


def get_commune_info(query, params=None):
    infos_commune = get_info_from_database(query, params)
    commune_names_with_duplicate = [
        info[1] for info in infos_commune if info[1] != None
    ]
    occurence = collections.Counter(commune_names_with_duplicate).items()
    commune_names = sorted(set(commune_names_with_duplicate))
    commune_names_init = {name: 0 for name in commune_names}
    for info in infos_commune:
        for name in commune_names_init:
            if name == info[1]:
                commune_names_init[name] += round(info[0])
    for occur in occurence:
        for name in commune_names_init:
            if name == occur[0]:
                commune_names_init[name] /= occur[1]
    commune_sum_list = list(commune_names_init.items())
    commune_names = []
    commune_sum = []
    for x in commune_sum_list:
        commune_names.append(x[0])
        commune_sum.append(x[1])
    return commune_names, commune_sum


def get_location_regions(country=None):
    __open_ssh_tunnel__()
    with __mysql_connect__().cursor() as cur:
        if country:
            query = "SELECT kor, location_region, location_sub_region, location_country FROM free_qar_result WHERE location_country=%s"
            cur.execute(query, (country,))
        else:
            query = "SELECT kor, location_region, location_sub_region, location_country FROM free_qar_result"
            cur.execute(query)
        infos = [
            (kor, location_region, location_sub_region, location_country)
            for kor, location_region, location_sub_region, location_country in cur
        ]

    __mysql_disconnect__()
    __close_ssh_tunnel__()

    return infos


def clean_department_names(infos):
    names_with_duplicate = [location_region for _, location_region, _, _ in infos]
    names_sorted = sorted(set(names_with_duplicate))

    for i in range(len(names_sorted)):
        if "Department" in names_sorted[i]:
            names_sorted[i] = names_sorted[i].replace(" Department", "")

    return names_sorted


def generate_department_choices(names_sorted):
    department_choices = [
        tuple([x[0].lower() + x[1:], x.capitalize()]) for x in names_sorted
    ]
    department_choices.insert(0, ("select department", _("Select Department")))
    return department_choices


def generate_commune_choices(country=None):
    """ """
    try:
        if country:
            commune_choices = Training.objects.using(country).values_list(
                "commune", flat=True
            )
        else:
            commune_choices = []
            for db in Countries.active:
                commune_choices.extend(
                    Training.objects.using(db).values_list("commune", flat=True)
                )

        commune_choices = sorted(set(commune_choices))
        commune_choices = [
            tuple([x[0].lower() + x[1:], x.capitalize()]) for x in commune_choices
        ]
        commune_choices.insert(0, ("select commune", _("Select Commune")))
        return commune_choices

    except:
        return []


def generate_country_choices():
    try:
        country_choices = [("all", _("All"))] + [
            (country.country_name, country.country_name.upper())
            for country in Country.objects.filter(status=1)
        ]
        return country_choices
    except:
        return []


def get_data_based_on_role(request, main_query, commune_query, country=None):
    params = None

    if request.user.remuser.role.role_name != RemRolesList.GLOBAL_ADMIN or country:
        final_country = (
            request.user.remuser.country_id.all()[0].country_name
            if request.user.remuser.role.role_name != RemRolesList.GLOBAL_ADMIN
            else country
        )
        main_query += " WHERE location_country=%s"
        commune_query += " WHERE location_country=%s"
        params = (final_country,) if final_country else None

    infos = get_info_from_database(main_query, params)
    names_sorted, names_with_duplicate = extract_unique_names(infos)
    department_sum_list, department_names = get_department_sum_list(
        names_sorted, infos, names_with_duplicate
    )
    commune_names, commune_sum_list = get_commune_info(commune_query, params)

    return department_sum_list, department_names, commune_names, commune_sum_list


def build_websocket_groupname(session=None):
    session_key = session.session_key
    if not session_key:
        # Force session save to get the key if it's a new session
        session.save()
        session_key = session.session_key
    group_name = f"session_{session_key}"

    return group_name


def compress_message(message):
    print("STARTING COMPRESSION")
    start_time = time.time()
    encoded_data = None
    try:
        if isinstance(message, (dict, list)):
            message = json.dumps(message).encode("utf-8")
            compressed = brotli.compress(message, quality=5)
            encoded_data = base64.b64encode(compressed).decode("utf-8")
            print(
                "TOTAL COMPRESSING TIME--- %s seconds ---" % (time.time() - start_time)
            )
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
        traceback.print_exc()
    return encoded_data


# from typing import Any, Type, TypeVar, Dict
# T = TypeVar('T')
class FetcherResult:
    resources: list
    geo: dict

    def __init__(self, resources, features):
        self.resources = resources
        self.geo = features


class FetcherTree:
    crowns: dict
    tops: dict

    def __init__(self, crowns, tops):
        self.crowns = crowns
        self.tops = tops


standard_srs = "OGC:CRS84"
from django.contrib.gis.serializers.geojson import Serializer


class CustomGISSerializer(Serializer):

    def end_object(self, obj):
        for field in self.selected_fields:
            if field == "pk":
                continue
            elif field in self._current.keys():
                continue
            else:
                try:
                    if "__" in field:
                        fields = field.split("__")
                        value = obj
                        for f in fields:
                            value = getattr(value, f)
                        if value != obj:
                            self._current[field] = value

                except AttributeError:
                    pass
        super(CustomGISSerializer, self).end_object(obj)


class Fetcher:

    @staticmethod
    def get_geojson_from_objects(objects, fields_mapping=None, fields=None):

        _fields = list(fields_mapping.keys()) if fields_mapping else None

        # Preprocess the objects to convert non-serializable fields to strings
        # Serialize the queryset to GeoJSON
        # a: Plantation = a
        # a._meta.fields
        serializer = CustomGISSerializer()
        geojson_data = serializer.serialize(
            objects,
            geometry_field="geometry",
            fields=fields or _fields,
        )

        # Parse the serialized data
        geojson_dict = json.loads(geojson_data)

        # Rename fields if a mapping is provided
        if fields_mapping:
            for feature in geojson_dict["features"]:
                properties = feature["properties"]
                for old_name, new_name in fields_mapping.items():
                    if old_name in properties:
                        properties[new_name] = properties.pop(old_name)
        # return json.dumps(geojson_dict, indent=2)
        return geojson_dict

    @staticmethod
    def country_plantations(country: str) -> FetcherResult:
        """
        Fetches all active plantations within a country that have geometry
        """
        resources = models.Plantation.objects.using(country).filter(
            geometry__isnull=False,
        )
        print("resources_plantations: ", len(resources))
        return FetcherResult(
            **{
                "resources": resources,
                "features": Fetcher.get_geojson_from_objects(
                    resources,
                    {
                        "pk": "id",
                        "plantation_code": "plantation_code",
                        "shape_id": "shape_id",
                        "country__country_name": "country",
                        "commune": "admin_level_2",
                        "village": "village",
                    },
                ),
            }
        )

    @staticmethod
    def country(country: str) -> FetcherResult:
        """
        Fetches all countries have geometry
        """
        resources = models.Country.objects.using(country).get(
            country_name=country,
            geometry__isnull=False,
        )
        features = Fetcher.get_geojson_from_objects(
            [resources],
            {"pk": "id", "country_name": "NAME_0"},
        )
        return FetcherResult(
            **{
                "resources": resources,
                "features": features,
            }
        )

    @staticmethod
    def GAUL1(country: str) -> FetcherResult:
        """
        Fetches all GAUL1's within a country that have geometry
        """
        resources = models.GAUL1.objects.using(country).filter(
            geometry__isnull=False,
        )
        # print("resources_GAUL1: ", len(resources))
        return FetcherResult(
            **{
                "resources": resources,
                "features": Fetcher.get_geojson_from_objects(
                    resources,
                    {"pk": "id", "name": "NAME_1", "country__country_name": "NAME_0"},
                ),
            }
        )

    @staticmethod
    def GAUL2(country: str) -> FetcherResult:
        """
        Fetches all GAUL2's within a country that have geometry
        """
        resources = models.GAUL2.objects.using(country).filter(
            geometry__isnull=False,
        )
        print("resources_GAUL2: ", len(resources))
        return FetcherResult(
            **{
                "resources": resources,
                "features": Fetcher.get_geojson_from_objects(
                    resources,
                    {
                        "pk": "id",
                        "name": "NAME_2",
                        "GAUL1__name": "NAME_1",
                        "country__country_name": "NAME_0",
                    },
                ),
            }
        )

    @staticmethod
    def GAUL3(country: str) -> FetcherResult:
        """
        Fetches all GAUL3's within a country that have geometry
        """
        resources = models.GAUL3.objects.using(country).filter(
            geometry__isnull=False,
        )
        print("resources_GAUL3: ", len(resources))
        return FetcherResult(
            **{
                "resources": resources,
                "features": Fetcher.get_geojson_from_objects(
                    resources,
                    {
                        "pk": "id",
                        "name": "NAME_3",
                        "GAUL2__name": "NAME_2",
                        "GAUL1__name": "NAME_1",
                        "country__country_name": "NAME_0",
                    },
                ),
            }
        )

    @staticmethod
    def protected_areas(country: str) -> FetcherResult:
        """
        Fetches all protected areas that have geometry
        """
        resources = models.ProtectedArea.objects.using(country).filter(
            geometry__isnull=False,
        )
        return FetcherResult(
            **{
                "resources": resources,
                "features": Fetcher.get_geojson_from_objects(
                    resources,
                    {
                        # TODO Assign naming maps
                        "country__country_name": "NAME_0",
                        "name": "NAME",
                        "rep_area": "REP_AREA",
                        "designation": "DESIG_ENG",
                        "rep_area": "DESIG_TYPE",
                    },
                ),
            }
        )

    @staticmethod
    def tree_crowns_tops(country: str, code: str) -> FetcherTree:
        """
        Fetches all protected areas that have geometry
        """
        country_repo = country.replace(" ", "_")
        clean_plant_id = clean_plantation_code(code)

        tree_crowns_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_CROWNS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
        tree_crowns_feature_geojson = ee.FeatureCollection(tree_crowns_path).getInfo()

        tree_tops_path = f'{replace_occurrence(os.getenv("EE_CAJU_TREE_TOPS"), "cajusupport", f"cajusupport/{country_repo}", 1)}/{clean_plant_id}'
        tree_tops_features_geojson = ee.FeatureCollection(tree_tops_path).getInfo()

        return FetcherTree(
            **{
                "crowns": tree_crowns_feature_geojson,
                "tops": tree_tops_features_geojson,
            }
        )
