#!/usr/bin/env python3
import os
import sys
import django
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.realpath(__name__))
sys.path.append(BASE_DIR)
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "cajulab_remote_sensing_dashboard.settings"
)
django.setup()

from apps.authentication import models
from django.db import connections


def insert_organizations(db):
    # List of record tuples to insert into the table
    values = [
        # (1, "TECHNOSERVE", "tns.org", 1),
        (2, "GOVERNMENT", 1),
        (3, "ACADEMIA", 1),
        (4, "NON-PROFIT", 1),
        (5, "PRIVATE SECTOR", 1),
        (6, "OTHER", 1),
    ]
    for v in values:
        models.RemOrganization.objects.using(db).create(
            id=v[0], organization_name=v[1], status=v[2]
        )


def insert_roles(db):
    # List of record tuples to insert into the table
    values = [
        (1, "OTHER", 1),
        (2, "GOV-STAFF", 1),
        (3, "GOV-ADMIN", 1),
        (4, "TNS-STAFF", 1),
        (5, "TNS-ADMIN", 1),
        (6, "ADMIN", 1),
    ]
    for v in values:
        models.RemRole.objects.using(db).create(id=v[0], role_name=v[1], status=v[2])


def insert_datas():
    # TODO improve should only populate default DB
    for db in connections:
        try:
            insert_organizations(db)
            insert_roles(db)
            print(f"Using {db} connection insert_datas worked.")
        except:
            print(f"Using {db} connection insert_datas failed.")


if __name__ == "__main__":
    insert_datas()
