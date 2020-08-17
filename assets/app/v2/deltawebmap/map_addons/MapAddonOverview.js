"use strict";

class MapAddonOverview {

    constructor(map) {
        this.map = map;
        this.query = "";
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */
        
    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Get parts
        this.sidebar = this.map.sidebar;

        //Create recycler view
        var recyclerOptions = {
            "rowHeight": 48,
            "extraContainerClass": "map_sidebar",
            "onClickElementEvent": (data, row) => {
                var pos = row.getBoundingClientRect();
                var x = pos.left - 360;
                var y = pos.top - 5;
                DeltaPopoutModal.ShowDinoModal(this.map.server.app, data, { "x": x, "y": y }, this.map.server);
            },
            "createView": () => {
                //Create row
                var row = DeltaTools.CreateDom("div", "dino_sidebar_item");
                row._img = DeltaTools.CreateDom("img", "dino_sidebar_item_invertedimg", row);
                row._img.onload = function () {
                    this.style.display = "block";
                }
                row._title = DeltaTools.CreateDom("div", "dino_sidebar_item_title", row);
                row._sub = DeltaTools.CreateDom("div", "dino_sidebar_item_sub", row);

                return row;
            },
            "setViewContent": (node, data) => {
                var species = this.map.server.GetEntrySpecies(data.classname);
                if (node._img.src != species.icon.image_thumb_url) {
                    node._img.style.display = "none";
                    node._img.src = species.icon.image_thumb_url;
                }
                if (data.tamed_name != "") {
                    node._title.innerText = data.tamed_name;
                } else {
                    node._title.innerText = species.screen_name;
                }
                node._title.style.color = data.tribe_prefs.color_tag;
                if (this.map.server.adminEnabled) {
                    //Admin mode is on; Show the tribe name
                    node._sub.innerText = this.map.server.GetTribeByIdSafe(data.tribe_id).tribe_name + " (" + data.tribe_id + ")";
                } else {
                    //Standard text
                    node._sub.innerText = species.screen_name + " - Lvl " + data.level.toString();
                }
                node.style.borderRightColor = statics.STATUS_STATES[data.status].color;
            },
            "getDataPrimaryKey": (data) => {
                return data.dino_id;
            },
            "doSort": (a, b) => {
                return b.level - a.level;
            },
            "doFilter": (a) => {
                return a.tamed_name.toLowerCase().includes(this.query) || this.map.server.GetEntrySpecies(a.classname).screen_name.toLowerCase().includes(this.query);
            }
        }
        this.recycler = new DeltaRecyclerView(this.sidebar, recyclerOptions);

        //Subscribe
        this.map.server.dinos.SubscribeRecycler("deltawebmap.tabs.map.addons.overview.recycler", this.recycler);
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

    OnNewSearchQuery(query) {
        this.query = query.toLowerCase();
        this.recycler.ReloadAll();
    }

}