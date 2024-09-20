import asyncio
import time
import folium
import geojson
from celery import shared_task
from django.utils.translation import gettext
from apps.dashboard.models import Country
import json
import traceback
from apps.dashboard.maps_builders.shared_fn import format_perc
from apps.dashboard import utils


class DataObject:
    def __init__(self, **entries):
        self.__dict__.update(entries)


def highlight_function(feature):
    """
    Function to define the layer highlight style
    """
    return {
        "fillColor": "#ffaf00",
        "color": "green",
        "weight": 3,
        "dashArray": "1, 1",
    }


def __human_format__(value):
    """
    Format a number using the SI standard (with K, M, B, etc.)
    """
    units = ["", "K", "M", "B", "T"]
    magnitude = 0
    value = float(f"%.3g" % value)
    while abs(value) >= 1000:
        magnitude += 1
        value /= 1000.0
    return f"{value:.3f}{units[magnitude]}"


def __build_html_view__(data):
    """
    Return the HTML view of the district layer popup
    """
    satellite_est = gettext("Satellite Estimation")

    # All 3 shapefiles share these variables
    total_area = gettext("Total Area (ha)")
    cashew_tree_cover = gettext("Cashew Tree Cover (ha)")
    protected_area = gettext("Protected Area (ha)")
    cashew_tree_cover_within_protected_area = gettext(
        "Cashew Tree Cover Within Protected Area (ha)"
    )
    deforestation_area = gettext("Deforested Area (2021 - 2022) (ha)")
    afforestation_area = gettext("Afforested Area (2000 - 2012) (ha)")

    # This data is mandated to always be calculated for every area
    try:
        protected_area_percentage = (
            data.predictions["protected area"] / data.predictions["total area"]
        )
        cashew_tree_cover_percentage = (
            data.predictions["cashew tree cover"] / data.predictions["total area"]
        )
        cashew_protected_percent = data.predictions[
            "cashew tree cover within protected area"
        ] / (data.predictions["protected area"] or 1)
    except Exception as e:
        protected_area_percentage = 0
        cashew_tree_cover_percentage = 0
        cashew_protected_percent = 0

    # Deforestation and afforestation data & rows
    try:
        deforestation_percentage = (
            data.predictions["deforested area"] / data.predictions["total area"]
        )
        afforestation_percentage = (
            data.predictions["afforested area"] / data.predictions["total area"]
        )
        deforestation_row = f"<tr><td>{deforestation_area}</td><td>{__human_format__(data.predictions['deforested area'])} {format_perc(deforestation_percentage)}</td></tr>"
        afforestation_row = f"<tr><td>{afforestation_area}</td><td>{__human_format__(data.predictions['afforested area'])} {format_perc(afforestation_percentage)}</td></tr>"
    except Exception as e:
        deforestation_row = ""
        afforestation_row = ""

    return (
        "No Predictions"
        if not hasattr(data, "predictions") or data.predictions is None
        else f"""
                <html>
                    <head>
                    <style>
                        table {{
                            font-family: arial, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }}


                        table th {{
                            background-color: #004b55;
                            text-align: left;
                            color: #FFF;
                            padding: 4px 30px 4px 8px;
                        }}


                        table td {{
                            border: 1px solid #e3e3e3;
                            padding: 4px 8px;
                        }}


                        table tr:nth-child(odd) td{{
                            background-color: #e7edf0;
                        }}
                        </style>
                    </head>
                    <body>
                        <h2>{data.district}</h2>
                        <table>
                            <tr>
                                <th></th>
                                <th>{satellite_est}</th>
                            </tr>
                            <tr>
                                <td>{total_area}</td>
                                <td>{__human_format__(data.predictions["total area"])}</td>
                            </tr>
                            <tr>
                                <td>{protected_area}</td>
                                <td>{__human_format__(data.predictions["protected area"])} {format_perc(protected_area_percentage)}</td>
                            </tr>
                            <tr>
                                <td>{cashew_tree_cover}</td>
                                <td>{__human_format__(data.predictions["cashew tree cover"])} {format_perc(cashew_tree_cover_percentage)}</td>
                            </tr>
                            <tr>
                                <td>{cashew_tree_cover_within_protected_area}</td>
                                <td>{__human_format__(data.predictions["cashew tree cover within protected area"])}  {format_perc(cashew_protected_percent)}</td>
                            </tr>
                            {deforestation_row}
                            {afforestation_row}
                        </table>
                    </body>
                </html>
            """
    )


