import collections
import csv
import io
import json
import os
from datetime import datetime, timedelta, date, time
from apps.authentication.decorators import has_admin_and_superuser_role
from apps.dashboard.utils import (
    extract_unique_names,
    get_commune_info,
    get_data_based_on_role,
    get_department_sum_list,
    get_info_from_database,
)
from cajulab_remote_sensing_dashboard import settings

import xlwt
from django.contrib import messages
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from django.http import HttpResponse, FileResponse, HttpResponseBadRequest, JsonResponse
from django.http import HttpRequest
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.template import loader
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.translation import gettext
from django.views import generic
from reportlab.lib import colors
from reportlab.lib.pagesizes import A2, A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    TableStyle,
    SimpleDocTemplate,
    Table,
    Paragraph,
    Spacer,
    Image,
)

from apps.authentication import utils
from apps.authentication.models import (
    RemOrganization,
    RemOrganizationList,
    RemRole,
    RemUser,
    RemRolesList,
    Country,
)
from django.core.exceptions import ObjectDoesNotExist
from apps.dashboard import models
from apps.authentication.forms import RegisterRole, RequestProfileChangeForm
from apps.dashboard.forms import (
    CountryChoice,
    UserCustomProfileForm,
    UserBaseProfileForm,
    KorDateForm,
    DepartmentChoice,
    NurserySearch,
    BeninYieldSearch,
    PlantationsSearch,
    TrainingSearch,
    CommuneChoice,
)
from shapely import MultiPolygon
import geopandas as gpd
from io import BytesIO
import pandas as pd
import numpy as np
from django.db import transaction, IntegrityError, DataError
from apps.dashboard.map_views import build_layers_cache_per_country
from .db_conn_string import (
    __mysql_disconnect__,
    __close_ssh_tunnel__,
    __open_ssh_tunnel__,
    __mysql_connect__,
)
from scripts.data_compute_scripts.build_satellite_prediction_computed_data import (
    satellite_prediction_computed_data_file,
)
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis import geos
from apps.dashboard import utils as uti

CORE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
all_paper_params = [
    {
        "type": "A2",
        "first_logo_x": 3.125,
        "first_logo_y": 0.865,
        "second_logo_x": 3.125,
        "second_logo_y": 0.427,
        "create_date_x": 21.67,
        "create_date_y": 0.65,
        "page_footer_logo_x": 1,
        "page_footer_logo_y": 0.60,
        "page_footer_logo_width": 0.307,
        "page_footer_logo_height": 0.307,
        "page_footer_line_x": 0.5,
        "page_footer_line_y": 0.5,
        "page_footer_line_width": 22.9,
        "page_footer_line_height": 0.5,
        "page_number_x": 22.15,
        "page_number_y": 0.25,
    },
    {
        "type": "A4",
        "first_logo_x": 1.56,
        "first_logo_y": 0.43,
        "second_logo_x": 2.08,
        "second_logo_y": 0.28,
        "create_date_x": 10,
        "create_date_y": 0.65,
        "page_footer_logo_x": 1,
        "page_footer_logo_y": 0.60,
        "page_footer_logo_width": 0.2,
        "page_footer_logo_height": 0.2,
        "page_footer_line_x": 0.5,
        "page_footer_line_y": 0.5,
        "page_footer_line_width": 10.95,
        "page_footer_line_height": 0.5,
        "page_number_x": 10.58,
        "page_number_y": 0.25,
    },
]

from django.db import models as db_models


def get_objects(
    model: models.Plantation,
    condition=None,
    countries_select: list[models.Country] = None,
) -> dict[str, db_models.Manager]:
    """
    Given a mode ex: Plantation, filters per given condition and country searching ot selected
    """
    if countries_select is None:
        raise Exception("Should have a country filter for objects.")

    all_objects = {}

    for country in countries_select:
        query = model.objects.using(country.country_name).all()
        if condition:
            query = query.filter(condition)
        filtered_objects = query.all()
        all_objects[country.country_name] = filtered_objects

    return all_objects


def get_roles(value):
    roles_per_org = {
        "TECHNOSERVE": [RemRolesList.GLOBAL_ADMIN, RemRolesList.NORMAL_USER],
        "GOVERNMENT": [RemRolesList.COUNTRY_ADMIN, RemRolesList.NORMAL_USER],
    }
    if value in roles_per_org.keys():
        filtered_options = (
            RemRole.objects.filter(role_name__in=roles_per_org[value])
            .order_by("id")
            .values("id", "role_name")
        )
    else:
        filtered_options = RemRole.objects.filter(
            role_name=RemRolesList.NORMAL_USER
        ).values("id", "role_name")
    return filtered_options


def filter_options(request):
    is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"
    if is_ajax:
        if request.method == "POST":
            data = json.load(request)
            value = data.get("value")
            filtered = data.get("filtered")
            if filtered == "Roles":
                filtered_options = get_roles(value=value)
            elif filtered == "Organizations":
                try:
                    queryset = (
                        RemOrganization.objects.filter()
                        .order_by("id")
                        .values("id", "organization_name")
                    )
                    if queryset.exists():
                        filtered_options = {}
                        filtered_options["organizations"] = [obj for obj in queryset]
                        filtered_options["roles"] = [
                            obj
                            for obj in get_roles(queryset.first()["organization_name"])
                        ]
                        return JsonResponse(filtered_options, safe=False)
                    else:
                        filtered_options = {}
                        filtered_options["organizations"] = [
                            obj
                            for obj in RemOrganization.objects.all()
                            .order_by("id")
                            .values("id", "organization_name")
                        ]
                        filtered_options["roles"] = [obj for obj in get_roles("ALL")]
                        return JsonResponse(filtered_options, safe=False)
                except Exception as e:
                    print(e)
                    filtered_options = {}
                    filtered_options["organizations"] = [
                        obj
                        for obj in RemOrganization.objects.all()
                        .order_by("id")
                        .values("id", "organization_name")
                    ]
                    filtered_options["roles"] = [obj for obj in get_roles("ALL")]
                    return JsonResponse(filtered_options, safe=False)
            return JsonResponse(list(filtered_options), safe=False)
        return JsonResponse({"status": "Invalid request"}, status=400)
    else:
        return HttpResponseBadRequest("Invalid request")


@login_required(login_url="/")
def pages(request):
    context = {}
    # All resource paths end in .html.
    # Pick out the html file name from the url. And load that template.

    load_template = request.path.split("/")[-1]
    context["segment"] = load_template

    html_template = loader.get_template(load_template)
    return HttpResponse(html_template.render(context, request))


def error_400(request, exception):
    return render(request, "dashboard/HTTP400.html", status=400)


def error_403(request, exception):
    return render(request, "dashboard/HTTP403.html", status=403)


def error_404(request, exception):
    return render(request, "dashboard/HTTP404.html", status=404)


def error_500(request):
    return render(request, "dashboard/HTTP500.html")


@login_required(login_url="/")
def load_roles(request):
    org_id = request.GET.get("organization_name")
    roles = RemRole.objects.filter(organization=org_id)
    return render(request, "authentication/role_options.html", {"roles": roles})


@method_decorator(login_required, name="dispatch")
class EditProfilePageView(generic.UpdateView):
    form_class = UserCustomProfileForm
    template_name = "dashboard/profile.html"
    success_url = reverse_lazy("profile")

    def form_invalid(self, form):
        print(form.errors)
        if self.request.accepts("text/html"):
            return super(EditProfilePageView, self).form_invalid(form)
        else:
            return JsonResponse(form.errors, status=400)

    def form_valid(self, form):
        print(form.errors)
        return super(EditProfilePageView, self).form_valid(form)

    def get_context_data(self, *args, **kwargs):
        context = super(EditProfilePageView, self).get_context_data(**kwargs)
        context["segment"] = "profile"
        return context

    def get_object(self, queryset=None):
        print(self)
        return self.request.user


@login_required(login_url="/")
def profile(request: HttpRequest):
    msg = None
    success = False
    user = RemUser.objects.get(user=request.user)
    rem_user = user
    form = UserBaseProfileForm(
        instance=request.user,
        initial={
            "first_name": user.user.first_name,
            "last_name": user.user.last_name,
        },
    )
    request_form = RequestProfileChangeForm(
        initial={
            "organization_name": user.organization_name,
            "organization": user.organization,
            "country_id": user.country_id.all(),
            "role": user.role,
        },
        user=request.user,
    )
    custom_form = UserCustomProfileForm(
        instance=user,
        user=request.user,
        page="profile",
    )

    if request.method == "POST":
        if "request_form_btn" in request.POST:
            request_form = RequestProfileChangeForm(request.POST, user=request.user)
            if request_form.is_valid():
                informations = {
                    "Organization Name": [
                        request_form.cleaned_data.get("organization_name"),
                        user.organization_name,
                    ],
                    "Organization": [
                        request_form.cleaned_data.get("organization"),
                        user.organization.organization_name,
                    ],
                    "Country": [
                        ", ".join(
                            [
                                country.country_name
                                for country in request_form.cleaned_data.get(
                                    "country_id"
                                )
                            ]
                        ),
                        ", ".join(
                            [country.country_name for country in user.country_id.all()]
                        ),
                    ],
                    "Role": [
                        request_form.cleaned_data.get("role"),
                        user.role.role_name,
                    ],
                }

                informations = {
                    key: value
                    for key, value in informations.items()
                    if value[0] is not None and value[0] != value[1]
                }
            else:
                messages.warning(request, "Form is not valid")
                print(request_form.errors)
            if request_form.cleaned_data.get("message") != "":
                informations["Request"] = request_form.cleaned_data.get("message")

            current_site = get_current_site(request)
            mail_subject = gettext("New request")
            message = loader.get_template(
                "authentication/user_request_email.html"
            ).render(
                {
                    "user": user,
                    "informations": informations,
                    "domain": current_site.domain,
                }
            )

            country_admins = RemUser.objects.filter(
                Q(role__role_name=RemRolesList.COUNTRY_ADMIN)
                & Q(country_id__in=user.country_id.all())
            )
            global_admins = RemUser.objects.filter(
                role__role_name=RemRolesList.GLOBAL_ADMIN
            )
            if len(country_admins) != 0 and (
                informations["Organization"] == RemOrganizationList.GOVERNMENT
                or informations["Role"] == RemRolesList.COUNTRY_ADMIN
            ):
                to_email = [elmt.user.email for elmt in country_admins]
            else:
                to_email = [elmt.user.email for elmt in global_admins]
            email = EmailMessage(
                mail_subject,
                message,
                from_email=user.user.username + "<" + user.user.email + ">",
                to=to_email,
            )
            email.content_subtype = "html"
            email.send()
            messages.success(request, "Request sent sucessfully!")
        elif "user_custom_profile_form_btn" in request.POST:
            form = UserBaseProfileForm(request.POST, instance=request.user)
            custom_form = UserCustomProfileForm(
                request.POST, instance=user, user=request.user
            )
            if form.is_valid() and custom_form.is_valid():
                form.save()
                rem_user: RemUser = request.user.remuser
                rem_user.phone = custom_form.cleaned_data.get("phone")
                rem_user.save()
                messages.success(request, "Informations saved sucessfully!")
            else:
                messages.warning(request, "Form is not valid")
                print(f"form errors: {form.errors}")
                print(f"custom_form errors: {custom_form.errors}")
        else:
            messages.warning(request, "Form is not valid")
            msg = gettext("Form is not valid")

    args = {
        "form": form,
        "request_form": request_form,
        "custom_form": custom_form,
        "msg": msg,
        "success": success,
        "segment": "profile",
    }
    return render(request, "dashboard/profile.html", args)


