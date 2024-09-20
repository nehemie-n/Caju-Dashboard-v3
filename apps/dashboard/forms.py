# -*- encoding: utf-8 -*-
import datetime
from datetime import date, time

from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.forms import ModelForm, TimeInput
from django.utils.translation import gettext_lazy as _

from apps.authentication.models import (
    RemRole,
    RemUser,
    RemOrganization,
    RemUserAccessRequest,
)
from apps.dashboard.utils import (
    clean_department_names,
    generate_commune_choices,
    generate_country_choices,
    generate_department_choices,
    get_location_regions,
)
from apps.dashboard.models import Country

from phonenumber_field.formfields import PhoneNumberField
from phonenumber_field.widgets import PhoneNumberPrefixWidget


class UserBaseProfileForm(ModelForm):
    def clean(self):
        email = self.cleaned_data.get("email")
        if (
            User.objects.filter(email=email).exists()
            or RemUserAccessRequest.objects.filter(email=email).exists()
        ):
            raise ValidationError({"email": "Email exists or requested"})

        username = self.cleaned_data.get("username")
        if (
            User.objects.filter(username=username).exists()
            or RemUserAccessRequest.objects.filter(username=username).exists()
        ):
            raise ValidationError({"username": "Username exists or requested"})

        return self.cleaned_data

    class Meta:
        model = User
        widgets = {
            "username": forms.TextInput(
                attrs={
                    "placeholder": "Username",
                    "class": "form-control",
                    "type": "text",
                    "id": "input-username",
                    "name": "username",
                }
            ),
            "email": forms.EmailInput(
                attrs={
                    "placeholder": "E-mail",
                    "class": "form-control",
                    "type": "email",
                    "id": "input-email",
                    "name": "email_address",
                }
            ),
            "first_name": forms.TextInput(
                attrs={
                    "placeholder": "First Name",
                    "class": "form-control",
                    "type": "text",
                    "id": "input-first-name",
                    "name": "first_name",
                }
            ),
            "last_name": forms.TextInput(
                attrs={
                    "placeholder": "Last Name",
                    "class": "form-control",
                    "type": "text",
                    "id": "input-last-name",
                    "name": "last_name",
                }
            ),
        }
        fields = [
            # 'username',
            # 'email',
            "first_name",
            "last_name",
        ]


class UserCustomProfileForm(ModelForm):
    phone = PhoneNumberField(
        required=False,
        widget=PhoneNumberPrefixWidget(
            initial="BJ",
            attrs={
                "autocomplete": "off",
                "class": "form-control",

            },
            country_attrs={
                "class": "form-control",
            },
        ),
    )

    organization = forms.ModelChoiceField(
        queryset=RemOrganization.objects.filter(status=1).exclude(),
        empty_label="Not Listed",
        required=False,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "id": "id_organization",
            }
        ),
    )
    organization_name = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Organization name",
                "class": "form-control",
                "id": "organization_name",
            }
        ),
    )
    country_id = forms.ModelMultipleChoiceField(
        queryset=Country.objects.filter(status=1),
        # empty_label="Not Listed",
        required=False,
        widget=forms.SelectMultiple(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "id": "id_country",
            }
        ),
    )

    role = forms.ModelChoiceField(
        queryset=RemRole.objects.filter(status=1),
        empty_label="Not Listed",
        required=False,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "id": "id_role",
            }
        ),
    )

    def __init__(self, *args, **kwargs):
        instance = kwargs.get("instance")
        user = kwargs.pop("user", None)
        user_phone = kwargs.pop("user_phone", None)
        page = kwargs.pop("page", None)
        super(UserCustomProfileForm, self).__init__(*args, **kwargs)

        if user:
            rem_user = RemUser.objects.get(user=user)
            queryset = RemOrganization.objects.filter(status=1)

            if queryset.exists():
                self.fields["organization"].queryset = queryset
            if user_phone:
                self.fields["phone"].initial = user_phone
                self.fields["phone"].widget = forms.HiddenInput()

    class Meta:
        model = RemUser
        fields = ["phone", "organization", "organization_name", "role", "country_id"]


class DateInput(forms.DateInput):
    input_type = "date"


