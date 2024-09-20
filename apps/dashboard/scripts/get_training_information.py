import geojson
from shapely.geometry import shape, Point
from apps.dashboard.models import Training
from apps.dashboard import utils


class TrainingObject:
    def __init__(self, **entries):
        self.latitude = None
        self.longitude = None
        self.number_of_participant = None
        self.datetime = None
        self.module = None
        self.trainer = None
        self.department = None
        self.commune = None
        self.__dict__.update(entries)

    def dump(self):
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "number_of_participant": self.number_of_participant,
            "datetime": self.datetime,
            "module": self.module,
            "trainer": self.trainer,
            "department": self.department,
            "commune": self.commune,
        }


def get_training_data_from_db(country: str):
    try:
        trainings = (
            Training.objects.using(country)
            .filter(latitude__isnull=False, longitude__isnull=False)
            .exclude(department="Unknown")
            .exclude(commune="Unknown")
            .select_related("module_id", "trainer_id")
            .only(
                "latitude",
                "longitude",
                "number_of_participant",
                "DateTime",
                "module_id__module_name",
                "module_id__category",
                "trainer_id__firstname",
                "trainer_id__lastname",
                "trainer_id__institution",
            )
            .iterator()
        )

        # load GAUL1 geojson
        departments_geojson = utils.Fetcher.GAUL1(country=country).geo

        # load GAUL2 geojson
        communes_geojson = utils.Fetcher.GAUL2(country=country).geo

        trainings_data = []

        for training in trainings:
            department = get_department_from_coord(
                training.latitude, training.longitude, departments_geojson
            )
            commune = get_commune_from_coord(
                training.latitude, training.longitude, communes_geojson
            )

            training_obj = TrainingObject(
                latitude=training.latitude,
                longitude=training.longitude,
                number_of_participant=training.number_of_participant,
                datetime=training.DateTime,
                module={
                    "title": training.module_id.module_name,
                    "category": training.module_id.category,
                },
                trainer={
                    "firstname": training.trainer_id.firstname,
                    "lastname": training.trainer_id.lastname,
                    "institution": training.trainer_id.institution,
                },
                department=department,
                commune=commune,
            )

            trainings_data.append(training_obj)

    except Exception as e:
        print(e)
        trainings_data = []

    return trainings_data


def get_department_from_coord(latitude, longitude, departments_geojson):
    point = Point(longitude, latitude)
    for feature in departments_geojson["features"]:
        polygon = shape(feature["geometry"])
        if polygon.contains(point):
            return feature["properties"]["NAME_1"]
    return "Unknown"


def get_commune_from_coord(latitude, longitude, communes_geojson):
    point = Point(longitude, latitude)
    for feature in communes_geojson["features"]:
        polygon = shape(feature["geometry"])
        if polygon.contains(point):
            return feature["properties"]["NAME_2"]
    return "Unknown"
