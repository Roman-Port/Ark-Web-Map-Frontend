"use struct";

class MapAddonPlayers extends TabMapAddon {

    constructor(map) {
        super(map);

        this.data = []; //Icon data, from the server
        this.pins = {}; //Pins, mapped with format "TYPE@ID"
        this.markers = null;
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */
        //container.on("moveend", () => this.RefreshPins());
    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Add
        window.setTimeout(() => {
            for (var i = 0; i < this.map.server.worldPlayers.length; i += 1) {
                this.AddPin(this.map.server.worldPlayers[i]);
            }
        }, 2000);
    }

    AddPin(data) {
        /* Adds a pin using the pin data format */

        //Get position on the map
        var pos = TabMap.ConvertFromGamePosToMapPos(this.map.server, data.x, data.y);

        //Create the inner content
        var content = DeltaTools.CreateDom("div", "mini_modal_marker");

        //Create marker
        var marker = DeltaTools.CreateDom("div", "map_icon_base map_icon_player", content);

        //Set image
        marker.style.backgroundImage = "url(" + data.steam_icon + ")";

        //Create icon
        var icon_template = L.divIcon({
            iconSize: [40, 40],
            className: "",
            html: content.innerHTML
        });

        //Make marker
        var marker = L.marker(pos, {
            icon: icon_template,
            zIndexOffset: 10000,
            x_delta_data: data
        });
        marker.x_last_data = data;

        //Add to map
        var icon_data = marker.addTo(this.map.map);

        //Add to register
        /*this.pins[data.type + "@" + data.id] = {
            "icon": icon_data,
            "data": data,
            "marker": marker
        };*/

        return icon_data;
    }

}