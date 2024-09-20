import functools
from django.shortcuts import redirect
from django.contrib import messages
from django.http.request import HttpRequest
from apps.authentication.models import RemUser


def has_admin_and_superuser_role(roles_list: list):
    def decorator(view_func, redirect_url="/"):
        @functools.wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            if request.user.is_authenticated:
                rem_user: RemUser = request.user.remuser
                if rem_user.role.role_name in roles_list:
                    return view_func(request, *args, **kwargs)

            messages.info(request, "You don't have access to this page")
            print("You don't have access to this page")
            return redirect(redirect_url)

        return wrapper

    return decorator


def logout_required(view_func, redirect_url="/"):
    """
    Requires a user to be logged out to access the attached function
    """

    @functools.wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        messages.info(request, "You must logout to access this page")
        print("You must logout to access this page")
        return redirect(redirect_url)

    return wrapper
