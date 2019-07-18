var dinopop = {};

dinopop.downloadAndShow = function(x, y, url, ele) {
    ele.x_is_loading = true;
    ark.serverRequest(url, {"failOverride":function() {
        ele.x_is_loading = false;
        if(ele.x_has_hovered_ended) {
            map.doEndHover(ele);
        }
    }}, function(e) {
        ele.x_is_loading = false;

        //Show
        dinopop.show(x, y, e);

        //Kill hoverer
        if(ele.x_modal != null) {
            ele.x_modal.remove();
        }
        ele.x_modal = null;
    });
}

dinopop.clickCatcher = function(evt) {
    //Check if we're in the path
    for(var i = 0; i<evt.path.length; i+=1) {
        if(evt.path[i].classList != null) {
            if(evt.path[i].classList.contains("popout_modal")) {
                return;
            }
        }
    }

    //Hide
    var e = document.getElementsByClassName("popout_modal");
    for(var i = 0; i<e.length; i+=1) {
        e[i].remove();
    }

    //Remove events
    window.removeEventListener("mousedown", dinopop.clickCatcher);
}

dinopop.show = function(x, y, data) {
    //Create element
    var e = ark.createDom("div", "popout_modal");

    //Add icon
    var icon = ark.createDom("img", "popout_icon", e);
    icon.src = "/assets/images/blank_50px.png";
    map.createBackground(icon, data.dino_entry.icon.image_thumb_url);

    //Create name
    var ce = ark.createDom("div", "popout_name", e);
    ark.createDom("div", "popout_name_title", ce).innerText = data.dino.tamedName;
    ark.createDom("div", "popout_name_sub", ce).innerText = data.dino_entry.screen_name+" - Lvl "+data.dino.level;

    //Add actual content
    var co = ark.createDom("div", "popout_content", e);
    dinopop.createStatsBox(data, co);
    dinopop.createStaticStatsBox(data, co);
    dinopop.createItemsBox(data, co);

    //Place
    e.style.top = y.toString()+"px";
    e.style.left = x.toString()+"px";
    document.body.appendChild(e);

    //Add events
    window.addEventListener("mousedown", dinopop.clickCatcher);
}

dinopop.createStatsBox = function(data, parent) {
    var statusesToUse = [
        "health",
        "stamina",
        "inventoryWeight",
        "food"
    ];

    var statsContainer = ark.createDom("div", "", parent);
    for(var i = 0; i<statusesToUse.length; i+=1) {
        //Get the status entry and dino data
        var statName = statusesToUse[i];
        var statusEntry = ark.statusEntries[statName];
        var maxStat = data.max_stats[statName];
        var currentStat = data.dino.currentStats[statName];

        //Create a DOM element
        var e = ark.createDom('div', 'stats_item stats_item_tweaked');
        var bar = ark.createDom('div', 'stats_item_bar', e);
        var content = ark.createDom('div', 'stats_item_content', e);
        var img = ark.createDom('img', '', content);
        var title = ark.createDom('div', 'title', content);
        var amount = ark.createDom('div', 'amount', content);

        //Set img and title
        img.src = statusEntry.icon;
        title.innerText = statusEntry.name;

        //Set bar
        var percent = (currentStat / maxStat) * 100;
        if(percent > 100) {percent = 100;}
        bar.style.width = percent.toString()+"%";

        //Set amount
        amount.innerText = ark.createNumberWithCommas(currentStat) + " / "+ark.createNumberWithCommas(maxStat);

        //Add
        statsContainer.appendChild(e);
    }

    return statsContainer;
}

dinopop.createStaticStatsBox = function(data, parent) {
    var statusesToUse = [
        "meleeDamageMult",
        "oxygen",
        "movementSpeedMult"
    ];

    var container = ark.createDom("ul", "popout_staticstats_container", parent);
    for(var i = 0; i<statusesToUse.length; i+=1) {
        //Get data
        var statName = statusesToUse[i];
        var statusEntry = ark.statusEntries[statName];
        var value = data.dino.currentStats[statName];

        //Add breaks if needed
        if(i != 0) {
            ark.createDom("li", "popout_staticstats_break", container);
        }

        //Create DOM element
        var e = ark.createDom("li", "popout_staticstats_s", container);
        e.innerText = statusEntry.formatString(value);
        ark.createDom("img", "popout_staticstats_s_icon", e).src = statusEntry.icon;
    }
}

dinopop.createItemsBox = function(data, parent) {
    var e = ark.createDom("ul", "popout_stats_item_area", parent);
    for(var i = 0; i<data.inventory_items.length; i+=1) {
        var item = data.inventory_items[i];
        var itemClass = data.item_class_data[item.classname];
        var entry = ark.createDom("li", "popout_stats_item", e);
        if(itemClass == null) {
            //Fallback
            ark.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x"+item.stackSize.toString();
            ark.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = "Missing Item Data";
        } else {
            entry.style.backgroundImage = "url('"+itemClass.icon.icon_url+"')";

            var stackWeightRounded = Math.round(itemClass.baseItemWeight * item.stackSize * 10) / 10;
            var name = stackWeightRounded.toString();
            if(stackWeightRounded % 1 == 0) {
                name += ".0";
            }

            ark.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x"+item.stackSize.toString();
            ark.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = name;
        }
    }
}