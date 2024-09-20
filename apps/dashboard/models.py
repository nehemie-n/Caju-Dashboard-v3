from django.core.validators import RegexValidator, MaxValueValidator
from django.db import models
from django.db.models.fields.related import ForeignKey
from django.utils.translation import gettext_lazy as _
from apps.authentication.models import User
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models as gismodels
from django.contrib.gis import geos

# Create your models here.
ACTIVE = 1
INACTIVE = 0
Status = [
    (ACTIVE, "Active"),
    (INACTIVE, "Inactive"),
]


class Country(gismodels.Model):
    """
    Country now has a geomerty field
    """

    country_code = models.CharField(max_length=2, unique=True)
    latitude = models.FloatField(null=True, blank=False)
    longitude = models.FloatField(null=True, blank=False)
    country_name = models.CharField(max_length=80, unique=True)
    status = models.IntegerField(
        choices=Status,
        default=INACTIVE,
    )
    level0_name = models.CharField(max_length=200, default="Country")
    level1_name = models.CharField(max_length=200, default="Department")
    level2_name = models.CharField(max_length=200, default="Commune")
    level3_name = models.CharField(max_length=200, default="District")

    # Will now be having geometry instead of using GeoJSON
    geometry = gismodels.MultiPolygonField(null=True)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.country_name


class GAUL1(gismodels.Model):
    """
    Administrative level 1 model setup
    """

    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=200, null=False, blank=False)
    display = models.CharField(max_length=200, null=False, blank=False)
    size = models.FloatField(null=False, blank=False)
    geometry = gismodels.MultiPolygonField(null=False, blank=False)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class GAUL2(gismodels.Model):
    """
    Administrative level 2 model setup
    """

    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=False)
    GAUL1 = models.ForeignKey(GAUL1, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=200, null=False, blank=False)
    display = models.CharField(max_length=200, null=False, blank=False)
    size = models.FloatField(null=False, blank=False)
    geometry = gismodels.MultiPolygonField(null=False, blank=False)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class GAUL3(gismodels.Model):
    """
    Administrative level 3 model setup
    """

    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=False)
    GAUL1 = models.ForeignKey(GAUL1, on_delete=models.CASCADE, null=False)
    GAUL2 = models.ForeignKey(GAUL2, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=200, null=False, blank=False)
    display = models.CharField(max_length=200, null=False, blank=False)
    size = models.FloatField(null=False, blank=False)

    geometry = gismodels.MultiPolygonField(null=False, blank=False)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class ProtectedArea(gismodels.Model):
    """
    ProtectedArea model setup
    Most of the fields here were derived from the ones that the open dataset of protected areas has
    """

    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)

    name = models.CharField(max_length=300, null=False, blank=False)
    orig_name = models.CharField(max_length=300, null=False, blank=False)

    designation = models.CharField(max_length=200, null=False, blank=False)
    designation_type = models.CharField(max_length=200, null=False, blank=False)

    area = models.FloatField(null=False, blank=False)
    rep_area = models.FloatField(null=True, blank=True)

    gov_type = models.CharField(max_length=200, null=True, blank=True)
    own_type = models.CharField(max_length=200, null=True, blank=True)
    mang_auth = models.CharField(max_length=200, null=True, blank=True)

    status = models.CharField(max_length=200, null=False, blank=False)
    status_yr = models.IntegerField(null=True, blank=True)

    geometry = gismodels.MultiPolygonField(null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class Nursery(models.Model):
    class Status:
        ACTIVE = 1
        INACTIVE = 0

    class GenderChoices:
        MALE = "male", _("Male")
        FEMALE = "female", _("Female")
        OTHERS = "others", _("Others")

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
        (OTHERS, "Others"),
    ]

    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    nursery_name = models.CharField(max_length=200, unique=True)
    owner_first_name = models.CharField(max_length=200)
    owner_last_name = models.CharField(max_length=200)
    nursery_address = models.CharField(max_length=200)
    country = models.CharField(max_length=200)
    commune = models.CharField(max_length=200)
    current_area = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    altitude = models.FloatField(null=True, blank=True)
    partner = models.CharField(max_length=200, null=True, blank=True)
    status = models.IntegerField(
        choices=Status,
        default=ACTIVE,
    )
    number_of_plants = models.IntegerField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.nursery_name


