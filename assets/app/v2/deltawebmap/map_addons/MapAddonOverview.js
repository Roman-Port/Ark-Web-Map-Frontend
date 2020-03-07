"use strict";

class MapAddonOverview {

    constructor(map) {
        this.map = map;
        
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
            node._img.style.display = "none";
            node._img.src = species.icon.image_thumb_url;
            node._title.innerText = data.tamed_name;
            node._sub.innerText = species.screen_name + " - Lvl "+data.level.toString();
        });

        //Set recycler views
        window.requestAnimationFrame(() => {
            //Resize
            this.recycler._CreateTemplateDOMs();

            //Set dataset
            this.map.server.CreateManagedDbSession('dinos', {
                "tribe_key": "tribe_id"
            }, () => {
                return true;
            }, {}, (dataset) => {
                this.recycler.SetData(dataset);
            });
        });
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

}