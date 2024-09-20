import collections
import csv
import io
import json
import os
from apps.authentication.decorators import has_admin_and_superuser_role
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.http import HttpRequest, HttpResponse
from django.http import JsonResponse
from django.shortcuts import render, redirect
from reportlab.lib.units import inch
from apps.authentication import utils
from apps.authentication.models import (
    RemUser,
    RemRolesList,
    Country,
)
from apps.dashboard import models
from io import BytesIO
import pandas as pd
import numpy as np
from django.db import transaction, IntegrityError, DataError
from apps.dashboard.map_views import build_layers_cache_per_country, __build_maps__
from .db_conn_string import (
    __mysql_disconnect__,
    __close_ssh_tunnel__,
    __open_ssh_tunnel__,
    __mysql_connect__,
)
from apps.dashboard.views import (
    download_excel_format,
    check_country_upload,
    generate_geo_json_format,
    validate_geoJSON_country_of_upload,
    validate_geojson_upload_columns,
    get_objects,
)
import traceback
from scripts.data_compute_scripts.build_satellite_prediction_computed_data import (
    satellite_prediction_computed_data_file,
)
import geopandas as gpd
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis import geos
from apps.dashboard import utils as uti


def remove_third_coordinate(geojson_data):
    """
    Removes the third coordinate from a geojson data structure.
    This is useful for converting geojson data from a 3D format to a 2D format.
    """
    if geojson_data["type"] == "FeatureCollection":
        for feature in geojson_data["features"]:
            remove_third_coordinate(feature)
    elif geojson_data["type"] == "Feature":
        remove_third_coordinate(geojson_data["geometry"])
    elif geojson_data["type"] == "MultiPolygon":
        for polygon in geojson_data["coordinates"]:
            for ring in polygon:
                for coordinate in ring:
                    if len(coordinate) > 2:
                        del coordinate[2:]
    return geojson_data


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def alteia_data(request):
    # TODO Recheck the role list filtering logic
    remuser: RemUser = request.user.remuser
    context = {}

    if "download_format" in request.POST:
        return download_alteia_upload_format(request)

    if "upload_button" in request.POST:
        if remuser.role.role_name not in [
            RemRolesList.GLOBAL_ADMIN,
            RemRolesList.COUNTRY_ADMIN,
        ]:
            error_response = JsonResponse({"error": "Unauthorized User"}, safe=True)
            error_response.status_code = 401
            return error_response
        return upload_alteia_data(request)

    # fetch
    countries_select = uti.Countries.users(remuser)
    _temp_resources_ = get_objects(
        model=models.AlteiaData,
        countries_select=countries_select,
    )
    main_resources_list = []
    for db, __resources__ in _temp_resources_.items():
        main_resources_list.extend(__resources__)

    context["data_list"] = main_resources_list
    context["segment"] = "data"
    # context["page_range"] = page_range
    return render(request, "dashboard/alteia_data.html", context)


