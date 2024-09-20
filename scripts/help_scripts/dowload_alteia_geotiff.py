import os
from pathlib import Path
import alteia
import folium
import geojson

alteia_sdk = alteia.SDK(
    url="https://app.alteia.com/",
    user=os.getenv("ALTEIA_USER"),
    password=os.getenv("ALTEIA_PASSWORD"),
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


def download_rgb_geotiff(dir_path, mission, code):
    """
    This downloads the specific clean top drone image of the plantation
    """
    datasets = alteia_sdk.datasets.search(
        filter={
            "mission": {"$eq": mission.id},
            "name": {"$eq": "RGB"},
        }
    )
    rgb = datasets[-1]

    created_file = alteia_sdk.datasets.download_component(
        dataset=rgb.id,
        target_path=dir_path.__str__(),
        component=rgb.components[0]["name"],
        overwrite=False,
        target_name=code + ".tif",
    )
    print(created_file)


def download(country):
    """
    :param country: string
    Reads the plantations GeoJSON and downloads the RGB GeoTIFFs drone images for each plantation and stores them in the drone_images folder, 
    Later on these were uploaded to EE so, we now load them from ee instead of folder
    """
    dir_path = BASE_DIR.__str__() + f"/media/{country}/drone_images/"
    if os.path.exists(dir_path.__str__()) is False:
        os.mkdir(dir_path)
        print("Directory '% s' created" % dir_path)
    with open(
        BASE_DIR.__str__()
        + f"/Caju-Dashboard-v2/staticfiles/{country}/Data/CajuLab_Plantations.geojson",
        encoding="utf8",
        errors="ignore",
    ) as file:
        plantations = geojson.load(file)

    temp_plantations_a = folium.GeoJson(
        data=plantations,
    )
    for plantation_feature in temp_plantations_a.data["features"]:
        try:
            code = plantation_feature["properties"]["plantation_code"]
            project = alteia_sdk.projects.search(filter={"name": {"$eq": code}})[0]
            mission = alteia_sdk.missions.search(
                filter={"project": {"$eq": project.id}}
            )[0]
            download_rgb_geotiff(dir_path, mission, code)
        except Exception as e:
            print(e)
            pass


if __name__ == "__main__":
    download()
