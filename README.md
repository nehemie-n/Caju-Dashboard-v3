# Caju-Dashboard

> The Satellite Dashboard is a remote sensing dashboard created to map satellite growing areas in Benin and Côte d'Ivoire, using satellite imagery and machine learning algorithms. The dashboard will help field teams improve operations and policy makers make better decisions.

![GitHub](https://img.shields.io/github/license/Technoserve/Caju-Dashboard-v2)
![PyPI - Python Version](https://img.shields.io/badge/python-3.8%20%7C%203.9-blue)
![Maintenance](https://img.shields.io/maintenance/yes/2022)
![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_message=online&url=https%3A%2F%2Fcajuboard.tnslabs.org)

# Project Parteners

![Project Parteners](https://i.ibb.co/zmSTb1N/Capture-d-cran-2022-06-02-120227.png)

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Screenshots](#screenshots)

## Project Description

The Satellite Dashboard is a remote sensing dashboard that utilizes satellite imagery and machine learning algorithms to map satellite growing areas in Benin and Côte d'Ivoire. It aims to improve field operations for teams and enable policy makers to make informed decisions.

## Features

- Feature 1:.
- Feature 2: 
- ...

## Installation

To install the project, follow these steps:

1. Clone the repository:

   ```sh
   $ git clone https://github.com/TechnoServe/Caju-Dashboard-v2.git
   $ cd Caju-Dashboard-v2

2. Install uv (if not already installed):

    ```
    $ pip install uv
    ```

3. Install the dependencies:

    $ uv sync

4. Run database migrations:
    
    $ make migrate 

# Usage

1. Start the Django development server:

    ```
    $ make run 
    ```
2. Open your web browser and access the dashboard at http://localhost:8000.

# Configuration

    Create a `.env` file in the root of the project with following content:

    ```sh
    TIMES=2

    #Dashboard DB credentials
    NAME='YOUR DATABASE NAME HERE'
    USER='YOUR DATATBASE USERNAME HERE'
    PASSWORD='YOUR DATABASE USER PASSWORD HERE'
    HOST=YOUR DATABASE SERVER HOSTNAME HERE
    PORT='YOUR DATABASE SERVER PORT HERE'

    #CAJU-APP credentials
    SQL_HOSTNAME=''
    SQL_USERNAME=''
    SQL_PASSWORD=''
    SQL_DATABASE=''
    SSH_HOSTNAME=''
    SSH_USER=''

    #SMTP
    EMAIL_HOST='YOUR EMAIL SERVER HOSTNAME HERE'
    EMAIL_HOST_USER='YOUR EMAIL ADDRESS HERE'
    EMAIL_HOST_PASSWORD='YOUR EMAIL PASSWORD HERE'
    EMAIL_PORT=YOUR EMAIL SERVER PORT HERE

    #AWS
    PKEY=''

    #ALTEIA
    ALTEIA_USER=""
    ALTEIA_PASSWORD=""

    #GOOGLE EARTH ENGINE
    PRIVATE_KEY=""

    #PROJECT SECRET KEY
    SECRET_KEY="YOUR SECRET KEY HERE"

    SERVER_URL="YOUR SERVER URL HERE. ex:http://127.0.0.1:8000/"
    ```

# Contributing
## Contributions to the project are welcome. To contribute, please follow these guidelines:

    Fork the repository and create a new branch.
    Make your changes and test thoroughly.
    Submit a pull request explaining your changes.

# License

# Screenshots

![Screenshots of projects](https://i.ibb.co/5s6PMDk/Capture-d-cran-2022-06-02-112228.png)

![Screenshots of projects](https://i.ibb.co/Snv1XJP/Capture-d-cran-2022-06-02-120718.png)

![image](https://github.com/TechnoServe/Caju-Dashboard-v2/assets/134303266/3fafc552-5666-4a18-b19f-3e321ba7ad30)

![image](https://github.com/TechnoServe/Caju-Dashboard-v2/assets/134303266/f59af0cc-fcd7-4a43-b84c-3861a3d0923c)

## Migration from Pipenv to UV

This project has been migrated from `pipenv` to `uv` for better performance and dependency management. If you're updating from a previous version:

1. **Install uv**: `pip install uv`
2. **Remove old virtual environment**: Delete any existing `venv/` or `.venv/` directories
3. **Install dependencies**: Run `uv sync` to create a new virtual environment and install dependencies
4. **Update your workflow**: Use `uv run <command>` instead of `pipenv run <command>`

### Command Changes:
- `pipenv install` → `uv sync`
- `pipenv run python manage.py <command>` → `uv run python manage.py <command>`
- `pipenv shell` → `uv shell` (or just use `uv run` for individual commands)

All Makefile commands have been updated to use `uv run` automatically.