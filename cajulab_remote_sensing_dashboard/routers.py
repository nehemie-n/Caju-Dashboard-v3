from django.contrib.auth.models import AbstractUser
from django.db import models


class AuthRouter:
    def db_for_read(self, model: models.Model, **hints):
        if (
            model._meta.app_label == "auth"
            or model._meta.app_label == "contenttypes"
        ):
            return "default"
        return None

    def db_for_write(self, model, **hints):
        if (
            model._meta.app_label == "auth"
            or model._meta.app_label == "contenttypes"
        ):
            return "default"
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == "auth" or app_label == "contenttypes":
            return db == "default"
        return None
