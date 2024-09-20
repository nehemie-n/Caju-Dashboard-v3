from django.urls import path

from . import drone_views
from . import map_views
from . import views
from . import extra_views

urlpatterns = [
    path("public", map_views.public, name="public_map"),  # public map
    path("", map_views.index, name="map"),
    path("map_data/", map_views.map_data, name="map_data"),
    # drone path that is backward compatible since we nolonger need to pass coordinates
    path("drone/<plant_id>/<coordinate_xy>/", drone_views.drone, name="drone_backward"),
    path("drone/<plant_id>/", drone_views.drone, name="drone"),
    # Other urls
    path("plantations/", views.plantations, name="plantations"),
    path("yield/", views.yields, name="yield"),
    path("nurseries/", views.nurseries, name="nurseries"),
    path("training/", views.training, name="training"),
    path("shipment/", views.shipment, name="shipment"),
    path("load_roles/", views.load_roles, name="load_roles"),
    path("profile/", views.profile, name="profile"),
    path("analytics/", views.analytics, name="analytics"),
    path("nut_count/", views.nut_count, name="nut_count"),
    path("defective_rate/", views.defective_rate, name="defective_rate"),
    path("filter-options/", views.filter_options, name="filter_options"),
    # New Added paths
    path("build-maps", map_views.build_maps, name="build_maps"),  # build maps
    # other data models
    path("alteia_data/", extra_views.alteia_data, name="alteia_data"),
    path("countries/", extra_views.countries, name="countries"),
    path("gaul1/", extra_views.gaul1, name="gaul1"),
    path("gaul2/", extra_views.gaul2, name="gaul2"),
    path("gaul3/", extra_views.gaul3, name="gaul3"),
    path("protected_areas/", extra_views.protected_areas, name="protected_areas"),
]
