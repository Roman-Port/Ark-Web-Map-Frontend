"use strict";

class DeltaPopoutModuleInventory extends DeltaPopoutModuleCollapsable {

    constructor(holderType, holderId, rows) {
        super("Inventory", true);
        this.rows = rows;
        this.holderType = holderType;
        this.holderId = holderId;
    }

    BuildCollapseArea(ctx, rootHolder) {
        //Create the basic layout
        this.container = DeltaTools.CreateDom("div", "popoutm2_inventory");
        this.container.style.maxHeight = (78 * this.rows).toString() + "px";

        //Fetch inventory data
        var items = ctx.server.inventories.GetItemsFromInventory(this.holderType, this.holderId);
        if (items.length == 0) {
            this.container.classList.add("popoutm2_inventory_empty");
            this.container.innerText = "No Inventory Items";
        } else {
            //Add each item
            for (var i = 0; i < items.length; i += 1) {
                this.container.appendChild(this.CreateItem(ctx, items[i]));
            }

            this.container.classList.add("popoutm2_inventory_ready");
        }

        //Trigger resize
        ctx.OnResize();
        

        return this.container;
    }

    CreateItem(ctx, data) {
        //Get item information
        var info = ctx.app.GetItemEntryByClassName(data.classname);

        //Create item div
        var d = DeltaTools.CreateDom("div", "popoutm2_inventory_item");
        d.style.backgroundImage = "url('" + info.icon.image_url + "')";
        DeltaTools.CreateDom("div", "popoutm2_inventory_item_weight", d, (info.baseItemWeight * data.stack_size).toFixed(1));
        DeltaTools.CreateDom("div", "popoutm2_inventory_item_count", d, "x"+data.stack_size.toString());
        DeltaTools.CreateDom("div", "popoutm2_inventory_item_name", d, info.name);

        return d;
    }

}