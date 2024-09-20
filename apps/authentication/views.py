# -*- encoding: utf-8 -*-
import datetime
import logging
import os

from django.contrib.auth import authenticate, login
from django.contrib.auth import logout

from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage
from django.http import HttpResponse
from django.http import HttpRequest
from django.contrib import messages

# Create your views here.
from django.shortcuts import render, redirect
from django.db.models import Q
from django.template import loader
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.translation import gettext
from apps.authentication.decorators import (
    has_admin_and_superuser_role,
    logout_required,
)
import secrets
import string
from apps.dashboard.forms import UserCustomProfileForm

from . import forms as custom_forms
from .forms import *
from .forms import RequestAccessForm, LoginForm
from .models import RemUser, RemRolesList
from .utils import account_activation_token
from django.db import transaction
import traceback

logger = logging.getLogger(__name__)


def signin(request):
    msg = None
    if request.user.is_authenticated:
        next_url = request.GET.get("next", "/dashboard/")
        return redirect(next_url)

    elif request.method == "POST":
        form = LoginForm(data=request.POST or None)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            remember_me = form.cleaned_data.get("remember_me")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if remember_me:
                    request.session.set_expiry(604800)
                next_url = request.GET.get("next", "/dashboard/")
                return redirect(next_url)
            else:
                messages.warning(request, "Invalid credentials")
                msg = gettext("Invalid credentials")

        else:
            messages.error(request, str(form.errors))
            msg = str(form.errors)  # 'Error validating the form'
    else:
        form = LoginForm()

    return render(
        request,
        "authentication/login.html",
        {"form": form, "msg": msg, "segment": "login"},
    )


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def user_list(request: HttpRequest):
    """
    You only manage users that belong to your organization or whom are assigned
    """
    rem_user: RemUser = RemUser.objects.get(user=request.user)

    # If global admin get all
    if rem_user.role.role_name == RemRolesList.GLOBAL_ADMIN:
        users = RemUser.objects.all().exclude(user__username=request.user.username)

    # If country admin
    # Can't fetch global admins
    elif rem_user.role.role_name == RemRolesList.COUNTRY_ADMIN:
        users = RemUser.objects.filter(
            Q(country_id__in=rem_user.country_id.all()),
        ).exclude(
            Q(user__username=request.user.username)
            | Q(role__role_name=RemRolesList.GLOBAL_ADMIN)
        )

    else:
        users = RemUser.objects.filter(user__username=request.user.username)

    return render(request, "authentication/user_list.html", {"users": users})


def __get_user_nearby_admins__(access_request: RemUserAccessRequest) -> list[RemUser]:
    """
    When provided access request, decides the users who can act as admins for a certain user
    If a user has direct admins
    """
    country_admins = RemUser.objects.filter(
        Q(country_id__in=access_request.country_id.all())
        & Q(role__role_name=RemRolesList.COUNTRY_ADMIN)
    )
    global_admins = RemUser.objects.filter(role__role_name=RemRolesList.GLOBAL_ADMIN)

    if len(country_admins) > 0:
        return country_admins

    else:
        return global_admins


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def admin_register_user(request: HttpRequest):
    msg = None
    success = False

    try:
        if request.method == "POST":
            form = RegisterUserForm(request.POST, user=request.user)

            if form.is_valid():
                password_characters = (
                    string.ascii_letters + string.digits + string.punctuation
                )
                password_length = 10  # You can adjust the length as needed
                random_password = "".join(
                    secrets.choice(password_characters) for i in range(password_length)
                )

                form.cleaned_data["password1"] = random_password
                form.cleaned_data["password2"] = random_password

                user: User = form.save(commit=False)
                user.is_active = True
                email = form.cleaned_data.get("email")
                phone = form.cleaned_data.get("phone")
                organization = form.cleaned_data.get("organization")
                organization_name = form.cleaned_data.get("organization_name")
                country_id = form.cleaned_data.get("country_id")
                role = form.cleaned_data.get("role")

                try:
                    user.save()
                    new_rem_user: RemUser = RemUser.objects.get(user=user)
                    current_site = get_current_site(request)
                    mail_subject = gettext(
                        "Activate your Cashew Remote Sensing account."
                    )
                    message = loader.get_template(
                        "authentication/access_granted_email.html"
                    ).render(
                        {
                            "user": user,
                            "domain": current_site.domain,
                            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                            "token": account_activation_token.make_token(user),
                        }
                    )
                    to_email = user.email
                    email = EmailMessage(
                        mail_subject,
                        message,
                        from_email='"Caju-Lab Support" <'
                        + os.getenv("EMAIL_HOST_USER")
                        + ">",
                        to=[to_email],
                    )
                    email.content_subtype = "html"
                    email.send()
                    msg = gettext("User registration was successfull!")
                    success = True
                    # Assign new_rem user the other fields values
                    new_rem_user.phone = phone
                    new_rem_user.organization = organization
                    new_rem_user.organization_name = organization_name
                    new_rem_user.role = role
                    new_rem_user.country_id.clear()
                    # Set the new country_id relationships
                    for country in country_id:
                        new_rem_user.country_id.add(country)
                    new_rem_user.save()

                    messages.success(request, "Registration successful!")

                except Exception as e:
                    traceback.print_exc()
                    messages.warning(request, "Form is not valid")
                    msg = gettext("Form is not valid")

            else:
                print(form.errors.as_json)
                print(form.cleaned_data)
                messages.warning(request, "Form is not valid")
                msg = gettext("Form is not valid")
        else:
            form = RegisterUserForm(user=request.user)
        return render(
            request,
            "authentication/admin_register_user.html",
            {"form": form, "msg": msg, "success": success},
        )

    except Exception as e:
        traceback.print_exc()
        msg = gettext("An Error has Occurred")
        return render(
            request,
            "authentication/admin_register_user.html",
            {"form": form, "msg": msg, "success": False},
        )


