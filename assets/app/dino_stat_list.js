var dino_stats = {};

dino_stats.registered_classnames = [];
dino_stats.entries = {};
dino_stats.dinos = [];
dino_stats.index = 0;
dino_stats.loading = false;

dino_stats.container = document.getElementById('tab_dinos_table');
dino_stats.title = document.getElementById('dino_stats_title');
dino_stats.query = document.getElementById('dino_stats_search');

dino_stats.active_sort = null;
dino_stats.active_sort_reverse = false;
dino_stats.active_sort_stat = "stamina"; //Only if active sort is "stat"
dino_stats.active_sort_stat_tamed = true; //Only if active sort is "stat"

dino_stats.SORT_MODES = {
    "name":function(a, b) {
        if(a.tamed_name < b.tamed_name) { return -1; }
        if(a.tamed_name > b.tamed_name) { return 1; }
        return 0;
    },
    "species":function(a, b) {
        var ae = dino_stats.entries[a.classname];
        var be = dino_stats.entries[b.classname];
        if(ae != null && be == null) {
            return 1;
        }
        if(be != null && ae == null) {
            return -1;
        }
        if(be == null && ae == null) {
            return 0;
        }
        if(ae.screen_name < be.screen_name) { return -1; }
        if(ae.screen_name > be.screen_name) { return 1; }
        return 0;
    },
    "gender":function(a, b) {
        if(a.is_female && !b.is_female) { return -1; }
        if(!a.is_female && b.is_female) { return 1; }
        return 0;
    },
    "level":function(a, b) {
        if(a.level > b.level) { return -1; }
        if(a.level < b.level) { return 1; }
        return 0;
    },
    "base_level":function(a, b) {
        if(a.base_level > b.base_level) { return -1; }
        if(a.base_level < b.base_level) { return 1; }
        return 0;
    },
    "stat":function(a, b) {
        var stat = dino_stats.active_sort_stat;
        var at = a.base_levelups_applied[stat];
        var bt = b.base_levelups_applied[stat];
        if(dino_stats.active_sort_stat_tamed) {
            at += a.tamed_levelups_applied[stat];
            bt += b.tamed_levelups_applied[stat];
        }
        if(at > bt) { return -1; }
        if(at < bt) { return 1; }
        return 0;
    },
}

dino_stats.getActiveSort = function(a, b) {
    var v = dino_stats.SORT_MODES[dino_stats.active_sort](a, b);
    if(dino_stats.active_sort_reverse) {
        if(v == -1) {
            v = 1;
        } else if (v == 1) {
            v = -1;
        }
    }
    return v;
}

dino_stats.changeSort = function(name) {
    //Deselect any old sort
    var old = document.getElementsByClassName('dino_stats_header_sort_selected');
    for(var i = 0; i<old.length; i+=1) {
        var o = old[i];
        o.classList.remove("dino_stats_header_sort_selected");
        o.classList.remove("dino_stats_header_sort_selected_reverse");
    }

    //Check if we've selected the same one
    var same = dino_stats.active_sort == name;
    if(same) {
        dino_stats.active_sort_reverse = !dino_stats.active_sort_reverse;
    } else {
        dino_stats.active_sort_reverse = false;
    }

    //Find our button
    var btn = document.getElementById('stat_sort_btn_'+name);
    btn.classList.add("dino_stats_header_sort_selected");
    if(dino_stats.active_sort_reverse) {
        btn.classList.add("dino_stats_header_sort_selected_reverse");
    }

    //Set up and refresh
    dino_stats.active_sort = name;
    dino_stats.refresh();
}

dino_stats.changeSortStat = function(statName) {
    //Deselect any old sort
    var old = document.getElementsByClassName('dino_stats_header_sort_selected');
    for(var i = 0; i<old.length; i+=1) {
        var o = old[i];
        o.classList.remove("dino_stats_header_sort_selected");
        o.classList.remove("dino_stats_header_sort_selected_reverse");
    }

    //Check if we've selected the same one
    var same = dino_stats.active_sort_stat == statName && dino_stats.active_sort == "stat";
    if(same) {
        if(dino_stats.active_sort_stat_tamed) {
            //Swap
            dino_stats.active_sort_stat_tamed = !dino_stats.active_sort_stat_tamed;
        } else {
            //Switch sort direction
            dino_stats.active_sort_reverse = !dino_stats.active_sort_reverse;
            dino_stats.active_sort_stat_tamed = true;
        }
    } else {
        dino_stats.active_sort_reverse = false;
        dino_stats.active_sort_stat_tamed = true;
    }

    //Find our button
    var btn = document.getElementById('stat_sort_btn_stat_'+statName);
    btn.classList.add("dino_stats_header_sort_selected");
    if(dino_stats.active_sort_reverse) {
        btn.classList.add("dino_stats_header_sort_selected_reverse");
    }

    //Set up and refresh
    dino_stats.active_sort = "stat";
    dino_stats.active_sort_stat = statName;
    dino_stats.refresh();
}

dino_stats.init = function(url) {
    //Unload any old data
    dino_stats.dinos = [];
    dino_stats.loading = true;
    
    //Set sort mode. This'll also trigger a refresh
    dino_stats.changeSort("species");

    //Fetch new data
    dino_stats.load(url+"?limit=10", dino_stats.container);
}