def export_pdf(
    datas_name,
    paper_type,
    paper_format,
    title_list,
    elemts_list,
    date_from=None,
    date_to=None,
):
    buffer = io.BytesIO()
    paper_params = None
    for elemt in all_paper_params:
        if elemt["type"] == paper_type:
            paper_params = elemt

    elements = []

    # For dev env
    # TechnoserveLabs_reportlab_logo = Image(os.path.join(
    #     CORE_DIR, "static/assets/img/brand/TNS-Labs-Logov3.jpg"), paper_params['first_logo_x'] * inch,
    #                                                               paper_params['first_logo_y'] * inch)
    # BeninCaju_reportlab_logo = Image(os.path.join(
    #     CORE_DIR, "static/assets/img/brand/TNS-Labs-Logo.jpg"), paper_params['second_logo_x'] * inch,
    #                                                             paper_params['second_logo_y'] * inch)
    # For prod env
    TechnoserveLabs_reportlab_logo = Image(
        os.path.join(settings.STATIC_ROOT, "assets/img/brand/TNS-Labs-Logov3.jpg"),
        paper_params["first_logo_x"] * inch,
        paper_params["first_logo_y"] * inch,
    )
    BeninCaju_reportlab_logo = Image(
        os.path.join(settings.STATIC_ROOT, "assets/img/brand/TNS-Labs-Logo.jpg"),
        paper_params["second_logo_x"] * inch,
        paper_params["second_logo_y"] * inch,
    )
    TechnoserveLabs_reportlab_logo.hAlign = "LEFT"
    BeninCaju_reportlab_logo.hAlign = "RIGHT"
    logo_table = Table([[TechnoserveLabs_reportlab_logo, BeninCaju_reportlab_logo]])
    logo_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (0, 0), "LEFT"),
                ("VALIGN", (-1, -1), (-1, -1), "RIGHT"),
                ("LEFTPADDING", (-1, -1), (-1, -1), 100),
                ("RIGHTPADDING", (0, 0), (0, 0), 100),
            ]
        )
    )

    elements.append(logo_table)
    elements.append(Spacer(1, 12))

    sample_style_sheet = getSampleStyleSheet()
    title_style = sample_style_sheet["Heading1"]
    title_style.alignment = 1
    table_name = (
        "{0} ({1} au {2})".format(gettext(datas_name), date_from[0:10], date_to[0:10])
        if date_from and date_to
        else "{0} ({1})".format(gettext(datas_name), gettext("All"))
    )
    paragraph_1 = Paragraph(table_name, title_style)

    elements.append(paragraph_1)
    elements.append(Spacer(1, 12))

    doc = SimpleDocTemplate(
        buffer,
        title="{0}_{1}".format(
            gettext(datas_name), datetime.now().strftime("%Y_%m_%d_%I_%M_%S")
        ),
        rightMargin=72,
        leftMargin=72,
        topMargin=30,
        bottomMargin=72,
        pagesize=landscape(paper_format),
    )

    data = [(gettext(title) for title in title_list)]

    for elemt in elemts_list:
        data.append(elemt)

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
                ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.Color(green=(178 / 255), red=(20 / 255), blue=(177 / 255)),
                ),
                ("LEFTPADDING", (0, 0), (-1, 0), 15),
                ("RIGHTPADDING", (0, 0), (-1, 0), 15),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 15),
                ("TOPPADDING", (0, 0), (-1, 0), 15),
            ]
        )
    )

    elements.append(table)

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Times-Roman", 10)
        canvas.drawString(
            (
                (
                    paper_params["page_footer_logo_x"]
                    + paper_params["page_footer_logo_width"]
                )
                + 0.05
            )
            * inch,
            0.65 * inch,
            table_name,
        )
        now = datetime.now()
        create_date = "Created on " + now.strftime("%d/%m/%Y")
        canvas.drawCentredString(
            paper_params["create_date_x"] * inch,
            paper_params["create_date_y"] * inch,
            create_date,
        )
        canvas.setLineWidth(0.008 * inch)

        # For dev env
        # canvas.drawInlineImage(os.path.join(CORE_DIR, "static/assets/img/brand/TNS-Logo.jpg"),
        #                        paper_params['page_footer_logo_x'] * inch,
        #                        paper_params['page_footer_logo_y'] * inch,
        #                        paper_params['page_footer_logo_width'] * inch,
        #                        paper_params['page_footer_logo_height'] * inch)

        # For prod env
        canvas.drawInlineImage(
            os.path.join(settings.STATIC_ROOT, "assets/img/brand/TNS-Logo.jpg"),
            paper_params["page_footer_logo_x"] * inch,
            paper_params["page_footer_logo_y"] * inch,
            paper_params["page_footer_logo_width"] * inch,
            paper_params["page_footer_logo_height"] * inch,
        )

        canvas.line(
            paper_params["page_footer_line_x"] * inch,
            paper_params["page_footer_line_y"] * inch,
            paper_params["page_footer_line_width"] * inch,
            paper_params["page_footer_line_height"] * inch,
        )
        page_number_text = "%d" % (doc.page)
        canvas.drawCentredString(
            paper_params["page_number_x"] * inch,
            paper_params["page_number_y"] * inch,
            page_number_text,
        )

        canvas.restoreState()

    try:
        doc.build(
            elements,
            onFirstPage=add_page_number,
            onLaterPages=add_page_number,
        )
    except Exception as f:
        print(f)
    buffer.seek(0)
    response = FileResponse(
        buffer,
        as_attachment=True,
        filename="{0}_{1}.pdf".format(
            gettext(datas_name), datetime.now().strftime("%Y_%m_%d_%I_%M_%S")
        ),
    )
    return response


def download_yield_upload_format(request: HttpRequest):
    """
    When a user requests to download the excel format for uploading the list of yield,
    this function is called
    """

    data = {
        "country": ["Benin", "Benin"],
        "plantation_name": ["Gbe-Mam-KON-0231", None],
        "plantation_code": ["Gbe-Mam-KON-0231", "Gbe-Mam-KON-0231"],
        "admin_level_1": ["Valle Du Bandama", "Valle Du Bandama"],
        "admin_level_2": ["Gbeke", "Gbeke"],
        "admin_level_3": ["Mamini", "Mamini"],
        "arrondissement": ["Saminikro", "Saminikro"],
        "village": ["Saminikro", "Saminikro"],
        "owner_first_name": ["John", "ABATA"],
        "owner_last_name": ["Abata", "Doe"],
        "surface_area": [2, 3.1],
        "total_yield_kg": [33, 43],
        "total_yield_per_ha_kg": [10, 4],
        "total_yield_per_tree_kg": [1, 2],
        "sex": ["Male", "Female"],
        "product_id": [None, None],
        "total_number_trees": [14, 15],
        "total_sick_trees": [2, 2],
        "total_dead_trees": [1, 0],
        "total_trees_out_of_prod": [1, 2],
        "plantation_age": [12, 21],
        "latitude": [1.38919, 1.38919],
        "longitude": [8.46869, 9.802138333],
        "altitude": [383.0, 300],
        "status": [1, 1],
        "year": [2024, 2023],
        "data_source": ["CIV - Prosper Cashew 2024", "Benin Caju 2022"],
    }
    return download_excel_format("yield", data, request)


def upload_yields(request: HttpRequest):
    """
    When a user uploads a list of yields in the excel format, this function is called
    """
    n_index = None
    yields_saved = []
    yields_errors = []

    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df = pd.read_excel(BytesIO(file_data))
            df = df.replace(np.nan, None)
            df.rename(
                columns={
                    "admin_level_1": "department",
                    "admin_level_2": "commune",
                    "admin_level_3": "district",
                },
                inplace=True,
            )
            yields_list = df.to_dict(orient="records")

            # Basic validate the presence of columns and some general data
            country = validate_geoJSON_country_of_upload(df)
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )
            country_name = country.country_name

            for i, _yield in enumerate(yields_list):
                try:
                    with transaction.atomic():
                        print(_yield, "UPLOAD _yield")
                        # remove the fields not expected
                        _plantation_code = _yield.get("plantation_code")
                        if _plantation_code is None:
                            raise Exception("Plantation code is required")

                        del _yield["country"]
                        print({**_yield})
                        yield_obj: models.BeninYield = models.BeninYield(**_yield)
                        yield_obj.country_id = country
                        yield_obj.created_by = request.user.pk
                        yield_obj.updated_by = request.user.pk

                        # Get fellow plantation
                        _plantation = models.Plantation.objects.using(country_name).get(
                            plantation_code=_plantation_code,
                            country_id=yield_obj.country_id,
                        )
                        yield_obj.plantation_id = _plantation
                        yield_obj.product_id = yield_obj.plantation_code

                        # Pick unprovided fields from plantation
                        yield_obj.country_id = (
                            yield_obj.country_id
                            if yield_obj.country_id
                            else _plantation.country_id
                        )
                        yield_obj.plantation_name = (
                            yield_obj.plantation_name
                            if yield_obj.plantation_name
                            else _plantation.plantation_name
                        )
                        yield_obj.department = (
                            yield_obj.department
                            if yield_obj.department
                            else _plantation.department
                        )
                        yield_obj.commune = (
                            yield_obj.commune
                            if yield_obj.commune
                            else _plantation.commune
                        )
                        yield_obj.district = (
                            yield_obj.district
                            if yield_obj.district
                            else _plantation.arrondissement
                        )  # TODO: Arrondissment and district recheck
                        yield_obj.arrondissement = (
                            yield_obj.arrondissement
                            if yield_obj.arrondissement
                            else _plantation.arrondissement
                        )
                        yield_obj.village = (
                            yield_obj.village
                            if yield_obj.village
                            else _plantation.village
                        )
                        yield_obj.owner_first_name = (
                            yield_obj.owner_first_name
                            if yield_obj.owner_first_name
                            else _plantation.owner_first_name
                        )
                        yield_obj.owner_last_name = (
                            yield_obj.owner_last_name
                            if yield_obj.owner_last_name
                            else _plantation.owner_last_name
                        )
                        yield_obj.surface_area = (
                            yield_obj.surface_area
                            if yield_obj.surface_area
                            else _plantation.current_area
                        )
                        yield_obj.sex = (
                            yield_obj.sex if yield_obj.sex else _plantation.owner_gender
                        )
                        yield_obj.latitude = (
                            yield_obj.latitude
                            if yield_obj.latitude
                            else _plantation.latitude
                        )
                        yield_obj.longitude = (
                            yield_obj.longitude
                            if yield_obj.longitude
                            else _plantation.longitude
                        )
                        yield_obj.altitude = (
                            yield_obj.altitude
                            if yield_obj.altitude
                            else _plantation.altitude
                        )
                        # validate
                        yield_obj.full_clean()
                        # and save
                        yield_obj.save(using=country_name)
                        yields_saved.append(yield_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"AT ROW: {i + 2} : " + str(e)
                    yields_errors.append(error)

            # If some yields have errors
            if len(yields_errors) > 0:
                raise DataError(yields_errors)

    except Exception as e:
        traceback.print_exc()
        if len(yields_errors) > 0:
            error_response = JsonResponse({"error": yields_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(yields_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
        RemRolesList.SUPERUSER,
    ]
)
def yields(request):
    # TODO Recheck the role list filtering logic
    remuser: RemUser = request.user.remuser
    context = {}

    if "download_format" in request.POST:
        return download_yield_upload_format(request)

    if "upload_button" in request.POST:
        if remuser.role.role_name not in [
            RemRolesList.GLOBAL_ADMIN,
            RemRolesList.COUNTRY_ADMIN,
        ]:
            error_response = JsonResponse({"error": "Unauthorized User"}, safe=True)
            error_response.status_code = 401
            return error_response
        return upload_yields(request)

    search_yields = request.GET.get("search")
    yields_column = request.GET.get("column")
    country_search = request.GET.get("yields_country")

    filter_condition = ()
    countries_select = uti.Countries.users(remuser, country_search)
    print(countries_select, " : countries_select")

    _temp_resources_ = get_objects(
        model=models.BeninYield,
        condition=filter_condition,
        countries_select=countries_select,
    )
    main_resources_list = []
    response = None

    # Fetch all resources and merge
    for db, __resources__ in _temp_resources_.items():
        if search_yields:
            if yields_column != "all":
                yields_column = yields_column.replace(" ", "_")
                params = {
                    "{}__icontains".format(yields_column): search_yields,
                }
                _resources_list_ = __resources__.filter(
                    Q(**params), status=utils.Status.ACTIVE
                )

            else:
                _resources_list_ = __resources__.filter(
                    Q(plantation_name__icontains=search_yields)
                    | Q(total_yield_kg__icontains=search_yields)
                    | Q(total_yield_per_ha_kg__icontains=search_yields)
                    | Q(total_yield_per_tree_kg__icontains=search_yields)
                    | Q(product_id__icontains=search_yields)
                    | Q(total_number_trees__icontains=search_yields)
                    | Q(total_sick_trees__icontains=search_yields)
                    | Q(total_dead_trees__icontains=search_yields)
                    | Q(total_trees_out_of_prod__icontains=search_yields)
                    | Q(year__icontains=search_yields),
                    status=utils.Status.ACTIVE,
                )

        else:
            _resources_list_ = __resources__.filter(status=utils.Status.ACTIVE)

            # add to other countries plantations
        main_resources_list.extend(_resources_list_)

    if "pdf" in request.POST:
        titles_list = [
            "No",
            "Plantation name",
            "Product id",
            "Year",
            "Total number trees",
            "Total yield kg",
            "Total yield per ha kg",
            "Total yield per tree kg",
            "Total sick trees",
            "Total dead trees",
            "Total trees out of prod",
        ]
        i = 1
        yields_datas = []
        for yields0 in main_resources_list:
            data = [i]
            for title in titles_list[1:]:
                data.append(getattr(yields0, title.lower().replace(" ", "_")))
            yields_datas.append(data)
            i += 1
        response = export_pdf(
            datas_name="Yields",
            paper_type="A2",
            paper_format=A2,
            title_list=titles_list,
            elemts_list=yields_datas,
        )
    elif "xls" in request.POST:
        response = HttpResponse(content_type="application/ms-excel")
        if "/fr/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=rendement" + str(datetime.now()) + ".xls"
            )
        elif "/en/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=yield" + str(datetime.now()) + ".xls"
            )
        wb = xlwt.Workbook(encoding=" utf-8")
        ws = wb.add_sheet("Nurseries")
        row_num = 0
        font_style = xlwt.XFStyle()
        font_style.font.bold = True

        columns = [
            "No",
            gettext("Plantation name"),
            gettext("Product id"),
            gettext("Year"),
            gettext("Total number trees"),
            gettext("Total yield kg"),
            gettext("Total yield per ha kg"),
            gettext("Total yield per tree kg"),
            gettext("Total sick trees"),
            gettext("Total dead trees"),
            gettext("Total trees out of prod"),
        ]

        for col_num in range(len(columns)):
            ws.write(row_num, col_num, columns[col_num], font_style)

        font_style = xlwt.XFStyle()

        rows = []

        i = 1
        for yields0 in main_resources_list:
            rows.append(
                (
                    i,
                    yields0.plantation_name,
                    yields0.product_id,
                    yields0.year,
                    yields0.total_number_trees,
                    yields0.total_yield_kg,
                    yields0.total_yield_per_ha_kg,
                    yields0.total_yield_per_tree_kg,
                    yields0.total_sick_trees,
                    yields0.total_dead_trees,
                    yields0.total_trees_out_of_prod,
                )
            )
            i += 1

        for row in rows:
            row_num += 1

            for col_num in range(len(row)):
                ws.write(row_num, col_num, str(row[col_num]), font_style)
        wb.save(response)

    elif "csv" in request.POST:
        response = HttpResponse(content_type="text/csv")
        if "/fr/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=rendement" + str(datetime.now()) + ".csv"
            )
        elif "/en/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=yield" + str(datetime.now()) + ".csv"
            )
        writer = csv.writer(response)
        writer.writerow(
            [
                "No",
                gettext("Plantation name"),
                gettext("Product id"),
                gettext("Year"),
                gettext("Total number trees"),
                gettext("Total yield kg"),
                gettext("Total yield per ha kg"),
                gettext("Total yield per tree kg"),
                gettext("Total sick trees"),
                gettext("Total dead trees"),
                gettext("Total trees out of prod"),
            ]
        )

        i = 1
        for yields0 in main_resources_list:
            writer.writerow(
                [
                    i,
                    yields0.plantation_name,
                    yields0.product_id,
                    yields0.year,
                    yields0.total_number_trees,
                    yields0.total_yield_kg,
                    yields0.total_yield_per_ha_kg,
                    yields0.total_yield_per_tree_kg,
                    yields0.total_sick_trees,
                    yields0.total_dead_trees,
                    yields0.total_trees_out_of_prod,
                ]
            )
            i += 1

    # page = request.GET.get("page", 1)

    # paginator = Paginator(main_resources_list, 10)

    # page_range = paginator.get_elided_page_range(number=page)
    # try:
    #     yields = paginator.page(page)
    # except PageNotAnInteger:
    #     yields = paginator.page(1)
    # except EmptyPage:
    #     yields = paginator.page(paginator.num_pages)

    context["yields"] = main_resources_list
    context["segment"] = "yield"
    # context["page_range"] = page_range
    context["form"] = BeninYieldSearch(
        initial={
            "column": request.GET.get("column", ""),
            "yields_country": "All",
        }
    )
    return response if response else render(request, "dashboard/yield.html", context)