class KorDateForm(forms.Form):
    my_date_field = forms.DateField(
        label=_("From"),
        required=False,
        initial=str(
            date(
                year=datetime.datetime.now().year - 1,
                month=datetime.datetime.now().month,
                day=1,
            )
        ),
        widget=DateInput(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )
    my_date_field1 = forms.DateField(
        label=_("To"),
        required=False,
        initial=str(date.today()),
        widget=DateInput(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class DepartmentChoice(forms.Form):
    def __init__(self, *args, **kwargs):
        country = kwargs.pop("country", None)
        super().__init__(*args, **kwargs)
        self.fields["department"].choices = generate_department_choices(
            clean_department_names(get_location_regions(country))
        )

    department = forms.ChoiceField(
        choices=generate_department_choices(
            clean_department_names(get_location_regions())
        ),
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class CommuneChoice(forms.Form):
    def __init__(self, *args, **kwargs):
        country = kwargs.pop("country", None)
        super().__init__(*args, **kwargs)
        self.fields["commune"].choices = generate_commune_choices(country)

    commune = forms.ChoiceField(
        choices=generate_commune_choices(),
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class CountryChoice(forms.Form):
    country = forms.ChoiceField(
        choices=generate_country_choices(),
        initial="all",
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class NurserySearch(forms.Form):
    column = forms.ChoiceField(
        choices=(
            ("all", _("All")),
            ("nursery name", _("NURSERY NAME")),
            ("owner first name", _("OWNER FIRST NAME")),
            ("owner last name", _("OWNER LAST NAME")),
            ("nursery address", _("NURSERY ADDRESS")),
            ("country", _("COUNTRY")),
            ("commune", _("COMMUNE")),
            ("current area", _("CURRENT AREA")),
            ("latitude", _("LATITUDE")),
            ("longitude", _("LONGITUDE")),
            ("altitude", _("ALTITUDE")),
            ("partner", _("PARTNER")),
            ("number of plants", _("NUMBER OF PLANTS")),
        ),
        widget=forms.Select(
            attrs={
                "class": "form-control mr-sm-2",
                "style": "border-color: none;",
            }
        ),
    )
    nurseries_country = forms.ChoiceField(
        choices=[
            ("all", _("All")),
        ]
        + [
            (country.country_name, country.country_name.upper())
            for country in Country.objects.filter(status=1)
        ],
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class BeninYieldSearch(forms.Form):
    column = forms.ChoiceField(
        choices=(
            ("all", _("All")),
            ("plantation name", _("PLANTATION NAME")),
            ("total yield kg", _("TOTAL YIELD KG")),
            ("total yield per ha kg", _("TOTAL YIELD PER HA KG")),
            ("total yield per tree kg", _("TOTAL YIELD PER TREE KG")),
            ("product id", _("PRODUCT ID")),
            ("total number trees", _("TOTAL NUMBER TREES")),
            ("total sick trees", _("TOTAL SICK TREES")),
            ("total dead trees", _("TOTAL DEAD TREES")),
            ("total trees out of prod", _("TOTAL TREES OUT OF PROD")),
            ("year", _("YEAR")),
        ),
        widget=forms.Select(
            attrs={
                "class": "form-control mr-sm-2",
                "style": "border-color: none;",
            }
        ),
    )
    yields_country = forms.ChoiceField(
        choices=[
            ("all", _("All")),
        ]
        + [
            (country.country_name, country.country_name.upper())
            for country in Country.objects.filter(status=1)
        ],
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class PlantationsSearch(forms.Form):
    column = forms.ChoiceField(
        choices=(
            ("all", _("All")),
            ("plantation name", _("PLANTATION NAME")),
            ("plantation code", _("PLANTATION CODE")),
            ("owner first name", _("OWNER FIRST NAME")),
            ("owner last name", _("OWNER LAST NAME")),
            ("owner gender", _("OWNER GENDER")),
            ("total trees", _("TOTAL TREES")),
            ("country", _("COUNTRY")),
            ("department", _("DEPARTMENT")),
            ("commune", _("COMMUNE")),
            ("arrondissement", _("ARRONDISSEMENT")),
            ("village", _("village")),
            ("current area", _("CURRENT AREA")),
            ("latitude", _("LATITUDE")),
            ("longitude", _("LONGITUDE")),
            ("altitude", _("ALTITUDE")),
        ),
        widget=forms.Select(
            attrs={
                "class": "form-control mr-sm-2",
                "style": "border-color: none;",
            }
        ),
    )
    plantations_country = forms.ChoiceField(
        choices=[
            ("all", _("All")),
        ]
        + [
            (country.country_name, country.country_name.upper())
            for country in Country.objects.filter(status=1)
        ],
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class TrainingSearch(forms.Form):
    column = forms.ChoiceField(
        choices=(
            ("all", _("All")),
            ("module name", _("MODULE NAME")),
            ("trainer first name", _("TRAINER FIRST NAME")),
            ("trainer last name", _("TRAINER LAST NAME")),
            ("number of participant", _("NUMBER OF PARTICIPANT")),
            ("department", _("DEPARTMENT")),
            ("commune", _("COMMUNE")),
        ),
        widget=forms.Select(
            attrs={
                "class": "form-control mr-sm-2",
                "style": "border-color: none;",
            }
        ),
    )
    trainings_country = forms.ChoiceField(
        choices=[
            ("all", _("All")),
        ]
        + [
            (country.country_name, country.country_name.upper())
            for country in Country.objects.filter(status=1)
        ],
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class TrainingDateForm(forms.Form):
    training_date = forms.DateField(
        initial=str(date.today()),
        widget=DateInput(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
            }
        ),
    )


class TrainingTimeForm(forms.Form):
    training_time = forms.TimeField(
        initial=str(
            time(
                hour=datetime.datetime.now().hour, minute=datetime.datetime.now().minute
            )
        ),
        widget=TimeInput(
            format="%H:%M",
            attrs={
                "type": "time",
                "class": "form-control",
                "style": "border-color: none;",
            },
        ),
    )
