"use strict";

class TabMap extends DeltaServerTab {

    constructor(server) {
        super(server);

        this.MARKER_Z_OFFSETS = {
            "dinos": 10,
            "players": 10000
        }; //Used to define layer priorities. If the layer name does not exist on this list, it is pushed to the bottom
        this.dino_marker_list = {};
        this.dino_marker_list_index = 0;
        this.markers = {};
        this.query = "";
        this.queryCancel = 0;
        this.ICON_ENTRIES = {
            "dinos": function (data, icon) {
                //icon.addEventListener('click', map.onDinoClicked);
            },
            "players": function (data, icon) {
                icon.style.backgroundSize = "cover";
            }
        };
        this.EVENT_ENTRIES = {
            "dinos": function (data, icon, id) {
                data._map.CloseAllPopouts();
                var p = PopoutModalView.ShowDinoDataFromIcon(data._map.server, data._icon, function (e) {
                    e.classList.add("map_popout_mount");
                    icon.style.zIndex = "99999";
                    icon.appendChild(e);
                });
                data._map.activePopout = p;
            }
        }
        this.SIDEBAR_SOURCES = [
            new OverviewSearchSourceDino(this.server),
            new OverviewSearchSourceItems(this.server)
        ];
        this.activePopout = null;
        this.map = null;

        //Create addons
        this.addons = [
            new MapAddonStructures(this),
            new MapAddonIcons(this)
        ];
    }

    GetDisplayName() {
        return "Overview";
    }

    GetId() {
        return "overview";
    }

    CloseAllPopouts() {
        if (this.activePopout != null) {
            this.activePopout.mount.parentNode.style.zIndex = "unset";
            this.activePopout.Close();
            this.activePopout = null;
        }
    }

    static CloseAllPopoutsMap() {
        this._dmap.CloseAllPopouts();
    }

    async OnInit(mountpoint) {
        super.OnInit(mountpoint);

        //Create DOM
        this.LayoutDom(mountpoint);

        //Subscribe RPC events
        this.server.SubscribeRPCEvent("tab.map", 7, (m) => this.OnRPCLiveUpdate(m)); 
    }

    LayoutDom(mountpoint) {
        this.mountpoint = mountpoint;

        //Create DOM layout
        this.mapContainer = DeltaTools.CreateDom("div", "map_part", this.mountpoint);
        var mapCanvas = DeltaTools.CreateDom("div", "map_part_canvas", this.mapContainer);

        var sidebarContainer = DeltaTools.CreateDom("div", "dino_sidebar smooth_anim dino_sidebar_open", this.mountpoint);
        this.sidebarContent = DeltaTools.CreateDom("div", "dino_sidebar_helper", sidebarContainer);

        var sidebarSearchContainer = DeltaTools.CreateDom("div", "dino_stats_search_box", this.top);
        this.searchBar = DeltaTools.CreateDom("input", "dino_stats_search_base dino_stats_search_text", sidebarSearchContainer);
        this.searchBar.type = "text";
        this.searchBar.placeholder = "Search Tribe";
        this.searchBar.addEventListener("input", () => this.OnSidebarQueryChanged());
        var sidebarSort = DeltaTools.CreateDom("div", "dino_stats_search_base dino_stats_search_sort", sidebarSearchContainer);
    }

    async OnFirstOpen() {
        //Get map spawn location
        var pos = TabMap.ConvertFromGamePosToMapPos(this.server.session, this.server.prefs.x, this.server.prefs.y);

        //Create map
        this.map = L.map(this.mapContainer, {
            crs: L.CRS.Simple,
            minZoom: 0,
            maxBounds: [
                [-356, -100],
                [100, 356]
            ],
            zoomSnap: 0.5
        }).setView(pos, this.server.prefs.z);
        this.map._dmap = this;

        //Bind events to addons
        for (var i = 0; i < this.addons.length; i += 1) {
            this.addons[i].BindEvents(this.map);
        }

        //Bind events
        this.map.on("move", TabMap.CloseAllPopoutsMap);
        this.map.on("moveend", () => this.MapMovePushSavedPos());
        this.map.on("zoombegin", TabMap.CloseAllPopoutsMap);
        this.map.on("click", TabMap.CloseAllPopoutsMap);

        //Add addons
        for (var i = 0; i < this.addons.length; i += 1) {
            this.addons[i].OnLoad(this.map);
        }

        //Add game map
        this.SwitchGameLayer(this.server.session.maps[0]);

        //Load overview
        this.server.GetOverviewData().then((e) => {
            this.overview = e;
            this.RefreshSidebar();
        });
    }

