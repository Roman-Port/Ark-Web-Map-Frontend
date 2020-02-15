"use struct";

class MapAddonIcons extends TabMapAddon {

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

        this.data = (await this.map.server.GetIconsData()).icons;

        //Add markers
        this.markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            disableClusteringAtZoom: 6,
            maxClusterRadius: 50
        });
        for (var i = 0; i < this.data.length; i += 1) {
            var data = this.data[i];
            var pos = TabMap.ConvertFromGamePosToMapPos(this.map.server.session, data.location.x, data.location.y);
            this.AddPin(this.data[i]);
            //this.markers.addLayer(L.marker(pos));
        }
        this.map.map.addLayer(this.markers);
    }

    async OnUnload(container) {
        
    }

    GetClustersOnScreen() {
        //Get bounds
        var bounds = this.map.map.getBounds();

        //Get clusters
        var c = this.index.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], this.map.map.getZoom());
        return c;
    }

    SubdivideToGroups(datas, gridSize) {
        //Create array padding
        var arr = [];
        for (var i = 0; i < gridSize * gridSize; i += 1) {
            arr.push([]);
        }

        //Do some calculations
        var mapSize = this.map.server.session.mapData.captureSize;
        var halfMapSize = mapSize / 2;

        //Add array items
        for (var i = 0; i < datas.length; i += 1) {
            var d = datas[i];
            var x = ((d.location.x / mapSize) + 0.5) * gridSize;
            var y = ((d.location.y / mapSize) + 0.5) * gridSize;
            arr[(Math.floor(y) * gridSize) + Math.floor(x)].push(d);
        }

        return arr;
    }

    FindMarkersInAndOutOfBounds(datas, bounds) {
    /* Returns a list of markers that should be rendered to the screen */

        //Search all icons
        var inB = [];
        var outB = [];
        for (var i = 0; i < datas.length; i += 1) {
            var d = datas[i];
            if (d.location.x > bounds[0][0] || d.location.x < bounds[1][0] || d.location.y > bounds[0][1] || d.location.y < bounds[1][1]) {
                outB.push(d);
            } else {
                inB.push(d);
            }
        }

        return [inB, outB];
    }

    AddPin(data) {
    /* Adds a pin using the pin data format */

        //Get position on the map
        var pos = TabMap.ConvertFromGamePosToMapPos(this.map.server.session, data.location.x, data.location.y);

        //Create the inner content
        var content = DeltaTools.CreateDom("div", "");

        //Create marker
        var marker = DeltaTools.CreateDom("div", "map_icon_base map_icon_dino", content);

        //Set image
        marker.style.backgroundImage = "url(" + data.img + ")";

        //Add color tag to content, if any
        if (data.tag_color != null) {
            DeltaTools.CreateDom("div", "map_icon_tag", content).style.backgroundColor = data.tag_color;
        } else {
            DeltaTools.CreateDom("div", "map_icon_tag", content).style.display = "none";
        }

        //Create the hover content, if any
        /*if (data.dialog != null) {
            content.appendChild(this.CreateHoverElement(data.img, data.dialog.title, data.dialog.subtitle));
        }*/

        //Create icon
        var icon_template = L.divIcon({
            iconSize: [40, 40],
            className: "",
            html: content.innerHTML
        });

        //Add to map
        var icon_data = this.markers.addLayer(L.marker(pos, {
            icon: icon_template,
            zIndexOffset: 1
        }));

        //Create icon
        if (data.extras !== undefined) {
            data.extras = {};
        }
        data.extras._id = data.id;
        data.extras._icon = data;
        data.extras._map = this;

        //Set border from state
        /*if (data.outline_color !== undefined) {
            icon_div.style.borderColor = data.outline_color;
        }*/

        //Add to register
        this.pins[data.type + "@" + data.id] = {
            "icon": icon_data,
            "data": data
        };

        return icon_data;
    }

    CreateHoverElement(iconImg, title, subtitle) {
        //Create element
        var e = DeltaTools.CreateDom("div", "mini_modal mini_modal_anim");

        //Add icon
        var icon = DeltaTools.CreateDom("img", "mini_modal_icon map_icon_base map_icon_dino", e);
        icon.style.backgroundImage = "url(" + iconImg + ")";

        //Create content
        var ce = DeltaTools.CreateDom("div", "mini_modal_content", e);
        DeltaTools.CreateDom("div", "mini_modal_title", ce).innerText = title;
        DeltaTools.CreateDom("div", "mini_modal_sub", ce).innerText = subtitle;

        return e;
    }

    GetAddedPin(type, id) {
    /* Returns a pin by it's type and ID */
        return this.pins[type + "@" + id];
    }

    RemovePin(type, id) {
    /* Accepts DATA in THIS.PINS */
        var data = this.pins[type + "@" + id];
        if (data != null) {
            data.icon.remove();
            delete this.pins[type + "@" + id];
        }
    }

    RemovePinsOfType(type) {
        var k = Object.keys(this.pins);
        for (var i = 0; i < k.length; i++) {
            if (k[i].startsWith(type + "@")) {
                var data = this.pins[k[i]];
                if (data != null) {
                    data.icon.remove();
                    delete this.pins[k[i]];
                }
            }
        }
    }

    RefreshPins() {
        /* Renders new pins to the screen */

        //Get pins we must add
        var pins = this.GetClustersOnScreen();
        console.log(pins);

        //Add all
        var added = 0;
        
        for (var j = 0; j < pins.length; j += 1) {
            if (pins[j].properties.cluster) {
                //This is a group
                var coords = TabMap.ConvertFromMapPosToGamePos(this.map.server.session, pins[j].geometry.coordinates[0], pins[j].geometry.coordinates[1]);
                /*this.AddPin(MapAddonIcons.CreateGroupMarkerPinData(pins[j].id, 1, {
                    x: coords[0],
                    y: coords[1]
                }));*/
                this.AddPin(MapAddonIcons.CreateGroupMarkerPinData(pins[j].id, 1, L.latLng(pins[j].geometry.coordinates[1], pins[j].geometry.coordinates[0])));
                added++;
            } else {
                //Ungrouped
                var data = pins[j].properties.data;
                var coords = TabMap.ConvertFromMapPosToGamePos(this.map.server.session, pins[j].geometry.coordinates[0], pins[j].geometry.coordinates[1]);
                if (this.GetAddedPin(data.type, data.id) == null) {
                    //this.AddPin(data);
                    added++;
                }
            }
        }

        return [added];
    }

    static CreateGroupMarkerPinData(index, amount, location) {
        return {
            "location": location,
            "img": "",
            "type": "group",
            "id": index.toString(),
            "outline_color": null,
            "tag_color": null,
            "dialog": null,
            "extras": {
                "amount": amount
            }
        };
    }

}