from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)

app = Celery("cajulab_remote_sensing_dashboard")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    "periodic_force_gee": {
        "task": "apps.dashboard.tasks.py.periodic_force_gee",
        "schedule": crontab(hour="*/12"),
    },
}
