from django import template

from apps.authentication.models import RemUser
from apps.dashboard.models import Country

register = template.Library()


@register.filter
def index(indexable, i):
    return indexable[i]


@register.filter
def user_role(object):
    return RemUser.objects.get(user=object).role.role_name


@register.filter
def active_map_site(status: int):
    return Country.objects.filter(status=status)


@register.filter
def check_list(value, string):
    if value in string.split(","):
        return True
    else:
        return False
