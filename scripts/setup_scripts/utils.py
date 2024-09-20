import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

# Retrieve configuration values from .env file
sql_hostname = os.getenv("DASHBOARD_DB_HOSTNAME")
sql_username = os.getenv("DASHBOARD_DB_USERNAME")
sql_password = os.getenv("DASHBOARD_DB_PASSWORD")
sql_main_database = os.getenv("DASHBOARD_DB_NAME")
sql_port = int(os.getenv("DASHBOARD_DB_PORT"))


def mysql_connect():
    """
    Connect to MySQL server and return the connection object.
    """

    # Establish a connection to the database
    conn = pymysql.connect(
        host=sql_hostname,
        user=sql_username,
        password=sql_password,
        db=sql_main_database,
    )

    return conn


def mysql_disconnect(conn):
    """
    Close the connection to the database.
    """
    conn.close()
