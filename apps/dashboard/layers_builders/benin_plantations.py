import json
import traceback
import os
from apps.dashboard.earthengine import ee_client as ee
import traceback
import folium
import geojson
from area import area
from celery import shared_task
from django.utils.translation import gettext
from folium.plugins import MarkerCluster
from math import log10, floor
from shapely.geometry import shape
from apps.dashboard.models import AlteiaData
from apps.dashboard.models import BeninYield, Plantation
from apps.dashboard.models import SpecialTuple
from apps.dashboard.utils import replace_occurrence
from apps.dashboard import utils
from apps.dashboard import models
from django.contrib.gis import geos

"""
@TODO ensure Benin path also moves to country sprcific folder to make this process dynamic per active country
Prepare plantations drone images per country
"""
# benin
benin_assets_path = os.getenv("EE_DRONES_GEOTIFF")
benin_assets_list = ee.data.getList(params={"id": benin_assets_path})

# ivory coast
ivory_coast_assets_path = f'{replace_occurrence(os.getenv("EE_DRONES_GEOTIFF"), "cajusupport", f"cajusupport/Ivory_Coast", 1)}'
ivory_coast_assets_list = ee.data.getList(params={"id": ivory_coast_assets_path})

drones_images_ids = {
    "Benin": [asset["id"].split("/").pop() for asset in benin_assets_list],
    "Ivory Coast": [asset["id"].split("/").pop() for asset in ivory_coast_assets_list],
}


class BeninPlantationStatsObject:
    """ """

    def __init__(self, **entries):
        self.r_total_grand_pred_yield = None
        self.r_total_grand_ground_yield = None
        self.grand_plantation_size = None
        self.total_grand_ground_surface = None
        self.total_grand_pred_surface = None
        self.average_pred_yield_ha = None
        self.average_ground_yield_ha = None
        self.r_total_grand_num_tree = None
        self.total_grand_yield_tree = None
        self.counter = None
        self.__dict__.update(entries)


def __highlight_function(feature):
    return {"fillColor": "#ffaf00", "color": "green", "weight": 3, "dashArray": "1, 1"}


def __get_department_name(code, coordinates, country):
    """
    Read geolocalization data from 'GAUL1 geometries'
    Check whenever a Point defined by the longitude and latitude passed in parameter belongs to a department in
    country
    Return the name of the department found or 'Unknown' otherwise
    """
    try:
        point = geos.Point(coordinates[1], coordinates[0])
        gaul1 = models.GAUL1.objects.using(country).get(geometry__contains=point)
        return gaul1.name
    except Exception as e:
        traceback.print_exc()
        return None


def __get_satellite_estimation_data(
    feature, dept_yield_ha: dict, code, code_2, coordinate_xy, country
):
    plantation_size = area(feature["geometry"]) / 10000
    plantation_size = round(plantation_size, 1)
    try:
        tree_ha_pred_plant = round(
            round(
                AlteiaData.objects.using(country)
                .filter(plantation_code=code)
                .first()
                .cashew_tree_cover
                / 10000,
                2,
            ),
            1,
        )
        department_name = __get_department_name(code_2, coordinate_xy, country)
        yield_pred_plant = int(tree_ha_pred_plant * dept_yield_ha.get(department_name))
        yield_per_hectare = dept_yield_ha.get(department_name)

    except Exception:
        tree_ha_pred_plant = 0
        department_name = __get_department_name(code_2, coordinate_xy, country)
        yield_pred_plant = 0
        yield_per_hectare = 0

    try:
        if yield_pred_plant < 90000:
            r_yield_pred_plant = round(
                yield_pred_plant, 1 - int(floor(log10(abs(yield_pred_plant))))
            )
        else:
            r_yield_pred_plant = round(
                yield_pred_plant, 2 - int(floor(log10(abs(yield_pred_plant))))
            )
    except Exception:
        r_yield_pred_plant = yield_pred_plant

    return {
        "plantation_size": plantation_size,
        "cashew_yield": r_yield_pred_plant / 1000,
        "tree_ha_pred_plant": tree_ha_pred_plant,
        "department_name": department_name,
        "yield_pred_plant": yield_pred_plant,
        "r_yield_pred_plant": r_yield_pred_plant,
        "cashew_surface_area": tree_ha_pred_plant,
        "yield_per_hectare": yield_per_hectare,
        "number_of_trees_p": "N/A",
        "yield_per_tree_p": "N/A",
    }


