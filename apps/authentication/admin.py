# your models here.
from django.contrib import admin
from apps.authentication import models


models_list = [
    models.RemUserAccessRequest,
    models.RemOrganization,
    models.RemRole,
    models.RemUser,
]
admin.site.register(models_list)