def generate_geo_json_format(fmt_columns):
    """
    When given columns helps generate a GeoJSON file that can be used as a sample
    """
    data = {}
    for col, value in fmt_columns:
        data[col] = [value]
        # print(col, value)
    geo_coordinates = MultiPolygon(
        [
            (
                (
                    (0.0, 0.0, 212.59),
                    (0.0, 1.0, 212.59),
                    (1.0, 1.0, 212.59),
                    (1.0, 0.0, 212.59),
                ),
                [
                    (
                        (0.1, 0.1, 212.59),
                        (0.1, 0.2, 212.59),
                        (0.2, 0.2, 212.59),
                        (0.2, 0.1, 212.59),
                    )
                ],
            )
        ]
    )
    fmt_df = pd.DataFrame(data)
    standard_srs = "OGC:CRS84"
    f_fmt_df = gpd.GeoDataFrame(fmt_df, geometry=[geo_coordinates], crs=standard_srs)
    return f_fmt_df


def generate_plantations_format():
    """
    Generate plantations dataframe to use in downloading the upload format
    """
    fmt_columns = [
        ("country", "Ivory Coast"),
        ("plantation_name", "102054fa"),
        ("plantation_code", "102054fa"),
        ("owner_first_name", "John"),
        ("owner_last_name", "Doe"),
        ("owner_gender", "female"),
        ("total_trees", "122"),
        ("admin_level_1", "Gbeke"),
        ("admin_level_2", "Gbeke"),
        ("admin_level_3", "Bounda"),
        ("village", "Yapikro"),
        ("current_area", "122"),
        ("latitude", -4.714786922599999),
        ("longitude", 7.588733732700001),
        ("altitude", 232.3),
        ("status", 1),
        ("data_source", "Prosper Cashew 2024"),
    ]
    return generate_geo_json_format(fmt_columns)


def download_plantations_format():
    """
    Download the upload format for plantations
    """
    df = generate_plantations_format()
    df_json = df.to_json()
    response = HttpResponse(df_json, content_type="application/json")
    response["Content-Disposition"] = (
        "attachment; filename=plantations_upload_format.geojson"
    )
    return response


import shutil

plantation_columns = [
    "country",
    "plantation_name",
    "plantation_code",
    "owner_first_name",
    "owner_last_name",
    "owner_gender",
    "total_trees",
    "admin_level_1",
    "admin_level_2",
    "admin_level_3",
    "village",
    "current_area",
    "latitude",
    "longitude",
    "altitude",
    "status",
    "data_source",
    "geometry",
]


def validate_geoJSON_country_of_upload(df: gpd.GeoDataFrame, country_key="country"):
    """
    For GeoJSON features all need to be coming from one country only
    """
    if len(df[country_key].value_counts().keys()) > 1:
        raise Exception("All features need to be coming from one country only")
    country = df[country_key].iloc[0]
    country = models.Country.objects.using(country).get(
        country_name=country, status=utils.Status.ACTIVE
    )
    if country is None:
        raise Exception("Country not found")
    return country


def validate_geojson_upload_columns(df: gpd.GeoDataFrame, columns_needed):
    """
    Validate the columns of the plantations dataframe
    """
    missing_columns = []
    for column in columns_needed:
        if column not in df.columns:
            missing_columns.append(column)
    if len(missing_columns) > 0:
        raise Exception(
            f"Properties '{missing_columns}' are missing in the GEOJSON file".format(
                column
            )
        )


def validate_plantations_data(df: gpd.GeoDataFrame):
    """
    Validate the data of the plantations dataframe
    """
    # Check if the plantation code is unique
    if df["plantation_code"].duplicated().any():
        raise Exception("Plantation code must be unique")

    if df["plantation_name"].duplicated().any():
        raise Exception("Plantation code must be unique")

    # Check if the latitude and longitude are valid
    if not df["latitude"].between(-90, 90).all():
        raise Exception("Latitude must be between -90 and 90")
    if not df["longitude"].between(-180, 180).all():
        raise Exception("Longitude must be between -180 and 180")

    # Check if the status is valid
    if not df["status"].isin([0, 1]).all():
        raise Exception("Status must be either 0 or 1")

    # Check if the geometry is valid
    if not df.geometry.is_valid.all():
        raise Exception("Geometry is not valid")


from shapely.geometry import Point, LineString, Polygon, MultiPolygon


def remove_third_coordinate_geopandas(gdf):
    """
    Removes the third coordinate from geometries in a GeoDataFrame.
    This is useful for converting 3D geometries to 2D.
    """

    def remove_z(geom):
        if geom.is_empty:
            return geom
        if isinstance(geom, Point):
            return Point(geom.x, geom.y)
        elif isinstance(geom, LineString):
            return LineString([(p[0], p[1]) for p in geom.coords])
        elif isinstance(geom, Polygon):
            exterior = LineString([(p[0], p[1]) for p in geom.exterior.coords])
            interiors = [
                LineString([(p[0], p[1]) for p in inner.coords])
                for inner in geom.interiors
            ]
            return Polygon(exterior, interiors)
        elif isinstance(geom, MultiPolygon):
            return MultiPolygon([remove_z(part) for part in geom.geoms])
        else:
            raise ValueError(f"Unsupported geometry type: {type(geom)}")

    gdf.geometry = gdf.geometry.apply(remove_z)
    return gdf