def __get_tns_survey_data(code_2: str, country: str):
    benin_yield = (
        BeninYield.objects.using(country).filter(plantation_code=code_2).first()
    )
    benin_plantation = (
        Plantation.objects.using(country).filter(plantation_code=code_2).first()
    )
    surface_area_p = round(benin_yield.surface_area if benin_yield else 0, ndigits=1)
    total_yield_p = round(benin_yield.total_yield_kg if benin_yield else 0, ndigits=1)
    yield_ha_p = round(
        total_yield_p / (surface_area_p or 1), ndigits=1
    )  # Avoid Division by 0
    num_tree_p = round(benin_yield.total_number_trees if benin_yield else 0)
    yield_tree_p = round(
        total_yield_p / (num_tree_p or 1), ndigits=1
    )  # Avoid Division by 0

    if benin_yield is None:
        name_p = (
            str(benin_plantation.owner_first_name)
            + " "
            + str(benin_plantation.owner_last_name)
        )
        village = benin_plantation.village
    else:
        name_p = (
            str(benin_yield.owner_first_name) + " " + str(benin_yield.owner_last_name)
        )
        village = benin_yield.village

    try:
        r_total_yield_p = (
            round(
                total_yield_p, 1 - int(floor(log10(abs(total_yield_p or 1))))
            )  # Avoid log 0
            if total_yield_p < 90000
            else round(
                total_yield_p, 2 - int(floor(log10(abs(total_yield_p or 1))))
            )  # Avoid log 0
        )
    except Exception:
        r_total_yield_p = total_yield_p

    try:
        plantation_size = round(
            (
                surface_area_p
                if surface_area_p != 0
                else (benin_plantation.current_area if benin_plantation != 0 else 0)
            ),
            2,
        )
    except:
        plantation_size = (
            surface_area_p
            if surface_area_p != 0
            else (benin_plantation.current_area if benin_plantation != 0 else 0)
        )

    return {
        "plantation_owner": name_p,
        "village": village,
        "cashew_yield": (r_total_yield_p / 1000) if benin_yield is not None else "N/A",
        "plantation_size": plantation_size,
        "cashew_surface_area": "N/A",
        "yield_per_hectare": yield_ha_p if benin_yield else "N/A",
        "number_of_trees_p": num_tree_p if benin_yield else "N/A",
        "yield_per_tree_p": yield_tree_p if benin_yield else "N/A",
    }


def __check_if_plantation_has_drone_image(code: str, country: str):
    try:
        if utils.clean_plantation_code(code) in drones_images_ids[country]:
            return True
    except Exception:
        return False


