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
        this.sidebar = this.map.sidebarContent;
        this.sidebarContent = DeltaTools.CreateDom("div", "", this.sidebar);

        //Add
        this.topBar = DeltaTools.CreateDom("div", "dino_stats_sort_top", this.map.sidebarContainer);
        this.searchBar = DeltaTools.CreateDom("input", "dino_stats_sort_top_input", this.topBar);
        this.searchBar.placeholder = "Search Tribe";
        this.searchBar.type = "text";
        this.searchBar.addEventListener("input", () => {
            this.query = this.searchBar.value.toLowerCase();
            this.recycler.RefreshSearch();
        });

        //Set up recycler view
        this.recycler = new DeltaRecyclerView(this.sidebarContent, this.sidebar, 60, 48);
        this.recycler.SetCreateRowFunction(() => {
            //Create row
            var row = DeltaTools.CreateDom("div", "dino_sidebar_item");
            row._img = DeltaTools.CreateDom("img", "dino_sidebar_item_invertedimg", row);
            row._img.onload = function () {
                this.style.display = "block";
            }
            row._title = DeltaTools.CreateDom("div", "dino_sidebar_item_title", row);
            row._sub = DeltaTools.CreateDom("div", "dino_sidebar_item_sub", row);

            return row;
        });
        this.recycler.SetRenderRowFunction((node, data) => {
            var species = this.map.server.app.GetSpeciesByClassName(data.classname);
            if (node._img.src != species.icon.image_thumb_url) {
                node._img.style.display = "none";
                node._img.src = species.icon.image_thumb_url;
            }
            if (data.tamed_name != "") {
                node._title.innerText = data.tamed_name;
            } else {
                node._title.innerText = species.screen_name;
            }
            node._sub.innerText = species.screen_name + " - Lvl "+data.level.toString();
        });
        this.recycler.SetSortFunction((a, b) => {
            return b.level - a.level;
        });
        this.recycler.SetGetUniqueKeyFunction((a) => {
            return a.dino_id;
        });
        this.recycler.SetNewSearchQuery((a) => {
            if (this.query == "") { return true; }
            return a.tamed_name.toLowerCase().includes(this.query) || this.map.server.app.GetSpeciesByClassName(a.classname).screen_name.toLowerCase().includes(this.query);
        });
        this.recycler.AddEventListener("click", (data, originalEvent, originalDom) => {
            //Show the dino modal
            var pos = originalDom.getBoundingClientRect();
            var x = pos.left - 360;
            var y = pos.top - 5;
            DeltaPopoutModal.ShowDinoModal(this.map.server.app, data, { "x": x, "y": y }, this.map.server);
        });

        //Set recycler views
        window.requestAnimationFrame(() => {
            //Resize
            this.recycler._CreateTemplateDOMs();

            //Set dataset
            /*this.map.server.CreateManagedDinoDbListener((adds) => {
                this.recycler.BulkAddItems(adds);
            }, (removes) => {
                this.recycler.BulkRemoveItems(removes);
            }, () => {
                this.recycler.Reset();
            });*/

            this.map.server.db.dinos.SubscribeRecyclerViewToFiltered(this.recycler, "deltawebmap.tabs.map.addons.overview.recycler");
        });
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

    OnSidebarQueryChanged(query) {
        
    }

}