def upload_plantations(request: HttpRequest):
    """
    When a user uploads plantations geojson file, this function is called
    1. Calculate longitude and latitude if not provided
    2. Change SRS to default TNS
    3.
    """
    standard_srs = "OGC:CRS84"
    plantations_saved = []
    plantations_errors = []
    try:
        country: models.Country
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df: gpd.GeoDataFrame = gpd.read_file(BytesIO(file_data))

            # Basic validate the presence of columns and some general data
            country = validate_geoJSON_country_of_upload(df)
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )
            country_name = country.country_name

            # Change SRS (Spatial reference system) coordinate reference system (CRS)
            df = df.to_crs(standard_srs)
            # coordinates with [0,0,0] cause errors
            df = remove_third_coordinate_geopandas(df)

            try:
                # calculate latitude and longitude if not provided
                df["latitude"] = df["latitude"].fillna(
                    df["geometry"].geometry.centroid.y
                )
                df["longitude"] = df["longitude"].fillna(
                    df["geometry"].geometry.centroid.x
                )
            except:
                pass

            df = df.replace(np.nan, None)
            plantations_list = df.to_dict(orient="records")

            for i, _plantation in enumerate(plantations_list):
                try:
                    with transaction.atomic():
                        # geometry clean
                        geometry = GEOSGeometry(_plantation["geometry"].wkt)
                        if geometry and isinstance(geometry, geos.Polygon):
                            geometry = geos.MultiPolygon(geometry)

                        # get and update or create
                        if country.country_name != "Benin":
                            try:
                                plantation_obj = models.Plantation.objects.using(
                                    country_name
                                ).get(
                                    plantation_code=_plantation["plantation_code"],
                                    country_id=country,
                                )
                                plantation_obj.geometry = geometry
                                plantation_obj.country_id = country
                                # plantation_obj.created_by = request.user.pk
                                plantation_obj.updated_by = request.user.pk
                                # @TODO add other fields here to update
                                # validate
                                print(
                                    "Got the plantation ",
                                    plantation_obj.geometry.geom_type,
                                )
                                plantation_obj.full_clean()
                                # and save
                                plantation_obj.save(using=country_name)
                            except ObjectDoesNotExist as e:
                                print(
                                    e,
                                    _plantation["plantation_code"],
                                    " ObjectDoesNotExist",
                                )
                                validate_geojson_upload_columns(df, plantation_columns)
                                validate_plantations_data(df)
                                # computed fields
                                owner_last_name = (
                                    _plantation["owner_last_name"]
                                    if _plantation.get("owner_last_name") is not None
                                    else " "
                                )
                                owner_gender = (
                                    _plantation["owner_gender"]
                                    if _plantation.get("owner_gender")
                                    in ["male", "female", "others"]
                                    else "others"
                                )
                                plantation_obj = models.Plantation.objects.using(
                                    country_name
                                ).create(
                                    country_id=country,
                                    plantation_name=_plantation["plantation_code"],
                                    plantation_code=_plantation["plantation_code"],
                                    owner_first_name=_plantation["owner_first_name"],
                                    owner_last_name=owner_last_name,
                                    owner_gender=owner_gender,
                                    total_trees=_plantation["total_trees"],
                                    # cols with different names
                                    department=_plantation["admin_level_1"],
                                    commune=_plantation["admin_level_2"],
                                    arrondissement=_plantation["admin_level_3"],
                                    village=_plantation["village"],
                                    # other cols
                                    current_area=_plantation["current_area"],
                                    latitude=_plantation["latitude"],
                                    longitude=_plantation["longitude"],
                                    altitude=_plantation["altitude"],
                                    status=_plantation["status"],
                                    data_source=_plantation["data_source"],
                                    geometry=geometry,
                                    created_by=request.user,
                                    updated_by=request.user,
                                )

                        else:
                            """
                            Benin's edit and creation process is very different
                            """
                            try:
                                plantation_obj = models.Plantation.objects.using(
                                    country_name
                                ).get(
                                    plantation_code=_plantation["plantation_code"],
                                    country_id=country,
                                )
                                plantation_obj.shape_id = _plantation[
                                    "plantation_code"
                                ]  # add this field to ease future reference
                                plantation_obj.geometry = geometry
                                plantation_obj.country_id = country
                                plantation_obj.country = country.country_name
                                # plantation_obj.created_by = request.user.pk
                                plantation_obj.updated_by = request.user.pk
                                # @TODO add other fields here to update
                                # validate
                                print(
                                    "Got the plantation ",
                                    plantation_obj.geometry.geom_type,
                                )
                                plantation_obj.full_clean()
                                # and save
                                plantation_obj.save(using=country_name)
                            except ObjectDoesNotExist as e:
                                # computed fields
                                owner_last_name = (
                                    _plantation.get("owner_last_name")
                                    if _plantation.get("owner_last_name") is not None
                                    else " "
                                )
                                owner_gender = (
                                    _plantation.get("owner_gender")
                                    if _plantation.get("owner_gender")
                                    in ["male", "female", "others"]
                                    else "others"
                                )
                                plantation_obj = models.Plantation.objects.using(
                                    country_name
                                ).create(
                                    country_id=country,
                                    plantation_name=_plantation.get("plantation_code")
                                    or _plantation["plantation_code"],
                                    plantation_code=_plantation.get("plantation_code")
                                    or _plantation["plantation_code"],
                                    shape_id=_plantation["plantation_code"],
                                    owner_first_name=_plantation.get(
                                        "owner_first_name"
                                    ),
                                    owner_last_name=owner_last_name,
                                    owner_gender=owner_gender,
                                    total_trees=_plantation.get("total_trees"),
                                    # cols with different names
                                    department=_plantation.get("admin_level_1"),
                                    commune=_plantation.get("admin_level_2"),
                                    arrondissement=_plantation.get("admin_level_3"),
                                    village=_plantation.get("village"),
                                    # other cols
                                    current_area=_plantation.get("current_area"),
                                    latitude=_plantation.get("latitude"),
                                    longitude=_plantation.get("longitude"),
                                    altitude=_plantation.get("altitude"),
                                    status=_plantation.get("status", 1),
                                    data_source=_plantation.get("data_source"),
                                    geometry=geometry,
                                    created_by=request.user,
                                    updated_by=request.user,
                                )

                        # append object
                        plantations_saved.append(plantation_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = (
                        f"Plantation CODE: {_plantation.get('plantation_code')} : "
                        + str(e)
                    )
                    plantations_errors.append(error)

            # If some plantations have errors
            if len(plantations_errors) > 0:
                raise DataError(plantations_errors)

            # # trigger computations and then run the dashboard dashboard!
            # try:
            #     satellite_prediction_computed_data_file(country.country_name)
            # except Exception as e:
            #     print(e)
            # # Force rebuilding map for this country
            # try:
            #     build_layers_cache_per_country(country)
            # except Exception as e:
            #     traceback.print_exc()

    except Exception as e:
        traceback.print_exc()
        if len(plantations_errors) > 0:
            error_response = JsonResponse({"error": plantations_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(plantations_saved)}"}, safe=True)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
        RemRolesList.SUPERUSER,
    ]
)
def plantations(request):
    # TODO Recheck the role list filtering logic
    remuser: RemUser = request.user.remuser
    context = {}

    if "download_format" in request.POST:
        return download_plantations_format()

    if "upload_button" in request.POST:
        if remuser.role.role_name not in [
            RemRolesList.GLOBAL_ADMIN,
            RemRolesList.COUNTRY_ADMIN,
        ]:
            error_response = JsonResponse({"error": "Unauthorized User"}, safe=True)
            error_response.status_code = 401
            return error_response
        return upload_plantations(request)

    search_plantations = request.GET.get("search")
    plantations_column = request.GET.get("column")
    country_search = request.GET.get("plantations_country")

    filter_condition = ()
    countries_select = uti.Countries.users(remuser, country_search)
    print(countries_select, " : countries_select")

    _temp_plantations_ = get_objects(
        models.Plantation,
        filter_condition,
        countries_select=countries_select,
    )
    main_plantations_list = []
    response = None

    # Fetch all plantations and merge
    for db, plantations in _temp_plantations_.items():
        if search_plantations:
            if plantations_column != "all":
                plantations_column = plantations_column.replace(" ", "_")
                if plantations_column == "owner_gender":
                    params = {
                        "{}__iexact".format(plantations_column): search_plantations,
                    }
                else:
                    params = {
                        "{}__icontains".format(plantations_column): search_plantations,
                    }
                plantations_list = plantations.filter(
                    Q(**params), status=utils.Status.ACTIVE
                )

            else:
                plantations_list = plantations.filter(
                    Q(plantation_name__icontains=search_plantations)
                    | Q(plantation_code__icontains=search_plantations)
                    | Q(owner_first_name__icontains=search_plantations)
                    | Q(owner_last_name__icontains=search_plantations)
                    | Q(owner_gender__iexact=search_plantations)
                    | Q(total_trees__icontains=search_plantations)
                    | Q(department__icontains=search_plantations)
                    | Q(commune__icontains=search_plantations)
                    | Q(arrondissement__icontains=search_plantations)
                    | Q(village__icontains=search_plantations)
                    | Q(current_area__icontains=search_plantations)
                    | Q(latitude__icontains=search_plantations)
                    | Q(longitude__icontains=search_plantations)
                    | Q(altitude__icontains=search_plantations),
                    status=utils.Status.ACTIVE,
                )

        else:
            plantations_list = plantations.filter(status=utils.Status.ACTIVE)

        # add to other countries plantations
        main_plantations_list.extend(plantations_list)

    if "pdf" in request.POST:
        titles_list = (
            "No",
            "Plantation name",
            "Plantation code",
            "Owner first name",
            "Owner last name",
            "Owner gender",
            "Total trees",
            "Country",
            "Department",
            "Commune",
            "Arrondissement",
            "Village",
            "Current area",
            "Latitude",
            "Longitude",
            "Altitude",
        )

        i = 1
        plantations_data = []
        for plantations0 in main_plantations_list:
            data = [i]
            for title in titles_list[1:]:
                data.append(getattr(plantations0, title.lower().replace(" ", "_")))
            plantations_data.append(data)
            i += 1
        response = export_pdf(
            datas_name="Pantations",
            paper_type="A2",
            paper_format=A2,
            title_list=titles_list,
            elemts_list=plantations_data,
        )

    elif "xls" in request.POST:
        response = HttpResponse(content_type="application/ms-excel")
        response["Content-Disposition"] = (
            "attachement; filename=plantations" + str(datetime.now()) + ".xls"
        )
        wb = xlwt.Workbook(encoding=" utf-8")
        ws = wb.add_sheet("Plantations")
        row_num = 0
        font_style = xlwt.XFStyle()
        font_style.font.bold = True

        columns = [
            "No",
            gettext("Plantation name"),
            gettext("Plantation code"),
            gettext("Owner first name"),
            gettext("Owner last name"),
            gettext("Owner gender"),
            gettext("Total trees"),
            gettext("Country"),
            gettext("Department"),
            gettext("Commune"),
            gettext("Arrondissement"),
            gettext("Village"),
            gettext("Current area"),
            gettext("Latitude"),
            gettext("Longitude"),
            gettext("Altitude"),
        ]

        for col_num in range(len(columns)):
            ws.write(row_num, col_num, columns[col_num], font_style)

        font_style = xlwt.XFStyle()

        rows = []

        i = 1
        for plantations0 in main_plantations_list:
            rows.append(
                (
                    i,
                    plantations0.plantation_name,
                    plantations0.plantation_code,
                    plantations0.owner_first_name,
                    plantations0.owner_last_name,
                    plantations0.owner_gender,
                    plantations0.total_trees,
                    plantations0.country,
                    plantations0.department,
                    plantations0.commune,
                    plantations0.arrondissement,
                    plantations0.village,
                    plantations0.current_area,
                    plantations0.latitude,
                    plantations0.longitude,
                    plantations0.altitude,
                )
            )
            i += 1

        for row in rows:
            row_num += 1

            for col_num in range(len(row)):
                ws.write(row_num, col_num, str(row[col_num]), font_style)
        wb.save(response)

    elif "csv" in request.POST:
        response = HttpResponse(content_type="text/csv")

        response["Content-Disposition"] = (
            "attachement; filename=plantation" + str(datetime.now()) + ".csv"
        )
        writer = csv.writer(response)
        writer.writerow(
            [
                "No",
                gettext("Plantation name"),
                gettext("Plantation code"),
                gettext("Owner first name"),
                gettext("Owner last name"),
                gettext("Owner gender"),
                gettext("Total trees"),
                gettext("Country"),
                gettext("Department"),
                gettext("Commune"),
                gettext("Arrondissement"),
                gettext("Village"),
                gettext("Current area"),
                gettext("Latitude"),
                gettext("Longitude"),
                gettext("Altitude"),
            ]
        )

        i = 1
        for plantations0 in main_plantations_list:
            writer.writerow(
                [
                    i,
                    plantations0.plantation_name,
                    plantations0.plantation_code,
                    plantations0.owner_first_name,
                    plantations0.owner_last_name,
                    plantations0.owner_gender,
                    plantations0.total_trees,
                    plantations0.country,
                    plantations0.department,
                    plantations0.commune,
                    plantations0.arrondissement,
                    plantations0.village,
                    plantations0.current_area,
                    plantations0.latitude,
                    plantations0.longitude,
                    plantations0.altitude,
                ]
            )
            i += 1

    context["plantations"] = main_plantations_list
    context["segment"] = "plantations"
    context["form"] = PlantationsSearch(
        initial={
            "column": request.GET.get("column", ""),
        }
    )
    return (
        response if response else render(request, "dashboard/plantations.html", context)
    )


