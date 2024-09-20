import json
import os
import sys
import time
import folium
import geojson
from area import area
from celery import shared_task
from django.db.models import Sum, Avg
from django.utils.translation import gettext
from math import log10, floor
from apps.dashboard.models import BeninYield, Country
from apps.dashboard.models import CommuneSatellite
from apps.dashboard.models import DeptSatellite
from apps.dashboard.maps_builders.shared_fn import format_perc
from apps.dashboard import utils


def __human_format__(num):
    num = float("{:.3g}".format(num))
    magnitude = 0
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0
    return "{}{}".format(
        "{:f}".format(num).rstrip("0").rstrip("."), ["", "K", "M", "B", "T"][magnitude]
    )


def __highlight_function__(feature):
    """
    Function to define the layer highlight style
    """

    return {"fillColor": "#ffaf00", "color": "green", "weight": 3, "dashArray": "1, 1"}


def __highlight_function2__(feature):
    """
    Function to define the layer highlight style
    """

    return {
        "fillColor": "transparent",
        "color": "#B4B4B4",
        "weight": 3,
        "dashArray": "1, 1",
    }


def __get_average_nut_count__(qars: list):
    """
    Get the average of nut count in the area
    """

    total = 0
    count = len(qars)
    if count == 0:
        count = 1
    for i, x in enumerate(qars):
        total += x.nut_count
    result = total / count
    return "{:.2f}".format(result) if result != 0 else "NA"


def __get_average_defective_rate__(qars: list):
    """
    Get the average of defective rate in the area
    """
    total = 0
    count = len(qars)
    if count == 0:
        count = 1
    for i, x in enumerate(qars):
        total += x.defective_rate
    result = total / count
    return "{:.2f}".format(result) if result != 0 else "NA"


def __get_average_kor__(qars):
    """
    Get the average of kor in the area
    """
    total = 0
    count = len(qars)
    if count == 0:
        count = 1
    for i, x in enumerate(qars):
        total += x.kor
    result = total / count
    return "{:.2f}".format(result) if result != 0 else "NA"


