# -*- encoding: utf-8 -*-

from django import forms
from django.db.models import Q
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from .models import (
    RemRole,
    RemUser,
    RemUserAccessRequest,
    RemOrganization,
    RemRolesList,
)
from .utils import DateInput
from apps.dashboard.models import Country

from phonenumber_field.formfields import PhoneNumberField
from phonenumber_field.widgets import PhoneNumberPrefixWidget
import secrets
import string

ACTIVE = 1
INACTIVE = 0
Status = [
    (ACTIVE, "Active"),
    (INACTIVE, "Inactive"),
]

MALE = "male"
FEMALE = "female"
OTHERS = "others"

GenderChoices = [
    (MALE, "Male"),
    (FEMALE, "Female"),
    (FEMALE, "Others"),
]


class NewPassword(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={"placeholder": "Password", "class": "form-control"}
        )
    )

    password1 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={"placeholder": "Confirm Password", "class": "form-control"}
        )
    )

    def clean(self):
        password_ = self.cleaned_data.get("password")
        password__ = self.cleaned_data.get("password1")
        if password_ != password__:
            raise ValidationError(
                {
                    "password": "Password and confirm password do not match",
                    "password1": "Password and confirm password do not match",
                }
            )
        return self.cleaned_data

    class Meta:
        model = User
        fields = (
            "password",
            "password1",
        )


class ForgotPassword(forms.ModelForm):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={"placeholder": "Email", "class": "form-control"})
    )

    def clean(self):
        email = self.cleaned_data.get("email")
        if not User.objects.filter(email=email).exists():
            raise ValidationError({"email": "Email does not exists"})

        return self.cleaned_data

    class Meta:
        model = User
        fields = ("email",)


class LoginForm(forms.Form):
    username = forms.CharField(
        widget=forms.TextInput(
            attrs={"placeholder": "Username", "class": "form-control"}
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={"placeholder": "Password", "class": "form-control"}
        )
    )
    remember_me = forms.BooleanField(required=False)

    class Meta:
        model = User
        fields = ("username", "password", "remember_me")


