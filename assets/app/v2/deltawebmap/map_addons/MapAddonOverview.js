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

        //Set up recycler view
        this.recycler = new DeltaRecyclerView(this.sidebarContent, this.sidebar, 0, 54);
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

        //Set recycler views
        window.requestAnimationFrame(() => {
            //Resize
            this.recycler._CreateTemplateDOMs();

            //Set dataset
            this.map.server.CreateManagedDbListener('dinos', "tribe_id", (adds, removes) => {
                if (adds.length > 0) {
                    this.recycler.BulkAddItems(adds);
                }
                if (removes.length > 0) {
                    this.recycler.BulkRemoveItems(removes);
                }
            });
        });
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

    OnSidebarQueryChanged(query) {
        this.query = query.toLowerCase();
        this.recycler.RefreshSearch();
    }

}