def __build_popup(
    feature,
    temp_layer_a,
    dept_yield_ha,
    path_link,
    code,
    statistics_obj,
    coordinate_xy,
    country,
):
    with open(
        f"staticfiles/{country}/plantation_recommendation.json",
        encoding="utf8",
        errors="ignore",
    ) as plantation_recommendation_json:
        plantation_recommendations = json.load(plantation_recommendation_json)
    # Plantation translation variables
    plantation_owner = gettext("Plantation Owner")
    plantation_id = gettext("Plantation ID")
    village_text = gettext("Village")
    satellite_estimate = gettext("Satellite Estimate")
    yield_survey = gettext("Yield Survey")
    cashew_yield = gettext("Cashew Yield (kg)")
    plantation_size = gettext("Plantation Size (ha)")
    cashew_surface_area = gettext("Cashew Surface Area (ha)")
    yield_per_hectare = gettext("Yield Per Hectare (kg/ha)")
    number_of_trees_p = gettext("Number of Trees")
    yield_per_tree_p = gettext("Yield per Tree (kg/tree)")
    average_surface_area_p = (
        gettext("Average Surface Area and Cashew Yield Information for Plantations in")
        + " "
        + country
    )
    number_of_farms = gettext("Number of Farms")
    total_plantation_yield = gettext("Total Plantation Yield (kg)")
    total_plantation_area = gettext("Total Plantation Area (ha)")
    cashew_surface_area = gettext("Cashew Surface Area (ha)")
    average_yield_per = gettext("Average Yield Per Hectare (kg/ha)")
    total_number_of = gettext("Total Number of Trees")
    average_yield_per_tree = gettext("Average Yield per Tree (kg/tree)")
    if country == "Benin":
        source_tns = gettext("Source: TNS/BeninCaju Yield Surveys 2020")
    elif country == "Ivory Coast":
        source_tns = gettext("Source: TNS/ProsperCashew Yield Surveys")
    else:
        source_tns = gettext("Source: TNS Yield Surveys")
    view_drone_image = gettext("View Drone Image")
    unknown = gettext("Unknown")
    plantation_recommendation = gettext("Training Recommendations")
    recommendedGAP = gettext("Recommended GAP")
    top_walking = gettext("Top walking")
    thinning = gettext("Thinning")
    gap_filling_needs = gettext("Gap filling")
    planting_more = gettext("Planting More")
    has_survey_data = True
    survey_data = {}
    code_2 = ""
    try:
        specia_tuple = (
            SpecialTuple.objects.using(country).filter(alteia_id=code).first()
        )
        if specia_tuple:
            code_2 = specia_tuple.plantation_id
            try:
                survey_data = __get_tns_survey_data(code_2, country)
            except:
                # pass to be able
                pass
        else:
            # has_survey_data = False #@NOTE: replaced this with below to consider ivory coast preliminary plantation dataset that doesn't have yield  or alteia data
            survey_data = __get_tns_survey_data(code, country)
    except Exception as e:
        print(e)
        print("Error computing plantation survey data. ", code, code_2)
        has_survey_data = False
    # print(survey_data, has_survey_data)
    satellite_data = __get_satellite_estimation_data(
        feature, dept_yield_ha, code, code_2, coordinate_xy, country
    )
    has_drone_image = __check_if_plantation_has_drone_image(code, country)
    drone_image_button = f"""
    <div style= "text-align: center">
        <button class="btn" style="border: none;
        background: none;background-color: #FFFFFF; padding: 0;
        color: "black";" onclick= "window.open('{path_link}drone/{code}/','_blank')" role="button">
        <i class="fab fa-accusoft me-2"></i>{view_drone_image}
        </button>
    </div>
    """
    drone_image_button_bottom = f"""
    <div style= "text-align: center">
        <button class="btn btn-outline-light" style="background-color: #004b55;"
        onclick= "window.open('{path_link}drone/{code}/','_blank')" role="button">
        <i class="fab fa-accusoft me-2"></i>{view_drone_image}
        </button>
    </div>
    """
    try:
        if code in plantation_recommendations.keys():
            recommendedGAPHTML = f"""
                            <table>
                        <tr>
                            <th>{recommendedGAP}</th>
                            <th></th>
                        </tr>
                        <tr>
                            <td>{thinning}</td>
                            <td>
                            {"Required" if plantation_recommendations[code].get("thinning", 0) > 0 else "Not Required"}</td>
                        </tr>
                        <tr>
                            <td>{top_walking}</td>
                            <td>
                            {"Required" if plantation_recommendations[code].get("top_walking", 0) > 0 else "Not Required"}</td>
                        </tr>
                        <tr>
                            <td>{gap_filling_needs}</td>
                            <td>
                            {"Required" if plantation_recommendations[code].get("gap_filling_needs", 0) > 0 else "Not Required"}</td>
                        </tr>
                        <tr>
                            <td>{planting_more}</td>
                            <td>
                            {"Required" if plantation_recommendations[code].get("number_of_trees_to_plant")[0] > 0 else "Not Required"}</td>
                        </tr>
                        </table>
            """
        else:
            recommendedGAPHTML = f"""
                            <table>
                        <tr>
                            <th>{recommendedGAP}</th>
                            <th></th>
                        </tr>
                        <tr>
                            <td>{thinning}</td>
                            <td>N/A</td>
                        </tr>
                        <tr>
                            <td>{top_walking}</td>
                            <td>N/A</td>
                        </tr>
                        <tr>
                            <td>{gap_filling_needs}</td>
                            <td>N/A</td>
                        </tr>
                        <tr>
                            <td>{planting_more}</td>
                            <td>N/A</td>
                        </tr>
                        </table>
            """
    except Exception:
        recommendedGAPHTML = f"""
                        <table>
                    <tr>
                        <th>{recommendedGAP}</th>
                        <th></th>
                    </tr>
                    <tr>
                        <td>{thinning}</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>{top_walking}</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>{gap_filling_needs}</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>{planting_more}</td>
                        <td>N/A</td>
                    </tr>
                    </table>
        """

    try:
        html_a = f"""
        <html>
        <head>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <link rel="icon" href="img/mdb-favicon.ico" type="image/x-icon" />
            <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.2/css/all.css" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900
            &display=swap" />
            <link rel="stylesheet" href="css/mdb.min.css" />
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>

            <style>
                table {{
                font-family: arial, sans-serif;
                border-collapse: collapse;
                width: 99%;
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


                <h6>{plantation_owner}: {survey_data["plantation_owner"] if has_survey_data else unknown}</h3>
                <h6>{plantation_id}: {code}</h4>
                <h6>{village_text}: {survey_data["village"] if has_survey_data else unknown}</h4>
                {drone_image_button if has_drone_image else ""}
                <table>
                <tr>
                    <th></th>
                    <th>{satellite_estimate}</th>
                    <th>{yield_survey}</th>
                </tr>
                <tr>
                    <td>{cashew_yield}</td>
                    <td>{satellite_data["cashew_yield"]}K</td>
                    <td>{(survey_data["cashew_yield"].__str__() + "K") if has_survey_data and not isinstance(survey_data["cashew_yield"], str) else "N/A"}</td>
                </tr>
                <tr>
                    <td>{plantation_size}</td>
                    <td>{satellite_data["plantation_size"]}</td>
                    <td>{survey_data["plantation_size"] if has_survey_data and survey_data["plantation_size"] != 0 else "N/A"}</td>
                </tr>
                <tr>
                    <td>{cashew_surface_area}</td>
                    <td>{satellite_data["cashew_surface_area"]}</td>
                    <td>{survey_data["cashew_surface_area"] if has_survey_data else "N/A"}</td>
                </tr>
                <tr>
                    <td>{yield_per_hectare}</td>
                    <td>{satellite_data["yield_per_hectare"]}</td>
                    <td>{survey_data["yield_per_hectare"] if has_survey_data else "N/A"}</td>
                </tr>
                <tr>
                    <td>{number_of_trees_p}</td>
                    <td>{satellite_data["number_of_trees_p"]}</td>
                    <td>{survey_data["number_of_trees_p"] if has_survey_data else "N/A"}</td>
                </tr>
                <tr>
                    <td>{yield_per_tree_p}</td>
                    <td>{satellite_data["yield_per_tree_p"]}</td>
                    <td>{survey_data["yield_per_tree_p"] if has_survey_data else "N/A"}</td>
                </tr>

                </table>

                <h6 class="mt-4 mb-3">
                {average_surface_area_p}
                </h6>
                <table>
                <tr>
                    <th></th>
                    <th>{satellite_estimate}</th>
                    <th>{yield_survey}</th>
                </tr>
                <tr>
                    <td>{number_of_farms}</td>
                    <td>{statistics_obj.counter}</td>
                    <td>{statistics_obj.counter}</td>

                </tr>
                <tr>
                    <td>{total_plantation_yield}</td>
                    <td>{statistics_obj.r_total_grand_pred_yield / 1000:n}K</td>
                    <td>{statistics_obj.r_total_grand_ground_yield / 1000:n}K</td>

                </tr>
                <tr>
                    <td>{total_plantation_area}</td>
                    <td>{statistics_obj.grand_plantation_size}</td>
                    <td>{statistics_obj.total_grand_ground_surface}</td>

                </tr>
                <tr>
                    <td>{cashew_surface_area}</td>
                    <td>{statistics_obj.total_grand_pred_surface}</td>
                    <td>N/A</td>

                </tr>

                <tr>
                    <td>{average_yield_per}</td>
                    <td>{statistics_obj.average_pred_yield_ha}</td>
                    <td>{statistics_obj.average_ground_yield_ha}</td>

                </tr>
                <tr>
                    <td>{total_number_of}</td>
                    <td>N/A</td>
                    <td>{statistics_obj.r_total_grand_num_tree / 1000:n}K</td>
                </tr>
                <tr>
                    <td>{average_yield_per_tree}</td>
                    <td>N/A</td>
                    <td>{statistics_obj.total_grand_yield_tree}</td>
                </tr>

                </table>

                <h6 class="mt-5 mb-3">
                    {plantation_recommendation}
                </h6>
                    {recommendedGAPHTML}
                &nbsp;&nbsp;
                <table>
                    <td> {drone_image_button_bottom if has_drone_image else ""} </td>
                </table>
                &nbsp;&nbsp;
                <table>
                    <div style= "text-align: center"><h6>{source_tns}</h6></div>
                </table>
                <script>
                window.open(
                    {path_link}/drone/{code}/{coordinate_xy}/',
                    '_blank'
                    );
                <script>

            </body>
            </html>
        """

        iframe = folium.IFrame(html=html_a, width=365, height=380)
        folium.Popup(iframe, max_width=1000).add_to(temp_layer_a)
    except Exception as e:
        print("ERROOR: ", e)
        pass