def build_layer(feature, benin_district_layer, geojson_list, country: Country):
    # GEOJSON layer consisting of a single feature
    temp_layer3 = folium.GeoJson(
        feature, zoom_on_click=False, highlight_function=highlight_function
    )

    # consolidate individual features back into the main layer
    folium.GeoJsonTooltip(
        fields=["NAME_3"],
        aliases=[f"{country.level3_name}: "],
        labels=True,
        sticky=False,
        style=(
            "background-color: white; color: black;"
            " font-family: sans-serif; font-size: 12px; padding: 4px;"
        ),
    ).add_to(temp_layer3)

    try:
        data = __build_data__(feature, country)
        obj = DataObject(**data)

        # If data exists for a certain district
        if (
            data.get("predictions") is not None
            and data.get("predictions").get("total area") > 0
        ):
            # html template for the popups
            html_view = __build_html_view__(obj)
            # Popup size and frame declaration
            iframe = folium.IFrame(html=html_view, width=600, height=280)
            folium.Popup(iframe, max_width=2000).add_to(temp_layer3)

    except Exception as e:
        print("Error building district feature data")
        traceback.print_exc()

    temp_layer3.add_to(benin_district_layer)
    geojson_list.append(temp_layer3)


def __build_data__(feature, country: Country):
    """
    @return data for the district layer
    """
    satellite_prediction_computed_data_json = open(
        f"staticfiles/{country.country_name}/satellite_prediction_computed_data.json",
        encoding="utf8",
        errors="ignore",
    )
    data = {}
    data_dictionary = json.load(satellite_prediction_computed_data_json)
    # GEOJSON layer consisting of a single feature
    # country_name = feature["properties"]["NAME_0"]
    # department_name = feature["properties"]["NAME_1"]
    # commune_name = feature["properties"]["NAME_2"]
    # district_name = feature["properties"]["NAME_3"]

    # data["district"] = district_name

    try:
        country_name = feature["properties"]["NAME_0"]
        department_name = feature["properties"]["NAME_1"]
        commune_name = feature["properties"]["NAME_2"]
        district_name = feature["properties"]["NAME_3"]

        data["district"] = district_name
        data["predictions"] = data_dictionary[country_name][department_name][
            commune_name
        ][district_name]
    except:
        data["district"] = feature["properties"]["NAME_3"]
        data["predictions"] = {
            "afforested area": 0,  # 17473.251036675647,
            "cashew tree cover": 0,  # 0.0,
            "cashew tree cover within protected area": 0,  # 0.0,
            "deforested area": 0,  # 13121.75549345043,
            "number of trees": 0,  # 0,
            "protected area": 0,  # 94655.90351988396,
            "total area": 0,  # 624392.393784098,
        }
    return data


@shared_task(bind=True)
def create_benin_district(self, country: Country):
    """
    Adding the shapefiles with popups for the districts
    Add districts data to the parent layer
    """

    try:
        start_time = time.time()
        benin_adm3_json = utils.Fetcher.GAUL3(country=country.country_name).geo
        benin_district_layer = folium.FeatureGroup(
            name=gettext(f"{country.country_name} {country.level3_name}"),
            show=False,
            overlay=True,
        )
        loop = asyncio.new_event_loop()
        task_list = []
        geojson_list = []
        for feature in benin_adm3_json["features"]:
            task_list.append(
                asyncio.ensure_future(
                    loop.run_in_executor(
                        None,
                        build_layer,
                        feature,
                        benin_district_layer,
                        geojson_list,
                        country,
                    )
                )
            )

        asyncio.set_event_loop(loop)
        loop.run_until_complete(asyncio.gather(*task_list))
        loop.close()

        return benin_district_layer, geojson_list
    except Exception as e:
        print(e)
        return None
