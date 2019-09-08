var dinopop = {};

dinopop.statusEntries = {
    "water": {
        "icon":"/assets/ui/status/water.png",
        "name":"Water",
        "formatString":function(value) {return value;}
    },
    "unknown3": {
        "icon":"/assets/ui/status/unknown3.png",
        "name":"UNKNOWN 3",
        "formatString":function(value) {return value;}
    },
    "unknown2": {
        "icon":"/assets/ui/status/unknown2.png",
        "name":"UNKNOWN 2",
        "formatString":function(value) {return value;}
    },
    "unknown1": {
        "icon":"/assets/ui/status/unknown1.png",
        "name":"UNKNOWN 1",
        "formatString":function(value) {return value;}
    },
    "stamina": {
        "icon":"/assets/ui/status/stamina.png",
        "name":"Stamina",
        "formatString":function(value) {return value;}
    },
    "oxygen": {
        "icon":"/assets/ui/status/oxygen.png",
        "name":"Oxygen",
        "formatString":function(value) {return value;}
    },
    "movementSpeedMult": {
        "icon":"/assets/ui/status/movementSpeedMult.png",
        "name":"Movement Speed",
        "formatString":function(value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString()+"%";
        }
    },
    "meleeDamageMult": {
        "icon":"/assets/ui/status/meleeDamageMult.png",
        "name":"Melee Damage",
        "formatString":function(value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString()+"%";
        }
    },
    "inventoryWeight": {
        "icon":"/assets/ui/status/inventoryWeight.png",
        "name":"Weight",
        "formatString":function(value) {return value;}
    },
    "health": {
        "icon":"/assets/ui/status/health.png",
        "name":"Health",
        "formatString":function(value) {return value;}
    },
    "food": {
        "icon":"/assets/ui/status/food.png",
        "name":"Food",
        "formatString":function(value) {return value;}
    },
};

dinopop.downloadAndShow = function(x, y, url, ele) {
    ele.x_is_loading = true;
    main.serverRequest(url, {"failOverride":function() {
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
    var e = main.createDom("div", "popout_modal");

    //Add icon
    var icon = main.createDom("img", "popout_icon", e);
    icon.src = "/assets/images/blank_50px.png";
    map.createBackground(icon, data.dino_entry.icon.image_thumb_url);

    //Create name
    var ce = main.createDom("div", "popout_name", e);
    main.createDom("div", "popout_name_title", ce).innerText = data.dino.tamedName;
    main.createDom("div", "popout_name_sub", ce).innerText = data.dino_entry.screen_name+" - Lvl "+data.dino.level;

    //Add actual content
    var co = main.createDom("div", "popout_content", e);
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

    var statsContainer = main.createDom("div", "", parent);
    for(var i = 0; i<statusesToUse.length; i+=1) {
        //Get the status entry and dino data
        var statName = statusesToUse[i];
        var statusEntry = dinopop.statusEntries[statName];
        var maxStat = data.max_stats[statName];
        var currentStat = data.dino.currentStats[statName];

        //Create a DOM element
        var e = main.createDom('div', 'stats_item stats_item_tweaked');
        var bar = main.createDom('div', 'stats_item_bar', e);
        var content = main.createDom('div', 'stats_item_content', e);
        var img = main.createDom('img', '', content);
        var title = main.createDom('div', 'title', content);
        var amount = main.createDom('div', 'amount', content);

        //Set img and title
        img.src = statusEntry.icon;
        title.innerText = statusEntry.name;

        //Set bar
        var percent = (currentStat / maxStat) * 100;
        if(percent > 100) {percent = 100;}
        bar.style.width = percent.toString()+"%";

        //Set amount
        amount.innerText = main.createNumberWithCommas(currentStat) + " / "+main.createNumberWithCommas(maxStat);

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

    var container = main.createDom("ul", "popout_staticstats_container", parent);
    for(var i = 0; i<statusesToUse.length; i+=1) {
        //Get data
        var statName = statusesToUse[i];
        var statusEntry = dinopop.statusEntries[statName];
        var value = data.dino.currentStats[statName];

        //Add breaks if needed
        if(i != 0) {
            main.createDom("li", "popout_staticstats_break", container);
        }

        //Create DOM element
        var e = main.createDom("li", "popout_staticstats_s", container);
        e.innerText = statusEntry.formatString(value);
        main.createDom("img", "popout_staticstats_s_icon", e).src = statusEntry.icon;
    }
}

dinopop.createItemsBox = function(data, parent) {
    var e = main.createDom("ul", "popout_stats_item_area", parent);
    for(var i = 0; i<data.inventory_items.length; i+=1) {
        var item = data.inventory_items[i];
        var itemClass = data.item_class_data[item.classname];
        var entry = main.createDom("li", "popout_stats_item", e);
        if(itemClass == null) {
            //Fallback
            main.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x"+item.stackSize.toString();
            main.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = "Missing Item Data";
        } else {
            entry.style.backgroundImage = "url('"+itemClass.icon.image_url+"')";

            var stackWeightRounded = Math.round(itemClass.baseItemWeight * item.stackSize * 10) / 10;
            var name = stackWeightRounded.toString();
            if(stackWeightRounded % 1 == 0) {
                name += ".0";
            }

            main.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x"+item.stackSize.toString();
            main.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = name;
        }
    }
}