def __build_stats(temp_geojson_a, country: str):
    # Computing the total statistics of all plantations
    grand_pred_surface = 0
    grand_ground_surface = 0
    grand_total_yield = 0
    grand_plantation_size = 0
    counter = 0
    grand_num_tree = 0
    for feature in temp_geojson_a.data["features"]:
        # GEOJSON layer consisting of a single feature
        code_sum = feature["properties"]["plantation_code"]
        # items = len(SpecialTuple.objects.using(country).filter(country_id__country_name=country, alteia_id=code_sum))
        try:
            # if items != 0:
            counter += 1
            # if no alteia Model cashew tree cover stat fetch
            if (
                AlteiaData.objects.using(country)
                .filter(plantation_code=code_sum)
                .first()
            ):
                grand_pred_surface += round(
                    AlteiaData.objects.using(country)
                    .filter(plantation_code=code_sum)
                    .first()
                    .cashew_tree_cover
                    / 10000,
                    2,
                )
            # else:
            # TODO: What happens?

            grand_plantation_size += area(feature["geometry"]) / 10000
            if SpecialTuple.objects.using(country).filter(alteia_id=code_sum):
                code_2_sum = (
                    SpecialTuple.objects.using(country)
                    .filter(alteia_id=code_sum)
                    .first()
                    .plantation_id
                )

                benin_yield_sum = (
                    BeninYield.objects.using(country)
                    .filter(plantation_code=code_2_sum)
                    .first()
                )
                if benin_yield_sum:
                    grand_ground_surface += benin_yield_sum.surface_area
                    grand_total_yield += benin_yield_sum.total_yield_kg
                    grand_num_tree += benin_yield_sum.total_number_trees
        except Exception as e:
            if type(e) is not IndexError:
                print(e)
            print("Could not compute for plantation ", e)
            pass

    # Precalculated average yield per hectare per country
    average_pred_yield_ha_country = {
        "Benin": 390,
        "Ivory Coast": 469.86,
    }
    average_pred_yield_ha: float = average_pred_yield_ha_country.get(country, 390)
    total_grand_pred_surface = int(round(grand_pred_surface))
    total_grand_ground_surface = int(round(grand_ground_surface))
    total_grand_pred_yield = int(round(average_pred_yield_ha * grand_pred_surface))
    total_grand_ground_yield = int(round(grand_total_yield))
    grand_plantation_size = int(round(grand_plantation_size))
    average_ground_yield_ha = int(
        total_grand_ground_yield / (total_grand_ground_surface or 1)
    )  # Avoid Division by Zero
    total_grand_num_tree = int(round(grand_num_tree))
    total_grand_yield_tree = int(
        round(total_grand_ground_yield / (total_grand_num_tree or 1))
    )  # Avoid Division by Zero

    # formating numbers greater than 90000 to show 91k

    r_total_grand_num_tree = (
        round(
            total_grand_num_tree, 1 - int(floor(log10(abs(total_grand_num_tree or 1))))
        )  # Avoid math domain error (log 0)
        if total_grand_num_tree < 90000
        else round(
            total_grand_num_tree,
            2
            - int(
                floor(log10(abs(total_grand_num_tree or 1)))
            ),  # Avoid math domain error (log 0)
        )
    )

    r_total_grand_pred_yield = (
        round(
            total_grand_pred_yield,
            1
            - int(
                floor(log10(abs(total_grand_pred_yield or 1)))
            ),  # Avoid math domain error (log 0)
        )
        if total_grand_pred_yield < 90000
        else round(
            total_grand_pred_yield,
            2
            - int(
                floor(log10(abs(total_grand_pred_yield or 1)))
            ),  # Avoid math domain error (log 0)
        )
    )

    r_total_grand_ground_yield = (
        round(
            total_grand_ground_yield,
            1
            - int(
                floor(log10(abs(total_grand_ground_yield or 1)))
            ),  # Avoid math domain error (log 0)
        )
        if total_grand_ground_yield < 90000
        else round(
            total_grand_ground_yield,
            2
            - int(
                floor(log10(abs(total_grand_ground_yield or 1)))
            ),  # Avoid math domain error (log 0)
        )
    )

    statistics_dict = {
        "r_total_grand_pred_yield": r_total_grand_pred_yield,
        "r_total_grand_ground_yield": r_total_grand_ground_yield,
        "grand_plantation_size": grand_plantation_size,
        "total_grand_ground_surface": total_grand_ground_surface,
        "total_grand_pred_surface": total_grand_pred_surface,
        "average_pred_yield_ha": average_pred_yield_ha,
        "average_ground_yield_ha": average_ground_yield_ha,
        "r_total_grand_num_tree": r_total_grand_num_tree,
        "total_grand_yield_tree": total_grand_yield_tree,
        "counter": counter,
    }

    return BeninPlantationStatsObject(**statistics_dict)


