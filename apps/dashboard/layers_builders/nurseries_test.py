# import json
# import os
# import geopandas as gpd
# from shapely.geometry import Point
# from shapely.ops import nearest_points
# from apps.dashboard.earthengine import ee_client as ee
# from apps.dashboard.utils import replace_occurrence


# class GeoProcessor:
#     def __init__(
#         self, nursery_count_file, plantations_file, watercourses_file, roads_file
#     ):
#         self.nursery_count_file = nursery_count_file
#         self.plantations_file = plantations_file
#         self.watercourses_file = watercourses_file
#         self.roads_file = roads_file

#     def load_json(self, file_path):
#         with open(file_path) as f:
#             return json.load(f)

#     def find_nearest_point(self, nursery_point, points_gdf):
#         return min(points_gdf, key=lambda point: point.distance(nursery_point))

#     def process_nursery_locations(self):
#         nursery_counts = self.load_json(self.nursery_count_file)
#         low_density_plantations = gpd.read_file(self.plantations_file)
#         watercourses = gpd.read_file(self.watercourses_file)
#         roads = gpd.read_file(self.roads_file)

#         nursery_locations = {}

#         for admin_subdiv, count in nursery_counts.items():
#             admin_subdiv_plantations = low_density_plantations[
#                 low_density_plantations["admin_subdiv"] == admin_subdiv
#             ]
#             admin_subdiv_centroid = admin_subdiv_plantations.centroid.unary_union

#             nurseries = []
#             for _ in range(count):
#                 nearest_point = None
#                 min_distance = float("inf")

#                 for _, row in admin_subdiv_plantations.iterrows():
#                     plantation_point = row["geometry"].centroid
#                     if admin_subdiv_centroid.contains(plantation_point):
#                         watercourse_point = self.find_nearest_point(
#                             plantation_point, watercourses
#                         )["geometry"]
#                         road_point = self.find_nearest_point(plantation_point, roads)[
#                             "geometry"
#                         ]

#                         nursery_point = nearest_points(
#                             plantation_point, watercourse_point.union(road_point)
#                         )[1]
#                         distance = nursery_point.distance(plantation_point)

#                         if distance < min_distance:
#                             nearest_point = nursery_point
#                             min_distance = distance

#                 if nearest_point:
#                     nurseries.append(nearest_point)

#             nursery_locations[admin_subdiv] = nurseries

#         return nursery_locations

#     def save_json(self, file_path):
#         nursery_locations = self.process_nursery_locations()
#         with open(file_path, "w") as f:
#             json.dump(nursery_locations, f)


# def main():
#     geo_processor = GeoProcessor(
#         "nursery_count.json",
#         "studyArea_well-poorly_clipped.geojson",
#         "ben_waterways_lines.shp",
#         "ben_roads_lines.shp",
#     )
#     geo_processor.save_json("nursery_locations.json")


# if __name__ == "__main__":
#     main()

import argparse
import os
import sys
import django
import openpyxl
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

import rasterio
import rasterio.features
import geopandas as gpd

# Define the tile size (adjust according to your memory capacity)
tile_size = 1000

# Open the GeoTIFF file
with rasterio.open("./staticfiles/Benin/Data/studyArea_well-poorly_clipped.tif") as src:
    # Get the dimensions of the image
    height, width = src.shape
    class zones_de_production():
        def init(self, zones):
            self.zone_name = zones
            self.field =

    # Iterate over tiles
    for row in range(0, height, tile_size):
        for col in range(0, width, tile_size):
            # Read a tile of the raster data
            window = rasterio.windows.Window(col, row, tile_size, tile_size)
            image = src.read(1, window=window)

            # Generate the polygon features from the tile
            shapes = rasterio.features.shapes(image, transform=src.transform)

            # Convert the polygon features to a GeoDataFrame
            gdf = gpd.GeoDataFrame.from_features(
                [
                    {'geometry': shape, 'properties': {'value': value}}
                    for shape, value in shapes
                ],
                crs=src.crs
            )

            # Save the GeoDataFrame as a GeoJSON file (one file per tile)
            output_filename = f"./staticfiles/Benin/Data/output_{row}_{col}.geojson"
            gdf.to_file(output_filename, driver='GeoJSON')