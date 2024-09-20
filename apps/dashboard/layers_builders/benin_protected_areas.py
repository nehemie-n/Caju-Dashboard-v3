# WDPA_WDOECM_May2022_Public_BEN_shp-polygons_1.json
import json
import time
import folium
import geojson
from celery import shared_task
from django.utils.translation import gettext
from apps.dashboard.models import Country
from apps.dashboard.maps_builders.shared_fn import format_perc
from apps.dashboard import utils

heroku = False


def __human_format__(num):
    num = float("{:.3g}".format(num))
    magnitude = 0
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0
    return "{}{}".format(
        "{:f}".format(num).rstrip("0").rstrip("."), ["", "K", "M", "B", "T"][magnitude]
    )


def __style_function__(feature):
    """
    Function to define the layer highlight style
    """
    return {
        "color": "black",
        "fillColor": "#476930",
        "weight": 2,
        "dashArray": "1, 1",
        "opacity": 0.35,
        "fillOpacity": 1.0,
    }


def __highlight_function__(feature):
    """
    Function to define the layer highlight style
    """
    return {
        "color": "black",
        "fillColor": "#1167B1",
        "weight": 2,
        "dashArray": "1, 1",
        "opacity": 0.35,
        "fillOpacity": 0.75,
    }


def __build_html_view__(data: object, country: Country) -> any:
    """
    Return the HTML view of the protected_areas Layer popup
    """
    # Deforestation and afforestation
    deforestation_area = gettext("Deforested Area (2021 - 2022) (ha)")
    afforestation_area = gettext("Afforested Area (2000 - 2012) (ha)")

    # Area Type
    try:
        area_type_row = f"<tr><td>Area Type</td><td>{data.type}</td></tr>"
    except Exception as e:
        area_type_row = ""

    # Percentages
    cashew_tree_cover_percentage = data.cashew_tree_cover / data.area_ha

    try:
        # Calculate the percentages
        deforestation_percentage = data.deforested_area / data.area_ha
        afforestation_percentage = data.afforested_area / data.area_ha
        deforestation_row = f"<tr><td>{deforestation_area}</td><td>{__human_format__(data.deforested_area)} {format_perc(deforestation_percentage)}</td></tr>"
        afforestation_row = f"<tr><td>{afforestation_area}</td><td>{__human_format__(data.afforested_area)} {format_perc(afforestation_percentage)}</td></tr>"
    except Exception as e:
        deforestation_row = ""
        afforestation_row = ""

    return f"""
<html>
  <head>
    <style>
      body {{
        align-items: center;
        background: #F1EEF1;
        display: flex;
        font-family: sans-serif;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        margin: 0;
      }}
      .container {{
        align-items: center;
        /*       background: #F1EEF1;
        border: 1px solid #D2D1D4;
        */      display: flex;
        height: 100vh;
        justify-content: center;
        width: 100vw;
      }}
      .email {{
        background: #DEDBDF;
        border-radius: 16px;
        height: 32px;
        overflow: hidden;
        position: relative;
        width: 162px;
        -webkit-tap-highlight-color: transparent;
        transition: width 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
          height 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
          box-shadow 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
          border-radius 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
      }}x
      .email:not(.expand) {{
        cursor: pointer;
      }}
      .email:not(.expand):hover {{
        background: #C2C0C2;
      }}
      .to {{
        height: 100%;
        opacity: 0;
        position: absolute;
        transition: opacity 100ms cubic-bezier(0.4, 0.0, 1, 1);
      }}
      .to-contents {{
        transform: scale(.55);
        transform-origin: 0 0;
        transition: transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
      }}

      .name {{
        font-size: 14px;
        line-height: 32px;
        margin-left: 10px;
      }}

      .top {{
        background: #34495E;
        display: flex;
        flex-direction: row;
        transition: height 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
        width: 400px;
      }}

      .name-large {{
        color: #dd5;
        padding: 4px 6px;
        font-size: 18px;
        line-height: 25px;
        font-weight: 500;
      }}
      .line1 {{
        background: #6422EB;
        height: 12px;
        position: absolute;
        transform: translateX(9px) translateY(4px) rotate(45deg);
        width: 2px;
      }}
      .line2 {{
        background: #6422EB;
        height: 12px;
        position: absolute;
        transform: translateX(9px) translateY(4px) rotate(-45deg);
        width: 2px;
      }}
      .bottom {{
        background: #FFF;
        color:  #444247;
        font-size: 16px;
        height: 100%;
        padding-top: 5px;
        width: 400px;
        overflow: auto;
      }}
      .row {{
        align-items: center;
        display: flex;
        flex-direction: row;
        height: 30px;
      }}
      .link {{
        margin-left: 16px;
      }}
      .link a {{
        color:  #444247;
        text-decoration: none;
      }}
      .link a:hover {{
        color:  #777579;
      }}
      .email.expand {{
        border-radius: 6px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.10), 0 6px 6px rgba(0,0,0,0.16);
        height: 100%;
        width: 400px;
      }}
      .expand .from {{
        opacity: 0;
        transition: opacity 100ms cubic-bezier(0.4, 0.0, 1, 1);
      }}
      .expand .from-contents {{
        transform: scale(1.91);
      }}
      .expand .to {{
        height: 100%;
        opacity: 1;
        transition: opacity 200ms 100ms cubic-bezier(0.0, 0.0, 0.2, 1);
      }}
      .expand .to-contents {{
        height: 100%;
        transform: scale(1);
      }}


      table td {{
        border: 1px solid #fff;
        padding: 4px 8px;
      }}
    </style>
  </head>
  <body>
      <div class="container">
        <div class="email expand">
          <div class="to">
            <div class="to-contents">
              <div class="top">
                <div class="name-large">
                {data.name}
                </div>
              </div>
              <div class="bottom">
              <table>

                { area_type_row }

                <tr>
                  <td>Area Size:</td>
                  <td>{__human_format__(data.area_ha)} ha</td>
                </tr>
                <tr>
                  <td>Cashew Tree Cover:</td>
                  <td>{__human_format__(data.cashew_tree_cover)} ha {format_perc(cashew_tree_cover_percentage)}</td>
                </tr>

                {deforestation_row}

                {afforestation_row}


              </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
</html>
"""