def __get_good_shapfiles_codes(temp_geojson_a):
    polygons = []
    good_codes = []
    for feature in temp_geojson_a.data["features"]:
        code = feature["properties"]["plantation_code"]
        current_polygon = shape(feature["geometry"])
        intersect = False
        for polygon in polygons:
            if current_polygon.intersects(polygon):
                intersect = True
                break
        if intersect is False:
            polygons.append(current_polygon)
            good_codes.append(code)

    return good_codes


@shared_task(bind=True)
def create_benin_plantation(self, path_link, dept_yield_ha, country: str):
    # Get all plantations with available GeoJSON Geometry polygons
    alteia_json = utils.Fetcher.country_plantations(country=country).geo

    benin_plantation_layer = folium.FeatureGroup(
        name=gettext("Plantation Locations"), show=True, overlay=True
    )

    # Adding Benin Plantation to the map
    plantation_cluster = MarkerCluster(name=gettext("Benin Plantations"))
    temp_geojson_a = folium.GeoJson(
        data=alteia_json,
        name="Alteia Plantation Data 2",
        highlight_function=__highlight_function,
    )
    not_overlapping_plantation_codes = __get_good_shapfiles_codes(temp_geojson_a)
    statistics_obj = __build_stats(temp_geojson_a, country)
    nb = 0
    nb_failed = 0
    geojson_list = []
    markers_data = []
    plantations_with_errors = []
    for feature in temp_geojson_a.data["features"]:
        # TODO: In feature differentiate how in Benin they used ALteia ID as plantation code in the plantations GeoJSON
        code = feature["properties"]["plantation_code"]
        if code not in not_overlapping_plantation_codes:
            nb_failed += 1
            plantations_with_errors.append(code)
            # continue # NOTE: Commented out because some plantations get skipped just because they overlay each

        # items = len(SpecialTuple.objects.filter(country_id__country_name=country, alteia_id=code))
        try:
            temp_layer_a = folium.GeoJson(feature, zoom_on_click=True)
            # if items != 0:

            # Getting the centroid of the plantation shapefile for use by the drone map and placing markers on the
            # plantation midpoint
            s = shape(feature["geometry"])
            centre = s.centroid
            coordinate_xy = [centre.y, centre.x]
            has_popup = True
            try:
                __build_popup(
                    feature,
                    temp_layer_a,
                    dept_yield_ha,
                    path_link,
                    code,
                    statistics_obj,
                    coordinate_xy,
                    country,
                )
            except Exception as e:
                traceback.print_exc()
                has_popup = False
                pass
            # consolidate individual features back into the main layer
            marker = folium.Marker(
                location=coordinate_xy,
                rise_on_hover=True,
                rise_offset=250,
                icon=folium.Icon(color="green" if has_popup else "black", icon="globe"),
                popup=None,
            )
            marker.add_to(plantation_cluster)
            markers_data.append(marker)

            nb += 1
            temp_layer_a.add_to(benin_plantation_layer)
            geojson_list.append(temp_layer_a)
        except Exception as e:
            nb_failed += 1
            if type(e) is not IndexError:
                print(e)
            traceback.print_exc()
            pass
    print("PLANTATIONS LAYER STATS nb + nb_failed  = total")
    print(
        nb.__str__() + " + " + nb_failed.__str__() + " = " + (nb_failed + nb).__str__()
    )
    print("Plantations Codes with errors: ")
    plantation_cluster.add_to(benin_plantation_layer)
    return benin_plantation_layer, geojson_list, markers_data


def create_benin_plantation_layer(path_link, current_benin_department_layer, country):
    print(f"Creating plantation layer {country}")
    try:
        _, current_benin_department, _ = current_benin_department_layer[country]
        benin_plantation_layer = create_benin_plantation(
            path_link, current_benin_department, country
        )
    except Exception as e:
        print(f"Error creating plantation layer {country}")
        print(e)
        traceback.print_exc()
        benin_plantation_layer = None, None, None

    return benin_plantation_layer
