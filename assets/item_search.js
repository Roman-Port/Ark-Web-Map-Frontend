var itemsearch = {};

itemsearch.MAX_DINOS_PER_ITEM = 4;

itemsearch.fetchResultsCreateDom = function(query, page, callback, callbackArgs) {
    //Create DOM
    var parent = ark.createDom("div", "");

    //Make a request
    if(query == null) {
        query = "";
    }
    ark.serverRequest(ark.session.endpoint_tribes_itemsearch.replace("{query}", query)+"&p="+page.toString(), {}, function(d) {
        //Create for each
        for(var i = 0; i<d.items.length; i+=1) {
            var r = d.items[i];

            //Create structure.
            var e = ark.createDom("div", "dino_sidebar_item", parent);
            var e_icon = ark.createDom("img", "sidebar_item_search_entry_icon", e);
            var e_title = ark.createDom("div", "sidebar_item_search_entry_text", e);
            var e_sub = ark.createDom("div", "sidebar_item_search_entry_sub", e);
            var e_dinos = ark.createDom("div", "sidebar_item_search_entry_dinos", e);

            //Set some values
            e_icon.src = r.item_icon;
            e_title.innerText = r.item_displayname;
            e_sub.innerText = ark.createNumberWithCommas(r.total_count)+" total";
            
            //Add all of the dinos.
            var overflowDinos = ark.createDom("div", "dino_sidebar_itemsearch_overflowdinos");
            e.x_hasOverflow = false;
            for(var j = 0; j< r.owner_inventories.length; j+=1) {
                var inventory = r.owner_inventories[j];
                var dino = d.owner_inventory_dino[inventory.id];
                
                var e_dom = (ark.createCustomDinoEntry(dino.img, "", dino.displayName + " (x"+ark.createNumberWithCommas(inventory.count)+")", "dino_entry_offset dino_entry_mini"));
                e_dom.x_dino_id = dino.id;
                e_dom.addEventListener('click', function() {
                    ark.locateDinoById(this.x_dino_id);
                });
                if(j>itemsearch.MAX_DINOS_PER_ITEM) {
                    //Add to overflow
                    overflowDinos.appendChild(e_dom);

                    //Show a title for the overflow dinos
                    if(j == itemsearch.MAX_DINOS_PER_ITEM + 1) {
                        e.x_overflowMsg = (ark.createCustomDinoEntry("", "", "(Hover to view all "+r.owner_inventories.length+" dinos)", "dino_entry_offset dino_entry_mini dino_entry_overflowwarn"));
                        e_dinos.appendChild(e.x_overflowMsg);
                        e.x_hasOverflow = true;
                    }
                } else {
                    //Add like normal
                    e_dinos.appendChild(e_dom);
                }
            }

            //Add overflow area if it exists
            if(e.x_hasOverflow) {
                e.x_overflowArea = overflowDinos;
                e_dinos.appendChild(overflowDinos);
            }
        }

        //Add "show more" if needed
        if(d.more) {
            var e = ark.createDom("div", "nb_button_blue", parent);
            e.style.marginTop = "20px";
            e.innerText = "Load More";
            e.addEventListener('click', function() {
                //Remove button and load more
                this.remove();
                ark.tribeItemSearchPage++;
                ark.appendToDinoItemSearch(ark.latestTribeItemSearchQuery, ark.tribeItemSearchPage, false);
            });
        }

        //Send callback
        callback({
            "data":d,
            "dom":parent,
            "args":callbackArgs
        });
    });
}