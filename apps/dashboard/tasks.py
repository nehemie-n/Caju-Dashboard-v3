import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
import sys
import traceback
from celery import shared_task
from django.conf import settings
import joblib
from apps.dashboard.layers_builders.caju_density import create_caju_density
from apps.dashboard.layers_builders.deforestation_layer import create_deforestation
from apps.dashboard.layers_builders.prediction import create_predictions

from apps.dashboard.maps_builders.map_utils import (
    MAP_LAYER_TYPE,
    CustomEncoder,
    build_outdated_layer,
    check_outdated_layer,
    extract_tilelayer_data,
    save_map_datas,
)
from django.core.cache import cache

from apps.dashboard.models import Country
import pika
import json
from datetime import timedelta
from django.utils import timezone


def notify_task_status_change(task_id, group_name, result):
    try:
        credentials = pika.PlainCredentials(
            os.getenv("RABBIT_MQ_USERNAME"), os.getenv("RABBIT_MQ_PASSWORD")
        )
        connection_params = pika.ConnectionParameters(
            host="localhost",
            virtual_host=os.getenv("RABBIT_MQ_VHOST"),
            credentials=credentials,
        )
        connection = pika.BlockingConnection(connection_params)
        channel = connection.channel()
        channel.exchange_declare(exchange="task_updates", exchange_type="topic")
        message = json.dumps(
            {"task_id": task_id, "group_name": group_name, "result": result}
        )
        channel.basic_publish(
            exchange="task_updates", routing_key="task.result", body=message
        )
        connection.close()
    except Exception as e:
        print(e)


@shared_task(bind=True)
def run_build_outdated_layer(
    self,
    countries: list[str],
    langs: list,
    group_name: str,
    is_authenticated: bool,
):
    # passing countries name because celery doesn't have access to the object models
    # so we refeth them
    __countries__ = []
    for __country__ in countries:
        __countries__.append(
            Country.objects.using(__country__).get(country_name=__country__)
        )
    countries: list[Country] = __countries__

    # now building
    outdated_layer_per_country_and_lang = {
        country.country_name: {lang: {} for lang in langs} for country in countries
    }
    print("Should be building map!! ", countries)
    if cache.add("run_build_outdated_layer_lock", "true", timeout=3600):
        try:
            for country in countries:
                for lang in langs:
                    print("still running")
                    outdated_layer_per_country_and_lang[country.country_name][lang] = (
                        build_outdated_layer(
                            check_outdated_layer(country.country_name),
                            country.country_name,
                            lang,
                            is_authenticated,
                        )
                    )
        except Exception as e:
            print("Error cache building : ", e)
            traceback.print_exc()

        finally:
            # Release the lock
            cache.delete("run_build_outdated_layer_lock")

    notify_task_status_change(
        task_id=run_build_outdated_layer.request.id,
        group_name=group_name,
        result=outdated_layer_per_country_and_lang,
    )
    return "Built layers sucessfully"


def force_gee(country: str, is_authenticated: bool):
    """
    Forces building Raster Layers from GEE beacause their authentication
    access get expired and needs renewal to be usual for frontend.
    """
    print("FORCING BUILDING GEE")
    layers = {}
    futures_output = {}
    all_layer_to_build_objs = {}
    all_futures = {}
    futures_output = {}
    futures_per_country_gee = {
        "Benin": [
            "future3",
            "future6",  # caju density
            "future7",
        ],
        "Ivory Coast": [
            "future3",
            "future7",
        ],
    }
    futures_per_country = futures_per_country_gee[country]

    async def __get_context_data__():
        try:
            __loop = asyncio.get_event_loop()
            executor = ThreadPoolExecutor(2)

            if "future3" in futures_per_country:
                all_futures["future3"] = __loop.run_in_executor(
                    executor, create_predictions, country
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

            for future in futures_per_country:
                if all_futures.get(future, None) is not None:
                    futures_output[future] = await all_futures.get(future)
            print(futures_output, "all_layers")

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

    print("FUTURE OUTPUT futures_output")
    print(futures_output)
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

    print("FUTURE OUTPUT all_layer_to_build_objs")
    print(all_layer_to_build_objs)
    for key, value in all_layer_to_build_objs.items():
        print(f"LAYER TO BUILD {value}")
        if value:
            all_layer_to_build_objs[key] = value

    layers_names = [
        "predictions_layer",
        "tree_density_estimation_layer",
        "deforestation",
        "aforestation",
    ]

    print("caching layers")
    if is_authenticated:
        folder_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/normal"
        )
    else:
        folder_path = os.path.join(
            settings.BASE_DIR, f"staticfiles/{country}/map_datas/public"
        )
    outdated_layer_dict = {}
    for obj in layers_names:
        if all_layer_to_build_objs.get(obj, None):
            print(f"BUILT THE LAYER {obj}")
            try:
                save_map_datas(
                    country,
                    obj,
                    getattr(MAP_LAYER_TYPE, obj.upper()),
                    all_layer_to_build_objs[obj],
                    is_authenticated,
                )
                file_path = os.path.join(folder_path, f"{obj}_objects.joblib")
                if obj in [
                    "predictions_layer",
                    "tree_density_estimation_layer",
                    "deforestation",
                    "aforestation",
                ]:
                    outdated_layer_dict[obj] = [
                        extract_tilelayer_data(elmt) for elmt in joblib.load(file_path)
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


@shared_task
def periodic_force_gee():
    active_countries = Country.objects.filter(status=1)
    for country in active_countries:
        force_gee(country.country_name, True)
        force_gee(country.country_name, False)


periodic_force_gee.apply_async(eta=timezone.now() + timedelta(minutes=2))