def download_excel_format(name: str, data: dict[str, list[str]], request: HttpRequest):
    """
    Given excel file name and data, formulates a workbook to download
    """
    print("Should download nurseries format")
    response = HttpResponse(content_type="application/ms-excel")
    response["Content-Disposition"] = (
        f"attachement; filename={name}" + "_" + "upload_format" + ".xls"
    )
    wb = xlwt.Workbook(encoding=" utf-8")
    ws: xlwt.Worksheet = wb.add_sheet(name)
    row_index = 0
    font_style = xlwt.XFStyle()

    for col_index, col_name in enumerate(data.keys()):
        font_style.font.bold = True
        ws.write(row_index, col_index, col_name, font_style)
        font_style = xlwt.XFStyle()
        font_style.protection

    for row_index in range(len(data[list(data.keys())[0]])):
        for col_index, col_name in enumerate(data.keys()):
            ws.write(row_index + 1, col_index, data[col_name][row_index], font_style)
            font_style = xlwt.XFStyle()

    ws.set_panes_frozen(True)
    ws.set_horz_split_pos(1)
    wb.save(response)
    return response


import traceback


def check_country_upload(
    country: str, active_countries_dict: dict[str, Country], request: HttpRequest
):
    """
    Check if country is valid
    And check if user can upload data in this country (If not global admin checks if you can actually upload data in this country)
    """
    remuser: RemUser = request.user.remuser
    if country is None or country.strip() == "":
        raise Exception("Country is required")
    elif country not in [_c for _c in active_countries_dict.keys()]:
        raise Exception(f"Country not active {country}")
    elif remuser.role.role_name == RemRolesList.GLOBAL_ADMIN:
        return True
    elif country not in [
        _country.country_name for _country in remuser.country_id.all()
    ]:
        raise Exception(f"Unauthorized Country: {country}")


def upload_nurseries(request: HttpRequest):
    """
    When a user uploads a list of nurseries in the excel format, this function is called
    """
    n_index = None
    nurseries_saved = []
    nurseries_errors = []

    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df = pd.read_excel(BytesIO(file_data))
            df = df.replace(np.nan, None)

            # Basic validate the presence of columns and some general data
            country = validate_geoJSON_country_of_upload(df)
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )
            country_name = country.country_name

            nurseries_list = df.to_dict(orient="records")

            for i, _nursery in enumerate(nurseries_list):
                n_index = i
                try:
                    with transaction.atomic():
                        nursery_obj: models.Nursery = models.Nursery(**_nursery)
                        nursery_obj.country_id = country
                        nursery_obj.created_by = request.user.pk
                        nursery_obj.updated_by = request.user.pk
                        # validate
                        nursery_obj.full_clean()
                        # and save
                        nursery_obj.save(using=country_name)
                        nurseries_saved.append(nursery_obj)

                except (IntegrityError, DataError, Exception) as e:
                    traceback.print_exc()
                    error = f"AT ROW: {n_index + 2} : " + str(e)
                    nurseries_errors.append(error)

            # If some nurseries have errors
            if len(nurseries_errors) > 0:
                raise DataError(nurseries_errors)

    except Exception as e:
        traceback.print_exc()
        if len(nurseries_errors) > 0:
            error_response = JsonResponse({"error": nurseries_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(nurseries_saved)}"}, safe=True)


def download_nurseries_format(request: HttpRequest):
    """
    When a user requests to download the excel format for uploading the list of nurseries,
    this function is called
    """
    data = {
        "nursery_name": ["Maralin's nursery", "Nassirou's nursery"],
        "owner_first_name": ["Maralin", "Nassiro"],
        "owner_last_name": ["SEFANDE", "ABATA"],
        "nursery_address": ["KOUBEKRO", "KOUBEKRO"],
        "country": ["Benin", "Benin"],
        "commune": ["Borgou", "Ndari"],
        "current_area": [2.2, 3.1],
        "latitude": [1.38919, 1.38919],
        "longitude": [8.46869, 9.802138333],
        "altitude": [383.0, 300],
        "partner": [None, "KALATCHI"],
        "status": [1, 1],
        "number_of_plants": [9780, 311],
        "data_source": ["CIV - Prosper Cashew 2024", "Benin Caju 2022"],
    }
    return download_excel_format("nurseries", data, request)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
        RemRolesList.SUPERUSER,
    ]
)
def nurseries(request):
    # TODO Recheck the role list filtering logic
    remuser: RemUser = request.user.remuser
    context = {}

    print("request.POST ", request.POST)
    if "download_format" in request.POST:
        return download_nurseries_format(request)

    if "upload_button" in request.POST:
        if remuser.role.role_name not in [
            RemRolesList.GLOBAL_ADMIN,
            RemRolesList.COUNTRY_ADMIN,
        ]:
            error_response = JsonResponse({"error": "Unauthorized User"}, safe=True)
            error_response.status_code = 401
            return error_response
        return upload_nurseries(request)

    search_nurseries = request.GET.get("search")
    nursery_column = request.GET.get("column")
    country_search = request.GET.get("nurseries_country")

    filter_condition = ()
    countries_select = uti.Countries.users(remuser, country_search)
    print(countries_select, " : countries_select")

    _temp_resources_ = get_objects(
        models.Nursery,
        filter_condition,
        countries_select=countries_select,
    )
    main_resources_list = []
    response = None

    for db, __resources__ in _temp_resources_.items():
        if search_nurseries:
            if nursery_column != "all":
                nursery_column = nursery_column.replace(" ", "_")
                params = {
                    "{}__icontains".format(nursery_column): search_nurseries,
                }
                __temp_resources_list__ = __resources__.filter(
                    Q(**params), status=utils.Status.ACTIVE
                )

            else:
                __temp_resources_list__ = __resources__.filter(
                    Q(nursery_name__icontains=search_nurseries)
                    | Q(owner_first_name__icontains=search_nurseries)
                    | Q(owner_last_name__icontains=search_nurseries)
                    | Q(nursery_address__icontains=search_nurseries)
                    | Q(country__icontains=search_nurseries)
                    | Q(commune__icontains=search_nurseries)
                    | Q(current_area__icontains=search_nurseries)
                    | Q(latitude__icontains=search_nurseries)
                    | Q(longitude__icontains=search_nurseries)
                    | Q(altitude__icontains=search_nurseries)
                    | Q(partner__icontains=search_nurseries)
                    | Q(number_of_plants__icontains=search_nurseries),
                    status=utils.Status.ACTIVE,
                )

        else:
            __temp_resources_list__ = __resources__.filter(status=utils.Status.ACTIVE)

        # add to other countries plantations
        main_resources_list.extend(__temp_resources_list__)

    if "pdf" in request.POST:
        titles_list = (
            "No",
            "Nursery Name",
            "Owner First Name",
            "Owner Last Name",
            "Nursery Address",
            "Country",
            "Commune",
            "Current Area",
            "Latitude",
            "Longitude",
            "Altitude",
            "Partner",
            "Number of Plants",
        )
        i = 1
        nurseries_data = []
        for nursery0 in main_resources_list:
            data = [i]
            for title in titles_list[1:]:
                data.append(getattr(nursery0, title.lower().replace(" ", "_")))
            nurseries_data.append(data)
            i += 1
        response = export_pdf(
            datas_name="Nurseries",
            paper_type="A2",
            paper_format=A2,
            title_list=titles_list,
            elemts_list=nurseries_data,
        )

    elif "xls" in request.POST:
        response = HttpResponse(content_type="application/ms-excel")
        if "/fr/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=pépinières" + str(datetime.now()) + ".xls"
            )
        elif "/en/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=nurseries" + str(datetime.now()) + ".xls"
            )
        wb = xlwt.Workbook(encoding=" utf-8")
        ws = wb.add_sheet("Nurseries")
        row_num = 0
        font_style = xlwt.XFStyle()
        font_style.font.bold = True

        columns = [
            "No",
            gettext("Nursery Name"),
            gettext("Owner First Name"),
            gettext("Owner Last Name"),
            gettext("Nursery Address"),
            gettext("Country"),
            gettext("Commune"),
            gettext("Current Area"),
            gettext("Latitude"),
            gettext("Longitude"),
            gettext("Altitude"),
            gettext("Partner"),
            gettext("Number of Plants"),
        ]

        for col_num in range(len(columns)):
            ws.write(row_num, col_num, columns[col_num], font_style)

        font_style = xlwt.XFStyle()

        rows = []

        i = 1
        for nursery0 in main_resources_list:
            rows.append(
                (
                    i,
                    nursery0.nursery_name,
                    nursery0.owner_first_name,
                    nursery0.owner_last_name,
                    nursery0.nursery_address,
                    nursery0.country,
                    nursery0.commune,
                    nursery0.current_area,
                    nursery0.latitude,
                    nursery0.longitude,
                    nursery0.altitude,
                    nursery0.partner,
                    nursery0.number_of_plants,
                )
            )
            i += 1

        for row in rows:
            row_num += 1

            for col_num in range(len(row)):
                ws.write(row_num, col_num, str(row[col_num]), font_style)
        wb.save(response)

    elif "csv" in request.POST:
        response = HttpResponse(content_type="text/csv")
        if "/fr/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=pépinières" + str(datetime.now()) + ".csv"
            )
        elif "/en/" in request.build_absolute_uri():
            response["Content-Disposition"] = (
                "attachement; filename=nurseries" + str(datetime.now()) + ".csv"
            )
        writer = csv.writer(response)
        writer.writerow(
            [
                "No",
                gettext("Nursery Name"),
                gettext("Owner First Name"),
                gettext("Owner Last Name"),
                gettext("Nursery Address"),
                gettext("Country"),
                gettext("Commune"),
                gettext("Current Area"),
                gettext("Latitude"),
                gettext("Longitude"),
                gettext("Altitude"),
                gettext("Partner"),
                gettext("Number of Plants"),
            ]
        )

        i = 1
        for nursery0 in main_resources_list:
            writer.writerow(
                [
                    i,
                    nursery0.nursery_name,
                    nursery0.owner_first_name,
                    nursery0.owner_last_name,
                    nursery0.nursery_address,
                    nursery0.country,
                    nursery0.commune,
                    nursery0.current_area,
                    nursery0.latitude,
                    nursery0.longitude,
                    nursery0.altitude,
                    nursery0.partner,
                    nursery0.number_of_plants,
                ]
            )
            i += 1

    context["nurseries"] = main_resources_list
    context["segment"] = "nurseries"
    context["form"] = NurserySearch(
        initial={
            "column": request.GET.get("column", ""),
        }
    )
    return (
        response if response else render(request, "dashboard/nurseries.html", context)
    )


def extract_dict_by_keys(data, keys):
    """extracts a dictionary to include only the specified keys.

    Args:
      data: The dictionary to filter.
      keys: A list of keys to include in the filtered dictionary.

    Returns:
      A new dictionary containing only the specified keys from the original dictionary.
    """

    return {key: data[key] for key in keys if key in data}


def remove_dict_keys(data, keys):
    """
    Removed keys from a dictionary
    """
    for key in keys:
        if key in data:
            del data[key]
    return data