    MapMovePushSavedPos() {
        if (this._movePushSettingsDelay != null) {
            clearTimeout(this._movePushSettingsDelay);
        }
        var center = this.map.getCenter();
        var pos = TabMap.ConvertFromMapPosToGamePos(this.server.session, center.lng, center.lat);
        this.server.prefs.x = pos[0];
        this.server.prefs.y = pos[1];
        this.server.prefs.z = Math.ceil(this.map.getZoom());
        this._movePushSettingsDelay = window.setTimeout(() => {
            this.server.PushUserPrefs();
        }, 5000);
    }

    async OnOpen() {
        this.map._onResize();
    }

    async OnClose() {
        this.queryCancel++;
    }

    async OnDeinit() {
        if (this.map != null) {
            this.map.remove();
        }
        this.searchBar.removeEventListener("input", TabMap.OnSidebarQueryChangedStatic);
        this.queryCancel++;

        //Unsubscribe app RPC events
        this.server.UnsubscribeRPCEvent("tab.map");
    }

    GetCornersInGameCoords() {
        var d = [
            this.ScreenPosToGamePos(0, 0),
            this.ScreenPosToGamePos(this.mapContainer.clientWidth, this.mapContainer.clientHeight)
        ];
        return [
            [Math.max(d[0][0], d[1][0]), Math.max(d[0][1], d[1][1])],
            [Math.min(d[0][0], d[1][0]), Math.min(d[0][1], d[1][1])]
        ]
    }

    ScreenPosToGamePos(x, y) {
        var p = this.map.containerPointToLatLng([x, y]);
        return TabMap.ConvertFromMapPosToGamePos(this.server.session, p.lng, p.lat);
    }

    SwitchGameLayer(layer) {
        //Create main tile layer
        var mapSettings = {
            attribution: 'Studio Wildcard',
            maxNativeZoom: layer.maximumZoom,
            maxZoom: 12,
            id: 'ark_map',
            opacity: 1,
            zIndex: 1,
            bounds: [
                [-256, 0],
                [0, 256]
            ]
        };
        L.tileLayer(layer.url, mapSettings).addTo(this.map);
    }

    ToggleSidebar() {
        this.mountpoint.classList.toggle("map_tab_hiddensidebar");
    }

    async EnableTribeDinos() {
        //Get items
        var d = await this.server.GetIconsData();

        //Add all map icons
        for (var i = 0; i < d.icons.length; i += 1) {
            var data = d.icons[i];
            this.AddDataIconToMap(data, this.map);
        }
    }

    AddDataIconToMap (data) {
        //Get position on the map
        var pos = TabMap.ConvertFromGamePosToMapPos(this.server.session, data.location.x, data.location.y);

        //Create the inner content
        var content = DeltaTools.CreateDom("div", "");

        //Add color tag to content, if any
        if (data.tag_color != null) {
            DeltaTools.CreateDom("div", "map_icon_tag", content).style.backgroundColor = data.tag_color;
        } else {
            DeltaTools.CreateDom("div", "map_icon_tag", content).style.display = "none";
        }

        //Create the hover content, if any
        if (data.dialog !== undefined) {
            content.appendChild(this.CreateHoverElement(data.img, data.dialog.title, data.dialog.subtitle));
        }

        //Find click handler, if any
        var clickHandler = null;
        if (this.EVENT_ENTRIES[data.type] !== null) {
            clickHandler = function () {
                this.x_ctx.EVENT_ENTRIES[this.x_type](this.x_data, this._icon, this.x_id);
            };
        }

        //Create icon
        if (data.extras !== undefined) {
            data.extras = {};
        }
        data.extras._id = data.id;
        data.extras._icon = data;
        data.extras._map = this;
        var icon = this.AddMapIcon(data.type, data.id, data.extras, pos, data.img, clickHandler, "map_icon_dino", content, this.map, data.location.yaw);
        icon.x_data = data;

        //Set border from state
        if (data.outline_color !== undefined) {
            icon.style.borderColor = data.outline_color;
        }

        //Add custom events from the type
        if (this.ICON_ENTRIES[data.type] !== undefined) {
            this.ICON_ENTRIES[data.type](data, icon);
        } else {
            //Unexpected type.
            console.warn("Got icon with type " + data.type + ", but there was no entry for this type!");
        }
    }