def __build_data__(feature, country):
    """
    Return all the data needed to build the protected_areas Layer
    """

    protected_area_data_file = open(
        f"staticfiles/{country}/protected_area_data.json",
        encoding="utf8",
        errors="ignore",
    )
    protected_area_data_dict = json.load(protected_area_data_file)
    properties = feature.get("properties")
    area_name = properties.get("NAME")
    data = protected_area_data_dict.get(area_name)
    if data is None:
        data = {
            "name": area_name,
            "area_ha": properties.get("GIS_AREA") or 0,
            "cashew_tree_cover": 0,
        }
    return data


@shared_task(bind=True)
def create_benin_protected_area(self, country: Country):
    """
    Adding the shapefiles with popups for the protected_areas
    Add protected_areas data to the parent layer
    """
    try:
        __start_time = time.time()

        class DataObject:
            def __init__(self, **entries):
                self.__dict__.update(entries)

        benin_dept_layer = folium.FeatureGroup(
            name=gettext(f"{country} Protected Areas"), show=False, overlay=True
        )
        geojsons = [utils.Fetcher.protected_areas(country=country.country_name).geo]

        geojson_list = []

        for geo in geojsons:
            for feature in geo["features"]:
                layer = folium.GeoJson(
                    feature, zoom_on_click=False, style_function=__highlight_function__
                )
                try:
                    data = __build_data__(feature, country)

                    # html template for the popups
                    html_view = __build_html_view__(DataObject(**data), country)
                    # Popup size and frame declaration
                    iframe = folium.IFrame(html=html_view, width=400, height=250)
                    folium.Popup(iframe).add_to(layer)

                except Exception as e:
                    print("Protected Area: ", e)

                layer.add_to(benin_dept_layer)
                geojson_list.append(layer)

        return benin_dept_layer, geojson_list
    except Exception as e:
        print(e)
        return None
