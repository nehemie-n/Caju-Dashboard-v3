import os
import ee
from dotenv import load_dotenv

load_dotenv()
service_account = os.getenv("EE_SERVICE_ACCOUNT")
credentials = ee.ServiceAccountCredentials(service_account, os.getenv("PRIVATE_KEY"))
ee.Initialize(credentials)

ee_client = ee
