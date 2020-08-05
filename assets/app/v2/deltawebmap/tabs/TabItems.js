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

        //Subscribe
        this.server.inventories.OnContentUpdated.Subscribe("deltawebmap.tabs.items.run", () => {
            this.RefreshResults();
        });
    }

    LayoutDom(mountpoint) {
        this.mountpoint = mountpoint;
        this.container = DeltaTools.CreateDom("div", "itemlist_container", mountpoint);

        //Create area where inventories would go 
        this.holder = DeltaTools.CreateDom("div", null, this.container);
        this.holder.style.width = "100%";
        this.holder.style.position = "relative";

        //Add events
        this.holder.parentNode.addEventListener("scroll", () => {
            this.RefreshVisibleData();
        });

        //Create sidebar
        var sidebar = DeltaTools.CreateDom("div", "itemsearch_sidebar", this.mountpoint);

        //Create query box
        var query = DeltaTools.CreateDom("input", "itemsearch_query", sidebar);
        query.type = "text";
        query.placeholder = "Search Items";
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        window.requestAnimationFrame(() => {
            this.RefreshVisibleData();
        });
    }

    async OnOpen() {
        /* Called when this tab is switched to */
        
    }

    async OnClose() {
        /* Called when this tab is switched away from */

    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        
    }

    RefreshResults() {
        //Get items
        var data = this.server.inventories.GetAllItemsFromInventories(null);

        //Sort
        data.sort((a, b) => {
            return b.total - a.total;
        });
        this.currentData = data;

        //Calculate the height of all inventories
        var totalHeight = 0;
        for (var i = 0; i < data.length; i += 1) {
            data[i]._hpos = totalHeight;
            var height = this.GetHeightOfSection(data[i].inventories.length);
            data[i]._htop = totalHeight;
            data[i]._hbottom = totalHeight + height;
            totalHeight += height;
        }

        //Clear holder
        DeltaTools.RemoveAllChildren(this.holder);
        this.holder.parentNode.scrollTop = 0;

        //Update height
        this.holder.style.height = totalHeight.toString() + "px";

        //Update now
        this.RefreshVisibleData();
    }

    AddItemBox(data) {
        //Fetch item entry
        var entry = this.server.GetEntryItem(data.classname);

        //Total the amount of each item
        var total = data.total;

        //Create container
        var c = DeltaTools.CreateDom("div", "itemlist_item", this.holder);
        var top = DeltaTools.CreateDom("div", "itemlist_item_top", c);

        //Position container
        c.style.top = data._hpos.toString() + "px";

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
            this._SetDataDino(data.holder_id, c, icon, name);
        } else if (data.holder_type == 1) {
            //Structure
            this._SetDataStructure(data.holder_id, icon, name);
        } else if (data.holder_type == -1) {
            //Unknown item location (happens when an item is moved)
            name.innerText = "Unknown Location";
            icon.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
            icon.firstChild.remove();
        } else {
            //Unknown
            name.innerText = "UNKNOWN TYPE";
            icon.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
            icon.firstChild.remove();
        }

        return c;
    }

    async _SetDataDino(id, container, iconDiv, nameDiv) {
        var dino = await this.server.dinos.GetById(id);
        if (dino != null) {
            //Set info
            nameDiv.innerText = dino.tamed_name;

            //Get species
            var species = this.server.GetEntrySpecies(dino.classname);
            if (species != null) {
                iconDiv.style.backgroundImage = "url('" + species.icon.image_thumb_url + "')";
                if (species.icon.image_thumb_url != "https://icon-assets.deltamap.net/unknown_dino.png") {
                    //If this is a valid dino, set the invert
                    iconDiv.classList.add("itemlist_inventory_row_icon_invert");
                }
                if (dino.tamed_name == "") {
                    //Set default name
                    nameDiv.innerText = species.screen_name;
                }
            } else {
                iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
            }

            //Also add an event listener
            container._dino = dino;
            container.addEventListener("click", (e) => {
                //Find dino data
                var dd = e.target._dino;
                var dt = e.target;
                while (dd == null) {
                    dt = dt.parentNode;
                    dd = dt._dino;
                }

                //Show
                DeltaPopoutModal.ShowDinoModal(this.server.app, dd, {
                    "x": e.x,
                    "y": e.y
                }, this.server);
            });
            container.classList.add("itemlist_inventory_clickable");
        } else {
            nameDiv.innerText = "MISSING DINO (" + id + ")";
            iconDiv.style.backgroundImage = "url('https://icon-assets.deltamap.net/unknown_dino.png')";
        }

        //Clear icon loader
        iconDiv.firstChild.remove();
    }

    async _SetDataStructure(id, iconDiv, nameDiv) {
        var sName = "Unknown";
        var sIcon = "https://icon-assets.deltamap.net/unknown_dino.png";
        var structure = await this.server.structures.GetById(id);
        if (structure != null) {
            //Get item data
            var structureEntry = await this.server.app.GetItemEntryByStructureClassNameAsync(structure.classname);
            if (structureEntry != null) {
                sName = structureEntry.name;
                sIcon = structureEntry.icon.image_thumb_url;
            } else {
                sName = structure.classname;
            }

            //Cover some weird edge cases
            if (structure.classname.startsWith("DeathItemCache")) {
                sName = "Dead Creature";
                sIcon = "https://icon-assets.deltamap.net/unknown_dino.png";
            }
        } else {
            sName = "MISSING STRUCTURE (" + id + ")";
        }

        //Set data
        nameDiv.innerText = sName;
        iconDiv.style.backgroundImage = "url('" + sIcon + "')";

        //Clear icon loader
        iconDiv.firstChild.remove();
    }

    /* Interface */

    GetHeightOfSection(entryCount) {
        var h = 10; //Margin
        h += 43; //Top
        h += (entryCount * 30); //Entries
        return h;
    }

    RefreshVisibleData() {
        //Get the top and bottom of the visible area
        var top = this.holder.parentNode.scrollTop;
        var bottom = this.holder.parentNode.scrollTop + this.holder.parentNode.clientHeight;

        //Find all elements within this viewport
        for (var i = 0; i < this.currentData.length; i += 1) {
            if (this.currentData[i]._hbottom > top && this.currentData[i]._htop < bottom) {
                //Add
                if (this.currentData[i]._node == null) {
                    this.currentData[i]._node = this.AddItemBox(this.currentData[i]);
                }
            } else {
                //Remove
                if (this.currentData[i]._node != null) {
                    this.currentData[i]._node.remove();
                    this.currentData[i]._node = null;
                }
            }
        }
    }
}