@logout_required
@transaction.atomic
def request_access(request: HttpRequest):
    """
    Formely signup now request access
    """
    msg = None
    success = False

    fullpage = True
    form = RequestAccessForm(page_type="registration_page")
    print(f"Is register form valid: {form.is_valid()}")
    try:
        if request.method == "POST":
            # Request is POST
            form = RequestAccessForm(request.POST, page_type="registration_page")
            print(f"Is register form valid: {form.is_valid()}")
            if form.is_valid():
                print(form.cleaned_data)
                access_request: RemUserAccessRequest = form.save()
                first_name = form.cleaned_data.get("email")
                print(access_request.pk)
                try:
                    mail_subject = gettext(f"New access request from {first_name}.")
                    current_site = get_current_site(request)
                    message = loader.get_template(
                        "authentication/access_request_email.html"
                    ).render(
                        {
                            "access_request": access_request,
                            "id": access_request.pk,
                            "domain": current_site.domain,
                        }
                    )
                    # TODO (Done) get emails to send this notifications to
                    to_admins = __get_user_nearby_admins__(access_request)
                    to_emails = [admin.user.email for admin in to_admins]

                    access_request.save()
                    email = EmailMessage(
                        mail_subject,
                        message,
                        from_email='"Caju-Lab Support" <'
                        + os.getenv("EMAIL_HOST_USER")
                        + ">",
                        to=to_emails,
                    )
                    email.content_subtype = "html"
                    email.send()
                    msg = gettext("Access request sent succesfully, wait for approval!")
                    success = True
                    messages.success(request, msg)

                except Exception as e:
                    print(e)
                    messages.warning(request, "Form is not valid")
                    msg = gettext("Form is not valid")

            else:
                messages.warning(request, "Form is not valid")
                msg = gettext("Form is not valid")

        return render(
            request,
            "authentication/request_access.html",
            {"form": form, "msg": msg, "success": success, "fullpage": fullpage},
        )

    except Exception as e:
        print(e)
        msg = gettext("An Error has Occurred")
        return render(
            request,
            "authentication/request_access.html",
            {"form": form, "msg": msg, "success": False, "fullpage": fullpage},
        )


from django.db.models import Q, Count


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def access_requests(request: HttpRequest):
    """
    You only manage access requests that belong to your organization or whom are assigned
    """
    rem_user: RemUser = RemUser.objects.get(user=request.user)

    # If global admin get all
    if rem_user.role.role_name == RemRolesList.GLOBAL_ADMIN:
        requests = RemUserAccessRequest.objects.all()

    # If country admin
    # only see requests for your country only, not if countries being requested are more than one
    elif rem_user.role.role_name == RemRolesList.COUNTRY_ADMIN:
        requests = RemUserAccessRequest.objects.annotate(
            country_count=Count("country_id")
        ).filter(Q(country_id__in=rem_user.country_id.all()) & Q(country_count=1))
    else:
        requests = RemUserAccessRequest.objects.filter(
            user__username=request.user.username
        )

    return render(
        request,
        "authentication/access_requests_list.html",
        {"access_requests": requests.order_by("-created_at")},
    )