    CreateHoverElement (iconImg, title, subtitle) {
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

    AddMapIcon(layerId, markerId, data, pos, img, onclick, classNames, inner, mapContainer, rotation) {
        var icon = L.divIcon({
            iconSize: [40, 40],
            className: "map_icon_base " + classNames,
            html: inner.innerHTML
        });

        //Make sure that we have an index in the markers for this
        if (this.markers[layerId] == null) {
            this.markers[layerId] = {};
        }

        //Determine Z-index
        var z = 0;
        if (this.MARKER_Z_OFFSETS[layerId] != null) {
            //Get base
            z = this.MARKER_Z_OFFSETS[layerId];

            //Find number of items already here
            z += Object.keys(this.markers[layerId]).length;
        }

        //Add to map
        var dino_icon = L.marker(pos, {
            icon: icon,
            zIndexOffset: 1
        }).addTo(mapContainer);

        //Add to list
        this.markers[layerId][markerId] = dino_icon;

        //Add data
        dino_icon.x_data = data;
        dino_icon.x_ctx = this;
        dino_icon.x_id = markerId;
        dino_icon.x_type = layerId;

        //Add events
        if (onclick != null) { dino_icon.on('click', onclick); }

        //Set image
        dino_icon._icon.style.backgroundImage = "url(" + img + ")";
        dino_icon._icon.style.zIndex = null;

        //Add rotation
        /*if (rotation != null) {
            var rotor = DeltaTools.CreateDom("div", "map_icon_rotor", dino_icon._icon);
            dino_icon.x_rotor = rotor;
            rotor.style.transform = "rotate(" + rotation + "deg)";
        }*/

        return dino_icon._icon;
    }

    static ConvertFromNormalizedToMapPos (pos) {
        ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
        return [
            (-pos.y * 256),
            (pos.x * 256)
        ];
    }

    static ConvertFromMapPosToNormalized (pos) {
        ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
        return [
            (-pos.y / 256),
            (pos.x / 256)
        ];
    }

    static ConvertFromGamePosToMapPos (session, x, y) {
        //Add offsets
        x += session.mapData.mapImageOffset.x;
        y += session.mapData.mapImageOffset.y;

        //Divide by scale
        x /= session.mapData.captureSize;
        y /= session.mapData.captureSize;

        //Move
        x += 0.5;
        y += 0.5;

        //Convert to map pos
        x = x * 256;
        y = -y * 256;

        //Now, return latlng
        return L.latLng(y, x);
    }

    static ConvertFromMapPosToGamePos(session, x, y) {
        //When calling this, X IS LNG
        //Convert to map pos
        x = x / 256;
        y = -y / 256;

        //Move
        x -= 0.5;
        y -= 0.5;

        //Divide by scale
        x *= session.mapData.captureSize;
        y *= session.mapData.captureSize;

        //Add offsets
        x -= session.mapData.mapImageOffset.x;
        y -= session.mapData.mapImageOffset.y;

        return [x, y];
    }

    static ConvertFromMapTilePosToGamePos(session, x, y, zoom) {
        var upt = Math.pow(2, zoom);

        //Multiply by tile size
        x *= (session.mapData.captureSize / upt);
        y *= (session.mapData.captureSize / upt);

        //Add offsets
        x -= session.mapData.mapImageOffset.x;
        y -= session.mapData.mapImageOffset.y;

        return [x, y];
    }

    /* Dino sidebar */
    OnSidebarQueryChanged() {
        this.query = this.searchBar.value;
        this.RefreshSidebar();
    }

    async RefreshSidebar() {
        /* Called when it's time to refresh the dino sidebar */

        //Check if we have data
        if (this.overview == null) {
            return;
        }

        //Obtain a token
        this.queryCancel++;
        var token = this.queryCancel;

        //Get container
        var container = this.sidebarContent;
        container.innerHTML = "";

        //Get results for all
        var promises = [];
        for (var i = 0; i < this.SIDEBAR_SOURCES.length; i += 1) {
            promises.push(this.SidebarLoadResult(token, DeltaTools.CreateDom("div", "", container), i));
        }

        //Create loading dialog
        var loading = DeltaTools.CreateDom("div", "dino_sidebar_noresults_sub dino_sidebar_stillloading", container, "Still Loading...");

        //Wait for all of these to finish
        await Promise.all(promises);

        //Check if our token is still valid
        if (token != this.queryCancel) {
            return;
        }

        //Collapse loader
        loading.remove();

        console.log("done loading");
    }

    async SidebarLoadResult(token, container, index) {
        //Load results
        var data = await this.SIDEBAR_SOURCES[index].LoadResults(this.query, this.overview);

        //Check if our token is still valid
        if (token != this.queryCancel) {
            return;
        }

        //Now, produce results
        container.appendChild(this.SIDEBAR_SOURCES[index].DisplayResults(data));

        return true;
    }

    /*
     * RPC EVENTS
     */

    OnRPCLiveUpdate(payload) {
        /* This handles opcode 7, LiveUpdate */
        //Run all updates
        for (var i = 0; i < payload.updates.length; i += 1) {
            this.HandleRPCLiveUpdate(payload.updates[i]);
        }
    }

    HandleRPCLiveUpdate(update) {
        //Find the map target
        var target = null;
        switch (update.type) {
            case 0: if (this.markers["players"] != null) { target = this.markers["players"][update.id]; } break;
            case 1: if (this.markers["dinos"] != null) { target = this.markers["dinos"][update.id]; } break;
        }
        if (target == null) { return; }

        //Run updates
        if (update.x != null && update.y != null && update.z != null) {
            target.setLatLng(TabMap.ConvertFromGamePosToMapPos(this.server.session, update.x, update.y));
        }

        //Show damage indicator, if any
        if (target.x_last_health != null && update.health != null) {
            this.CreateHitIndicator(target, update.health - target.x_last_health);
        }

        //Set last stats
        if (update.health != null) {
            target.x_last_health = update.health;
        }
    }

    CreateHitIndicator(target, amount) {
        var e = DeltaTools.CreateDom("div", "map_damage_indicator_v2", target._icon);
        var text = Math.round(amount).toString();
        var color = "#ff5338";
        if (amount > 0) {
            text = "+" + text;
            color = "#6fe84a";
        }
        if (amount == 0) {
            color = "#ffcf40";
        }
        e.style.color = color;
        e.innerText = text;
        return e;
    }
}

class TabMapAddon {

