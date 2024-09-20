import json
import time
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.template import loader
from apps.authentication.models import RemUser, RemRolesList, Country
from apps.authentication.models import RemUser
from apps.dashboard.maps_builders.default_build_cashew_map import full_map
from apps.dashboard.maps_builders.generic_build_cashew_map import generic_map
from apps.dashboard.maps_builders.public_build_cashew_map import public_map
from apps.dashboard.models import Country
from django.http.request import HttpRequest
from apps.dashboard.tasks import run_build_outdated_layer, periodic_force_gee
from apps.dashboard.utils import build_websocket_groupname, compress_message
from apps.authentication.decorators import has_admin_and_superuser_role
from datetime import datetime
from django.contrib.gis import geos

# If not set to false build the maps
import os
from django.core.cache import cache
from apps.dashboard.models import Dataset
from apps.dashboard import utils


def build_layers_cache_per_country(country: Country):
    """
    Force building map for a country
    build map for a country
    """
    # TODO Re-enable this line
    periodic_force_gee()

    # Run outdated GEE Layers too
    cache.delete("run_build_outdated_layer_lock")
    Dataset.objects.using(country.country_name).all().update(hash="")
    # temp to avoid not serializable error
    country.geometry = None
    run_build_outdated_layer.delay(
        [country.country_name],
        ["fr", "en"],
        "private",
        True,
    )
    # Computations
    print("Should Build Map for ", country)
    cache.delete("run_build_outdated_layer_lock")
    Dataset.objects.using(country.country_name).all().update(hash="")
    run_build_outdated_layer.delay(
        [country.country_name],
        ["fr", "en"],
        "public",
        False,
    )


def __build_maps__():
    """
    Trigger imediate building of maps
    Fetch country objects from respective DBs
    """
    ivory_name = "Ivory Coast"
    ivory = Country.objects.using(ivory_name).get(country_name=ivory_name)
    benin_name = "Benin"
    benin = Country.objects.using(benin_name).get(country_name=benin_name)
    print([ivory])
    print(ivory_name)
    build_layers_cache_per_country(ivory)
    build_layers_cache_per_country(benin)


# If want to build map before start
print("Build Map == ", os.environ.get("BUILD_MAP"))
if os.environ.get("BUILD_MAP") == "TRUE":
    __build_maps__()


def field_serialize(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, geos.GEOSGeometry):
        return obj.wkt
    return obj


def public(request):
    """
    Serves the public map view
    """
    print(f"Generating public public map")
    user_country = utils.Countries.default_obj()
    user = request.user

    if user.is_authenticated:
        return redirect("/dashboard/")
    path_link = request.build_absolute_uri(request.path)
    ws_groupname = build_websocket_groupname(session=request.session)
    map_id = 2
    lang = "fr" if "/fr/" in path_link else "en"
    start_time = time.time()
    active_countries = Country.objects.filter(status=1)
    run_build_outdated_layer.delay(
        [country.country_name for country in active_countries],
        [lang],
        ws_groupname,
        False,
    )
    serialized_layers, map_hash = public_map(lang)
    request.session["serialized_layers"] = serialized_layers
    print("TOTAL LOADING TIME--- %s seconds ---" % (time.time() - start_time))
    context = {
        "map_hash": map_hash,
        "map_id": map_id,
        "current_user": user,
        "user_country": json.dumps(
            {
                key: field_serialize(value)
                for key, value in user_country.__dict__.items()
                if key != "_state"
            }
        ),
    }
    html_template = loader.get_template("dashboard/index.html")
    render = html_template.render(context, request)
    return HttpResponse(render)


@login_required(login_url="/dashboard/public")
def index(request):
    map_id = 0
    map_hash = 0
    serialized_layers = None
    path_link = request.build_absolute_uri(request.path)
    lang = "fr" if "/fr/" in path_link else "en"
    user: RemUser = RemUser.objects.get(user=request.user)
    ws_groupname = build_websocket_groupname(session=request.session)
    print("normal")
    try:
        print("User country in session ", user.country_id)
        user_country: Country = user.country_id.all()[0]
        print("User country in session all", user.country_id.all())
    except IndexError:
        user_country: Country = Country.objects.get(country_name="Benin")
    if user.role.role_name == RemRolesList.GLOBAL_ADMIN:
        map_id = 0
        start_time = time.time()
        run_build_outdated_layer.delay(
            [country.country_name for country in Country.objects.filter(status=1)],
            [lang],
            ws_groupname,
            True,
        )
        print("Generating generic maps")
        serialized_layers, map_hash = generic_map(lang)
        print("TOTAL LOADING TIME--- %s seconds ---" % (time.time() - start_time))
    else:
        map_id = 1
        start_time = time.time()
        print(f"Generating {user_country.country_name} maps")
        run_build_outdated_layer.delay(
            [user_country.country_name], [lang], ws_groupname, True
        )
        serialized_layers, map_hash = full_map(
            lang=lang, country=user_country, outdated_layers={}
        )
        print("TOTAL LOADING TIME--- %s seconds ---" % (time.time() - start_time))

    request.session["serialized_layers"] = serialized_layers
    context = {
        "map_hash": map_hash,
        "map_id": map_id,
        "current_user": user,
        "user_country": json.dumps(
            {
                key: field_serialize(value)
                for key, value in user_country.__dict__.items()
                if key != "_state"
            }
        ),
    }
    html_template = loader.get_template("dashboard/index.html")
    render = html_template.render(context, request)
    return HttpResponse(render)


def map_data(request: HttpRequest):
    serialized_layers = request.session.get("serialized_layers", None)
    serialized_layers = compress_message(serialized_layers)
    response = JsonResponse({"serialized_layers": serialized_layers})
    return response


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[RemRolesList.GLOBAL_ADMIN, RemRolesList.COUNTRY_ADMIN]
)
def build_maps(request: HttpRequest):
    """
    Back url used to trigger map building
    """
    print("Calling build maps view.")
    __build_maps__()
    return redirect("index")