def __create_user_from_request__(access_req: RemUserAccessRequest):
    """
    Creates a new user from the access request
    """
    with transaction.atomic():
        # Define the characters that can be used in the random password
        password_characters = string.ascii_letters + string.digits + string.punctuation
        # Set the length of the random password
        password_length = 10  # You can adjust the length as needed
        # Generate a random password
        random_password = "".join(
            secrets.choice(password_characters) for i in range(password_length)
        )

        new_user = User.objects.create(
            username=access_req.username,
            email=access_req.email,
            first_name=access_req.first_name,
            last_name=access_req.last_name,
            is_active=True,
        )
        new_user.set_password(random_password)
        new_user.save()

        # Assign new_rem user the other fields values
        new_rem_user = RemUser.objects.get(user=new_user)
        new_rem_user.phone = access_req.phone
        new_rem_user.organization = access_req.organization
        new_rem_user.organization_name = access_req.organization_name
        new_rem_user.role = RemRole.objects.get(role_name=RemRolesList.NORMAL_USER)
        new_rem_user.country_id.clear()
        # Set the new country_id relationships
        for country in access_req.country_id.all():
            new_rem_user.country_id.add(country)
        new_rem_user.save()

        return new_rem_user


def __change_access_request__(
    access_req: RemUserAccessRequest,
    request: HttpRequest,
    id: int,
    status: int,
    comment: str = "",
):
    try:
        current_site = get_current_site(request)
        """On deny, deny and notify, on accept accept, create user and notify"""
        if status == RemUserAccessRequest.APPROVED:
            access_req.status = RemUserAccessRequest.APPROVED
            rem_user = __create_user_from_request__(access_req)
            user = User.objects.get(email=rem_user.user.email)
            access_req.status = RemUserAccessRequest.APPROVED
            mail_subject = gettext(f"Accepted request for access.")
            message = loader.get_template(
                "authentication/access_granted_email.html"
            ).render(
                {
                    "user": user,
                    "domain": current_site.domain,
                    "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                    "token": account_activation_token.make_token(user),
                }
            )
        elif status == RemUserAccessRequest.FAILED:
            access_req.status = RemUserAccessRequest.FAILED
            access_req.comment = comment
            mail_subject = gettext(f"Denied request for access.")
            message = loader.get_template(
                "authentication/access_denied_email.html"
            ).render(
                {
                    "access_request": access_req,
                    "id": access_req.pk,
                    "domain": current_site.domain,
                }
            )

        access_req.save()

        email = EmailMessage(
            mail_subject,
            message,
            from_email='"Caju-Lab Support" <' + os.getenv("EMAIL_HOST_USER") + ">",
            to=[access_req.email],
        )
        email.content_subtype = "html"
        email.send()

    except Exception as e:
        traceback.print_exc()
        raise e


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def view_access_request(request: HttpRequest, id):
    try:
        status = int(request.GET.get("status"))
        comment = request.GET.get("comment")
    except:
        status = None
        comment = None
        success = True

    try:
        access_request = RemUserAccessRequest.objects.get(id=id)
        msg = ""
        if status and status in [1, 2] and access_request.status == 0:
            try:
                __change_access_request__(
                    access_req=access_request,
                    request=request,
                    id=id,
                    status=status,
                    comment=comment,
                )
                msg = "Successfully replied."
                success = True
            except:
                traceback.print_exc()
                msg = "Could not process the request"
                success = False

        elif access_request.status != 0:
            success = False
            msg = "Access request was already responded to."

    except:
        access_request = None
        msg = "Access request was not found"
        success = False
        # return redirect()

    # refetch the access request to update it
    try:
        access_request = RemUserAccessRequest.objects.get(id=id)
    except:
        pass

    form = RequestAccessForm(instance=access_request)

    # Every field in the access request form is disabled by default
    for key in form.fields.keys():
        form.fields[key].disabled = True
    return render(
        request,
        "authentication/access_request_view.html",
        {
            "access_request": access_request,
            "form": form,
            "success": success,
            "msg": msg,
        },
    )


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def modify_user(request: HttpRequest, id):
    msg = None
    success = False
    authenticated_user: RemUser = request.user.remuser
    # user fetching
    # global admin can access other global admins and below
    # But country admins can only access themselves and below in their countries
    try:
        if authenticated_user.role.role_name == RemRolesList.GLOBAL_ADMIN:
            user: RemUser = RemUser.objects.get(id=id)
        else:
            user: RemUser = RemUser.objects.get(
                Q(id=id)
                & Q(country_id__in=authenticated_user.country_id.all())
                & ~Q(role__role_name=RemRolesList.GLOBAL_ADMIN)
            )

    except:
        messages.info(request, "User doesn't exist.")
        return redirect("/user_list")

    user_organization_type = user.organization.organization_name
    organization_name = user.organization_name
    user_countries = user.country_id.all()
    user_role_name = user.role.role_name
    user_phone = user.phone

    if request.method == "POST":
        form = UserCustomProfileForm(
            request.POST,
            instance=user,
            user=request.user,
            user_phone=user_phone,
            page="modify_user",
        )

        if form.is_valid():
            information = {
                "organization_name": [
                    form.cleaned_data.get("organization_name"),
                    organization_name,
                ],
                "organization": [
                    form.cleaned_data.get("organization").organization_name,
                    user_organization_type,
                ],
                "country": [
                    ", ".join(
                        [
                            country.country_name
                            for country in form.cleaned_data.get("country_id")
                        ]
                    ),  # changed
                    ", ".join([country.country_name for country in user_countries]),
                ],
                "role": [
                    form.cleaned_data.get("role").role_name,
                    user_role_name,
                ],
            }

            informations = {}
            print(form.cleaned_data.get("organization_name"))
            print(user.organization_name)

            for key, value in information.items():
                if value[0] is not None and value[0] != value[1]:
                    informations[key] = value
            if informations:
                form.save()
                user.save()
                current_site = get_current_site(request)
                mail_subject = gettext("Account details updated.")
                message = loader.get_template("authentication/user_email.html").render(
                    {
                        "user": None,
                        "domain": current_site.domain,
                        "informations": informations,
                        "title": "Account informations updated",
                        "body": f"{user.user.username}, your account information has been updated by {request.user.first_name} {request.user.last_name}.",
                    }
                )
                to_email = user.user.email
                email = EmailMessage(
                    mail_subject,
                    message,
                    from_email='"Caju-Lab Support" <'
                    + os.getenv("EMAIL_HOST_USER")
                    + ">",
                    to=[to_email],
                )
                email.content_subtype = "html"
                email.send()
            messages.success(request, "Informations saved succesfully!")
            return redirect("modify_user", id=id)
        else:
            print(form.errors)
            messages.warning(request, "Form is not valid")
            msg = gettext("Form is not valid")
    else:
        form = UserCustomProfileForm(
            instance=user,
            user=request.user,
            user_phone=user_phone,
            page="modify_user",
        )

    args = {
        "user": user,
        "form": form,
        "msg": msg,
        "success": success,
        "segment": "profile",
    }
    return render(request, "authentication/modify_user.html", args)