    /* Addon for use to add additonal features to maps */

    constructor(map) {
        this.map = map;
    }

    BindEvents (container) {
        /* Used when we bind events to the map container */
        throw new Error("TabMapAddon cannot be constructed; Please implement it!");
    }

    async OnLoad(container) {
        /* Called when we load the map */
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

}

class OverviewSearchSource {

    /* Result type for overview searches */

    constructor(server) {
        this.server = server;
    }

    async LoadResults(query, overviewData) {
        /* Returns adapted results for overview search */
        throw new Error("OverviewSearchSource cannot be constructed; Please implement it!");
    }

    DisplayResults(data) {
        /* Returns DOM results from LoadResults() */
        throw new Error("OverviewSearchSource cannot be constructed; Please implement it!");
    }

}

class OverviewSearchAutoSource extends OverviewSearchSource {

    /* Used to produce the standard box */

    constructor(server) {
        super(server);
    }

    GetStandardBox(img, title, subtitle, isImgInverted) {
        var e = DeltaTools.CreateDom("div", "dino_sidebar_item");
        var imgD = DeltaTools.CreateDom("img", "", e);
        imgD.src = img;
        if (isImgInverted) {
            imgD.classList.add("dino_sidebar_item_invertedimg");
        }
        DeltaTools.CreateDom("div", "dino_sidebar_item_title", e, title);
        DeltaTools.CreateDom("div", "dino_sidebar_item_sub", e, subtitle);
        return e;
    }

}

class OverviewSearchSourceDino extends OverviewSearchAutoSource {

    constructor(server) {
        super(server);
    }

