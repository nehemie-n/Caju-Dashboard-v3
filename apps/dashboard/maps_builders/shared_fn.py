
from folium.elements import *

def format_perc(num: float):
    """
    When given a {num} retutns the html format of it in percentages
    """
    return f"""
    <small 
        style="opacity: 0.7;
        font-weight: 600;"
    >
    ({round(num * 100, 1)}%)
    </small>
    """

def map_home_btn():
    """
    When clicked navigates the map to the inital view point
    """
    reset_map_js = """
        const map_leaf_dom = document.getElementsByClassName("folium-map")[0];

        const checkLoadMap = setInterval(() => {
        const map_leaf = eval(map_leaf_dom.id);
        if (map_leaf) {
            console.log('Map is loaded')
            /**
            *
            * Create the node to hold the custom html
            */
            const btnNode = document.createElement("div");
            // Set styles attributes for the div
            btnNode.setAttribute("class", "btn-group");
            btnNode.setAttribute(
            "style",
            "z-index: 909; position: absolute; top: 10px; right: 45px;"
            );
            btnNode.innerHTML = `
                                    <button id="resetview" type="buttons" style="background-color: white;
                                        width: 36px;
                                        height: 36px;
                                        border: none;
                                        box-shadow: rgba(0, 0, 0, 0.45) 0px 1px 5px;
                                        border-radius: 4px;
                                        font-size: 20px;
                                    ">
                                        <span><i class="fa fas fa-home"></i></span>
                                    </button>
                            `;
            map_leaf_dom.appendChild(btnNode); // append to map
            /**
            * Store inital load variables
            */
            const initialZoom = map_leaf.getZoom();
            const initialCenter = map_leaf.getCenter();
            /**
            * Reset zoom and view function
            * called after map is initiated
            */
            function resetZoom() {
                document.getElementById("resetview").addEventListener("click", () => {
                    map_leaf.setView(initialCenter, initialZoom);
                });
            }
            resetZoom();
            clearInterval(checkLoadMap);
        }
        }, 500);
    """
    return Element(reset_map_js)