class RegisterUserForm(UserCreationForm):
    username = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Username",
                "class": "form-control",
                "autocomplete": "off",
            }
        ),
    )
    first_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "First Name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    last_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Last Name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "placeholder": "Email",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    phone = PhoneNumberField(
        required=True,
        widget=PhoneNumberPrefixWidget(
            initial="AF",
            attrs={
                "autocomplete": "off",
                "class": "form-control",
                "placeholder": "xxxxxxxxx",
            },
            country_attrs={
                "class": "form-control",
            },
        ),
    )
    country_id = forms.ModelMultipleChoiceField(
        required=True,
        queryset=Country.objects.filter(status=ACTIVE),
        # empty_label="Select",
        widget=forms.SelectMultiple(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "autocomplete": "off",
                "id": "id_country",
            }
        ),
    )
    organization = forms.ModelChoiceField(
        queryset=RemOrganization.objects.filter(status=ACTIVE),
        empty_label="Select",
        required=True,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "autocomplete": "off",
                "id": "id_organization",
            }
        ),
    )
    organization_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Organization name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    role = forms.ModelChoiceField(
        queryset=RemRole.objects.filter(status=ACTIVE),
        empty_label="Select",
        required=False,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "autocomplete": "off",
                "id": "id_role",
            }
        ),
    )
    password1 = forms.CharField(
        required=False,
        widget=forms.PasswordInput(
            attrs={
                "placeholder": "Password",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    password2 = forms.CharField(
        required=False,
        widget=forms.PasswordInput(
            attrs={
                "placeholder": "Confirm Password",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )

    def __init__(self, *args, **kwargs):
        admin = kwargs.pop("user", None)
        super(RegisterUserForm, self).__init__(*args, **kwargs)
        # Before
        if admin:
            rem_admin = RemUser.objects.get(user=admin)
            """
            Global admin can register any role
            Country admin can only register up to country admin
            """
            if rem_admin.role.role_name == RemRolesList.GLOBAL_ADMIN:
                self.fields["role"].queryset = RemRole.objects.all()

            elif rem_admin.role.role_name == RemRolesList.COUNTRY_ADMIN:
                # If you are a country admin you can only provide access to your country and can't give an global admin role
                self.fields["role"].queryset = RemRole.objects.all().exclude(
                    Q(role_name=RemRolesList.GLOBAL_ADMIN)
                )
                self.fields["country_id"].queryset = Country.objects.filter(
                    Q(id__in=rem_admin.country_id.all())
                )

    def clean(self):
        """
        If the email or username is already assigned to a user or exists in access request
        They can't be assigned
        """
        del self.cleaned_data["password1"]
        del self.cleaned_data["password2"]

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

        password = self.cleaned_data.get("password1")
        password1 = self.cleaned_data.get("password2")
        if password != password1:
            raise ValidationError(
                {
                    "password1": "Password and confirm password do not match",
                    "password2": "Password and confirm password do not match",
                }
            )
        return self.cleaned_data

    class Meta:
        model = User
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
        )


class RequestAccessForm(forms.ModelForm):
    class Meta:
        model = RemUserAccessRequest
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "country_id",
            "organization",
            "organization_name",
            "reason",
            "comment",
        )

    username = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Username",
                "class": "form-control",
                "autocomplete": "off",
            }
        ),
    )
    first_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "First Name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    last_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Last Name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "placeholder": "Email",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    phone = PhoneNumberField(
        required=True,
        widget=PhoneNumberPrefixWidget(
            initial="+Code",  # from AF
            attrs={
                "autocomplete": "off",
                "class": "form-control",
                "placeholder": "xxxxxxxxx",
            },
            country_attrs={
                "placeholder": "+Code",
                "class": "form-control",
            },
        ),
    )
    country_id = forms.ModelMultipleChoiceField(
        required=True,
        queryset=Country.objects.filter(status=ACTIVE),
        # empty_label="Select country",
        widget=forms.SelectMultiple(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "autocomplete": "on",
                "id": "id_country",
            }
        ),
    )
    organization = forms.ModelChoiceField(
        queryset=RemOrganization.objects.all(),
        empty_label="Select organization type",
        required=True,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "autocomplete": "on",
                "id": "id_organization",
            }
        ),
    )
    organization_name = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Organization name",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    reason = forms.CharField(
        required=True,
        widget=forms.Textarea(
            attrs={
                "rows": 4,
                "cols": 15,
                "placeholder": "What kind of data are you requesting access to?",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )
    comment = forms.CharField(
        required=True,
        widget=forms.Textarea(
            attrs={
                "rows": 4,
                "cols": 15,
                "placeholder": "Admin comment about the request",
                "autocomplete": "off",
                "class": "form-control",
            }
        ),
    )

    def __init__(self, *args, **kwargs):
        page_type = kwargs.pop("page_type", None)
        super(RequestAccessForm, self).__init__(*args, **kwargs)
        if page_type and page_type == "registration_page":
            del self.fields["comment"]

    def clean(self):
        email = self.cleaned_data.get("email")
        if (
            User.objects.filter(email=email).exists()
            or RemUserAccessRequest.objects.filter(email=email).exists()
        ):
            raise ValidationError({"email": "Email exists or already claimed"})

        username = self.cleaned_data.get("username")
        if (
            User.objects.filter(username=username).exists()
            or RemUserAccessRequest.objects.filter(username=username).exists()
        ):
            raise ValidationError({"username": "Username exists or already claimed"})

        return self.cleaned_data


class RegisterRole(forms.ModelForm):
    role_name = forms.CharField(
        widget=forms.TextInput(attrs={"placeholder": "Role", "class": "form-control"})
    )

    class Meta:
        model = RemRole
        fields = ("role_name",)


class RequestProfileChangeForm(forms.Form):
    organization = forms.ModelChoiceField(
        queryset=RemOrganization.objects.filter(status=ACTIVE),
        empty_label="Select",
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
                "autocomplete": "off",
                "class": "form-control",
                "id": "id_organization_name",
            }
        ),
    )
    # TODO (Done) changed to select multiple countries
    country_id = forms.ModelMultipleChoiceField(
        queryset=Country.objects.filter(status=ACTIVE),
        # empty_label="Select",
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
        queryset=RemRole.objects.all(),
        empty_label="Select",
        required=False,
        widget=forms.Select(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "id": "id_role",
            }
        ),
    )
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "class": "form-control",
                "style": "border-color: none;",
                "id": "id_message",
            }
        ),
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super(RequestProfileChangeForm, self).__init__(*args, **kwargs)

        if user:
            queryset = RemOrganization.objects.filter(status=ACTIVE)

            if queryset.exists():
                self.fields["organization"].queryset = queryset
                self.fields["role"].queryset = RemRole.objects.filter(
                    status=ACTIVE
                ).exclude(role_name=RemRolesList.GLOBAL_ADMIN)
            else:
                self.fields["organization"].queryset = queryset
                self.fields["role"].queryset = RemRole.objects.filter(
                    status=ACTIVE
                ).exclude(role_name=RemRolesList.GLOBAL_ADMIN)
