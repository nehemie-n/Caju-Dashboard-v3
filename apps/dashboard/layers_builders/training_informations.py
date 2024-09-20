import folium
from django.utils.translation import gettext
from folium.plugins import MarkerCluster


def __build_popup__(current_object):
    # variables for translation
    training_region = gettext("Department")
    training_commune = gettext("Commune")
    trainer = gettext("Trainer")
    trainer_org = gettext("Organization")
    module_title = gettext("Topic")
    module_category = gettext("Category")
    participants = gettext("Number of Participants")
    time = gettext("Training DateTime")

    return f"""
            <div style="">
            <h4 style="font-family: 'Trebuchet MS', sans-serif">
                {training_region}: <b>{current_object.department}</b>
            </h4>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {training_commune}: <b>{current_object.commune}</b>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {trainer}: <i>{current_object.trainer['firstname'] + " " + current_object.trainer['lastname']}</i>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {trainer_org}: <i>{current_object.trainer['institution']}</i>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {module_title}: <i>{current_object.module["title"]}</i>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {module_category}: <i>{current_object.module['category']}</i>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {participants}: <i>{"NaN" if not current_object.number_of_participant else current_object.number_of_participant }</i>
            </h5>
            <h5 style="font-family: 'Trebuchet MS', sans-serif">
                {time}: <i>{current_object.datetime}</i>
            </h5>
            <img src="https://www.technoserve.org/files/blog_four-reasons-you-should-feel-good-about-your-cup-of-coffee-on-earth-day-1.jpg" width="200" height="133">
            </div>
        """


class TrainingLayer:
    def __init__(self, marker_cluster, trainings):
        self.trainings = trainings
        self.marker_cluster = marker_cluster

    def add_training(self, country):
        # Loop through every nursery owner and add to the nursery marker popups
        iconurl = "https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=50&hoffset=0&voffset=-1&background=DBA800"
        marker_datas = []
        for i in range(len(self.trainings)):
            current_object = self.trainings[i]
            icon = folium.features.CustomIcon(
                iconurl,
                icon_size=(45, 45),
            )
            if current_object.latitude and current_object.longitude:
                (current_object.latitude, current_object.longitude)
                marker = folium.Marker(
                    location=[current_object.latitude, current_object.longitude],
                    rise_on_hover=True,
                    rise_offset=500,
                    icon=icon,
                    popup=__build_popup__(current_object),
                )
                marker.add_to(self.marker_cluster)
                marker_datas.append(marker)

        return self.marker_cluster, marker_datas


def create_training(current_trainings, country):
    print(f"Creating training layer {country}")
    try:
        marker_cluster = MarkerCluster(name=gettext("Training Information"), show=False)
        training_layer = TrainingLayer(
            marker_cluster, current_trainings[country]
        ).add_training(country)
    except Exception as e:
        print(e)
        training_layer = None, None
        pass
    return training_layer