def __build_html_view__(data: object, country: Country, is_authenticated: bool) -> any:
    """
    Return the HTML view of the Layer popup
    """
    # Variables for translation
    departments_cashew_tree = gettext("Departments Cashew Tree Cover Statistics In")
    departments_cashew_tree = gettext("Departments Cashew Tree Cover Statistics In")
    active_trees = gettext("Active Trees")
    sick_trees = gettext("Sick Trees")
    dead_trees = gettext("Dead Trees")
    out_of_production = gettext("Out of Production Trees")
    cashew_trees_status = gettext("Cashew Trees Status in")
    satellite_est = gettext("Satellite Estimation")
    tns_survey = gettext("TNS Survey")

    # All 3 shapefiles share these variables
    total_cashew_yield = gettext("Total Cashew Yield (kg)")
    total_area = gettext("Total Area (ha)")
    cashew_tree_cover = gettext("Cashew Tree Cover (ha)")
    protected_area = gettext("Protected Area (ha)")
    cashew_tree_cover_within_protected_area = gettext(
        "Cashew Tree Cover Within Protected Area (ha)"
    )
    yield_hectare = gettext("Yield/Hectare (kg/ha)")
    yield_per_tree = gettext("Yield per Tree (kg/tree)")
    number_of_trees = gettext("Number of Trees")
    qar_average = gettext("KOR Average")
    nine_9 = gettext("9th")
    source_tns = gettext("Source: TNS/BeninCaju Yield Surveys 2020")
    deforestation_area = gettext("Deforested Area (2021 - 2022) (ha)")
    afforestation_area = gettext("Afforested Area (2000 - 2012) (ha)")

    # Percentages
    cashew_tree_cover_percentage = (
        data.predictions["cashew tree cover"] / data.predictions["total area"]
    )

    try:
        deforestation_percentage = (
            data.predictions["deforested area"] / data.predictions["total area"]
        )
        afforestation_percentage = (
            data.predictions["afforested area"] / data.predictions["total area"]
        )
        deforestation_row = f"<tr><td>{deforestation_area}</td><td>{__human_format__(data.predictions['deforested area'])} {format_perc(deforestation_percentage)}</td><td>NA</td></tr>"
        afforestation_row = f"<tr><td>{afforestation_area}</td><td>{__human_format__(data.predictions['afforested area'])} {format_perc(afforestation_percentage)}</td><td>NA</td></tr>"
    except Exception as e:
        deforestation_row = ""
        afforestation_row = ""

    name = gettext(f"{country.country_name}")

    return (
        "No Predictions"
        if not hasattr(data, "predictions") or data.predictions is None
        else f"""
                <html>
                    <head>
                        <style>
                        table {{
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
                        <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
                        <script type="text/javascript">
                        // Load Charts and the corechart and barchart packages.
                        google.charts.load('current', {{'packages':['corechart']}});
                        google.charts.load('current', {{'packages':['bar']}});

                        // Draw the pie chart and bar chart when Charts is loaded.
                        google.charts.setOnLoadCallback(drawChart);

                        function drawChart() {{

                            var pie_data = new google.visualization.DataTable();
                            pie_data.addColumn('string', 'Commune');
                            pie_data.addColumn('number', 'Cashew Tree Cover (ha)');
                            pie_data.addRows({data.pred_ben_data});

                            var piechart_options = {{title:'{departments_cashew_tree} {name}',
                                                        is3D: true,
                                                    }};
                            var piechart = new google.visualization.PieChart(document.getElementById('piechart_div'));
                            piechart.draw(pie_data, piechart_options);




                            var data_donut = google.visualization.arrayToDataTable([
                            ['Tree Type', 'Number of Trees'],
                            ['{active_trees}',      {data.active_trees}],
                            ['{sick_trees}',      {data.sick_trees}],
                            ['{dead_trees}',     {data.dead_trees}],
                            ['{out_of_production}',      {data.out_prod_trees}],
                            ]);

                            var options_donut = {{

                            title: '{cashew_trees_status} {name}',
                            pieHole: 0.5,
                            colors: ['007f00', '#02a8b1', '9e1a1a', '#242526'],
                            }};

                            var chart_donut = new google.visualization.PieChart(document.getElementById('donutchart'));
                            chart_donut.draw(data_donut, options_donut);

                            }};
                        </script>
                    </head>
                    <body>
                        <h2>{name}</h2>
                        <table>
                        <tr>
                            <th></th>
                            <th>{satellite_est}</th>
                            {f'<th>{tns_survey}</th>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{total_cashew_yield}</td>
                            <td>{__human_format__(data.predictions["total cashew yield"])}</td>
                            {f'<td>{data.r_total_yield / 1000000:n}M</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{total_area}</td>
                            <td>{__human_format__(data.predictions["total area"])}</td>
                            {f'<td>{__human_format__(data.predictions["total area"])}</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{protected_area}</td>
                            <td>{__human_format__(data.predictions["protected area"])}</td>
                            {f'<td>NA</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{cashew_tree_cover}</td>
                            <td>{__human_format__(data.predictions["cashew tree cover"])} {format_perc(cashew_tree_cover_percentage)}</td>
                            {f'<td>{__human_format__(data.r_surface_area)}</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{cashew_tree_cover_within_protected_area}</td>
                            <td>{__human_format__(data.predictions["cashew tree cover within protected area"])}</td>
                            {f'<td>NA</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{yield_hectare}</td>
                            <td>{__human_format__(data.predictions["yield per hectare"])}</td>
                            {f'<td>{data.r_yield_ha}</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{yield_per_tree}</td>
                            <td>
                            {__human_format__(data.predictions["yield per tree"]) if data.predictions["yield per tree"] != 0 else "N/A"}
                            </td>
                            {f'<td>{data.r_yield_tree}</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{number_of_trees}</td>
                            <td>
                            {__human_format__(data.predictions["number of trees"]) if data.predictions["number of trees"] != 0 else "N/A"}
                            </td>
                            {f'<td>{data.r_num_tree / 1000:n}K</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{deforestation_area}</td>
                            <td>{__human_format__(data.predictions['deforested area'])} {format_perc(deforestation_percentage)}</td>
                            {f'<td>NA</td>' if is_authenticated else ''}
                        </tr>
                        <tr>
                            <td>{afforestation_area}</td>
                            <td>{__human_format__(data.predictions['afforested area'])} {format_perc(afforestation_percentage)}</td>
                            {f'<td>NA</td>' if is_authenticated else ''}
                        </tr>


                        </table>

                        &nbsp;&nbsp;
                        {__build_caj_q_html_view__(data) if is_authenticated else ''}
                        &nbsp;&nbsp;

                        <table>
                            <td><div id="piechart_div" style="width: 400; height: 350; display: {'block' if len(data.pred_ben_data) > 0 else 'none'};"></div></td>
                        </table>
                        <table>
                            <td><div id="donutchart" style="width: 400; height: 350; display: {'block' if data.num_trees > 0 else 'none'};"></div></td>
                        </table>
                        <table>
                            <td><div style= "text-align: center"><h5>{source_tns if country.country_name =='Benin' and is_authenticated else ''}</h5></div>
                        </table>

                    </body>
                    </html>
            """
    )