def upload_trainings(request: HttpRequest):
    """
    When a user uploads a list of trainings in the excel format, this function is called
    """
    objects_saved = []
    objects_errors = []

    try:
        with transaction.atomic():
            file_data = request.FILES["file"].read()
            df = pd.read_excel(BytesIO(file_data))
            df = df.replace(np.nan, None)

            trainings_list = df.to_dict(orient="records")

            # Basic validate the presence of columns and some general data
            country = validate_geoJSON_country_of_upload(df)
            check_country_upload(
                country=country.country_name,
                active_countries_dict={f"{country.country_name}": country},
                request=request,
            )
            country_name = country.country_name

            # save trainers
            for i, _training in enumerate(trainings_list):
                try:
                    with transaction.atomic():
                        _training["country_id"] = country
                        trainer = models.Trainer.objects.using(
                            country_name
                        ).get_or_create(
                            firstname=_training.get("firstname"),
                            lastname=_training.get("lastname"),
                            institution=_training.get("institution"),
                            email=_training.get("email"),
                            country_id=_training.get("country_id"),
                            data_source=_training.get("data_source"),
                        )
                        trainer[0].phone = _training.get("phone")
                        if trainer[1]:
                            trainer[0].created_by = request.user.pk
                        trainer[0].updated_by = request.user.pk
                        trainer[0].full_clean()
                        trainer[0].save(using=country_name)
                        trainings_list[i]["trainer_id"] = trainer[0]

                except (IntegrityError, DataError, Exception) as e:
                    print("Error in trainer ", i, str(e))
                    error = f"Trainer at row: {i + 2} : " + str(e)
                    objects_errors.append(error)

            # save modules
            for i, _training in enumerate(trainings_list):
                try:
                    with transaction.atomic():
                        module = models.TrainingModule.objects.using(
                            country_name
                        ).get_or_create(
                            module_name=_training.get("module_name"),
                            category=_training.get("category"),
                            country_id=_training.get("country_id"),
                            data_source=_training.get("data_source"),
                        )
                        if module[1]:
                            module[0].created_by = request.user.pk
                        module[0].updated_by = request.user.pk
                        module[0].full_clean()
                        module[0].save(using=country_name)
                        trainings_list[i]["module_id"] = module[0]

                except (IntegrityError, DataError, Exception) as e:
                    print("Error in module ", i, str(e))
                    error = f"Module at row: {i + 2} : " + str(e)
                    objects_errors.append(error)

            # save trainings
            for i, _training in enumerate(trainings_list):
                try:
                    with transaction.atomic():
                        _training = remove_dict_keys(
                            _training,
                            [
                                "country",
                                "firstname",
                                "lastname",
                                "institution",
                                "phone",
                                "email",
                                "module_name",
                                "category",
                            ],
                        )
                        training_obj: models.Training = models.Training(**_training)
                        training_obj.created_by = request.user.pk
                        training_obj.updated_by = request.user.pk
                        training_obj.full_clean()
                        training_obj.save(using=country_name)
                        objects_saved.append(training_obj)
                        print("Appended ", training_obj)

                except (IntegrityError, DataError, Exception) as e:
                    print("Error in training ", i, str(e))
                    error = f"Training at row: {i + 2} : " + str(e)
                    objects_errors.append(error)

            # If some trainings have errors
            if len(objects_errors) > 0:
                raise DataError(objects_errors)

    except Exception as e:
        traceback.print_exc()
        if len(objects_errors) > 0:
            error_response = JsonResponse({"error": objects_errors}, safe=True)
        else:
            error_response = JsonResponse({"error": str(e)}, safe=True)
        error_response.status_code = 400
        return error_response

    return JsonResponse({"message": f"Uploaded {len(objects_saved)}"}, safe=True)


def download_trainings_format(request: HttpRequest):
    """
    When a user requests to download the excel format for uploading the list of trainings,
    this function is called
    """
    data = {
        "country": ["Ivory Coast", "Benin"],
        # trainer specific
        "firstname": ["Maralin", "John"],
        "lastname": ["Doe", "Maralin"],
        "institution": ["ATDA", "ATDA"],
        "phone": [None, None],
        "email": ["email@example.com", "email@example.com"],
        # module columns
        "module_name": ["Tree Thinning", "Tree Thinning"],
        "category": ["Thinning", "Thinning"],
        # training specific columns
        "longitude": [8.46869, 9.802138333],
        "latitude": [1.38919, 1.38919],
        "number_of_participant": [30, 40],
        "department": ["Valle Du Bandama", "Valle Du Bandama"],
        "commune": ["Gbeke", "Gbeke"],
        "arrondissement": ["Mamini", "Mamini"],
        "DateTime": ["12/03/2020", "12/03/2020"],
        "start_hour": ["9:30", "10:55"],
        "end_hour": ["10:30", "11:55"],
        "data_source": ["ProsperCashew CIV 2024", "ProsperCashew CIV 2024"],
    }
    return download_excel_format("trainings", data, request)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
        RemRolesList.SUPERUSER,
    ]
)
def training(request):
    context = {}
    # TODO Recheck the role list filtering logic
    remuser: RemUser = request.user.remuser
    print("request.POST ", request.POST)
    if "download_format" in request.POST:
        return download_trainings_format(request)
    if "upload_button" in request.POST:
        if remuser.role.role_name not in [
            RemRolesList.GLOBAL_ADMIN,
            RemRolesList.COUNTRY_ADMIN,
        ]:
            error_response = JsonResponse({"error": "Unauthorized User"}, safe=True)
            error_response.status_code = 401
            return error_response
        return upload_trainings(request)

    # query params and filters
    search_training = request.GET.get("search")
    training_column = request.GET.get("column")
    country_search = request.GET.get("trainings_country")
    department_form = request.GET.get("department")
    commune_form = request.GET.get("commune")
    date_form_from = request.GET.get("my_date_field")
    date_form_to = request.GET.get("my_date_field1")

    # base models and sselction
    filter_condition = ()
    countries_select = uti.Countries.users(remuser, country_search)
    _temp_all_trainings = get_objects(
        models.Training, filter_condition, countries_select
    )
    _temp_all_trainers = get_objects(models.Trainer, filter_condition, countries_select)

    print(countries_select, " : countries_select")
    print(_temp_all_trainers)

    # response list
    all_training_list = []
    durations = []
    response = None

    # fetching
    for db, __trainings__ in _temp_all_trainings.items():
        __trainers__ = _temp_all_trainers.get(db)
        __country_training_list__ = None

        print(__trainings__, db, " Before DB")

        if search_training:
            print("__search_training__ elif 2")
            if date_form_from and date_form_to:
                date_form_from = date_form_from + " 00:00:00.000000"
                date_form_to = date_form_to + " 23:59:59.999999"

            if training_column == "module name":
                training_column = training_column.replace(" ", "_")
                params = {
                    "{}__icontains".format(training_column): search_training,
                }
                module_list = __trainings__.filter(Q(**params))
                if date_form_from and date_form_to:
                    training_object = __trainings__.filter(
                        DateTime__gte=date_form_from, DateTime__lte=date_form_to
                    )
                else:
                    training_object = __trainings__.all()
                __country_training_list__ = []
                for item in training_object:
                    for element in module_list:
                        if str(item.module_id) == str(element.id):
                            __country_training_list__.append(item)

            elif training_column == "trainer first name":
                trainer_firstname_list = __trainers__.filter(
                    Q(firstname__icontains=search_training)
                )
                if date_form_from and date_form_to:
                    training_object = __trainings__.filter(
                        DateTime__range=[date_form_from, date_form_to]
                    )
                else:
                    training_object = __trainings__.all()
                __country_training_list__ = []
                for item in training_object:
                    for element in trainer_firstname_list:
                        if str(item.trainer_id) == str(element.id):
                            __country_training_list__.append(item)

            elif training_column == "trainer last name":
                trainer_lastname_list = __trainers__.filter(
                    Q(lastname__icontains=search_training)
                )
                if date_form_from and date_form_to:
                    training_object = __trainings__.filter(
                        DateTime__range=[date_form_from, date_form_to]
                    )
                else:
                    training_object = __trainings__.all()
                __country_training_list__ = []
                for item in training_object:
                    for element in trainer_lastname_list:
                        if str(item.trainer_id) == str(element.id):
                            __country_training_list__.append(item)

            elif training_column == "number of participant":
                training_column = training_column.replace(" ", "_")
                if date_form_from and date_form_to:
                    training_object = __trainings__.filter(
                        DateTime__range=[date_form_from, date_form_to]
                    )
                else:
                    training_object = __trainings__.all()
                params = {
                    "{}__icontains".format(training_column): search_training,
                }
                __country_training_list__ = training_object.filter(Q(**params))

            else:
                module_list = __trainings__.filter(
                    Q(module_name__icontains=search_training)
                )
                if date_form_from and date_form_to:
                    training_object = __trainings__.filter(
                        DateTime__range=[date_form_from, date_form_to]
                    )
                else:
                    training_object = __trainings__.all()
                __country_training_list__ = []
                for item in training_object:
                    for element in module_list:
                        if str(item.module_id) == str(element.id):
                            __country_training_list__.append(item)
                trainer_firstname_list = __trainers__.filter(
                    Q(firstname__icontains=search_training)
                )
                for item in training_object:
                    for element in trainer_firstname_list:
                        if str(item.trainer_id) == str(element.id):
                            __country_training_list__.append(item)
                trainer_lastname_list = __trainers__.filter(
                    Q(lastname__icontains=search_training)
                )
                for item in training_object:
                    for element in trainer_lastname_list:
                        if str(item.trainer_id) == str(element.id):
                            __country_training_list__.append(item)
                training_list_beta = __trainings__.filter(
                    Q(number_of_participant__icontains=search_training)
                )
                for item in training_list_beta:
                    __country_training_list__.append(item)
        elif department_form or commune_form:
            print("__trainings__ elif 1")
            if department_form:
                if date_form_from and date_form_to:
                    __country_training_list__ = __trainings__.filter(
                        Q(department__icontains=department_form),
                        DateTime__range=[date_form_from, date_form_to],
                    )
                else:
                    __country_training_list__ = __trainings__.filter(
                        Q(department__icontains=department_form)
                    )

            elif commune_form:
                if date_form_from and date_form_to:
                    __country_training_list__ = __trainings__.filter(
                        Q(commune__icontains=commune_form),
                        DateTime__range=[date_form_from, date_form_to],
                    )
                else:
                    __country_training_list__ = __trainings__.filter(
                        Q(commune__icontains=commune_form)
                    )
        elif date_form_from and date_form_to:
            print("__trainings__ elif 2")
            __country_training_list__ = __trainings__.filter(
                DateTime__range=[date_form_from, date_form_to]
            )
        else:
            print("__trainings__ else")
            print(__trainings__)
            __country_training_list__ = __trainings__.all()

        try:
            for elmt in __country_training_list__:
                time_diff = str(
                    datetime.combine(date.today(), elmt.end_hour)
                    - datetime.combine(date.today(), elmt.start_hour)
                )
                hours, minutes, seconds = time_diff.split(":")
                time_diff_str = (
                    f"{hours.zfill(2)}:{minutes.zfill(2)}:{seconds.zfill(2)}"
                )
                if not "-" in time_diff_str:
                    durations.append(time_diff_str)
                else:
                    durations.append("0")
        except Exception as e:
            print("ERROOR: ", e)
            pass

        # extend all trainings
        all_training_list.extend(__country_training_list__)

    if "pdf" in request.POST:
        try:
            titles_list = (
                "No",
                "Module Name",
                "Trainer First Name",
                "Trainer Last Name",
                "Trainer Organization",
                "Date",
                "Start Time",
                "End time",
                "Number of Participant",
                "Department",
                "Commune",
                "Duration",
            )

            i = 1
            training_data = []

            for training0 in all_training_list:
                if (training0.start_hour and training0.end_hour) and "nan" not in [
                    training0.start_hour,
                    training0.end_hour,
                ]:
                    time_diff = str(
                        datetime.combine(date.today(), training0.end_hour)
                        - datetime.combine(date.today(), training0.start_hour)
                    )
                    hours, minutes, seconds = time_diff.split(":")
                    time_diff_str = (
                        f"{hours.zfill(2)}:{minutes.zfill(2)}:{seconds.zfill(2)}"
                    )
                    if not "-" in time_diff_str:
                        time_diff_str = time_diff_str
                    else:
                        time_diff_str = "0"
                else:
                    time_diff_str = "--"

                training_data.append(
                    (
                        i,
                        (
                            training0.module_id.module_name
                            if training0.module_id.module_name
                            and training0.module_id.module_name != "nan"
                            else "--"
                        ),
                        (
                            training0.trainer_id.firstname
                            if training0.trainer_id.firstname
                            and training0.trainer_id.firstname != "nan"
                            else "--"
                        ),
                        (
                            training0.trainer_id.lastname
                            if training0.trainer_id.lastname
                            and training0.trainer_id.lastname != "nan"
                            else "--"
                        ),
                        (
                            training0.trainer_id.institution
                            if training0.trainer_id.institution
                            and training0.trainer_id.institution != "nan"
                            else "--"
                        ),
                        (
                            training0.DateTime.strftime("%Y-%m-%d")
                            if training0.DateTime and training0.DateTime != "nan"
                            else "--"
                        ),
                        (
                            training0.start_hour.strftime("%H:%M")
                            if training0.start_hour and training0.start_hour != "nan"
                            else "--"
                        ),
                        (
                            training0.end_hour.strftime("%H:%M")
                            if training0.end_hour and training0.end_hour != "nan"
                            else "--"
                        ),
                        (
                            training0.number_of_participant
                            if training0.number_of_participant
                            and training0.number_of_participant != "nan"
                            else "--"
                        ),
                        (
                            training0.department
                            if training0.department and training0.department != "nan"
                            else "--"
                        ),
                        (
                            training0.commune
                            if training0.commune and training0.commune != "nan"
                            else "--"
                        ),
                        time_diff_str,
                    )
                )
                i += 1
            if date_form_from and date_form_to:
                response = export_pdf(
                    datas_name="Trainings",
                    paper_type="A2",
                    paper_format=A2,
                    title_list=titles_list,
                    elemts_list=training_data,
                    date_from=date_form_from,
                    date_to=date_form_to,
                )
            else:
                response = export_pdf(
                    datas_name="Trainings",
                    paper_type="A2",
                    paper_format=A2,
                    title_list=titles_list,
                    elemts_list=training_data,
                )
        except Exception as e:
            print("ERROOR: ", e)
            pass

    elif "xls" in request.POST:
        try:
            response = HttpResponse(content_type="application/ms-excel")
            if "/fr/" in request.build_absolute_uri():
                response["Content-Disposition"] = (
                    "attachement; filename=formations" + str(datetime.now()) + ".xls"
                )
            elif "/en/" in request.build_absolute_uri():
                response["Content-Disposition"] = (
                    "attachement; filename=trainings" + str(datetime.now()) + ".xls"
                )
            wb = xlwt.Workbook(encoding=" utf-8")
            ws = wb.add_sheet("Trainings")
            row_num = 0
            font_style = xlwt.XFStyle()
            font_style.font.bold = True

            columns = [
                "No",
                gettext("Module Name"),
                gettext("Trainer First Name"),
                gettext("Trainer Last Name"),
                gettext("Trainer Organization"),
                gettext("Date"),
                gettext("Start Time"),
                gettext("End Time"),
                gettext("Number of Participant"),
                gettext("Department"),
                gettext("Commune"),
                gettext("Duration"),
            ]

            for col_num in range(len(columns)):
                ws.write(row_num, col_num, columns[col_num], font_style)

            font_style = xlwt.XFStyle()

            rows = []

            i = 1
            for training in all_training_list:
                if (training.start_hour and training.end_hour) and "nan" not in [
                    training.start_hour,
                    training.end_hour,
                ]:
                    time_diff = str(
                        datetime.combine(date.today(), training.end_hour)
                        - datetime.combine(date.today(), training.start_hour)
                    )
                    hours, minutes, seconds = time_diff.split(":")
                    time_diff_str = (
                        f"{hours.zfill(2)}:{minutes.zfill(2)}:{seconds.zfill(2)}"
                    )
                    if not "-" in time_diff_str:
                        time_diff_str = time_diff_str
                    else:
                        time_diff_str = "0"
                else:
                    time_diff_str = "--"
                rows.append(
                    (
                        i,
                        training.module_id.module_name,
                        training.trainer_id.firstname,
                        training.trainer_id.lastname,
                        training.trainer_id.institution,
                        training.DateTime.strftime("%Y-%m-%d"),
                        training.start_hour.strftime("%H:%M"),
                        training.end_hour.strftime("%H:%M"),
                        training.number_of_participant,
                        training.department,
                        training.commune,
                        time_diff_str,
                    )
                )
                i += 1

            for row in rows:
                row_num += 1

                for col_num in range(len(row)):
                    ws.write(row_num, col_num, str(row[col_num]), font_style)
            wb.save(response)
        except Exception as e:
            print("ERROOR: ", e)
            pass

    elif "csv" in request.POST:
        try:
            response = HttpResponse(content_type="text/csv")
            if "/fr/" in request.build_absolute_uri():
                response["Content-Disposition"] = (
                    "attachement; filename=formation" + str(datetime.now()) + ".csv"
                )
            elif "/en/" in request.build_absolute_uri():
                response["Content-Disposition"] = (
                    "attachement; filename=training" + str(datetime.now()) + ".csv"
                )
            writer = csv.writer(response)
            writer.writerow(
                [
                    "No",
                    gettext("Module Name"),
                    gettext("Trainer First Name"),
                    gettext("Trainer Last Name"),
                    gettext("Trainer Organization"),
                    gettext("Date"),
                    gettext("Start Time"),
                    gettext("End Time"),
                    gettext("Number of Participant"),
                    gettext("Department"),
                    gettext("Commune"),
                    gettext("Duration"),
                ]
            )

            i = 1
            for training in all_training_list:
                if (training.start_hour and training.end_hour) and "nan" not in [
                    training.start_hour,
                    training.end_hour,
                ]:
                    time_diff = str(
                        datetime.combine(date.today(), training.end_hour)
                        - datetime.combine(date.today(), training.start_hour)
                    )
                    hours, minutes, seconds = time_diff.split(":")
                    time_diff_str = (
                        f"{hours.zfill(2)}:{minutes.zfill(2)}:{seconds.zfill(2)}"
                    )
                    if not "-" in time_diff_str:
                        hours, minutes, seconds = time_diff.split(":")
                        time_diff_str = time_diff_str
                    else:
                        time_diff_str = "0"
                else:
                    time_diff_str = "--"
                writer.writerow(
                    [
                        i,
                        training.module_id.module_name,
                        training.trainer_id.firstname,
                        training.trainer_id.lastname,
                        training.trainer_id.institution,
                        training.DateTime.strftime("%Y-%m-%d"),
                        training.start_hour.strftime("%H:%M"),
                        training.end_hour.strftime("%H:%M"),
                        training.number_of_participant,
                        training.department,
                        training.commune,
                        time_diff_str,
                    ]
                )
                i += 1
        except Exception as e:
            print("ERROOR: ", e)
            pass

    # page = request.GET.get("page", 1)

    # paginator = Paginator(training_list, 10)

    # page_range = paginator.get_elided_page_range(number=page)
    # try:
    #     trainings = paginator.page(page)
    # except PageNotAnInteger:
    #     trainings = paginator.page(1)
    # except EmptyPage:
    #     trainings = paginator.page(paginator.num_pages)
    country = None
    if request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN:
        if country_search != "all":
            country = country_search
    else:
        country = request.user.remuser.country_id.all()[0]
    context["trainings"] = all_training_list
    context["durations"] = durations
    context["segment"] = "trainings"
    # context["page_range"] = page_range
    context["department_form"] = DepartmentChoice(
        initial={"department": request.GET.get("department")}, country=country
    )
    context["commune_form"] = CommuneChoice(
        initial={"commune": request.GET.get("commune")}, country=country
    )
    context["form"] = TrainingSearch(
        initial={
            "column": request.GET.get("column", ""),
        }
    )
    context["date_duration_get_form"] = KorDateForm(
        initial={
            "my_date_field": request.GET.get("my_date_field"),
            "my_date_field1": request.GET.get("my_date_field1"),
        }
    )
    return response if response else render(request, "dashboard/training.html", context)