dino_stats.load = function(url, container) {
    main.serverRequest(url, {
        "type":"POST",
        "body":JSON.stringify(dino_stats.registered_classnames)
    }, function(d) {
        //Add all dino entries
        dino_stats.registered_classnames = d.registered_classnames;
        var classnames = Object.keys(d.dino_entries);
        for(var i = 0; i<classnames.length; i+=1) {
            dino_stats.entries[classnames[i]] = d.dino_entries[classnames[i]];
        }

        //Now, add all dinos
        for(var i = 0; i<d.dinos.length; i+=1) {
            dino_stats.dinos.push(d.dinos[i]);
        }

        //Fetch next, if any
        if(d.dinos.length == d.limit) {
            dino_stats.load(d.next, container);
        } else {
            dino_stats.loading = false;
        }

        //Refresh up to this point
        dino_stats.refresh();
    });
}

dino_stats.refresh = function() {
    //Clean up old data
    while(dino_stats.container.getElementsByClassName('dino_stats_column').length != 0) {
        dino_stats.container.getElementsByClassName('dino_stats_column')[0].remove();
    }
    dino_stats.index = 0;

    //Find unsupported count
    var unsupported = 0;
    for(var i = 0; i<dino_stats.dinos.length; i+=1) {
        if(dino_stats.entries[dino_stats.dinos[i].classname] == null) {
            unsupported++;
        }
    }

    //Sort
    dino_stats.dinos.sort(dino_stats.getActiveSort);

    //Add
    var shown = 0;
    for(var i = 0; i<dino_stats.dinos.length; i+=1) {
        if(dino_stats.createDino(dino_stats.dinos[i], dino_stats.container)) {
            shown++;
        }
    }

    //Set title
    var text = dino_stats.dinos.length+" Total Dinosaurs, "+shown+" Found, "+unsupported+" Unsupported";
    if(dino_stats.loading) {
        text += "; Still Loading...";
    }

    dino_stats.title.innerText = text;
}

dino_stats.createDino = function(data, container) {
    if(!data.tamed_name.toLowerCase().includes(dino_stats.query.value.toLowerCase()) && dino_stats.query.value.length > 0) {
        //Does not match name
        return true;
    }
    if(dino_stats.entries[data.classname] == null) {
        return false;
    }

    var e = main.createDom("tr", "dino_stats_column", container);

    if(dino_stats.index++ % 2 == 0) {
        e.classList.add("dino_stats_column_odd");
    }

    dino_stats.helperCreateImg(e, dino_stats.entries[data.classname].icon.image_thumb_url);
    dino_stats.helperCreateGenderIcon(e, data.is_female);
    dino_stats.helperCreateText(e, data.tamed_name);

    dino_stats.helperCreateText(e, dino_stats.entries[data.classname].screen_name);
    dino_stats.helperCreateText(e, data.level);
    dino_stats.helperCreateText(e, data.base_level);
    dino_stats.helperCreateColors(e, data.colors);
    dino_stats.helperCreateText(e, main.convertFromWorldToGamePosDisplay(data.location.x).toString()+", "+main.convertFromWorldToGamePosDisplay(data.location.y).toString())

    dino_stats.helperCreateStat(e, data, "health");
    dino_stats.helperCreateStat(e, data, "stamina");
    dino_stats.helperCreateStat(e, data, "food");
    dino_stats.helperCreateStat(e, data, "inventoryWeight");
    dino_stats.helperCreateStat(e, data, "oxygen");
    dino_stats.helperCreateStat(e, data, "movementSpeedMult");
    dino_stats.helperCreateStat(e, data, "meleeDamageMult");

    return true;
}

dino_stats.helperCreateText = function(e, text, className) {
    var t = main.createDom("td", "dino_stats_list_item "+className, e);
    t.innerText = text;
}

dino_stats.helperCreateImg = function(e, url) {
    var t = main.createDom("td", "dino_stats_list_item dino_stats_list_item_img", e);
    var ti = main.createDom("img", "dino_stats_list_item_img_i", t);
    ti.src = url;
}

dino_stats.helperCreateGenderIcon = function(e, isFemale) {
    var t = main.createDom("td", "dino_stats_list_item", e);
    var g = main.createDom("div", "dino_stats_list_item_gender", t);
    if(isFemale) {
        g.classList.add("dino_stats_list_item_gender_male");
    }
}

dino_stats.helperCreateStat = function(e, dino, stat) {
    var t = main.createDom("td", "dino_stats_list_item", e);
    var tamedCount = dino.base_levelups_applied[stat] + dino.tamed_levelups_applied[stat];
    var baseCount = dino.base_levelups_applied[stat];

    var tamedValue = main.createDom("span", "dino_stats_stat_major", t);
    main.createDom("span", "", t).innerText = " / ";
    var baseValue = main.createDom("span", "", t);

    tamedValue.innerText = tamedCount;
    baseValue.innerText = baseCount;

    if(dino_stats.active_sort == "stat" && dino_stats.active_sort_stat == stat) {
        //We're sorting by this. Highlight the sorted one
        if(dino_stats.active_sort_stat_tamed) {
            tamedValue.classList.add("dino_stats_stat_sort");
        } else {
            baseValue.classList.add("dino_stats_stat_sort");
        }
    }
}

dino_stats.helperCreateColors = function(e, colors) {
    var c = main.createDom("td", "dino_stats_list_item", e);
    var p = main.createDom("div", "dino_stats_list_item_color_container", c);
    for(var i = 0; i<colors.length; i+=1) {
        var o = main.createDom("div", "dino_stats_list_item_color_container_item", p);
        o.style.backgroundColor = "#"+colors[i].toString();
    }
}