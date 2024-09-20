# import asyncio
# from concurrent.futures import ThreadPoolExecutor
# from apps.dashboard.layers_builders.benin_colored_communes import (
#     create_country_colored_commune,
# )
# from apps.dashboard.layers_builders.benin_colored_departments import (
#     create_country_colored_department,
# )
# from apps.dashboard.layers_builders.benin_commune import create_country_commune
# from apps.dashboard.layers_builders.benin_department import create_benin_department
# from apps.dashboard.layers_builders.benin_district import create_benin_district
# from apps.dashboard.layers_builders.benin_protected_areas import (
#     create_benin_protected_area,
# )
# from apps.dashboard.layers_builders.benin_republic import create_benin_republic
# from apps.dashboard.layers_builders.nursery_location_recommandation import (
#     get_number_of_nurseries,
#     get_plantations_details,
# )
# from apps.dashboard.models import Country
# from apps.dashboard.scripts.get_qar_information import (
#     get_qar_data_from_db,
# )
# from apps.dashboard.scripts.get_training_information import get_training_data_from_db
# from apps.dashboard.scripts.nursery_location_recommandations import (
#     generate_recommandation_file,
# )
# from apps.dashboard.maps_builders.map_utils import MAP_LAYER_TYPE, load_map_datas

# ACTIVE = 1

# common_layers_countries_list = Country.objects.filter(status=ACTIVE)
# benin_country = Country.objects.filter(status=ACTIVE, country_name="Benin")

# current_qars = {}
# current_trainings = {}
# current_benin_colored_commune_layer = {}
# current_benin_colored_department_layer = {}
# current_benin_commune_layer = {}
# current_benin_department_layer = {}
# current_benin_district_layer = {}
# current_benin_protected_area_layer = {}
# current_benin_republic_layer = {}
# plantations_details = {}
# nursery_number = {}

# for country in common_layers_countries_list:
#     print(f"Building for {country.country_name}")

#     # generate_recommandation_file(country.country_name)

#     current_qars[country.country_name] = get_qar_data_from_db(country)

#     plantations_details[country.country_name] = get_plantations_details(country)

#     nursery_number[country.country_name] = get_number_of_nurseries(
#         country, plantations_details
#     )

#     current_benin_commune_layer[country.country_name] = create_country_commune(
#         current_qars[country.country_name],
#         country,
#         plantations_details,
#         nursery_number,
#     )

#     current_benin_department_layer[country.country_name] = create_benin_department(
#         current_qars[country.country_name], country
#     )

#     current_benin_district_layer[country.country_name] = create_benin_district(country)

#     current_benin_protected_area_layer[
#         country.country_name
#     ] = create_benin_protected_area(country)

#     current_benin_republic_layer[country.country_name] = create_benin_republic(
#         current_qars[country.country_name], country
#     )
#     print(f"Done mapping for {country.country_name}")

# for country in benin_country:
#     print(f"Building specific for {country.country_name}")
#     current_trainings[country.country_name] = get_training_data_from_db(
#         country.country_name
#     )

#     current_benin_colored_commune_layer[
#         country.country_name
#     ] = create_country_colored_commune(country.country_name)

#     current_benin_colored_department_layer[
#         country.country_name
#     ] = create_country_colored_department(country.country_name)

#     print(f"Done mapping specific for {country.country_name}")