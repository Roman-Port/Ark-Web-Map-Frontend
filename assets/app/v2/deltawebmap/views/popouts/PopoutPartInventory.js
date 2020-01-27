"use strict";

class PopoutPartInventory extends PopoutPart {

    /* Represents the title of something */

    /* Adapter requirements: 
        inventory [WebInventory]
            The character's web inventory
     */

    constructor() {
        super();
    }

    Generate(e, server, data) {
        //Don't generate if we have no items
        if (data.inventory.inventory_items.length == 0) {
            return;
        }

        var outerContainer = DeltaTools.CreateDom("div", "popout_lower_content", e);
        var container = DeltaTools.CreateDom("ul", "popout_stats_item_area", outerContainer);

        for (var i = 0; i < data.inventory.inventory_items.length; i += 1) {
            this.GenerateInventoryItem(container, data.inventory.inventory_items[i], data.inventory.item_class_data);
        }
    }

    GenerateInventoryItem(container, data, classDict) {
        var e = DeltaTools.CreateDom("li", "popout_stats_item", container);
        var amount = DeltaTools.CreateDom("div", "popout_stats_item_text popout_stats_item_text_topleft", e);

        //Set amount
        amount.innerText = "x" + data.stack_size.toString();

        //Attempt to locate class data for this
        if (classDict[data.classname] != null) {
            var classData = classDict[data.classname];

            //Set icon
            e.style.backgroundImage = "url('" + classData.icon.image_url + "')";
        } else {
            //Unknown data
            //In the future, we might display something special here, but for now delete it
            e.remove();
        }

        return e;
    }

}