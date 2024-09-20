"""Gunicorn *production* config file"""

import django
import os

os.environ["DJANGO_SETTINGS_MODULE"] = "cajulab_remote_sensing_dashboard.settings"
django.setup()

from apps.dashboard.models import Country
from apps.dashboard.maps_builders.map_utils import (
    build_outdated_layer,
    check_outdated_layer,
)
import multiprocessing
from dotenv import load_dotenv, find_dotenv


load_dotenv(find_dotenv())

# Django WSGI application path in pattern MODULE_NAME:VARIABLE_NAME
# wsgi_app = "cajulab_remote_sensing_dashboard.wsgi:application"
asgi_app = "cajulab_remote_sensing_dashboard.asgi:application"
# The number of worker processes for handling requests
workers = multiprocessing.cpu_count() * 2 + 1
# The socket to bind
env = os.getenv("DJANGO_ENV", "local")
if env == "production":
    bind = "0.0.0.0:8001"
else:
    bind = "0.0.0.0:8000"
# Write access and error info to /var/log
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
# Redirect stdout/stderr to log file
capture_output = True
# PID file so you can easily fetch process ID
pidfile = "/var/run/gunicorn/prod.pid"
# Daemonize the Gunicorn process (detach & enter background)
daemon = True
# Workers silent for more than this many seconds are killed and restarted
timeout = 60
