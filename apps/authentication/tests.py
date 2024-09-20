# Create your tests here.
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

from django.test import TestCase
from .models import (
    User,
    RemUser,
    RemUserAccessRequest,
)  # Import your User and RemUser models
from .views import (
    __create_user_from_request__,
)  # Replace with the actual module where your function is defined


class CreateUserFromRequestTest(TestCase):
    def test_create_user_from_request(self):
        # Create a test instance of RemUserAccessRequest
        access_req = RemUserAccessRequest(
            username="testuser",
            email="testuser@example.com",
            first_name="Test",
            last_name="User",
            phone="1234567890",
            organization="Test Org",
            country_id="US",
            role="admin",
        )

        # Call the function to create a new user
        new_rem_user = __create_user_from_request__(access_req)

        # Check if the user and rem user were created successfully
        self.assertTrue(User.objects.filter(username="testuser").exists())
        self.assertTrue(RemUser.objects.filter(user=new_rem_user).exists())

        # Check if the password was generated and is not empty
        self.assertTrue(bool(new_rem_user.user.password))

        # Add more assertions as needed to test other attributes

    def tearDown(self):
        # Clean up after the test
        User.objects.filter(username="testuser").delete()
        # Add more clean-up for RemUser if needed