    async LoadResults(query, overviewData) {

        //Create holder
        var holder = [];

        //Find
        for (var i = 0; i < overviewData.dinos.length; i += 1) {
            var d = overviewData.dinos[i];
            if (d.displayName.toLowerCase().includes(query) || d.classDisplayName.toLowerCase().includes(query)) {
                holder.push({
                    "sort": [
                        d.displayName,
                        d.classDisplayName,
                        d.level
                    ],
                    "data": d
                });
            }
        }

        return holder;
    }

    DisplayResults(data) {

        //Create holder
        var holder = DeltaTools.CreateDom("div", "");

        //Find
        for (var i = 0; i < data.length; i += 1) {
            var d = data[i].data;

            //Create box
            var b = this.GetStandardBox(d.img, d.displayName, d.classDisplayName + " - Lvl " + d.level, true);

            //Add dino status
            var status = DeltaTools.CreateDom("div", "dino_sidebar_item_sub dino_sidebar_item_sub_state", b);
            var entry = statics.STATUS_STATES[d.status];
            if (entry != null) {
                status.innerText = entry.text;
                status.style.color = entry.modal_color;
            } else {
                status.innerText = "UNKNOWN";
            }

            //Add
            holder.appendChild(b);
        }

        return holder;
    }

}

class OverviewSearchSourceItems extends OverviewSearchAutoSource {

    constructor(server) {
        super(server);
    }

    async LoadResults(query, overviewData) {

        //Create holder
        var holder = [];

        //Request
        var d = await this.server.WebRequestToEndpoint("tribes_itemsearch", {}, {
            "{query}": query
        });

        //Add
        for (var i = 0; i < d.items.length; i += 1) {
            var item = d.items[i];

            //Read inventories
            var inventoryRefs = [];
            var inventories = [];

            //Loop through connected inventories
            for (var j = 0; j < item.owner_inventories.length; j += 1) {
                var inventory_ref = item.owner_inventories[j];
                var inventory = d.inventories[inventory_ref.type.toString()][inventory_ref.id.toString()];
                inventoryRefs.push(inventory_ref);
                inventories.push(inventory);
            }

            //Add item
            holder.push({
                "sort": [
                    
                ],
                "data": item,
                "inventories": inventories,
                "refs": inventoryRefs
            });
        }

        return holder;
    }

    DisplayResults(data) {

        //Create holder
        var holder = DeltaTools.CreateDom("div", "");

        //Find
        for (var i = 0; i < data.length; i += 1) {
            var item = data[i].data;

            //Create structure.
            var e = this.GetStandardBox(item.item_icon, item.item_displayname, DeltaTools.CreateNumberWithCommas(item.total_count) + " total", false);
            var e_dinos = DeltaTools.CreateDom("div", "", e);

            //Loop through connected inventories
            for (var j = 0; j < data[i].inventories.length; j += 1) {
                var inventory_ref = data[i].refs[j];
                var inventory = data[i].inventories[j];
                var e_dom = null;
                if (inventory_ref.type == 0) {
                    //Dino
                    e_dom = this.CreateMiniItemModal(inventory.img, inventory.displayName + " (x" + DeltaTools.CreateNumberWithCommas(inventory_ref.count) + ")", true);
                    e_dom.x_id = inventory_ref.id;
                } else if (inventory_ref.type == 1) {
                    //Inventory
                    e_dom = this.CreateMiniItemModal(inventory.img, inventory.displayName + " (x" + DeltaTools.CreateNumberWithCommas(inventory_ref.count) + ")", false);
                    e_dom.x_id = inventory_ref.id;
                } else {
                    //Character
                    e_dom = this.CreateMiniItemModal(inventory.img, inventory.name + " (x" + DeltaTools.CreateNumberWithCommas(inventory_ref.count) + ")", false);
                    e_dom.x_id = inventory_ref.id;
                }
                e_dom.x_type = inventory_ref.type;
                e_dinos.appendChild(e_dom);
            }

            //Add
            holder.appendChild(e);
        }

        return holder;
    }

    CreateMiniItemModal(imgSrc, text, isInverted) {
        var e = DeltaTools.CreateDom("div", "dino_entry dino_entry_offset dino_entry_mini");
        var img = DeltaTools.CreateDom("img", "", e);
        img.src = imgSrc;
        if (!isInverted) {
            e.classList.add("dino_entry_no_invert");
        }
        DeltaTools.CreateDom("div", "dino_entry_sub", e).innerText = text;
        return e;
    }

}