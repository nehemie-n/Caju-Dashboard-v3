var decompress = require('brotli/decompress');
$(document).ready(function () {
  function applyCSS() {
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = ".parent div { height: 100% !important; }";
    document.head.appendChild(style);
  }

  if (!window.location.href.includes("drone")) {
    const databaseName = "mapDB";
    const objectStoreName = "mapData";
    var cashewMap = L.map("map");
    var control_layer;
    let currentGeoJsonObj;
    var generateMapLayers;

    function isTouchSupported() {
      var msTouchEnabled = window.navigator.msMaxTouchPoints;
      var generalTouchEnabled = "ontouchstart" in document.createElement("div");

      if (msTouchEnabled || generalTouchEnabled) {
        return true;
      }
      return false;
    }

    function makeDraggable(element) {
      $(element).draggable({
        start: function (event, ui) {
          $(this).css({
            right: "auto",
            top: "auto",
            bottom: "auto",
          });
        },
      });
    };

    function getPathBasedContent(pathLink) {
      const legendHTML_en = `
        <div id='maplegend' class='maplegend'
            style='position: absolute; z-index:9999; border:2px solid grey; background-color:rgba(255, 255, 255, 0.8);
            border-radius:6px; padding: 10px; font-size:14px; right: 20px; bottom: 20px; font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; color: rgb(0, 0, 0)'>

        <div class='legend-title'>Legend</div>
        <div class='legend-scale'>
            <ul class='legend-labels'>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1
                &background=1167b1">&nbsp;&nbsp;Cashew Warehouse</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-globe-africa&size=25&hoffset=0&voffset
                =-1&background=008000">&nbsp;&nbsp;Plantation Location</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-leaf&size=25&hoffset=0&voffset=-1
                &background=c63e2b">&nbsp;&nbsp;Nursery</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1
                &background=DBA800">&nbsp;&nbsp;Training Location</li>
                <li>&nbsp;<img src="https://i.ibb.co/J3L37CV/Picture3.png" width="17" height="24">&nbsp;&nbsp;&nbsp;Satellite
                predictions</li>
            </ul>
        </div>
        </div>
      `;

      const legendHTML_fr = `
        <div id='maplegend' class='maplegend'
            style='position: absolute; z-index:9999; border:2px solid grey; background-color:rgba(255, 255, 255, 0.8);
            border-radius:6px; padding: 10px; font-size:14px; right: 20px; bottom: 20px; font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; color: rgb(0, 0, 0)'>

        <div class='legend-title'>Légende</div>
        <div class='legend-scale'>
            <ul class='legend-labels'>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1
                &background=1167b1">&nbsp;&nbsp;Entrepot de cajoux</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-globe-africa&size=25&hoffset=0&voffset
                =-1&background=008000">&nbsp;&nbsp;Plantation</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-leaf&size=25&hoffset=0&voffset=-1
                &background=c63e2b">&nbsp;&nbsp;Pépinière</li>
                <li><img src="https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-warehouse&size=25&hoffset=0&voffset=-1
                &background=DBA800">&nbsp;&nbsp;Lieu d'Apprentissage</li>
                <li>&nbsp;<img src="https://i.ibb.co/J3L37CV/Picture3.png" width="17" height="24">&nbsp;&nbsp;&nbsp;Prédictions
                satellitaire</li>
            </ul>
        </div>
        </div>
      `;
      return pathLink.includes("/en/")
        ? legendHTML_en
        : pathLink.includes("/fr/")
          ? legendHTML_fr
          : "";
    };

    function addLegendBasedOnURL(pathLink) {
      const parentDiv = document.getElementsByClassName("parent")[0];
      if (!parentDiv) return;
      parentDiv.insertAdjacentHTML("afterbegin", getPathBasedContent(pathLink));
      makeDraggable("#maplegend");
    };

    function decompressData(compressedData) {
      try {
        const decodedData = atob(compressedData.serialized_layers);
        const bytes = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) {
          bytes[i] = decodedData.charCodeAt(i);
        }
        const decompressedData = decompress(bytes);
        const decompressed = new TextDecoder("utf-8").decode(decompressedData);
        return JSON.parse(decompressed);
      } catch (err) {
        console.error("Failed to decompress data", err);
        return null;
      }
    };

    function customLayerControl(control_layer) {
      if (!isTouchSupported()) {
        var controlButton = control_layer.getContainer();
        controlButton.style.backgroundColor = "white";
        controlButton.style.cursor = "default";
        var controlContents = document.getElementsByClassName(
          "leaflet-control-layers-list"
        )[0];
        const button = document.getElementsByClassName(
          "leaflet-control-layers-toggle"
        )[0];
        const contents = document.getElementsByClassName(
          "leaflet-control-layers-list"
        );
        const parent = document.getElementsByClassName(
          "leaflet-control-layers"
        )[0];

        controlContents.style.display = "none";
        var timer;
        function showLayers() {
          button.style.display = "none";
          parent.style.padding = "6px 10px 6px 6px";
          controlContents.style.display = "block";
        }
        function hideLayers() {
          button.style.display = "block";
          parent.style.padding = "0";
          controlContents.style.display = "none";
        }
        function delayTimeHide() {
          showLayers();
          timer = setTimeout(function () {
            hideLayers();
          }, 4000);
        }
        controlButton.addEventListener("mouseenter", function () {
          clearTimeout(timer);
          showLayers();
        });
        controlButton.addEventListener("mouseleave", function () {
          delayTimeHide();
        });
      }
    };

    function addHomeButtonToMap(map) {
      const map_leaf_dom = map.getContainer();

      const checkLoadMap = setInterval(() => {
        const map_leaf = eval(map_leaf_dom.id);
        if (map_leaf) {
          console.log("Map is done loaded ");
          // Create the node to hold the custom html
          const btnNode = document.createElement("div");
          // Set styles attributes for the div
          btnNode.setAttribute("class", "btn-group");
          btnNode.setAttribute(
            "style",
            "z-index: 909; position: absolute; top: 10px; right: 45px;"
          );
          btnNode.innerHTML = `<button id="resetview" type="buttons" style="background-color: white;
                                    width: 36px;
                                    height: 36px;
                                    border: none;
                                    box-shadow: rgba(0, 0, 0, 0.45) 0px 1px 5px;
                                    border-radius: 4px;
                                    font-size: 20px;
                                  ">
                                    <span><i class="fa fas fa-home"></i></span>
                                </button>`;
          map_leaf_dom.appendChild(btnNode); // append to map
          // Store inital load variables
          const initialZoom = map_leaf.getZoom();
          const initialCenter = map_leaf.getCenter();
          // Reset zoom and view function
          // called after map is initiated
          function resetZoom() {
            document
              .getElementById("resetview")
              .addEventListener("click", () => {
                map_leaf.setView(initialCenter, initialZoom);
              });
          }
          resetZoom();
          clearInterval(checkLoadMap);
        }
      }, 500);
    };

    function getValueIgnoreCase(obj, key) {
      if (!obj || typeof obj !== "object") {
        throw new Error("Invalid object provided.");
      }
      if (typeof key !== "string") {
        throw new Error("Invalid key type. Key must be a string.");
      }
      const lowercaseKey = key.toLowerCase();
      for (const objKey in obj) {
        if (
          Object.prototype.hasOwnProperty.call(obj, objKey) &&
          objKey.toLowerCase() === lowercaseKey
        ) {
          return objKey;
        }
      }
      return undefined;
    };

    function replaceUpperCaseWithUnderscore(sentence) {
      let result = "";
      for (let i = 0; i < sentence.length; i++) {
        const currentChar = sentence.charAt(i);
        if (currentChar === currentChar.toUpperCase()) {
          result += "_" + currentChar.toLowerCase();
        } else {
          result += currentChar;
        }
      }

      return result;
    };

    L.NamedFeatureGroup = L.FeatureGroup.extend({
      initialize: function (name, layers) {
        L.FeatureGroup.prototype.initialize.call(this, layers);
        this.name = name;
      },
    });

    try {
      const openRequest = indexedDB.open(databaseName, 1);
      openRequest.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(objectStoreName)) {
          db.createObjectStore(objectStoreName, { keyPath: "id" });
        }
      };
      openRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(objectStoreName, "readonly");
        const objectStore = transaction.objectStore(objectStoreName);
        const getRequest = objectStore.get(parseInt(mapId));

        getRequest.onsuccess = function () {
          if (getRequest.result) {
            console.log(
              `OLD MAP HASH: ${getRequest.result.hash},\nNEW MAP HASH: ${mapHash}`
            );
          }
          if (getRequest.result && getRequest.result.hash === mapHash) {
            const cachedMapHtml = getRequest.result.html;
            $(".child1").html(cachedMapHtml);
            $(".child1")
              .promise()
              .done(function () {
                $("div.child2").fadeOut(function () {
                  $("div.child2").replaceWith("");
                });
              });
          } else {
            fetchMapData();
          }
        };
        transaction.oncomplete = function () {
          db.close();
        };
      };
    } catch (error) {
      console.log(error);
    };

    function fetchMapData() {
      $.get(link, function (unparseddata) {
        const data = decompressData(unparseddata);
        if (data) {
          cashewMap = updateMap(data, true);
          $(".child1")
            .promise()
            .done(function () {
              $("div.child2").fadeOut(function () {
                $("div.child2").replaceWith("");
              });
            });
          // const openRequest = indexedDB.open(databaseName, 1);
          // openRequest.onsuccess = function (event) {
          //   const db = event.target.result;
          //   const transaction = db.transaction(objectStoreName, "readwrite");
          //   const objectStore = transaction.objectStore(objectStoreName);
          //   objectStore.put({
          //     id: parseInt(mapId),
          //     html: data,
          //     hash: mapHash,
          //   });
          //   transaction.oncomplete = function () {
          //     db.close();
          //   };
          // };
        }
      });
    };

    function orderingLayers(layers) {
      const order = [
        "countryBorderLayer",
        "countryLayer",
        "countryDeptLayer",
        "countryCommuneLayer",
        "countryDistrictLayer",
        "countryColoredDeptLayer",
        "countryColoredCommuneLayer",
        "countryProtectedLayer",
        "countryPlantationLayer",
        "trainingLayer",
        "qarLayer",
        "nurseryLayer",
      ];

      order.forEach((layerName) => {
        if (layers[layerName]) {
          layers[layerName].bringToFront();
        }
      });
    };

    function addLayersToMap(cashewMap, layers) {
      const order = [
        "countryBorderLayer",
        // "countryLayer",
        // "countryDeptLayer",
        // "countryCommuneLayer",
        // "countryDistrictLayer",
        // "countryColoredDeptLayer",
        // "countryColoredCommuneLayer",
        // "countryProtectedLayer",
        // "countryPlantationLayer",
        // "trainingLayer",
        // "qarLayer",
        // "nurseryLayer",
        "predictionsLayer",
        // "treeDensityEstimationLayer",
        // "deforestation",
        // "aforestation",
      ];

      order.forEach((layerName) => {
        if (layers[layerName]) {
          try {
            if (["qarLayer", "nurseryLayer"].includes(layerName)) {
              cashewMap.addLayer(layers[layerName]);
              cashewMap.setView(
                [parseFloat(userCountryLat), parseFloat(userCountryLon)],
                8
              );
            } else {
              layers[layerName].addTo(cashewMap);
              cashewMap.setView(
                [parseFloat(userCountryLat), parseFloat(userCountryLon)],
                8
              );
            }
          } catch (e) {
            console.error(`Error adding layer ${layerName}:`, e);
          }
        }
      });

      return cashewMap;
    };

    function getBaseMap(pathLink) {
      try {
        const basemaps = {
          "Google Maps": L.tileLayer(
            "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
            {
              attribution: "Google",
              maxZoom: 25,
            }
          ),
          "Google Satellite": L.tileLayer(
            "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            {
              attribution: "Google",
              maxZoom: 25,
            }
          ),
          "Mapbox Satellite": L.tileLayer(
            "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2hha2F6IiwiYSI6ImNrczMzNTl3ejB6eTYydnBlNzR0dHUwcnUifQ.vHqPio3Pe0PehWpIuf5QUg",
            {
              attribution: "Mapbox",
              maxZoom: 25,
            }
          ),
        };
        basemaps["Google Maps"].addTo(cashewMap);
        L.control
          .fullscreen({
            position: "topright",
            title: "Full Screen",
            titleCancel: "Exit Full Screen",
            forceSeparateButton: false,
          })
          .addTo(cashewMap);

        addLegendBasedOnURL(pathLink);

        control_layer = L.control.layers(basemaps).addTo(cashewMap);

        customLayerControl(control_layer);
      } catch (e) {
        console.error(e);
      }
      return [cashewMap, control_layer];
    };

    if (userRole === "GLOBAL-ADMIN") {
      class GenericMap {
        constructor() {
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryColoredDeptLayer = null;
          this.countryColoredCommuneLayer = null;
          this.countryProtectedLayer = null;
          this.countryPlantationLayer = null;
          this.qarLayer = null;
          this.trainingLayer = null;
          this.nurseryLayer = null;
          this.predictionsLayer = null;
          this.treeDensityEstimationLayer = null;
          this.deforestation = null;
          this.aforestation = null;
        }

        createFeatureGroup(
          name,
          show = false,
          overlay = true,
          control = true,
          zIndexOffset = 0
        ) {
          let featureGroup = L.featureGroup();
          featureGroup.name = name;
          featureGroup.options = { name, show, overlay, control, zIndexOffset };
          return featureGroup;
        }

        createMarkerCluster(name) {
          var markerCluster = L.markerClusterGroup({ name: name });
          return markerCluster;
        }

        addLayersToGroup(layerGroup, countriesLayerList) {
          countriesLayerList = countriesLayerList || [];
          countriesLayerList.forEach((obj) => {
            (obj || []).forEach((elmt) => {
              elmt.addTo(layerGroup);
            });
          });
        }

        generateCountryColoredCommuneLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Training Recommendations Level 2",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryColoredCommuneLayer = layer;
          return layer;
        }

        generateCountryColoredDeptLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Training Recommendations Level 1",
              false,
              true,
              true,
              10
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryColoredDeptLayer = layer;
          return layer;
        }

        generateCountryCommuneLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Administrative Level 2",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryCommuneLayer = layer;
          return layer;
        }

        generateCountryDeptLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Administrative Level 1",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryDeptLayer = layer;
          return layer;
        }

        generateCountryDistrictLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Administrative Level 3",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryDistrictLayer = layer;
          return layer;
        }

        generateCountryPlantationLayer(
          countriesLayerList,
          countriesMarkerList
        ) {
          let layer;
          if (countriesLayerList != undefined && countriesMarkerList != undefined) {
            let plantationCluster = this.createMarkerCluster("Plantations");
            layer = this.createFeatureGroup(
              "Plantation Locations",
              true,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
            layer.addLayer(plantationCluster);
            this.addLayersToGroup(plantationCluster, countriesMarkerList);
          } else {
            layer = null;
          };
          this.countryPlantationLayer = layer;
          return layer;
        }

        generateCountryProtectedLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup("Protected Areas", false, true);
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryProtectedLayer = layer;
          return layer;
        }

        generateCountryLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Administrative Level 0",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryLayer = layer;
          return layer;
        }

        generateCountryBorderLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Administrative Boundaries Level 0",
              true,
              false,
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryBorderLayer = layer;
          return layer;
        }

        generateNurseryLayer(countriesLayerList) {
          console.log(countriesLayerList, ' Generic Nurseries');
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster("Nursery Information");
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.nurseryLayer = markerCluster;
          return markerCluster;
        }

        generateQarLayer(countriesLayerList) {
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster("Warehouse Location");
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.qarLayer = markerCluster;
          return markerCluster;
        }

        generateTrainingLayer(countriesLayerList) {
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster(
              "Training Information",
              false
            );
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.trainingLayer = markerCluster;
          return markerCluster;
        }

        generateTreeDensityEstimationLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Tree Density Satellite Estimation",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.treeDensityEstimationLayer = layer;
          return layer;
        }

        generatePredictionsLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup("Cashew Growing Areas", true);
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.predictionsLayer = layer;
          return layer;
        }

        generateDeforestation(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Deforested Area (2021 - 2022) (ha)",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.deforestation = layer;
          return layer;
        }

        generateAforestation(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Afforested Area (2000 - 2012) (ha)",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.aforestation = layer;
          return layer;
        }
      }

      /**
       * Generates layers for a generic map based on outdated layers and language settings.
       * @param {string} lang - The language setting.
       * @param {Object} outdatedLayers - The outdated layers data.
       * @return {Object|null} The generated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(
        lang,
        outdatedLayers,
        country,
        isLayersBuilted = false
      ) {
        let startTime = Date.now();
        let control_layer;
        if (isLayersBuilted != false) {
          [cashewMap, control_layer] = getBaseMap(window.location.href);
        }
        let activeCountries = Object.keys(outdatedLayers);
        try {
          var genericMapObj = new GenericMap();
          let layers = {};
          for (let attribute in genericMapObj) {
            if (
              !attribute.startsWith("_") &&
              genericMapObj[attribute] === null
            ) {
              let functionName = `generate${attribute
                .charAt(0)
                .toUpperCase()}${attribute.slice(1)}`;
              let method = genericMapObj[functionName];
              if (typeof method === "function") {
                layers[attribute] = callMapMethod(
                  genericMapObj,
                  functionName,
                  attribute,
                  lang,
                  activeCountries,
                  outdatedLayers
                );
              } else {
                console.log(`The function '${functionName}' does not exist.`);
              }
            }
          }
          layers = Object.fromEntries(
            Object.entries(layers).filter(([k, v]) => v !== null)
          );

          if (isLayersBuilted === false) {
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            console.log('map layers generic', layers);
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach((layerName) => {
              switch (layers[layerName].name) {
                case undefined:
                  if (
                    !["Administrative Boundaries Level 0"].includes(
                      layers[layerName].options.name
                    )
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].options.name
                    );
                  }
                  break;
                default:
                  if (
                    !["Administrative Boundaries Level 0"].includes(
                      layers[layerName].name
                    )
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].name
                    );
                  }
              }
            });

            console.log(
              `Total loading time: ${((Date.now() - startTime) / 1000).toFixed(
                2
              )} seconds`
            );

            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      }

      /**
       * Calls the appropriate layer method based on the function name and parameters.
       * @param {Function} method - The method to be called.
       * @param {string} functionName - The name of the function.
       * @param {string} lang - The language setting.
       * @param {Array} activeCountries - Array of active countries.
       * @param {Object} outdatedLayers - The outdated layers.
       * @return {Object} The result of the method call.
       */
      function callMapMethod(
        mapObject,
        functionName,
        map_class_attribute_name,
        lang,
        activeCountries,
        outdatedLayers
      ) {
        function filter_array(outdatedLayers, country, lang, map_class_attribute_name) {
          let value = outdatedLayers[country][lang][getValueIgnoreCase(outdatedLayers[country][lang], replaceUpperCaseWithUnderscore(map_class_attribute_name))];
          if (value != undefined) {
            return value
          } else {
            return []
          }
        }
        if (functionName !== "generateCountryPlantationLayer") {
          let result = mapObject[functionName](
            activeCountries.map(
              (country) => filter_array(outdatedLayers, country, lang, map_class_attribute_name)
            )
          );
          return result;
        } else {
          let result = mapObject[functionName](
            activeCountries.map(
              (country) =>
                outdatedLayers[country][lang][
                getValueIgnoreCase(
                  outdatedLayers[country][lang],
                  replaceUpperCaseWithUnderscore(map_class_attribute_name)
                )
                ]
            ),
            activeCountries.map(
              (country) =>
                outdatedLayers[country][lang]["country_plantation_marker"]
            )
          );
          return result;
        }
      }
    } else if (userRole == "") {
      class PublicMap {
        constructor() {
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryProtectedLayer = null;
          this.predictionsLayer = null;
          this.deforestation = null;
        }

        generateCountryCommuneLayer(countriesLayerList) {
          let countryCommuneLayer;
          if (countriesLayerList != undefined) {
            countryCommuneLayer = L.featureGroup({
              name: "Administrative Level 2",
              show: false,
              overlay: true,
            });
            countryCommuneLayer.name = "Administrative Level 2";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => countryCommuneLayer.addLayer(elmt))
            );
            this.countryCommuneLayer = countryCommuneLayer;
          } else {
            countryCommuneLayer = null;
          };
          return countryCommuneLayer;
        }

        generateCountryDeptLayer(countriesLayerList) {
          let countryDeptLayer;
          if (countriesLayerList != undefined) {
            countryDeptLayer = L.featureGroup({
              name: "Administrative Level 1",
              show: false,
              overlay: true,
            });
            countryDeptLayer.name = "Administrative Level 1";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => countryDeptLayer.addLayer(elmt))
            );
            this.countryDeptLayer = countryDeptLayer;
          } else {
            countryDeptLayer = null;
          };
          return countryDeptLayer;
        }

        generateCountryDistrictLayer(countriesLayerList) {
          let countryDistrictLayer;
          if (countriesLayerList != undefined) {
            countryDistrictLayer = L.featureGroup({
              name: "Administrative Level 3",
              show: false,
              overlay: true,
            });
            countryDistrictLayer.name = "Administrative Level 3";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => countryDistrictLayer.addLayer(elmt))
            );
            this.countryDistrictLayer = countryDistrictLayer;
          } else {
            countryDistrictLayer = null;
          };
          return countryDistrictLayer;
        }

        generateCountryProtectedLayer(countriesLayerList) {
          let countryProtectedLayer;
          if (countriesLayerList != undefined) {
            countryProtectedLayer = L.featureGroup({
              name: "Protected Areas",
              show: false,
              overlay: true,
            });
            countryProtectedLayer.name = "Protected Areas";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => countryProtectedLayer.addLayer(elmt))
            );
            this.countryProtectedLayer = countryProtectedLayer;
          } else {
            countryProtectedLayer = null;
          };
          return countryProtectedLayer;
        }

        generateCountryLayer(countriesLayerList) {
          let countryLayer;
          if (countriesLayerList != undefined) {
            countryLayer = L.featureGroup({
              name: "Administrative Level 0",
              show: false,
              overlay: true,
            });
            countryLayer.name = "Administrative Level 0";
            countriesLayerList.forEach(
              (obj) => obj && obj.forEach((elmt) => countryLayer.addLayer(elmt))
            );
            this.countryLayer = countryLayer;
          } else {
            countryLayer = null;
          };
          return countryLayer;
        }

        generateCountryBorderLayer(countriesLayerList) {
          let countryBorderLayer;
          if (countriesLayerList != undefined) {
            countryBorderLayer = L.featureGroup({
              name: "Administrative Boundaries Level 0",
              show: true,
              overlay: false,
              control: false,
            });
            countryBorderLayer.name = "Administrative Boundaries Level 0";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => countryBorderLayer.addLayer(elmt))
            );
            this.countryBorderLayer = countryBorderLayer;
          } else {
            countryBorderLayer = null;
          };
          return countryBorderLayer;
        }

        generatePredictionsLayer(countriesLayerList) {
          let predictionsLayer;
          if (countriesLayerList != undefined) {
            predictionsLayer = L.featureGroup({
              name: "Cashew Growing Areas",
              show: true,
            });
            predictionsLayer.name = "Cashew Growing Areas";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => predictionsLayer.addLayer(elmt))
            );
            this.predictionsLayer = predictionsLayer;
          } else {
            predictionsLayer = null;
          };
          return predictionsLayer;
        }

        generateDeforestation(countriesLayerList) {
          let deforestationLayer;
          if (countriesLayerList != undefined) {
            deforestationLayer = L.featureGroup({
              name: "Deforestation (2021 - 2022)",
              show: false,
            });
            deforestationLayer.name = "Deforestation (2021 - 2022)";
            countriesLayerList.forEach(
              (obj) =>
                obj && obj.forEach((elmt) => deforestationLayer.addLayer(elmt))
            );
            this.deforestation = deforestationLayer;
          } else {
            deforestationLayer = null;
          };
          return deforestationLayer;
        }
      }

      /**
       * Generates layers for a public map based on outdated layers and language settings.
       * @param {string} lang - The language setting.
       * @param {Object} outdatedLayers - The outdated layers data.
       * @return {Promise<Object|null>} The generated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(
        lang,
        outdatedLayers,
        country,
        isLayersBuilted = false
      ) {
        let startTime = Date.now();
        let control_layer;
        if (isLayersBuilted != false) {
          [cashewMap, control_layer] = getBaseMap(window.location.href);
        }
        let activeCountries = Object.keys(outdatedLayers);

        try {
          let publicMapObj = new PublicMap();
          let layers = {};
          for (let attribute in publicMapObj) {
            let functionName = `generate${attribute
              .charAt(0)
              .toUpperCase()}${attribute.slice(1)}`;
            if (
              !attribute.startsWith("_") &&
              publicMapObj[attribute] === null &&
              typeof publicMapObj[functionName] === "function"
            ) {
              let layerData = activeCountries.map(
                (current_country) =>
                  outdatedLayers[current_country][lang][
                  getValueIgnoreCase(
                    outdatedLayers[current_country][lang],
                    replaceUpperCaseWithUnderscore(attribute)
                  )
                  ]
              );
              layers[attribute] = publicMapObj[functionName](layerData);
            }
          }

          layers = Object.fromEntries(
            Object.entries(layers).filter(([k, v]) => v != null)
          );

          if (isLayersBuilted === false) {
            console.log(
              `Total loading time: ${(Date.now() - startTime) / 1000} seconds`
            );
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach((layerName) => {
              switch (layers[layerName].name) {
                case undefined:
                  if (
                    !["Administrative Boundaries Level 0"].includes(
                      layers[layerName].options.name
                    )
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].options.name
                    );
                  }
                  break;
                default:
                  if (
                    !["Administrative Boundaries Level 0"].includes(
                      layers[layerName].name
                    )
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].name
                    );
                  }
              }
            });

            console.log(
              `Total loading time: ${((Date.now() - startTime) / 1000).toFixed(
                2
              )} seconds`
            );

            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      }
    } else {
      class DefaultMap {
        constructor() {
          this.countryLayer = null;
          this.countryBorderLayer = null;
          this.countryDeptLayer = null;
          this.countryCommuneLayer = null;
          this.countryDistrictLayer = null;
          this.countryColoredDeptLayer = null;
          this.countryColoredCommuneLayer = null;
          this.countryProtectedLayer = null;
          this.countryPlantationLayer = null;
          this.qarLayer = null;
          this.trainingLayer = null;
          this.nurseryLayer = null;
          this.predictionsLayer = null;
          this.treeDensityEstimationLayer = null;
          this.deforestation = null;
          this.aforestation = null;
        }

        createFeatureGroup(
          name,
          show = false,
          overlay = true,
          control = true,
          zIndexOffset = 0
        ) {
          let featureGroup = L.featureGroup();
          featureGroup.name = name;
          featureGroup.options = { name, show, overlay, control, zIndexOffset };
          return featureGroup;
        }

        createMarkerCluster(name) {
          var marker_Cluster = L.markerClusterGroup({ name: name });
          return marker_Cluster;
        }

        addLayersToGroup(layerGroup, countriesLayerList) {
          countriesLayerList = countriesLayerList || [];
          (countriesLayerList || []).forEach((elmt) => {
            elmt.addTo(layerGroup);
          });
        }

        generateCountryColoredCommuneLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "GAUL2 Training Recommendations",
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryColoredCommuneLayer = layer;
          return layer;
        }

        generateCountryColoredDeptLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "GAUL1 Training Recommendations",
              false,
              true,
              true,
              10
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryColoredDeptLayer = layer;
          return layer;
        }

        generateCountryCommuneLayer(countriesLayerList, country) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              `${country} ${userCountrylevel2Name}`,
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryCommuneLayer = layer;
          return layer;
        }

        generateCountryDeptLayer(countriesLayerList, country) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              `${country} ${userCountrylevel1Name}`,
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryDeptLayer = layer;
          return layer;
        }

        generateCountryDistrictLayer(countriesLayerList, country) {
          console.log('in generateCountryDistrictLayer Passed ', countriesLayerList, country)
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              `${country} ${userCountryLevel3Name}`,
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryDistrictLayer = layer;
          return layer;
        }

        generateCountryPlantationLayer(
          countriesLayerList,
          countriesMarkerList
        ) {
          console.log('in generateCountryPlantationLayer Passed ', countriesLayerList, countriesMarkerList)
          let layer;
          if (countriesLayerList != undefined && countriesMarkerList != undefined) {
            let plantationCluster = this.createMarkerCluster("Plantations");
            layer = this.createFeatureGroup(
              "Plantation Locations",
              true,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
            layer.addLayer(plantationCluster);
            this.addLayersToGroup(plantationCluster, countriesMarkerList);
          } else {
            layer = null;
          };
          console.log('default generated plantation layer ', layer)
          this.countryPlantationLayer = layer;
          return layer;
        }

        generateCountryProtectedLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup("Protected Areas", false, true);
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryProtectedLayer = layer;
          return layer;
        }

        generateCountryLayer(countriesLayerList, country) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              `${country} Republic`,
              false,
              true
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryLayer = layer;
          return layer;
        }

        generateCountryBorderLayer(countriesLayerList, country) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              `${country} Boundaries Republic`,
              true,
              false,
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.countryBorderLayer = layer;
          return layer;
        }

        generateNurseryLayer(countriesLayerList) {
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster("Nursery Information");
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.nurseryLayer = markerCluster;
          return markerCluster;
        }

        generateQarLayer(countriesLayerList) {
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster("Warehouse Location");
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.qarLayer = markerCluster;
          return markerCluster;
        }

        generateTrainingLayer(countriesLayerList) {
          let markerCluster;
          if (countriesLayerList != undefined) {
            markerCluster = this.createMarkerCluster(
              "Training Information",
              false
            );
            this.addLayersToGroup(markerCluster, countriesLayerList);
          } else {
            markerCluster = null;
          };
          this.trainingLayer = markerCluster;
          return markerCluster;
        }

        generateTreeDensityEstimationLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Tree Density Satellite Estimation",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.treeDensityEstimationLayer = layer;
          return layer;
        }

        generatePredictionsLayer(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup("Cashew Growing Areas", true);
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.predictionsLayer = layer;
          return layer;
        }

        generateDeforestation(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Deforested Area (2021 - 2022) (ha)",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.deforestation = layer;
          return layer;
        }

        generateAforestation(countriesLayerList) {
          let layer;
          if (countriesLayerList != undefined) {
            layer = this.createFeatureGroup(
              "Afforested Area (2000 - 2012) (ha)",
              false
            );
            this.addLayersToGroup(layer, countriesLayerList);
          } else {
            layer = null;
          };
          this.aforestation = layer;
          return layer;
        }
      }

      /**
       * Generates map layers based on outdated layers and country-specific data.
       * @param {Object} outdatedLayers - The outdated layers to be updated.
       * @param {Object} country - The country-specific data for certain layers.
       * @return {Object|null} The updated layers or null in case of an error.
       */
      generateMapLayers = function generateMapLayersFunction(
        lang,
        outdatedLayers,
        country,
        isLayersBuilded = false
      ) {
        const startTime = Date.now();
        let control_layer;
        if (isLayersBuilded != false) {
          [cashewMap, control_layer] = getBaseMap(window.location.href);
        }
        try {
          let layers = {};
          var defaultMapObj = new DefaultMap();
          const methodWithCountry = [
            "generateCountryCommuneLayer",
            "generateCountryDeptLayer",
            "generateCountryDistrictLayer",
            "generateCountryLayer",
            "generateCountryBorderLayer",
          ];
          for (let attribute in defaultMapObj) {
            if (
              !attribute.startsWith("_") &&
              defaultMapObj[attribute] === null
            ) {
              let functionName = `generate${attribute
                .charAt(0)
                .toUpperCase()}${attribute.slice(1)}`;
              let method = defaultMapObj[functionName];
              if (typeof method === "function") {
                layers[attribute] = callMapMethod(
                  defaultMapObj,
                  functionName,
                  attribute,
                  lang,
                  country,
                  outdatedLayers,
                  methodWithCountry
                );
              } else {
                console.log(`The function '${functionName}' does not exist.`);
              }
            }
          }

          layers = Object.fromEntries(
            Object.entries(layers).filter(([k, v]) => v !== null)
          );
          console.log("layers default", layers);

          if (isLayersBuilded === false) {
            return layers;
          } else {
            cashewMap.on("overlayadd", function (event) {
              event.layer.bringToFront();
            });
            console.log('map layers normal default new', layers);
            cashewMap = addLayersToMap(cashewMap, layers);
            orderingLayers(cashewMap, layers);
            addHomeButtonToMap(cashewMap);
            Object.keys(layers).forEach((layerName) => {
              switch (layers[layerName].name) {
                case undefined:
                  if (
                    ![`${country} Boundaries Republic`].includes(
                      layers[layerName].options.name
                    )
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].options.name
                    );
                  }
                  break;
                default:
                  if (
                    ![`${country} Boundaries Republic`].includes(layers[layerName].name)
                  ) {
                    control_layer.addOverlay(
                      layers[layerName],
                      layers[layerName].name
                    );
                  }
              }
            });

            console.log(
              `Total loading time default: ${((Date.now() - startTime) / 1000).toFixed(
                2
              )} seconds`
            );

            return cashewMap;
          }
        } catch (e) {
          console.error(e);
          return null;
        }
      }

      /**
       * Calls the appropriate map method based on the function name and parameters.
       * @param {Function} method - The method to be called.
       * @param {string} functionName - The name of the function.
       * @param {Object} data - The data to be passed to the function.
       * @param {Object} country - The country-specific data.
       * @param {Object} outdatedLayers - The outdated layers.
       * @param {Array} methodWithCountry - Array of method names that require country data.
       * @param {Object} defaultMapObj - The default map object instance.
       * @return {Object} The result of the method calL.
       */
      function callMapMethod(
        mapObject,
        functionName,
        map_class_attribute_name,
        lang,
        country,
        outdatedLayers,
        methodWithCountry
      ) {
        if (methodWithCountry.includes(functionName)) {
          let result = mapObject[functionName](
            outdatedLayers[country][lang][
            getValueIgnoreCase(
              outdatedLayers[country][lang],
              replaceUpperCaseWithUnderscore(map_class_attribute_name)
            )
            ],
            country
          );
          return result;
        } else if (functionName === "generateCountryPlantationLayer") {
          let result = mapObject[functionName](
            outdatedLayers[country][lang][
            getValueIgnoreCase(
              outdatedLayers[country][lang],
              replaceUpperCaseWithUnderscore(map_class_attribute_name)
            )
            ],
            outdatedLayers[country][lang]["country_plantation_marker"]
          );
          return result;
        } else {
          let result = mapObject[functionName](
            outdatedLayers[country][lang][
            getValueIgnoreCase(
              outdatedLayers[country][lang],
              replaceUpperCaseWithUnderscore(map_class_attribute_name)
            )
            ]
          );
          return result;
        }
      }
    };

    const MAP_LAYER_OBJECT_TYPE = {
      GEOJSON: "GeoJson",
      MARKER: "Marker",
      TILELAYER: "TileLayer",
      RASTER_TILELAYER: "Raster TileLayer",
      OTHER: "Other",
    };

    const MAP_LAYER_TYPE = {
      COUNTRY_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_BORDER_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_DEPT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COLORED_DEPT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COMMUNE_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_DISTRICT_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_COLORED_COMMUNE_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PROTECTED_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PLANTATION_LAYER: MAP_LAYER_OBJECT_TYPE.GEOJSON,
      COUNTRY_PLANTATION_MARKER: MAP_LAYER_OBJECT_TYPE.MARKER,
      NURSERY_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      QAR_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      TRAINING_LAYER: MAP_LAYER_OBJECT_TYPE.MARKER,
      PREDICTIONS_LAYER: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER,
      TREE_DENSITY_ESTIMATION_LAYER: MAP_LAYER_OBJECT_TYPE.TILELAYER,
      DEFORESTATION: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER,
      AFORESTATION: MAP_LAYER_OBJECT_TYPE.RASTER_TILELAYER,
    };

    function updateLayer(new_layer, map) {
      map.eachLayer(function (layer) {
        let newLayerName;
        switch (new_layer.name) {
          case undefined:
            newLayerName = new_layer.options.name;
            break;
          default:
            newLayerName = new_layer.name;
        }

        switch (layer.name) {
          case undefined:
            if (layer.options.name === newLayerName) {
              map.removeLayer(layer);
              control_layer.removeLayer(layer);
              new_layer.addTo(map);
              control_layer.addOverlay(new_layer, new_layer.options.name);
            }
            break;
          default:
            if (layer.name === newLayerName) {
              map.removeLayer(layer);
              control_layer.removeLayer(layer);
              new_layer.addTo(map);
              control_layer.addOverlay(new_layer, new_layer.name);
            }
        }
      });
    };

    function updateMap(serializedData, isLayersBuilted = false) {
      const [outdated_layer_per_country_and_lang_builded, neededToBeBuilded] =
        rebuildLayers(serializedData);
      if (neededToBeBuilded === true) {
        if (isLayersBuilted === false) {
          console.log(`Updating only: ${Object.keys(outdated_layer_per_country_and_lang_builded)}`);
          var layers = generateMapLayers(
            currentLanguage,
            outdated_layer_per_country_and_lang_builded,
            userCountryName
          );
          Object.values(layers).map((element) =>
            updateLayer(element, cashewMap)
          );
          return layers;
        } else {
          cashewMap = generateMapLayers(
            currentLanguage,
            outdated_layer_per_country_and_lang_builded,
            userCountryName,
            isLayersBuilted
          );
          return cashewMap;
        }
      } else {
        console.log("No need to update layers");
      }
    };

    function rebuildLayers(data) {
      let outdated_layer_per_country_and_lang_builded = {};
      let neededToBeBuilded;

      Object.keys(data).forEach((countryName) => {
        outdated_layer_per_country_and_lang_builded[countryName] = {};
        const countryData = data[countryName];
        Object.keys(countryData).forEach((lang) => {
          outdated_layer_per_country_and_lang_builded[countryName][lang] = {};
          const layers = countryData[lang];
          if (Object.keys(layers).length > 0) {
            neededToBeBuilded = true;
          }
          Object.keys(layers).forEach((layerName) => {
            var layerData = layers[layerName];
            if (typeof layerData !== "object" && layerData !== null) {
              layerData = JSON.parse(layerData);
            }
            var layerNameUpper = layerName.toUpperCase();
            var layerType = MAP_LAYER_TYPE[layerNameUpper];
            outdated_layer_per_country_and_lang_builded[countryName][lang][
              layerName
            ] = reconstructLayers(layerData, layerType, layerName);
          });
        });
      });

      return [outdated_layer_per_country_and_lang_builded, neededToBeBuilded];
    };

    function reconstructLayers(layerItems, type, layerName) {
      let layers = [];

      switch (type) {
        case "GeoJson":
          layerItems.forEach((layerItem) => {
            if (layerName == "country_commune_layer") {
            }
            let layer;
            if (
              [
                "country_border_layer",
                "country_colored_dept_layer",
                "country_colored_commune_layer",
                "country_protected_layer",
              ].includes(layerName)
            ) {
              const styleFunction = reconstructFunction(
                layerItem.style_function,
                layerName
              );
              layer = L.geoJSON(layerItem.data, {
                style: styleFunction,
                onEachFeature: onEachFeature(styleFunction, layerName),
              });
            } else {
              const styleFunction = reconstructFunction(
                layerItem.highlight_function,
                layerName
              );
              currentGeoJsonObj = layer = L.geoJSON(layerItem.data, {
                onEachFeature: onEachFeature(styleFunction, layerName),
              });
            }
            if (layerItem.custom_popup) {
              let popup = L.popup(layerItem.custom_popup.options);
              var content = layerItem.custom_popup.html;
              if (
                layerName == "country_plantation_layer" &&
                currentLanguage != "fr"
              ) {
                var content = $(content)[0];
                var base64EncodedIframe = content.src.split(";base64,")[1];
                var decodedIframe = atob(base64EncodedIframe);
                baseLink = `${window.location.origin}/fr/dashboard/drone/`;
                var baseLink = baseLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                modifiedContent = decodedIframe.replace(
                  new RegExp(baseLink, "g"),
                  `${window.location.origin}/${currentLanguage}/dashboard/drone/`
                );
                var modifiedBase64EncodedIframe = btoa(modifiedContent);
                content.src = `data:text/html;charset=utf-8;base64,${modifiedBase64EncodedIframe}`;
              }
              popup.setContent(content);
              layer.bindPopup(popup);
            }
            if (layerItem.custom_tooltip) {
              const customTooltipLayersFieldsAndAliases = {
                country_dept_layer: {
                  fields: "NAME_1",
                  aliases: "GAUL 1: ",
                },
                country_colored_dept_layer: {
                  fields: "NAME_1",
                  aliases: "GAUL 1: ",
                },
                country_commune_layer: {
                  fields: "NAME_2",
                  aliases: "GAUL 2: ",
                },
                country_district_layer: {
                  fields: "NAME_3",
                  aliases: "GAUL 3: ",
                },
                country_colored_commune_layer: {
                  fields: "NAME_2",
                  aliases: "GAUL 2: ",
                },
              };
              if (
                Object.keys(customTooltipLayersFieldsAndAliases).includes(
                  layerName
                )
              ) {
                layer.bindTooltip(
                  function (layer) {
                    let div = L.DomUtil.create("div");

                    let handleObject = (feature) =>
                      typeof feature == "object"
                        ? JSON.stringify(feature)
                        : feature;
                    const customTooltipLayerFieldsAndAliases =
                      customTooltipLayersFieldsAndAliases[layerName];
                    let fields = [customTooltipLayerFieldsAndAliases.fields];
                    let aliases = [customTooltipLayerFieldsAndAliases.aliases];
                    let table =
                      "<table>" +
                      String(
                        fields
                          .map(
                            (v, i) =>
                              `<tr>
                      <th>${aliases[i]}</th>

                      <td>${handleObject(layer.feature.properties[v])}</td>
                  </tr>`
                          )
                          .join("")
                      ) +
                      "</table>";
                    div.innerHTML = table;

                    return div;
                  },
                  {
                    className: "foliumtooltip",
                    sticky: true,
                    tooltipOptions: {
                      className: "foliumtooltip",
                      sticky: false,
                    },
                  }
                );
              } else {
                let tooltip = L.tooltip(layerItem.custom_tooltip.options);
                tooltip.setContent(layerItem.custom_tooltip.text);
                layer.bindTooltip(tooltip);
              }
            }
            layers.push(layer);
          });
          break;
        case "Marker":
          if (["country_plantation_marker", "qar_layer"].includes(layerName)) {
            layerItems.forEach((layerItem) => {
              let layer = reconstructMarker(layerItem, layerName);
              layers.push(layer);
            });
          } else {
            layerItems.forEach((layerItem) => {
              let layer = reconstructMarker(layerItem);
              layers.push(layer);
            });
          }
          break;
        case "TileLayer":
        case "Raster TileLayer":
          layerItems.forEach((layerItem) => {
            let layer = createLeafletTileLayer(layerItem);
            layers.push(layer);
          });
          break;
        default:
          console.warn("Unhandled layer type:", type);
      }

      if (type == "Marker") {
        return layers;
      } else {
        return layers;
      }
    };

    function createLeafletTileLayer(data) {
      return L.tileLayer(data.tiles, data.options);
    };

    function reconstructMarker(markerData, layerName = "") {
      const icon = reconstructIcon(
        markerData.icon,
        markerData.icon_class,
        layerName
      );
      const current_marker = L.marker(markerData.location, markerData.options);
      current_marker.setIcon(icon);

      if (markerData.popup) {
        var content = $(markerData.popup.html)[0];
        var popup = L.popup(markerData.popup.options);
        popup.setContent(content);
        current_marker.bindPopup(popup);
      }

      if (markerData.tooltip) {
        var tooltip = L.tooltip(markerData.tooltip.options);
        tooltip.setContent(markerData.tooltip.text);
        current_marker.bindTooltip(tooltip);
      }

      return current_marker;
    };

    function reconstructIcon(iconData, iconClass, layerName = "") {
      if (!iconData) return null;

      switch (iconClass) {
        case "folium.Icon":
          if (layerName == "country_plantation_marker") {
            iconData.options.icon = "globe";
            iconData.options.prefix = "fa";
          } else if (iconData.options.icon == "leaf") {
            iconData.options.prefix = "fa";
          }
          return L.AwesomeMarkers.icon(iconData.options);
        case "folium.features.CustomIcon":
          return L.icon({
            iconUrl: iconData.options.iconUrl,
            iconSize: iconData.options.iconSize,
          });
      }
    };

    function onEachFeature(styleFunction, layerName) {
      return function (feature, layer) {
        if (["country_plantation_layer"].includes(layerName)) {
          layer.on({
            click: function (e) {
              if (typeof e.target.getBounds === "function") {
                cashewMap.fitBounds(e.target.getBounds());
              } else if (typeof e.target.getLatLng === "function") {
                let zoom = cashewMap.getZoom();
                zoom = zoom > 12 ? zoom : zoom + 1;
                cashewMap.flyTo(e.target.getLatLng(), zoom);
              }
            },
          });
        } else if (
          [
            "country_border_layer",
            "country_protected_layer",
            "country_colored_dept_layer",
            "country_colored_commune_layer",
          ].includes(layerName)
        ) {
          layer.on({});
        } else if (
          [
            "country_layer",
            "country_dept_layer",
            "country_commune_layer",
            "country_district_layer",
          ].includes(layerName)
        ) {
          layer.on({
            mouseout: function (e) {
              if (typeof e.target.setStyle === "function") {
                currentGeoJsonObj.resetStyle(e.target);
              }
            },
            mouseover: function (e) {
              if (typeof e.target.setStyle === "function") {
                const highlightStyle = styleFunction(e.target.feature);
                e.target.setStyle(highlightStyle);
              }
            },
          });
        }
      };
    };

    function reconstructFunction(funcData, layerName) {
      if (!funcData) {
        return null;
      }

      if (funcData.__function__) {
        return layers_functions_to_recompute[layerName];
      }

      if (funcData.__partial__) {
        const baseFunction = reconstructFunction(
          { __function__: true, name: funcData.func },
          layerName
        );

        const partialHighlightFunction = function (color_values) {
          return function (feature) {
            return baseFunction(feature, color_values);
          };
        };
        return partialHighlightFunction(funcData.keywords);
      }

      return null;
    };

    function normalizeString(str) {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    };

    const layers_functions_to_recompute = {
      country_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1",
        };
      },
      country_border_layer: function highlight_function2(feature) {
        return {
          fillColor: "transparent",
          color: "#B4B4B4",
          weight: 3,
          dashArray: "1, 1",
        };
      },
      country_dept_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1",
        };
      },
      country_colored_dept_layer: function highlightFunction(
        feature,
        { color_values }
      ) {
        if (
          !feature ||
          !feature.properties ||
          !color_values ||
          typeof color_values !== "object"
        ) {
          console.error("Invalid input. Check feature and color_values.");
          return;
        }

        let department = normalizeString(feature.properties.NAME_1);
        let colorCode = color_values.hasOwnProperty(department)
          ? color_values[department]
          : 0;
        let color = "transparent";
        let border = "transparent";

        if (colorCode !== 0) {
          let redValue = colorCode & 255;
          let greenValue = (colorCode >> 8) & 255;
          let blueValue = (colorCode >> 16) & 255;

          color = `#${redValue.toString(16).padStart(2, "0")}${greenValue
            .toString(16)
            .padStart(2, "0")}${blueValue.toString(16).padStart(2, "0")}`;
          border = "black";
        }

        return {
          fillColor: color,
          color: border,
          weight: 3,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.8,
        };
      },
      country_commune_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1",
        };
      },
      country_district_layer: function highlight_function(feature) {
        return {
          fillColor: "#ffaf00",
          color: "green",
          weight: 3,
          dashArray: "1, 1",
        };
      },
      country_colored_commune_layer: function highlightFunction(
        feature,
        { color_values }
      ) {
        if (
          !feature ||
          !feature.properties ||
          !color_values ||
          typeof color_values !== "object"
        ) {
          console.error("Invalid input. Check feature and color_values.");
          return;
        }

        let commune = normalizeString(feature.properties.NAME_2);
        let colorCode = color_values.hasOwnProperty(commune)
          ? color_values[commune]
          : 0;
        let color = "transparent";
        let border = "transparent";

        if (colorCode !== 0) {
          let redValue = colorCode & 255;
          let greenValue = (colorCode >> 8) & 255;
          let blueValue = (colorCode >> 16) & 255;

          color = `#${redValue.toString(16).padStart(2, "0")}${greenValue
            .toString(16)
            .padStart(2, "0")}${blueValue.toString(16).padStart(2, "0")}`;
          border = "black";
        }

        return {
          fillColor: color,
          color: border,
          weight: 3,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.8,
        };
      },
      country_protected_layer: function highlight_function(feature) {
        return {
          color: "black",
          fillColor: "#1167B1",
          weight: 2,
          dashArray: "1, 1",
          opacity: 0.35,
          fillOpacity: 0.75,
        };
      },
    };

    const socket = new WebSocket(`wss://${host}/ws/map_layer/`);

    socket.onopen = function (e) {
      console.log("Connection established!");
    };

    socket.onmessage = function (event) {
      console.log('New message!!!');
      const data = JSON.parse(event.data);
      if (data.message) {
        var outdated_layer_per_country_and_lang = data.message;
        updateMap(outdated_layer_per_country_and_lang);
      }
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log(
          `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.error("Connection died");
      }
    };

    socket.onerror = function (error) {
      console.error(`WebSocket error observed: ${error}`);
      console.log(error);
    };

    // Function to dynamically update the legend if the language change without reloading the page
    // function updateLegend() {
    //   let legendDiv = $(".info.legend")[0];
    //   legendDiv.innerHTML = getPathBasedContent();
    //   makeDraggable(legendDiv);
    // }
  } else {
    applyCSS();
    const startTime = performance.now();
    $(document).ready(function () {
      const endTime = performance.now();
      console.log(`Document Loading took ${endTime - startTime} milliseconds`);
      $("div.child1").html(mapData);
      $(".child1")
        .promise()
        .done(function () {
          $("div.child2").fadeOut(function () {
            $("div.child2").replaceWith("");
          });
        });
    });
  };
});