@login_required(login_url="/")
@has_admin_and_superuser_role(
    roles_list=[
        RemRolesList.GLOBAL_ADMIN,
        RemRolesList.COUNTRY_ADMIN,
        RemRolesList.SUPERUSER,
    ]
)
def shipment(request):
    context = {}
    nurseries_list = models.Nursery.objects.filter(status=utils.Status.ACTIVE)

    page = request.GET.get("page", 1)

    paginator = Paginator(nurseries_list, 10)

    page_range = paginator.get_elided_page_range(number=page)
    try:
        nurseries = paginator.page(page)
    except PageNotAnInteger:
        nurseries = paginator.page(1)
    except EmptyPage:
        nurseries = paginator.page(paginator.num_pages)

    context["nurseries"] = nurseries
    context["segment"] = "shipment"
    context["page_range"] = page_range
    return render(request, "dashboard/shipment.html", context)


@login_required(login_url="/")
def analytics(request):
    context = {}
    kor_date_period = gettext("KOR Graph against date period")
    __open_ssh_tunnel__()
    country = None
    main_query = "SELECT kor, location_region, location_country FROM free_qar_result"
    commune_query = (
        "SELECT kor, location_sub_region, location_country FROM free_qar_result"
    )
    (
        department_sum_list,
        department_names,
        commune_names,
        commune_sum_list,
    ) = get_data_based_on_role(request, main_query, commune_query)
    remuser: RemUser = request.user.remuser

    if request.method == "POST":
        form = KorDateForm(data=request.POST or None)
        country_form = CountryChoice(data=request.POST or None)
        # TODO Revalidate this condition,
        if (
            country_form.is_valid()
            and request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
        ) or request.user.remuser.role.role_name != RemRolesList.GLOBAL_ADMIN:
            country = country_form.cleaned_data.get("country")
            __open_ssh_tunnel__()
            main_query = (
                "SELECT kor,location_region,location_country FROM free_qar_result"
            )
            commune_query = (
                "SELECT kor, location_sub_region, location_country FROM free_qar_result"
            )
            (
                department_sum_list,
                department_names,
                commune_names,
                commune_sum_list,
            ) = get_data_based_on_role(
                request,
                main_query,
                commune_query,
                country if country != gettext("all") else None,
            )
            dep_commune_sum_list = []
            dep_commune_names = []
            print("ok")
            per_kor = []
            kor_time = []
            form1 = DepartmentChoice(
                data=request.POST or None,
                country=country if country != gettext("all") else None,
            )
            if form1.is_valid():
                print("ok1")
                try:
                    department_names_ = form1.cleaned_data.get("department")
                    department_with_department = (
                        department_names_.capitalize() + " Department"
                    )
                    if (
                        remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == gettext("all")
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT kor, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query, (department_names_, department_with_department)
                        )
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT kor, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_country=%s AND location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query,
                            (country, department_names_, department_with_department),
                        )
                    dep_commune_sorted = sorted(dep_commune, key=lambda name: name[1])
                    dep_commune_with_duplicate = [
                        info[1] for info in dep_commune_sorted
                    ]
                    dep_comm_occurence = collections.Counter(
                        dep_commune_with_duplicate
                    ).items()
                    dep_commune_names = sorted(set(dep_commune_with_duplicate))
                    dep_commune_init = {name: 0 for name in dep_commune_names}
                    for info in dep_commune_sorted:
                        for name in dep_commune_init:
                            if name == info[1]:
                                dep_commune_init[name] += round(info[0])
                    for occur in dep_comm_occurence:
                        for name in dep_commune_init:
                            if name == occur[0]:
                                dep_commune_init[name] /= occur[1]
                    dep_commune_sum_list = list(dep_commune_init.items())
                    dep_commune_sum = []
                    dep_commune_names = []
                    for x in dep_commune_sum_list:
                        print(x[1])
                        dep_commune_sum.append(x[1])
                        dep_commune_names.append(x[0])
                except Exception as e:
                    print(e)
            if form.is_valid():
                print("ok2")
                try:
                    date1 = form.cleaned_data.get("my_date_field")
                    date1 = date1.replace(day=1)
                    date2 = form.cleaned_data.get("my_date_field1")
                    date2 = date2.replace(day=1)

                    if (
                        remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == gettext("all")
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT kor, location_country, created_at FROM free_qar_result WHERE created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (date1, date2))
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT kor, location_country, created_at FROM free_qar_result WHERE location_country=%s AND created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (country, date1, date2))
                    lite = sorted(lite, key=lambda kor_: kor_[2])

                    month_with_duplicate = [kor[2].strftime("%m/%Y") for kor in lite]
                    month_sorted = sorted(set(month_with_duplicate))

                    month_occurence = collections.Counter(month_with_duplicate).items()
                    month_init = {month: 0 for month in month_sorted}
                    for dates in lite:
                        for month in month_init:
                            if month == dates[2].strftime("%m/%Y"):
                                month_init[month] += round(dates[0])
                    for occur in month_occurence:
                        for month in month_init:
                            if month == occur[0]:
                                month_init[month] /= occur[1]
                    month_kor_list = sorted(
                        month_init.items(), key=lambda kor_: kor_[0]
                    )
                    per_kor = [x[1] for x in month_kor_list]
                    kor_time = [x[0] for x in month_kor_list]
                except Exception as e:
                    print(e)

    else:
        print("bad")
        country = None
        if not remuser.role.role_name == RemRolesList.GLOBAL_ADMIN:
            country = remuser.country_id.all()[0].country_name
        form = KorDateForm()
        form1 = DepartmentChoice(country=country)
        country_form = CountryChoice()

        # Filter the choices and update the form field choices
        country_names = [
            country.country_name.upper() for country in remuser.country_id.all()
        ]
        filtered_choices = [
            (code, name)
            for code, name in country_form.fields["country"].choices
            if (code.upper() in country_names or code == "all")
        ]
        country_form.fields["country"].choices = filtered_choices

        dep_commune_sum = []
        dep_commune_names = []
        kor_time = []
        per_kor = []
    context["commune_name"] = commune_names
    context["commune_sum_list"] = commune_sum_list
    context["department_name"] = department_names
    context["department_sum_list"] = department_sum_list
    context["per_kor"] = per_kor
    context["kor_time"] = kor_time
    context["form"] = form
    context["segment"] = "analytics"
    context["Department_choice"] = form1
    context["country_form"] = country_form
    context["dep_commune_names"] = dep_commune_names
    context["dep_commune_sum_list"] = dep_commune_sum
    context["kor_date_period"] = kor_date_period
    __close_ssh_tunnel__()
    return render(request, "dashboard/analytics.html", context)


