# your models here.
from django.contrib import admin
from apps.dashboard import models


models_list = [
    models.Country,
    models.GAUL1,
    models.GAUL2,
    models.GAUL3,
    models.ProtectedArea,
    models.Nursery,
    models.NurseryPlantsHistory,
    models.MotherTree,
    models.Plantation,
    models.BeninYield,
    models.AlteiaData,
    models.DeptSatellite,
    models.CommuneSatellite,
    models.SpecialTuple,
    models.Trainer,
    models.TrainingModule,
    models.Training,
]
admin.site.register(models_list)