def upload_alteia_data(request: HttpRequest):
    """
    When a user uploads a list of alteia_data in the excel format, this function is called
    """
    n_index = None
    alteaia_data_saved = []
    alteaia_data_errors = []

    try:
        country: models.Country
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df = pd.read_excel(BytesIO(file_data))
            df = df.replace(np.nan, None)
            alteaia_data_list = df.to_dict(orient="records")

            # validate country
            country = validate_geoJSON_country_of_upload(df=df, country_key="NAME_0")
            country_name = country.country_name
            check_country_upload(
                country=country_name,
                active_countries_dict={country_name: country},
                request=request,
            )

            # save every data
            for i, _alteia_plant in enumerate(alteaia_data_list):
                try:
                    with transaction.atomic():
                        print(_alteia_plant, "UPLOAD _alteia_plant")
                        # remove the fields not expected
                        _plantation_code = _alteia_plant.get("plantation_code")
                        if _plantation_code is None:
                            raise Exception("Plantation code is required")

                        del _alteia_plant["country"]
                        print({**_alteia_plant})
                        print(
                            _alteia_plant.get("cashew_tree_cover"), "Cashew Tree Cover"
                        )

                        alteia_obj = [None, None]
                        # Try get if it exists and update
                        try:
                            alteia_obj[0] = models.AlteiaData.objects.using(
                                country_name
                            ).get(
                                plantation_code=_alteia_plant.get("plantation_code"),
                            )
                            # Updating the cashew tree cover and data source
                            alteia_obj[0].cashew_tree_cover = _alteia_plant.get(
                                "cashew_tree_cover"
                            )
                            alteia_obj[0].data_source = _alteia_plant.get("data_source")
                            alteia_obj[1] = 0
                        # If not create
                        except Exception as e:
                            alteia_obj[0] = models.AlteiaData.objects.using(
                                country_name
                            ).create(
                                country_id=country,
                                plantation_code=_alteia_plant.get("plantation_code"),
                                cashew_tree_cover=_alteia_plant.get(
                                    "cashew_tree_cover"
                                ),
                                data_source=_alteia_plant.get("data_source"),
                                created_by=request.user.pk,
                                updated_by=request.user.pk,
                            )
                            alteia_obj[1] = 0

                        if alteia_obj[1]:
                            alteia_obj[0].created_by = request.user.pk
                        alteia_obj[0].updated_by = request.user.pk
                        alteia_obj[0].full_clean()
                        alteia_obj[0].save(using=country_name)

                        alteaia_data_saved.append(alteia_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"AT ROW: {i + 2} : " + str(e)
                    alteaia_data_errors.append(error)

            # If some data have errors
            if len(alteaia_data_errors) > 0:
                raise DataError(alteaia_data_errors)

            # Force rebuilding map for all countries
            try:
                build_layers_cache_per_country(country)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(alteaia_data_errors) > 0:
            error_response = JsonResponse({"error": alteaia_data_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(alteaia_data_saved)}"}, safe=True)


def download_alteia_upload_format(request: HttpRequest):
    """
    When a user requests to download the excel format for uploading the list of alteia_data,
    this function is called
    """
    data = {
        "country": ["Ivory Coast", "Ivory Coast"],
        "cashew_tree_cover": [12332.211, 1210.021],
        "plantation_code": ["Gbe-Mam-KON-0231", "Gbe-Mam-KON-0231"],
        "data_source": ["Prosper Cashew 2024", "Prosper Cashew 2024"],
    }
    return download_excel_format("alteia_data", data, request)


@login_required(login_url="/")
@has_admin_and_superuser_role(roles_list=[RemRolesList.GLOBAL_ADMIN])
def countries(request):
    remuser: RemUser = request.user.remuser
    """Only global admin can modify countries"""

    if "download_format" in request.POST:
        return download_countries_format()

    if "upload_button" in request.POST:
        return upload_countries(request)

    resources = Country.objects.filter(status=utils.Status.ACTIVE)
    context = {}
    context["resources"] = resources
    return render(request, "dashboard/countries.html", context)


countries_columns = []


def download_countries_format():
    """
    Download the upload format for plantations
    """
    df = generate_geo_json_format([("country_name", "Ivory Coast")])
    df_json = df.to_json()
    response = HttpResponse(df_json, content_type="application/json")
    response["Content-Disposition"] = "attachment; filename=upload_format.geojson"
    return response


def upload_countries(request: HttpRequest):
    """
    When a user uploads countries we
    1. validate who is uploading
    2. get country, and update it
    """
    standard_srs = "OGC:CRS84"
    resources_saved = []
    resources_errors = []
    columns_expected = [
        "country_name",
        "geometry",
    ]
    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))
            validate_geojson_upload_columns(df, columns_expected)

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)

            resources_list = df[columns_expected].to_dict(orient="records")

            for i, _resource in enumerate(resources_list):
                country_og = models.Country.objects.using(country_name).get(
                    country_name=_resource["country_name"], status=utils.Status.ACTIVE
                )
                check_country_upload(
                    country=country_og.country_name,
                    active_countries_dict={f"{country_og.country_name}": country_og},
                    request=request,
                )
                try:
                    with transaction.atomic():
                        country_name = _resource["country_name"]
                        geometry = GEOSGeometry(_resource["geometry"].wkt)
                        try:
                            resource_obj = models.Country.objects.using(
                                country_name
                            ).get(country_name=_resource["country_name"])
                            resource_obj.geometry = geometry
                            resource_obj.created_by = request.user.pk
                            resource_obj.updated_by = request.user.pk
                            resource_obj.full_clean()
                        except:
                            raise Exception(
                                "Countries need to be added through the the Django admin panel."
                            )
                        resource_obj.save(using=country_name)
                        resources_saved.append(resource_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"Country : {_resource.get('country_name')} : " + str(e)
                    resources_errors.append(error)

            # If some plantations have errors
            if len(resources_errors) > 0:
                raise DataError(resources_errors)

            # trigger computations and then run the dashboard dashboard!
            try:
                satellite_prediction_computed_data_file(country_og.country_name)
            except Exception as e:
                print(e)
            # Force rebuilding map for this country
            try:
                build_layers_cache_per_country(country_og)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(resources_errors) > 0:
            error_response = JsonResponse({"error": resources_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(resources_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[RemRolesList.GLOBAL_ADMIN, RemRolesList.COUNTRY_ADMIN]
)
def gaul1(request):
    """GAUL 1 Data"""
    remuser: RemUser = request.user.remuser

    if "download_format" in request.POST:
        df = generate_geo_json_format(
            [
                ("NAME_0", "Ivory Coast"),
                ("NAME_1", "Valle Du Bandama"),
            ]
        )
        df_json = df.to_json()
        response = HttpResponse(df_json, content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=upload_format.geojson"
        return response

    # upload
    if "upload_button" in request.POST:
        return upload_gaul1(request)

    # fetch
    countries_select = uti.Countries.users(remuser)
    _temp_resources_ = get_objects(
        model=models.GAUL1,
        countries_select=countries_select,
    )
    main_resources_list = []
    for db, __resources__ in _temp_resources_.items():
        main_resources_list.extend(__resources__)
    context = {}
    context["resources"] = main_resources_list
    return render(request, "dashboard/gaul1.html", context)


def upload_gaul1(request: HttpRequest):
    """
    Handles uploading GAUL 1 GeoJSON
    """
    standard_srs = "OGC:CRS84"
    resources_saved = []
    resources_errors = []
    columns_expected = [
        "NAME_0",
        "NAME_1",
        "geometry",
    ]
    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))
            validate_geojson_upload_columns(df, columns_expected)

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)

            # validate country and if you can upload in it
            country = validate_geoJSON_country_of_upload(df=df, country_key="NAME_0")
            country_name = country.country_name
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )

            # clean resources
            df = df.replace(np.nan, None)
            resources_list = df[columns_expected].to_dict(orient="records")

            for i, _resource in enumerate(resources_list):
                try:
                    with transaction.atomic():
                        geometry = GEOSGeometry(_resource["geometry"].wkt)
                        if geometry and isinstance(geometry, geos.Polygon):
                            geometry = geos.MultiPolygon(geometry)

                        try:
                            resource_obj = models.GAUL1.objects.using(country_name).get(
                                name=_resource["NAME_1"]
                            )
                            resource_obj.country = country
                            resource_obj.geometry = geometry
                            resource_obj.size = geometry.area
                            resource_obj.created_by = request.user.pk
                            resource_obj.updated_by = request.user.pk
                            resource_obj.full_clean()
                            resource_obj.save(using=country_name)
                        except:
                            resource_obj = models.GAUL1.objects.using(
                                country_name
                            ).create(
                                country=country,
                                name=_resource["NAME_1"],
                                display=_resource["NAME_1"],
                                geometry=geometry,
                                size=geometry.area,
                                created_by=request.user.pk,
                                updated_by=request.user.pk,
                            )
                        resources_saved.append(resource_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"Country : {_resource.get('country_name')} : " + str(e)
                    resources_errors.append(error)

            # If some resources have errors
            if len(resources_errors) > 0:
                raise DataError(resources_errors)

            # trigger computations and then run the dashboard dashboard!
            try:
                satellite_prediction_computed_data_file(country.country_name)
            except Exception as e:
                print(e)
            # Force rebuilding map for this country
            try:
                build_layers_cache_per_country(country)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(resources_errors) > 0:
            error_response = JsonResponse({"error": resources_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(resources_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[RemRolesList.GLOBAL_ADMIN, RemRolesList.COUNTRY_ADMIN]
)
def gaul2(request):
    """GAUL 2 Data"""
    remuser: RemUser = request.user.remuser

    if "download_format" in request.POST:
        df = generate_geo_json_format(
            [
                ("NAME_0", "Ivory Coast"),
                ("NAME_1", "Valle Du Bandama"),
                ("NAME_2", "Gbeke"),
            ]
        )
        df_json = df.to_json()
        response = HttpResponse(df_json, content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=upload_format.geojson"
        return response

    # upload
    if "upload_button" in request.POST:
        return upload_gaul2(request)

    # fetch
    countries_select = uti.Countries.users(remuser)
    _temp_resources_ = get_objects(
        model=models.GAUL2,
        countries_select=countries_select,
    )
    main_resources_list = []
    for db, __resources__ in _temp_resources_.items():
        main_resources_list.extend(__resources__)
    context = {}
    context["resources"] = main_resources_list
    return render(request, "dashboard/gaul2.html", context)


def upload_gaul2(request: HttpRequest):
    """
    Handles uploading GAUL 2 GeoJSON
    """
    standard_srs = "OGC:CRS84"
    resources_saved = []
    resources_errors = []
    columns_expected = [
        "NAME_0",
        "NAME_1",
        "NAME_2",
        "geometry",
    ]
    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))
            validate_geojson_upload_columns(df, columns_expected)

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)

            # validate country and if you can upload in it
            country = validate_geoJSON_country_of_upload(df=df, country_key="NAME_0")
            country_name = country.country_name
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )

            df = df.replace(np.nan, None)
            resources_list = df[columns_expected].to_dict(orient="records")

            for i, _resource in enumerate(resources_list):
                try:
                    with transaction.atomic():
                        # geometry clean
                        geometry = GEOSGeometry(_resource["geometry"].wkt)
                        if geometry and isinstance(geometry, geos.Polygon):
                            geometry = geos.MultiPolygon(geometry)

                        # get and updated or create
                        try:
                            resource_obj = models.GAUL2.objects.using(country_name).get(
                                name=_resource["NAME_2"],
                                country=country,
                            )
                            resource_obj.country = country
                            resource_obj.GAUL1 = models.GAUL1.objects.using(
                                country_name
                            ).get(name=_resource["NAME_1"], country=country)
                            resource_obj.geometry = geometry
                            resource_obj.size = geometry.area
                            resource_obj.created_by = request.user.pk
                            resource_obj.updated_by = request.user.pk
                            resource_obj.full_clean()
                            resource_obj.save(using=country_name)
                        except:
                            resource_obj = models.GAUL2.objects.using(
                                country_name
                            ).create(
                                country=country,
                                GAUL1=models.GAUL1.objects.using(country_name).get(
                                    name=_resource["NAME_1"], country=country
                                ),
                                name=_resource["NAME_2"],
                                display=_resource["NAME_2"],
                                geometry=geometry,
                                size=geometry.area,
                                created_by=request.user.pk,
                                updated_by=request.user.pk,
                            )
                        resources_saved.append(resource_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"Country : {_resource.get('NAME_2')} : " + str(e)
                    resources_errors.append(error)

            # If some resources have errors
            if len(resources_errors) > 0:
                raise DataError(resources_errors)

            # trigger computations and then run the dashboard dashboard!
            try:
                satellite_prediction_computed_data_file(country.country_name)
            except Exception as e:
                print(e)
            # Force rebuilding map for this country
            try:
                build_layers_cache_per_country(country)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(resources_errors) > 0:
            error_response = JsonResponse({"error": resources_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(resources_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[RemRolesList.GLOBAL_ADMIN, RemRolesList.COUNTRY_ADMIN]
)
def gaul3(request):
    """GAUL 3 Data"""
    remuser: RemUser = request.user.remuser

    if "download_format" in request.POST:
        df = generate_geo_json_format(
            [
                ("NAME_0", "Ivory Coast"),
                ("NAME_1", "Valle Du Bandama"),
                ("NAME_2", "Gbeke"),
                ("NAME_3", "Bora"),
            ]
        )
        df_json = df.to_json()
        response = HttpResponse(df_json, content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=upload_format.geojson"
        return response
    # upload
    if "upload_button" in request.POST:
        return upload_gaul3(request)

    # fetch
    countries_select = uti.Countries.users(remuser)
    _temp_resources_ = get_objects(
        model=models.GAUL3,
        countries_select=countries_select,
    )
    main_resources_list = []
    for db, __resources__ in _temp_resources_.items():
        main_resources_list.extend(__resources__)
    context = {}
    context["resources"] = main_resources_list
    return render(request, "dashboard/gaul3.html", context)


def upload_gaul3(request: HttpRequest):
    """
    Handles uploading GAUL 3 GeoJSON
    """
    standard_srs = "OGC:CRS84"
    resources_saved = []
    resources_errors = []
    columns_expected = [
        "NAME_0",
        "NAME_1",
        "NAME_2",
        "NAME_3",
        "geometry",
    ]
    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))
            validate_geojson_upload_columns(df, columns_expected)

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)

            # validate country and if you can upload in it
            country = validate_geoJSON_country_of_upload(df=df, country_key="NAME_0")
            country_name = country.country_name
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )

            #
            df = df.replace(np.nan, None)
            resources_list = df[columns_expected].to_dict(orient="records")

            for i, _resource in enumerate(resources_list):
                try:
                    with transaction.atomic():
                        # geometry clean
                        geometry = GEOSGeometry(_resource["geometry"].wkt)
                        if geometry and isinstance(geometry, geos.Polygon):
                            geometry = geos.MultiPolygon(geometry)

                        # get and updated or create
                        try:
                            resource_obj = models.GAUL3.objects.using(country_name).get(
                                name=_resource["NAME_3"],
                                country=country,
                            )
                            resource_obj.country = country
                            resource_obj.GAUL1 = models.GAUL1.objects.using(
                                country_name
                            ).get(name=_resource["NAME_1"], country=country)
                            resource_obj.GAUL2 = models.GAUL2.objects.using(
                                country_name
                            ).get(name=_resource["NAME_2"], country=country)
                            resource_obj.geometry = geometry
                            resource_obj.size = geometry.area
                            resource_obj.created_by = request.user.pk
                            resource_obj.updated_by = request.user.pk
                            resource_obj.full_clean()
                            resource_obj.save(using=country_name)
                        except:
                            resource_obj = models.GAUL3.objects.using(
                                country_name
                            ).create(
                                country=country,
                                GAUL1=models.GAUL1.objects.using(country_name).get(
                                    name=_resource["NAME_1"], country=country
                                ),
                                GAUL2=models.GAUL2.objects.using(country_name).get(
                                    name=_resource["NAME_2"], country=country
                                ),
                                name=_resource["NAME_3"],
                                display=_resource["NAME_3"],
                                geometry=geometry,
                                size=geometry.area,
                                created_by=request.user.pk,
                                updated_by=request.user.pk,
                            )
                        resources_saved.append(resource_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"Country : {_resource.get('NAME_3')} : " + str(e)
                    resources_errors.append(error)

            # If some resources have errors
            if len(resources_errors) > 0:
                raise DataError(resources_errors)

            # trigger computations and then run the dashboard dashboard!
            try:
                satellite_prediction_computed_data_file(country.country_name)
            except Exception as e:
                print(e)
            # Force rebuilding map for this country
            try:
                build_layers_cache_per_country(country)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(resources_errors) > 0:
            error_response = JsonResponse({"error": resources_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(resources_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[RemRolesList.GLOBAL_ADMIN, RemRolesList.COUNTRY_ADMIN]
)
def protected_areas(request):
    """Protected areas Data"""
    remuser: RemUser = request.user.remuser

    if "download_format" in request.POST:
        df = generate_geo_json_format(
            [
                ("name", "Marahoue National Park"),
                ("orig_name", "Parc national de la Marahoué"),
                ("designation", "Parc National"),
                ("rep_area", 1010),
                ("gov_type", "Government-delegated management"),
                ("own_type", "State"),
                ("mang_auth", "Office Ivoirien des Parcs et Réserves"),
                ("status", "Designated"),
                ("status_yr", 2000),
            ]
        )
        df_json = df.to_json()
        response = HttpResponse(df_json, content_type="application/json")
        response["Content-Disposition"] = "attachment; filename=upload_format.geojson"
        return response

    # upload
    if "upload_button" in request.POST:
        return upload_protected_areas(request)

    # fetch
    countries_select = uti.Countries.users(remuser)
    _temp_resources_ = get_objects(
        model=models.ProtectedArea,
        countries_select=countries_select,
    )
    main_resources_list = []
    for db, __resources__ in _temp_resources_.items():
        main_resources_list.extend(__resources__)
    context = {}
    context["resources"] = main_resources_list
    return render(request, "dashboard/protected_areas.html", context)


def upload_protected_areas(request: HttpRequest):
    """
    Handles uploading GAUL 3 GeoJSON
    """
    standard_srs = "OGC:CRS84"
    resources_saved = []
    resources_errors = []
    columns_expected = [
        "country",
        "NAME",
        "ORIG_NAME",
        "DESIG",
        "REP_AREA",
        "GOV_TYPE",
        "OWN_TYPE",
        "MANG_AUTH",
        "STATUS",
        "STATUS_YR",
        "geometry",
    ]
    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))
            validate_geojson_upload_columns(df, columns_expected)

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)

            # validate country and if you can upload in it
            country = validate_geoJSON_country_of_upload(df=df, country_key="country")
            country_name = country.country_name
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )

            df = df.replace(np.nan, None)
            resources_list = df.to_dict(orient="records")

            for i, _resource in enumerate(resources_list):
                try:
                    with transaction.atomic():
                        # geometry clean
                        geometry = GEOSGeometry(_resource["geometry"].wkt)
                        if geometry and isinstance(geometry, geos.Polygon):
                            geometry = geos.MultiPolygon(geometry)

                        # get and updated or create
                        try:
                            resource_obj = models.ProtectedArea.objects.using(
                                country_name
                            ).get(
                                name=_resource["NAME"],
                                country=country,
                            )
                            resource_obj.geometry = geometry
                            resource_obj.created_by = request.user.pk
                            resource_obj.updated_by = request.user.pk
                            resource_obj.full_clean()
                            resource_obj.save(using=country_name)
                        except:
                            resource_obj = models.ProtectedArea.objects.using(
                                country_name
                            ).create(
                                country=country,
                                name=_resource["NAME"],
                                orig_name=_resource["ORIG_NAME"],
                                designation=_resource["DESIG"],
                                designation_type=_resource["DESIG_TYPE"],
                                area=geometry.area,
                                rep_area=_resource["REP_AREA"],
                                gov_type=_resource["GOV_TYPE"],
                                own_type=_resource["OWN_TYPE"],
                                mang_auth=_resource["MANG_AUTH"],
                                status=_resource["STATUS"],
                                status_yr=_resource["STATUS_YR"],
                                geometry=geometry,
                                created_by=request.user.pk,
                                updated_by=request.user.pk,
                            )
                        resources_saved.append(resource_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"Protected area : {_resource.get('NAME')} : " + str(e)
                    resources_errors.append(error)

            # If some resources have errors
            if len(resources_errors) > 0:
                raise DataError(resources_errors)

            # trigger computations and then run the dashboard dashboard!
            try:
                satellite_prediction_computed_data_file(country.country_name)
            except Exception as e:
                print(e)
            # Force rebuilding map for this country
            try:
                build_layers_cache_per_country(country)
            except Exception as e:
                traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(resources_errors) > 0:
            error_response = JsonResponse({"error": resources_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(resources_saved)}"}, safe=True)