@login_required(login_url="/")
def nut_count(request):
    context = {}
    nut_date_period = gettext("Nut count Graph against date period")
    __open_ssh_tunnel__()
    country = None
    main_query = (
        "SELECT nut_count,location_region,location_country FROM free_qar_result"
    )
    commune_query = (
        "SELECT nut_count, location_sub_region, location_country FROM free_qar_result"
    )
    (
        department_sum_list,
        department_names,
        commune_names,
        commune_sum_list,
    ) = get_data_based_on_role(
        request,
        main_query,
        commune_query,
    )
    if request.method == "POST":
        form = KorDateForm(data=request.POST or None)
        country_form = CountryChoice(data=request.POST or None)
        if (
            country_form.is_valid()
            and request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
        ) or request.user.remuser.role.role_name != RemRolesList.GLOBAL_ADMIN:
            country = country_form.cleaned_data.get("country")
            __open_ssh_tunnel__()
            main_query = (
                "SELECT nut_count,location_region,location_country FROM free_qar_result"
            )
            commune_query = "SELECT nut_count, location_sub_region, location_country FROM free_qar_result"
            (
                department_sum_list,
                department_names,
                commune_names,
                commune_sum_list,
            ) = get_data_based_on_role(
                request,
                main_query,
                commune_query,
                country if country != gettext("all") else None,
            )
            dep_commune_sum_list = []
            dep_commune_names = []
            per_Nut_count = []
            Nut_count_time = []
            form1 = DepartmentChoice(
                data=request.POST or None,
                country=country if country != gettext("all") else None,
            )
            if form1.is_valid():
                try:
                    department_names_ = form1.cleaned_data.get("department")
                    department_with_department = (
                        department_names_.capitalize() + " Department"
                    )
                    if (
                        request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == "all"
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT nut_count, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query, (department_names_, department_with_department)
                        )
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT nut_count, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_country=%s AND location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query,
                            (country, department_names_, department_with_department),
                        )
                    dep_commune_sorted = sorted(dep_commune, key=lambda name: name[1])
                    dep_commune_with_duplicate = [
                        info[1] for info in dep_commune_sorted
                    ]
                    dep_comm_occurence = collections.Counter(
                        dep_commune_with_duplicate
                    ).items()
                    dep_commune_names = sorted(set(dep_commune_with_duplicate))
                    dep_commune_init = {name: 0 for name in dep_commune_names}
                    for info in dep_commune_sorted:
                        for name in dep_commune_init:
                            if name == info[1]:
                                dep_commune_init[name] += round(info[0])
                    for occur in dep_comm_occurence:
                        for name in dep_commune_init:
                            if name == occur[0]:
                                dep_commune_init[name] /= occur[1]
                    dep_commune_sum_list = list(dep_commune_init.items())
                    dep_commune_sum = []
                    dep_commune_names = []
                    for x in dep_commune_sum_list:
                        dep_commune_sum.append(x[1])
                        dep_commune_names.append(x[0])
                except Exception as e:
                    print(e)
            if form.is_valid():
                try:
                    date1 = form.cleaned_data.get("my_date_field")
                    date1 = date1.replace(day=1)
                    date2 = form.cleaned_data.get("my_date_field1")
                    date2 = date2.replace(day=1)

                    if (
                        request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == "all"
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT nut_count, location_country, created_at FROM free_qar_result WHERE created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (date1, date2))
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT nut_count, location_country, created_at FROM free_qar_result WHERE location_country=%s AND created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (country, date1, date2))
                    lite = sorted(lite, key=lambda kor_: kor_[2])

                    month_with_duplicate = [kor[2].strftime("%m/%Y") for kor in lite]
                    month_sorted = sorted(set(month_with_duplicate))

                    month_occurence = collections.Counter(month_with_duplicate).items()
                    month_init = {month: 0 for month in month_sorted}
                    for dates in lite:
                        for month in month_init:
                            if month == dates[2].strftime("%m/%Y"):
                                month_init[month] += round(dates[0])
                    for occur in month_occurence:
                        for month in month_init:
                            if month == occur[0]:
                                month_init[month] /= occur[1]
                    month_kor_list = sorted(
                        month_init.items(), key=lambda kor_: kor_[0]
                    )
                    per_Nut_count = [x[1] for x in month_kor_list]
                    Nut_count_time = [x[0] for x in month_kor_list]
                except Exception as e:
                    print(e)

    else:
        country = None
        if not request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN:
            country = request.user.remuser.country_id.all()[0].country_name
        form = KorDateForm()
        form1 = DepartmentChoice(country=country)
        country_form = CountryChoice()
        dep_commune_sum = []
        dep_commune_names = []
        Nut_count_time = []
        per_Nut_count = []

    context["commune_name"] = commune_names
    context["commune_sum_list"] = commune_sum_list
    context["department_name"] = department_names
    context["department_sum_list"] = department_sum_list
    context["per_Nut_count"] = per_Nut_count
    context["Nut_count_time"] = Nut_count_time
    context["form"] = form
    context["country_form"] = country_form
    context["segment"] = "analytics"
    context["Department_choice"] = form1
    context["dep_commune_names"] = dep_commune_names
    context["dep_commune_sum_list"] = dep_commune_sum
    context["nut_date_period"] = nut_date_period
    __close_ssh_tunnel__()
    return render(request, "dashboard/nut_count.html", context)


@login_required(login_url="/")
def defective_rate(request):
    context = {}
    defective_date_period = gettext("Defective rate Graph against date period")
    __open_ssh_tunnel__()
    country = None
    main_query = (
        "SELECT defective_rate,location_region,location_country FROM free_qar_result"
    )
    commune_query = "SELECT defective_rate, location_sub_region, location_country FROM free_qar_result"
    (
        department_sum_list,
        department_names,
        commune_names,
        commune_sum_list,
    ) = get_data_based_on_role(
        request,
        main_query,
        commune_query,
        country if country != "all" else None,
    )
    if request.method == "POST":
        form = KorDateForm(data=request.POST or None)
        country_form = CountryChoice(data=request.POST or None)
        if (
            country_form.is_valid()
            and request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
        ) or request.user.remuser.role.role_name != RemRolesList.GLOBAL_ADMIN:
            country = country_form.cleaned_data.get("country")
            __open_ssh_tunnel__()
            main_query = "SELECT defective_rate,location_region,location_country FROM free_qar_result"
            commune_query = "SELECT defective_rate, location_sub_region, location_country FROM free_qar_result"
            (
                department_sum_list,
                department_names,
                commune_names,
                commune_sum_list,
            ) = get_data_based_on_role(
                request,
                main_query,
                commune_query,
                country if country != gettext("all") else None,
            )

            dep_commune_sum_list = []
            dep_commune_names = []
            per_defective_rate = []
            defective_rate_time = []
            form1 = DepartmentChoice(
                data=request.POST or None,
                country=country if country != gettext("all") else None,
            )
            if form1.is_valid():
                try:
                    department_names_ = form1.cleaned_data.get("department")
                    department_with_department = (
                        department_names_.capitalize() + " Department"
                    )
                    if (
                        request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == "all"
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT defective_rate, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query, (department_names_, department_with_department)
                        )
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT defective_rate, location_sub_region, location_region, location_country FROM free_qar_result WHERE location_country=%s AND location_region=%s OR location_region=%s"
                        dep_commune = get_info_from_database(
                            query,
                            (country, department_names_, department_with_department),
                        )
                    dep_commune_sorted = sorted(dep_commune, key=lambda name: name[1])
                    dep_commune_with_duplicate = [
                        info[1] for info in dep_commune_sorted
                    ]
                    dep_comm_occurence = collections.Counter(
                        dep_commune_with_duplicate
                    ).items()
                    dep_commune_names = sorted(set(dep_commune_with_duplicate))
                    dep_commune_init = {name: 0 for name in dep_commune_names}
                    for info in dep_commune_sorted:
                        for name in dep_commune_init:
                            if name == info[1]:
                                dep_commune_init[name] += round(info[0])
                    for occur in dep_comm_occurence:
                        for name in dep_commune_init:
                            if name == occur[0]:
                                dep_commune_init[name] /= occur[1]
                    dep_commune_sum_list = list(dep_commune_init.items())
                    dep_commune_sum = []
                    dep_commune_names = []
                    for x in dep_commune_sum_list:
                        dep_commune_sum.append(x[1])
                        dep_commune_names.append(x[0])
                except Exception as e:
                    print(e)
            if form.is_valid():
                try:
                    date1 = form.cleaned_data.get("my_date_field")
                    date1 = date1.replace(day=1)
                    date2 = form.cleaned_data.get("my_date_field1")
                    date2 = date2.replace(day=1)

                    if (
                        request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN
                        and country == "all"
                    ):
                        __open_ssh_tunnel__()
                        query = "SELECT defective_rate, location_country, created_at FROM free_qar_result WHERE created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (date1, date2))
                    else:
                        __open_ssh_tunnel__()
                        query = "SELECT defective_rate, location_country, created_at FROM free_qar_result WHERE location_country=%s AND created_at BETWEEN %s AND %s"
                        lite = get_info_from_database(query, (country, date1, date2))
                    lite = sorted(lite, key=lambda kor_: kor_[2])

                    month_with_duplicate = [kor[2].strftime("%m/%Y") for kor in lite]
                    month_sorted = sorted(set(month_with_duplicate))

                    month_occurence = collections.Counter(month_with_duplicate).items()
                    month_init = {month: 0 for month in month_sorted}
                    for dates in lite:
                        for month in month_init:
                            if month == dates[2].strftime("%m/%Y"):
                                month_init[month] += round(dates[0])
                    for occur in month_occurence:
                        for month in month_init:
                            if month == occur[0]:
                                month_init[month] /= occur[1]
                    month_kor_list = sorted(
                        month_init.items(), key=lambda kor_: kor_[0]
                    )
                    per_defective_rate = [x[1] for x in month_kor_list]
                    defective_rate_time = [x[0] for x in month_kor_list]
                except Exception as e:
                    print(e)

    else:
        country = None
        if not request.user.remuser.role.role_name == RemRolesList.GLOBAL_ADMIN:
            country = request.user.remuser.country_id.all()[0].country_name
        form = KorDateForm()
        form1 = DepartmentChoice(country=country)
        country_form = CountryChoice()
        dep_commune_sum = []
        dep_commune_names = []
        defective_rate_time = []
        per_defective_rate = []

    context["commune_name"] = commune_names
    context["commune_sum_list"] = commune_sum_list
    context["department_name"] = department_names
    context["department_sum_list"] = department_sum_list
    context["per_defective_rate"] = per_defective_rate
    context["defective_rate_time"] = defective_rate_time
    context["form"] = form
    context["segment"] = "analytics"
    context["Department_choice"] = form1
    context["country_form"] = country_form
    context["dep_commune_names"] = dep_commune_names
    context["dep_commune_sum_list"] = dep_commune_sum
    context["defective_date_period"] = defective_date_period
    __close_ssh_tunnel__()
    return render(request, "dashboard/defective_rate.html", context)
