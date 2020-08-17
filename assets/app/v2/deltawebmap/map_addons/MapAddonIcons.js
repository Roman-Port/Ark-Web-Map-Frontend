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
    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Add markers
        this.markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            disableClusteringAtZoom: 6,
            maxClusterRadius: 50
        });
        this.map.map.addLayer(this.markers);

        //Set up
        this.markers.on("click", (evt) => this.OnMapMarkerClickEvent(evt));
        this.markers.on("mouseover", (evt) => this.OnMapMarkerHover(evt));

        //Add DB events
        this.map.server.dinos.OnContentAddRemoved.Subscribe("deltawebmap.tabs.map.addons.icons", (d) => {
            //Add
            this.AddDinoDataPins(d.adds);

            //Remove
            for (var i = 0; i < d.removes.length; i += 1) {
                this.RemovePin("dinos", d.removes[i]);
            }
        });
        this.AddDinoDataPins(this.map.server.dinos.filteredContent);
    }

    AddDinoDataPins(adds) {
        //Use adds
        for (var i = 0; i < adds.length; i += 1) {
            //Check if we have a pin for this
            var key = adds[i].dino_id;
            var pin = this.pins[key];
            if (pin != null) {
                //Remove
                this.RemovePin("", adds[i].dino_id);
            }

            //Add
            this.AddPin(adds[i]);
        }
    }

    OnMapMarkerClickEvent(evt) {
        //Get the data of this icon
        var dino = evt.layer.options.x_delta_data;
        var species = this.map.server.GetEntrySpecies(dino.classname);
        var marker = evt.layer._icon;

        //Execute
        var pos = marker.getBoundingClientRect();
        var x = pos.left - 14;
        var y = pos.top - 11;
        DeltaPopoutModal.ShowDinoModal(this.map.server.app,dino, { "x": x, "y": y }, this.map.server);

        //Stop propigation
        evt.originalEvent.stopPropagation();
    }

    OnMapMarkerHover(evt) {
        /* This is called when we hover over something. We'll check if we need to spawn the dialog */
        var dino = evt.layer.options.x_delta_data;
        var species = this.map.server.GetEntrySpecies(dino.classname);
        var marker = evt.layer._icon;

        //Check if it exists
        if (marker.x_delta_dialog != null) {
            marker.x_delta_dialog.remove();
            marker.x_delta_dialog = null;
        }

        //Get name
        var name = species.screen_name;
        if (dino.tamed_name.length > 0) {
            name = dino.tamed_name;
        }

        //Create
        marker.x_delta_dialog = this.CreateHoverElement(species.icon.image_url, name, species.screen_name);
        marker.classList.add("mini_modal_marker");
        marker.getElementsByClassName("map_icon_base")[0].appendChild(marker.x_delta_dialog);
    }

    async OnUnload(container) {
        
    }

    AddPin(data) {
        /* Adds a pin using the pin data format */

        //Get dino species
        var species = this.map.server.GetEntrySpecies(data.classname);

        //Get position on the map
        var pos = TabMap.ConvertFromGamePosToMapPos(this.map.server, data.location.x, data.location.y);

        //Create the inner content
        var content = DeltaTools.CreateDom("div", "mini_modal_marker");

        //Create marker
        var marker = DeltaTools.CreateDom("div", "map_icon_base map_icon_dino", content);

        //Set image
        marker.style.backgroundImage = "url(" + species.icon.image_thumb_url + ")";

        //Add color tag to content, if any
        var colorTag = null;
        if (data.tribe_prefs.color_tag != null) {
            colorTag = DeltaTools.CreateDom("div", "map_icon_tag", content);
            colorTag.style.backgroundColor = data.tribe_prefs.color_tag;
        }

        //Create icon
        var icon_template = L.divIcon({
            iconSize: [40, 40],
            className: "",
            html: content.innerHTML
        });

        //Make marker
        var marker = L.marker(pos, {
            icon: icon_template,
            zIndexOffset: 1,
            x_delta_data: data
        });
        marker.x_last_data = data;
        marker._content = content;
        marker._colorTag = colorTag;

        //Add to map
        var icon_data = this.markers.addLayer(marker);

        //Add to register
        this.pins[data.dino_id] = {
            "icon": icon_data,
            "data": data,
            "marker": marker
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

    RemovePin(type, id) {
    /* Accepts DATA in THIS.PINS */
        var data = this.pins[id];
        if (data != null) {
            data.marker.remove();
            delete this.pins[id];
        }
    }

    RemoveAllPins() {
        var keys = Object.keys(this.pins);
        for (var i = 0; i < keys.length; i += 1) {
            var data = this.pins[keys[i]];
            if (data != null) {
                data.icon.remove();
                delete this.pins[keys[i]];
            }
        }
    }

}