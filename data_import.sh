#!/bin/bash
while getopts C: flag
do
    case "${flag}" in
        C) country=${OPTARG};;
    esac
done
python manage.py makemigrations --skip-checks
python manage.py migrate --skip-checks

# setup scripts
python ./scripts/data_import_scripts/add_country.py $country && 


# data compute scripts
python ./scripts/data_compute_scripts/build_satellite_prediction_computed_data.py $country && 
python ./scripts/data_compute_scripts/nursery_location_recommandations.py $country && 
python ./scripts/data_compute_scripts/tree_spacing_recommandations.py $country && 


python ./scripts/data_import_scripts/add_organization_and_role.py
python ./scripts/data_import_scripts/import_alteia_data.py $country && 
python ./scripts/data_import_scripts/import_nurseries.py $country && 
python ./scripts/data_import_scripts/import_plantations.py $country && 
python ./scripts/data_import_scripts/import_satellite_data.py $country && 
python ./scripts/data_import_scripts/import_training.py $country

# cp ./apps/dashboard/scripts/build_satellite_prediction_computed_data.py . && 
python build_satellite_prediction_computed_data.py $country 
&& rm build_satellite_prediction_computed_data.py

# python ./apps/dashboard/scripts/tree_spacing_recommandations.py $country
