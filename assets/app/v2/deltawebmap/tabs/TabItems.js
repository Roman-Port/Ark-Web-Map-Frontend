"use strict";

class TabItems extends DeltaServerTab {

    constructor(server) {
        super(server);
    }

    GetDisplayName() {
        return "Items";
    }

    GetId() {
        return "items";
    }

    OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        super.OnInit(mountpoint);
        this.LayoutDom(mountpoint);
    }

    LayoutDom(mountpoint) {
        this.mountpoint = mountpoint;
        this.container = DeltaTools.CreateDom("div", "itemlist_container", mountpoint);
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */

    }

    async OnOpen() {
        /* Called when this tab is switched to */
        this.LoadResults();
    }

    async OnClose() {
        /* Called when this tab is switched away from */

    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        
    }

    async LoadResults() {
        //Get items
        var data = await this.server.db.inventories.GetAllItemsFromInventoriesByName("");

        //Sort
        data.sort((a, b) => {
            return b.total - a.total;
        });

        //Add entries
        for (var i = 0; i < data.length; i += 1) {
            this.container.appendChild(this.CreateItemBox(data[i]));
        }
    }

    CreateItemBox(data) {
        //Fetch item entry
        var entry = this.server.app.GetItemEntryByClassName(data.classname);

        //Total the amount of each item
        var total = data.total;

        //Create container
        var c = DeltaTools.CreateDom("div", "itemlist_item");
        var top = DeltaTools.CreateDom("div", "itemlist_item_top", c);

        //Add entries to the top
        var icon = DeltaTools.CreateDom("div", "itemlist_item_row", top);
        DeltaTools.CreateDom("div", "itemlist_item_row itemlist_item_row_amount", top, "x"+total.toString());
        DeltaTools.CreateDom("div", "itemlist_item_row", top, entry.name);
        var inventoryHolder = DeltaTools.CreateDom("div", null, c);

        //Set up icon
        DeltaTools.CreateDom("div", "itemlist_item_row_icon", icon).style.backgroundImage = "url('" + entry.icon.image_thumb_url + "')";

        //Sort
        data.inventories.sort((a, b) => {
            return b.count - a.count;
        });

        //Add inventories
        for (var i = 0; i < data.inventories.length; i += 1) {
            inventoryHolder.appendChild(this.CreateInventoryBox(data.inventories[i]));
        }

        return c;
    }

    CreateInventoryBox(data) {
        //Create container
        var c = DeltaTools.CreateDom("div", "itemlist_inventory");
        c._x_data = data;

        //Create template
        var icon = DeltaTools.CreateDom("div", "itemlist_inventory_row itemlist_inventory_row_icon", c);
        var count = DeltaTools.CreateDom("div", "itemlist_inventory_row itemlist_inventory_row_amount", c, "x" + data.count.toString());
        var name = DeltaTools.CreateDom("div", "itemlist_inventory_row", c);

        //Set defaults
        icon.appendChild(DeltaTools.CreateDom("div", "loading_spinner itemlist_inventory_loader"));

        //Get content
        if (data.holder_type == 0) {
            //Dino
            this._SetDataDino(data.holder_id, icon, name);
        } else if (data.holder_type == 1) {
            //Structure
            this._SetDataStructure(data.holder_id, icon, name);
        } else {
            //Unknown
        }

        return c;
    }

    async _SetDataDino(id, iconDiv, nameDiv) {
        var dino = await this.server.db.dinos.GetById(id);
        if (dino != null) {
            //Set info
            nameDiv.innerText = dino.tamed_name;

            //Get species
            var species = this.server.app.GetSpeciesByClassName(dino.classname);
            if (species != null) {
                iconDiv.style.backgroundImage = "url('" + species.icon.image_thumb_url + "')";
                if (species.icon.image_thumb_url != "https://icon-assets.deltamap.net/unknown_dino.png") {
                    //If this is a valid dino, set the invert
                    iconDiv.classList.add("itemlist_inventory_row_icon_invert");
                }
            } else {
                iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
            }
        } else {
            nameDiv.innerText = "MISSING DINO (" + id + ")";
            iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
        }

        //Clear icon loader
        iconDiv.firstChild.remove();
    }

    async _SetDataStructure(id, iconDiv, nameDiv) {
        var structure = await this.server.db.structures.GetById(parseInt(id));
        if (structure != null) {
            //Get item data
            var structureEntry = await this.server.app.GetItemEntryByStructureClassNameAsync(structure.classname);
            if (structureEntry != null) {
                nameDiv.innerText = structureEntry.name;
                iconDiv.style.backgroundImage = "url('" + structureEntry.icon.image_thumb_url + "')";
            } else {
                nameDiv.innerText = structure.classname;
                iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
            }
        } else {
            nameDiv.innerText = "MISSING STRUCTURE (" + id + ")";
            iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
        }

        //Clear icon loader
        iconDiv.firstChild.remove();
    }
}