@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
    ]
)
def activate_deactivate_user(request, id):
    user = User.objects.get(id=id)
    if user.is_active == True:
        user.is_active = False
        status = False
    else:
        user.is_active = True
        status = True

    user.save()
    current_site = get_current_site(request)
    mail_subject = gettext("Account status updated.")
    message = loader.get_template("authentication/user_email.html").render(
        {
            "user": None,
            "domain": current_site.domain,
            "informations": None,
            "title": "Account informations updated",
            "body": f"{user.username}, your account has been {'activated' if status else 'deactivated'} by {request.user.first_name} {request.user.last_name}.",
        }
    )
    to_email = user.email
    email = EmailMessage(
        mail_subject,
        message,
        from_email='"Caju-Lab Support" <' + os.getenv("EMAIL_HOST_USER") + ">",
        to=[to_email],
    )
    email.content_subtype = "html"
    email.send()

    return redirect("/user_list/")


def signout(request):
    logout(request)
    msg = None

    if request.method == "POST":
        form = LoginForm(data=request.POST or None)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            remember_me = form.cleaned_data.get("remember_me")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if remember_me:
                    request.session.set_expiry(604800)
                return redirect("/")
            else:
                msg = gettext("Invalid credentials")

        else:
            msg = str(form.errors)  # 'Error validating the form'
    else:
        form = LoginForm()

    return redirect("/")


