# -*- encoding: utf-8 -*-
"""
Copyright (c) 2020 - Technoserve
"""

from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save
from apps.dashboard.models import Country
from django.core.exceptions import FieldDoesNotExist
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.auth.validators import UnicodeUsernameValidator

# Create your models here.
"""
Organization related choices and fields
"""


class RemOrganizationList:
    GOVERNMENT = "GOVERNMENT"
    ACADEMIA = "ACADEMIA"
    NON_PROFIT = "NON-PROFIT"
    PRIVATE_SECTOR = "PRIVATE SECTOR"
    OTHER = "OTHER"


organization_types = [
    ("GOVERNMENT", "Government"),
    ("ACADEMIA", "Academia"),
    ("NON-PROFIT", "Non-Profit"),
    ("PRIVATE SECTOR", "Private Sector"),
    ("OTHER", "Other"),
]
ACTIVE = 1
INACTIVE = 0
Status = [
    (ACTIVE, "Active"),
    (INACTIVE, "Inactive"),
]


def get_default_user_org():
    """get a default value for user organization; create new organization if not available"""
    try:
        return RemOrganization.objects.get(organization_name="OTHER").pk
    except:
        return None


class RemOrganization(models.Model):
    """
    Organization types
    """

    organization_name = models.CharField(max_length=200, unique=True)
    status = models.IntegerField(
        choices=Status,
        default=ACTIVE,
    )

    def __str__(self):
        return self.organization_name


"""


"""


def get_default_user_role():
    """get a default value for user role; create new role if not available"""
    return RemRole.objects.get(role_name=RemRolesList.NORMAL_USER).pk


class RemRolesList:
    GLOBAL_ADMIN = "GLOBAL-ADMIN"
    COUNTRY_ADMIN = "COUNTRY-ADMIN"
    SUPERUSER = "SUPERUSER"
    NORMAL_USER = "NORMAL-USER"


class RemRole(models.Model):
    ACTIVE = 1
    INACTIVE = 0
    Status = [
        (ACTIVE, "Active"),
        (INACTIVE, "Inactive"),
    ]
    Roles = [
        ("GLOBAL-ADMIN", "Global Admin"),
        ("COUNTRY-ADMIN", "Country Admin"),
        ("SUPERUSER", "Superuser"),
        ("NORMAL-USER", "Normal-User"),
    ]
    role_name = models.CharField(
        max_length=200,
        choices=Roles,
        default="NORMAL-USER",
    )
    status = models.IntegerField(
        choices=Status,
        default=ACTIVE,
    )

    def __str__(self):
        return self.role_name


class RemUserManager(models.Manager):
    pass


"""

"""


def get_default_user_countries():
    """get a default value for user country; create new country if not available"""
    return [Country.objects.get(country_name="Ivory Coast")]


class RemUser(models.Model):
    """
    Stores information about a user with reference to the original django user model
    """

    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    phone = PhoneNumberField(max_length=17, blank=True)
    organization = models.ForeignKey(
        RemOrganization,
        on_delete=models.CASCADE,
        default=get_default_user_org,
    )
    organization_name = models.CharField(max_length=250, blank=False, null=True)

    # TODO (Done) a user can have access to one or many countries
    country_id = models.ManyToManyField(
        Country,
        default=get_default_user_countries,
    )
    role = models.ForeignKey(
        RemRole, on_delete=models.CASCADE, default=get_default_user_role
    )
    objects = RemUserManager()

    def __str__(self):
        return self.user.username


class RemUserAccessRequest(models.Model):
    """
    Stores information about a user's request to access the platform
    """

    USER_ACCESS_STATUS = [(0, "Pending"), (1, "Approved"), (2, "Failed")]
    PENDING = 0
    APPROVED = 1
    FAILED = 2

    # copy pasted django Abstract User username validation  and fields
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        _("username"),
        max_length=150,
        unique=True,
        help_text=_(
            "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
        validators=[username_validator],
        error_messages={
            "unique": _("A user with that username already exists."),
        },
        null=False,
    )
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    email = models.EmailField(blank=False, null=False)

    # Other fields as they appear in RemUse
    phone = PhoneNumberField(
        max_length=17,
        blank=True,
        null=False,
    )
    organization = models.ForeignKey(
        RemOrganization,
        on_delete=models.CASCADE,
        default=get_default_user_org,
    )
    organization = models.ForeignKey(
        RemOrganization,
        on_delete=models.CASCADE,
        default=get_default_user_org,
        blank=False,
        null=False,
    )
    organization_name = models.CharField(max_length=250, blank=False, null=False)

    country_id = models.ManyToManyField(
        Country,
        default=get_default_user_countries,
    )
    reason = models.TextField(
        max_length=1000,
        blank=False,
        null=False,
    )
    # Comment from admin on either deny or accept
    comment = models.TextField(
        max_length=1000,
        blank=True,
        null=True,
    )
    status = models.IntegerField(
        choices=USER_ACCESS_STATUS,
        default=PENDING,
        blank=False,
        null=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email


def create_remuser(sender, **kwargs):
    if kwargs["created"]:
        rem_user = RemUser.objects.create(user=kwargs["instance"])


post_save.connect(create_remuser, sender=User)


@classmethod
def model_field_exists(cls, field):
    try:
        cls._meta.get_field(field)
        return True
    except FieldDoesNotExist:
        return False


models.Model.field_exists = model_field_exists