def __build_caj_q_html_view__(data: object) -> any:
    """
    popup's table for Caju Quality Information
    """

    satellite_est = gettext("Satellite Estimation")
    tns_survey = gettext("TNS Survey")
    nut_count_average = gettext("Nut Count Average")
    defective_rate_average = gettext("Defective Rate Average")
    kor_average = gettext("KOR Average")

    return f"""
                <h4>Caju Quality Informations</h4>
                <table>
                    <tr>
                        <th></th>
                        <th>{tns_survey}</th>
                    </tr>
                    <tr>
                        <td>{nut_count_average}</td>
                        <td>{__get_average_nut_count__(data.qars)}</td>
                    </tr>
                    <tr>
                        <td>{defective_rate_average}</td>
                        <td>{__get_average_defective_rate__(data.qars)}</td>
                    </tr>
                    <tr>
                        <td>{kor_average}</td>
                        <td>{__get_average_kor__(data.qars)}</td>
                    </tr>
                </table>
            """


def __build_data__(feature, qars, country: Country):
    """
    Return all the data needed to build the Layer
    """
    satellite_prediction_computed_data_json = open(
        f"staticfiles/{country}/satellite_prediction_computed_data.json",
        encoding="utf8",
        errors="ignore",
    )
    data_dictionary = json.load(satellite_prediction_computed_data_json)
    # prepare data and attach predictions if they are available or having matching names
    # othewise set them as empty dict
    data = {"qars": qars}
    try:
        data["predictions"] = data_dictionary[feature["properties"]["NAME_0"]][
            "properties"
        ]
        data["predictions"] = data_dictionary[feature["properties"]["NAME_0"]][
            "properties"
        ]
    except:
        data["predictions"] = None

    pred_ben_data = []
    pred_ground_ben_data = [
        ["Departments", "Satellite Prediction", "Ground Data Estimate"]
    ]
    for d in range(len(DeptSatellite.objects.using(country.country_name).all())):
        y = DeptSatellite.objects.using(country.country_name).all()[d].department
        x = (
            CommuneSatellite.objects.using(country.country_name)
            .filter(department=y)
            .aggregate(Sum("cashew_tree_cover"))
        )
        x = round(x["cashew_tree_cover__sum"] / 10000, 2)
        pred_ben_data.append([y, x])
        pred_ground_ben_data.append([y, x, x])
    data["pred_ben_data"] = pred_ben_data

    surface_area = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("surface_area"))
    )
    surface_area = int(round(surface_area["surface_area__sum"] or 0, 2))
    data["surface_area"] = surface_area

    total_yield = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("total_yield_kg"))
    )
    total_yield = int(round(total_yield["total_yield_kg__sum"] or 0, 2))
    data["total_yield"] = total_yield

    yield_ha = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Avg("total_yield_per_ha_kg"))
    )
    yield_ha = int(round(yield_ha["total_yield_per_ha_kg__avg"] or 0, 2))
    data["yield_ha"] = yield_ha

    num_trees = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("total_number_trees"))
    )
    num_trees = int(num_trees["total_number_trees__sum"] or 0)
    data["num_trees"] = num_trees

    sick_trees = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("total_sick_trees"))
    )
    sick_trees = int(sick_trees["total_sick_trees__sum"] or 0)
    data["sick_trees"] = sick_trees

    out_prod_trees = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("total_trees_out_of_prod"))
    )
    out_prod_trees = int(out_prod_trees["total_trees_out_of_prod__sum"] or 0)
    data["out_prod_trees"] = out_prod_trees

    dead_trees = (
        BeninYield.objects.using(country.country_name)
        .all()
        .aggregate(Sum("total_dead_trees"))
    )
    dead_trees = int(round(dead_trees["total_dead_trees__sum"] or 0, 2))
    data["dead_trees"] = dead_trees

    tree_ha_pred = (
        CommuneSatellite.objects.using(country.country_name)
        .all()
        .aggregate(Sum("cashew_tree_cover"))
    )
    tree_ha_pred = int(round((tree_ha_pred["cashew_tree_cover__sum"] or 0) / 10000, 2))
    data["tree_ha_pred"] = tree_ha_pred

    region_size = area(feature["geometry"]) / 10000
    data["region_size"] = region_size

    active_trees = num_trees - sick_trees - out_prod_trees - dead_trees
    data["active_trees"] = active_trees

    r_surface_area = (
        round(
            surface_area, 1 - int(floor(log10(abs(surface_area or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if surface_area < 90000
        else round(
            surface_area, 2 - int(floor(log10(abs(surface_area or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_surface_area"] = r_surface_area

    r_total_yield = (
        round(
            total_yield, 1 - int(floor(log10(abs(total_yield or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if total_yield < 90000
        else round(
            total_yield, 2 - int(floor(log10(abs(total_yield or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_total_yield"] = r_total_yield

    r_yield_ha = (
        round(
            yield_ha, 1 - int(floor(log10(abs(yield_ha or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if yield_ha < 90000
        else round(
            yield_ha, 2 - int(floor(log10(abs(yield_ha or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_yield_ha"] = r_yield_ha

    yield_pred = r_yield_ha * tree_ha_pred
    data["yield_pred"] = yield_pred

    r_tree_ha_pred = (
        round(
            tree_ha_pred, 1 - int(floor(log10(abs(tree_ha_pred or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if tree_ha_pred < 90000
        else round(
            tree_ha_pred, 2 - int(floor(log10(abs(tree_ha_pred or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_tree_ha_pred"] = r_tree_ha_pred

    r_yield_pred = (
        round(
            yield_pred, 1 - int(floor(log10(abs(yield_pred or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if yield_pred < 90000
        else round(
            yield_pred, 2 - int(floor(log10(abs(yield_pred or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_yield_pred"] = r_yield_pred

    r_num_tree = (
        round(
            num_trees, 1 - int(floor(log10(abs(num_trees or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if num_trees < 90000
        else round(
            num_trees, 2 - int(floor(log10(abs(num_trees or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_num_tree"] = r_num_tree

    r_region_size = (
        round(
            region_size, 1 - int(floor(log10(abs(region_size or 1))))
        )  # or 1 to avoid ValueError: math domain error
        if region_size < 90000
        else round(
            region_size, 2 - int(floor(log10(abs(region_size or 1))))
        )  # or 1 to avoid ValueError: math domain error
    )
    data["r_region_size"] = r_region_size

    r_yield_tree = round(
        r_total_yield / (active_trees or 1)
    )  # To Avoid ZeroDivisionError: division by zero
    data["r_yield_tree"] = r_yield_tree

    return data


@shared_task(bind=True)
def create_benin_republic(feature, qars, country: Country, is_authenticated: bool):
    """
    Adding the shapefiles with popups for the region
    Add data to the parent layer
    """
    try:
        __start_time = time.time()
        benin_adm0_json = utils.Fetcher.country(country=country.country_name).geo

        class DataObject:
            def __init__(self, **entries):
                self.__dict__.update(entries)

        benin_border_layer = folium.FeatureGroup(
            name=gettext(f"{country} Republic"), show=True, overlay=False, control=False
        )

        benin_layer = folium.FeatureGroup(
            name=gettext(f"{country} Republic"), show=False, overlay=True
        )
        temp_geojson0 = folium.GeoJson(
            data=benin_adm0_json,
            name="Benin-Adm0 Department",
            highlight_function=__highlight_function__,
        )

        country_layer_geojson_list = []
        border_layer_geojson_list = []
        for feature in temp_geojson0.data["features"]:
            temp_layer0 = folium.GeoJson(
                feature, zoom_on_click=False, highlight_function=__highlight_function__
            )
            temp_border_layer = folium.GeoJson(
                feature,
                zoom_on_click=False,
                style_function=__highlight_function2__,
                highlight_function=__highlight_function2__,
                control=False,
            )

        try:
            data = __build_data__(feature, qars, country)
            html_view = __build_html_view__(
                DataObject(**data), country, is_authenticated
            )
            iframe = folium.IFrame(html=html_view, width=600, height=400)
            folium.Popup(iframe, max_width=2000).add_to(temp_layer0)
        except Exception as e:
            print("An error while calculating in benin_republic")
            print(e)

        temp_layer0.add_to(benin_layer)
        country_layer_geojson_list.append(temp_layer0)
        temp_border_layer.add_to(benin_border_layer)
        border_layer_geojson_list.append(temp_border_layer)

        return (
            benin_layer,
            benin_border_layer,
            country_layer_geojson_list,
            border_layer_geojson_list,
        )
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
        print(e)
        return None, None
