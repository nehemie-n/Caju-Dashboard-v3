import folium
from django.utils.translation import gettext
import geojson
from shapely.geometry import shape, Point
from folium.plugins import MarkerCluster
from apps.dashboard.models import Nursery
from apps.dashboard import utils


def bad_nurs_select(country: str):
    """ """
    communes_geojson = utils.Fetcher.GAUL2(country=country).geo
    departments_geojson = utils.Fetcher.GAUL1(country=country).geo
    items = [
        elmt
        for elmt in Nursery.objects.using(country).filter(
            country_id__country_name=country
        )
    ]
    good_datas = []
    for item in items:
        for feature in departments_geojson["features"] and communes_geojson["features"]:
            polygon = shape(feature["geometry"])
            if polygon.contains(Point(item.longitude, item.latitude)):
                good_datas.append(item)
    return good_datas


class NurseryLayer:
    """
    Create a Layer for nurseries data
    """

    def __init__(self, marker_cluster):
        self.marker_cluster = marker_cluster

    def add_nursery(self, country):
        """
        Add nurseries markers to the parent layer
        """
        # variables for translation
        commune_name = gettext("Commune Name")
        nursery_owner = gettext("Nursery Owner")
        nursery_area = gettext("Nursery Area (ha)")
        number_of_plants = gettext("Number of Plants")

        # Loop through every nursery owner and add to the nursery marker popups
        nurseries = bad_nurs_select(country)
        marker_datas = []
        for i in range(len(nurseries)):
            current_object = nurseries[i]
            if current_object.latitude == 0 and current_object.longitude == 0:
                continue
            marker = folium.Marker(
                location=[current_object.latitude, current_object.longitude],
                rise_on_hover=True,
                rise_offset=250,
                icon=folium.Icon(color="red", icon="leaf"),
                popup=f"""
                                <div style="">
                                <h4 style="font-family: 'Trebuchet MS', sans-serif">{commune_name}: <b>{current_object.commune}</b></h4>
                                <h5 style="font-family: 'Trebuchet MS', sans-serif">{nursery_owner}: <i>{current_object.nursery_name}</i></h5>
                                <h5 style="font-family: 'Trebuchet MS', sans-serif">{nursery_area}: <b>{current_object.current_area}</b></h5>
                                <h5 style="font-family: 'Trebuchet MS', sans-serif">{number_of_plants}: <b>{current_object.number_of_plants}</b></h5>
                                <img src="https://gumlet.assettype.com/deshdoot/import/2019/12/tripXOXO-e1558439144643.jpg?w=1200&h=750&auto=format%2Ccompress&fit=max" width="200" height="70">
                                </div>""",
            )
            marker.add_to(self.marker_cluster)
            marker_datas.append(marker)
        return self.marker_cluster, marker_datas


def create_nursery(country: str):
    """
    Create nursery later
    """
    print(f"Creating nursery {country}")
    try:
        marker_cluster = MarkerCluster(name=gettext("Nursery Information"), show=True)
        nursery_layer = NurseryLayer(marker_cluster).add_nursery(country)
    except Exception as e:
        print(e)
        nursery_layer = None, None
    return nursery_layer