def forgot_password(request):
    msg = None
    success = False

    if request.method == "POST":
        form = custom_forms.ForgotPassword(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"]
            user = User.objects.get(email=email)

            current_site = get_current_site(request)
            mail_subject = gettext("Reset your Password")
            message = loader.get_template(
                "authentication/password_reset_email.html"
            ).render(
                {
                    "user": user,
                    "domain": current_site.domain,
                    "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                    "token": account_activation_token.make_token(user),
                }
            )
            # message = render_to_string('authentication/acc_active_email.html', {
            #     'user': user,
            #     'domain': current_site.domain,
            #     'uid':urlsafe_base64_encode(force_bytes(user.pk)),
            #     'token':account_activation_token.make_token(user),
            # })
            to_email = form.cleaned_data.get("email")
            email = EmailMessage(
                mail_subject,
                message,
                from_email='"Caju-Lab Support" <cajusupport@tnslabs.org>',
                to=[to_email],
            )
            email.content_subtype = "html"

            email.send()

            msg = gettext(f"Please check your {to_email} inbox")
            success = True
            messages.info(request, "Email sent")
            # return HttpResponse('Please confirm your email address to complete the registration')
        else:
            messages.warning(request, "Form is not valid")
            msg = gettext("Form is not valid")
    else:
        form = custom_forms.ForgotPassword()
    return render(
        request,
        "authentication/password_reset_form.html",
        {"form": form, "msg": msg, "success": success},
    )


def password_reset_confirm(request, uidb64, token):
    context = {}
    try:
        # uid = force_str(urlsafe_base64_decode(uidb64))
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        msg = None
        success = False

        if request.method == "POST":
            form = custom_forms.NewPassword(request.POST)

            if form.is_valid():
                password = form.cleaned_data.get("password")
                user.set_password(password)

                user.save()

                msg = gettext("Password change successful. Now you can")
                messages.success(request, "Password change successful!")
                success = True
                # return HttpResponse('Please confirm your email address to complete the registration')
            else:
                messages.warning(request, "Form is not valid")
                msg = gettext("Form is not valid")
        else:
            form = custom_forms.NewPassword()
        return render(
            request,
            "authentication/new_password.html",
            {"form": form, "msg": msg, "success": success},
        )
    else:
        html_template = loader.get_template(
            "authentication/password_change_failed.html"
        )
        return HttpResponse(html_template.render(context, request))


def activate(request, uidb64, token):
    context = {}
    try:
        # uid = force_str(urlsafe_base64_decode(uidb64))
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as f:
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        try:
            informations = {
                "Username": user.username,
                "Firstname": user.first_name,
                "Lastname": user.last_name,
                "Email": user.email,
            }
            current_site = get_current_site(request)
            mail_subject = gettext("A new TNS user registered")
            message = loader.get_template("authentication/user_email.html").render(
                {
                    "user": user,
                    "domain": current_site.domain,
                    "informations": informations,
                    "title": "A new TNS user registered",
                    "body": "Below user's details:",
                }
            )
            rem_user: RemUser = user.remuser
            to_email = [
                admin.user.email
                for admin in RemUser.objects.filter(
                    Q(role__role_name=RemRolesList.GLOBAL_ADMIN)
                    | (
                        Q(role__role_name=RemRolesList.COUNTRY_ADMIN)
                        & Q(country_id__in=rem_user.country_id.all())
                    )
                )
            ]
            email = EmailMessage(
                mail_subject,
                message,
                from_email='"Caju-Lab Support" <' + os.getenv("EMAIL_HOST_USER") + ">",
                to=to_email,
            )
            email.content_subtype = "html"
            email.send()
        except Exception as e:
            print(e)
            pass
        user.save()
        html_template = loader.get_template("authentication/email_confirmed.html")
        return HttpResponse(html_template.render(context, request))
    else:
        html_template = loader.get_template("authentication/email_confirm_invalid.html")
        return HttpResponse(html_template.render(context, request))