class NurseryPlantsHistory(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    nursery_id = models.ForeignKey(Nursery, on_delete=models.CASCADE, null=True)
    year = models.IntegerField()
    season = models.IntegerField()
    total_plants = models.BigIntegerField()
    total_grafted = models.BigIntegerField()
    total_graft_holders = models.BigIntegerField()
    polyclonal = models.CharField(max_length=300)
    comment = models.CharField(max_length=300)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.total_plants


class MotherTree(models.Model):
    class Status:
        ACTIVE = 1
        INACTIVE = 0

    class GenderChoices:
        MALE = "male", _("Male")
        FEMALE = "female", _("Female")
        OTHERS = "others", _("Others")

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
        (OTHERS, "Others"),
    ]

    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    # id = models.BigAutoField(primary_key=True)
    mother_tree_name = models.CharField(max_length=200, unique=True)
    owner_first_name = models.CharField(max_length=200)
    owner_last_name = models.CharField(max_length=200)
    owner_gender = models.CharField(
        max_length=6,
        choices=GenderChoices,
        default=OTHERS,
    )
    owner_date_of_birth = models.DateField(blank=True, null=True)
    # owner_phone = PhoneNumberField(null=False, blank=False, unique=True)
    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
    )
    # validators should be a list
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    mother_tree_address = models.CharField(max_length=200)
    owner_address = models.CharField(max_length=200)
    country = models.CharField(max_length=200)
    department = models.CharField(max_length=200)
    commune = models.CharField(max_length=200)
    arrondissement = models.CharField(max_length=200)
    village = models.CharField(max_length=200)
    plantation_id = models.CharField(max_length=200)
    latitude = models.FloatField(null=False, blank=False)
    longitude = models.FloatField(null=True)
    altitude = models.FloatField(null=True)
    certified = models.BooleanField(default=False)
    certified_by = models.BigIntegerField(blank=True)
    certified_date = models.DateTimeField(blank=True, null=True)
    status = models.IntegerField(
        choices=Status,
        default=INACTIVE,
    )
    #
    created_by = models.BigIntegerField(blank=True, null=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    updated_date = models.DateTimeField(blank=True, null=True)
    data_source = models.CharField(max_length=500, null=False, blank=False)

    def __str__(self):
        return self.mother_tree_name


class Plantation(gismodels.Model):
    """
    Plantation model setup
    """

    class Status:
        ACTIVE = 1
        INACTIVE = 0

    class GenderChoices:
        MALE = "male", _("Male")
        FEMALE = "female", _("Female")
        OTHERS = "others", _("Others")

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
        (OTHERS, "Others"),
    ]

    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)

    plantation_name = models.CharField(max_length=200, unique=True)
    plantation_code = models.CharField(max_length=200, unique=True)

    # Added because of issue with BENIN Data having too many codes and plantations that have lots of mismatch
    shape_id = models.CharField(max_length=200, unique=True, null=True, blank=True)

    owner_first_name = models.CharField(max_length=200, blank=True, null=True)
    owner_last_name = models.CharField(max_length=200, blank=True, null=True)
    owner_gender = models.CharField(
        max_length=6,
        choices=GenderChoices,
        default=OTHERS,
    )
    total_trees = models.IntegerField(blank=True, null=True)
    country = models.CharField(max_length=200)
    department = models.CharField(max_length=200, blank=True, null=True)
    commune = models.CharField(max_length=200, blank=True, null=True)
    arrondissement = models.CharField(max_length=200, blank=True, null=True)
    village = models.CharField(max_length=200, blank=True, null=True)
    current_area = models.FloatField(blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    altitude = models.FloatField(null=True, blank=True)
    status = models.IntegerField(
        choices=Status,
        default=ACTIVE,
    )

    data_source = models.CharField(max_length=500, null=False, blank=False)

    #
    geometry = gismodels.MultiPolygonField(null=True, blank=False)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.plantation_name


class BeninYield(models.Model):
    """
    Store yield related data,

    Has some duplicated information of plantation, use the below query to get the data from cross tables
    SELECT dashboard_beninyield.plantation_name, dashboard_plantation.plantation_name FROM `dashboard_beninyield` join dashboard_plantation on dashboard_beninyield.plantation_code = dashboard_plantation.plantation_code;
    """

    class Status:
        ACTIVE = 1
        INACTIVE = 0

    ACTIVE = 1
    INACTIVE = 0
    Status = [
        (ACTIVE, "Active"),
        (INACTIVE, "Inactive"),
    ]

    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    plantation_name = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    plantation_code = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    department = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    commune = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    district = models.CharField(
        max_length=200, null=True
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    arrondissement = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    village = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    owner_first_name = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    owner_last_name = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    plantation_code = models.CharField(max_length=200)
    surface_area = models.FloatField(null=True)
    total_yield_kg = models.FloatField()
    total_yield_per_ha_kg = models.FloatField()
    total_yield_per_tree_kg = models.FloatField()
    sex = models.CharField(
        max_length=200
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    plantation_id = models.ForeignKey(Plantation, on_delete=models.CASCADE, null=True)
    product_id = models.CharField(max_length=60)
    total_number_trees = models.FloatField()
    total_sick_trees = models.FloatField()
    total_dead_trees = models.FloatField()
    total_trees_out_of_prod = models.FloatField()
    plantation_age = models.FloatField()
    latitude = models.FloatField(
        null=False, blank=False
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    longitude = models.FloatField(
        null=True
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    altitude = models.FloatField(
        null=True, blank=True
    )  # TODO: Should be removed no need since Plantation is referenced with foreign key
    status = models.IntegerField(
        choices=Status,
        default=ACTIVE,
    )
    year = models.IntegerField()

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.product_id) + str(self.year)


class AlteiaData(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    plantation_code = models.CharField(max_length=200, unique=True)
    cashew_tree_cover = models.FloatField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    # def __str__(self):
    #     return str(self.plantation_code)


class DeptSatellite(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    country = models.CharField(max_length=200)
    department = models.CharField(max_length=200, unique=True)
    cashew_tree_cover = models.FloatField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.department)


class CommuneSatellite(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    country = models.CharField(max_length=200)
    department = models.CharField(max_length=200)
    commune = models.CharField(max_length=200, unique=True)
    cashew_tree_cover = models.FloatField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.commune)


class DistrictSatellite(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    country = models.CharField(max_length=200)
    department = models.CharField(max_length=200)
    commune = models.CharField(max_length=200, unique=True)
    district = models.CharField(max_length=200, unique=True)
    cashew_tree_cover = models.FloatField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.district)


class SpecialTuple(models.Model):
    """
    This is a model that combines alteia id and plantation id.
    It probably shouldn't have been done like this since all the keys here are marked as unique, it is basically a one to one relationship
    However since they are all unique, it doesn't really matter that much.
    """

    country_id = models.ForeignKey(
        Country, on_delete=models.CASCADE, null=True
    )  # TODO: Should be removed no need since Plantation has country
    plantation_id = models.CharField(max_length=200, unique=True)
    alteia_id = models.CharField(max_length=200, unique=True)

    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.alteia_id)


class Trainer(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    firstname = models.CharField(max_length=200)
    lastname = models.CharField(max_length=200)
    institution = models.CharField(max_length=200, null=False, blank=False)
    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    email = models.EmailField(max_length=254, null=True, blank=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.id)


class TrainingModule(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    module_name = models.CharField(max_length=200)
    category = models.CharField(max_length=200, blank=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.id)


class Training(models.Model):
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    module_id = ForeignKey(TrainingModule, on_delete=models.CASCADE, null=True)
    trainer_id = ForeignKey(Trainer, on_delete=models.CASCADE, null=True)
    DateTime = models.DateTimeField()
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    number_of_participant = models.IntegerField(null=True)
    department = models.CharField(null=True, max_length=200, default="")
    commune = models.CharField(null=True, max_length=200, default="")
    arrondissement = models.CharField(max_length=200, default="")
    start_hour = models.TimeField(null=True)
    end_hour = models.TimeField(null=True)

    data_source = models.CharField(max_length=500, null=False, blank=False)
    # Access fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.BigIntegerField(
        null=True,
        blank=True,
    )
    updated_by = models.BigIntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return str(self.id)


class Dataset(models.Model):
    name = models.CharField(max_length=100)
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    hash = models.CharField(max_length=64, blank=True)


class Layer(models.Model):
    name = models.CharField(max_length=100)
    country_id = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    datasets = models.ManyToManyField(Dataset)
    dependencies = models.ManyToManyField("self", blank=True)


@classmethod
def model_field_exists(cls, field):
    try:
        cls._meta.get_field(field)
        return True
    except models.FieldDoesNotExist:
        return False


models.Model.field_exists = model_field_exists
