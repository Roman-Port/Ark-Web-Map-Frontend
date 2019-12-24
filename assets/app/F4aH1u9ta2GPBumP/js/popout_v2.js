var xpopout = {};

xpopout._features = {
    "name_top": function (data, args) {
        /* ARGS:
         * showColorPicker (bool): Sets wheteher the color selector is shown
         * adapter (adapter)
         * 
         * ADAPTER:
         * getName(d)
         * getSubtext(d),
         * getIcon(d),
         * getId(d),
         * getColor(d),
         * setColor(id,c)
         */

        //Create name
        var ce = main.createDom("div", "popout_name");
        main.createDom("div", "popout_name_title", ce).innerText = args.adapter.getName(data);
        main.createDom("div", "popout_name_sub", ce).innerText = args.adapter.getSubtext(data);

        //Add icon
        var icon = main.createDom("img", "mini_modal_icon map_icon_base map_icon_dino", ce);
        icon.style.backgroundImage = "url(" + args.adapter.getIcon(data) + ")";

        //Add color picker
        if (args.showColorPicker) {
            //Define callback
            var onClickNewColor = function () {
                var dot = this.parentElement.x_color_dot;
                var data = this.parentElement.x_data;
                var color = this.x_color;

                //Set dot color
                if (color == null) {
                    dot.style.backgroundColor = null;
                    dot.classList.add("popout_colorpicker_none");
                } else {
                    dot.style.backgroundColor = color;
                    dot.classList.remove("popout_colorpicker_none");
                }

                //Apply in adapter
                this.x_args.adapter.setColor(this.x_data, this.x_color);
            };

            //Add color picker options
            var cp = main.createDom("div", "popout_colorpicker", ce);
            var cpd = main.createDom("div", "popout_colorpicker_dot popout_colorpicker_none", cp);
            var cps = main.createDom("div", "popout_colorpicker_slider", cp);
            var cpm = main.createDom("div", "popout_colorpicker_menu", cps);
            cpm.x_color_dot = cpd;
            cpm.x_data = data;
            for (var i = 0; i < statics.COLOR_TAGS.length; i += 1) {
                var cpmo = main.createDom("div", "popout_colorpicker_menu_option", cpm);
                cpmo.style.backgroundColor = statics.COLOR_TAGS[i];
                cpmo.x_color = statics.COLOR_TAGS[i];
                cpmo.x_args = args;
                cpmo.x_data = data;
                cpmo.addEventListener("click", onClickNewColor);
            }
            var cpmon = main.createDom("div", "popout_colorpicker_menu_option popout_colorpicker_none", cpm);
            cpmon.x_args = args;
            cpmon.x_data = data;
            cpmon.addEventListener("click", onClickNewColor);
            if (args.adapter.getColor(data) != null) {
                cpd.classList.remove("popout_colorpicker_none");
                cpd.style.backgroundColor = args.adapter.getColor(data);
            }
        }

        return ce;
    },
    "stats": function (data, args) {
        /* ARGS:
         * adapter (adapter)
         * 
         * ADAPTER:
         * getCurrentStatuses(d);
         * getMaxStatuses(d);
         * getAgroStatus(d);
         */
        var co = main.createDom("div", "popout_content", e);

        //Add bar statuses
        var statusesToUse = [
            statics.ARK_DINO_STAT.Health,
            statics.ARK_DINO_STAT.Stamina,
            statics.ARK_DINO_STAT.Weight,
            statics.ARK_DINO_STAT.Food
        ];
        var statsContainer = main.createDom("div", "", co);
        for (var i = 0; i < statusesToUse.length; i += 1) {
            //Get the status entry and dino data
            var statName = statusesToUse[i];
            var statusEntry = statics.STATUS_ENTRIES[statName];
            var maxStat = args.adapter.getMaxStatuses(data)[statName];
            var currentStat = args.adapter.getCurrentStatuses(data)[statName];

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
            if (percent > 100) { percent = 100; }
            bar.style.width = percent.toString() + "%";
            amount.innerText = main.createNumberWithCommas(currentStat) + " / " + main.createNumberWithCommas(maxStat);
            statsContainer.appendChild(e);
        }

        //Add below that
        statusesToUse = [
            statics.ARK_DINO_STAT.MeleeDamageMultiplier,
            statics.ARK_DINO_STAT.Oxygen,
            statics.ARK_DINO_STAT.SpeedMultiplier
        ];
        var container = main.createDom("ul", "popout_staticstats_container", co);
        for (var i = 0; i < statusesToUse.length; i += 1) {
            //Get data
            var statName = statusesToUse[i];
            var statusEntry = statics.STATUS_ENTRIES[statName];
            var value = args.adapter.getMaxStatuses(data)[statName];

            //Add breaks if needed
            if (i != 0) {
                main.createDom("li", "popout_staticstats_break", container);
            }

            //Create DOM element
            var e = main.createDom("li", "popout_staticstats_s", container);
            e.innerText = statusEntry.formatString(value);
            main.createDom("img", "popout_staticstats_s_icon", e).src = statusEntry.icon;
        }

        //Add state
        var status = main.createDom("li", "popout_staticstats_s popout_staticstats_status", container);
        if (args.adapter.getAgroStatus(data) != null) {
            var statusData = statics.STATUS_STATES[args.adapter.getAgroStatus(data)];
            status.innerText = statusData.text.toUpperCase();
            status.style.color = statusData.modal_color;
        } else {
            status.innerText = "UNKNOWN";
            status.style.color = "#E0E0E0";
        }

        return co;
    },
    "inventory": function (data, args) {
        /* ARGS:
         * adapter (adapter)
         * 
         * ADAPTER:
         * getInventory(d)
         * 
         */
        var inventory = args.adapter.getInventory(data);
        if (inventory.inventory_items.length == 0) {
            return null;
        }

        var ce = main.createDom("div", "popout_lower_content");
        var e = main.createDom("ul", "popout_stats_item_area", ce);
        for (var i = 0; i < inventory.inventory_items.length; i += 1) {
            var item = inventory.inventory_items[i];
            var itemClass = inventory.item_class_data[item.classname];
            var entry = main.createDom("li", "popout_stats_item", e);
            if (itemClass == null) {
                //Fallback
                main.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x" + item.stack_size.toString();
                main.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = "Missing Item Data";
            } else {
                entry.style.backgroundImage = "url('" + itemClass.icon.image_url + "')";

                var stackWeightRounded = Math.round(itemClass.baseItemWeight * item.stack_size * 10) / 10;
                var name = stackWeightRounded.toString();
                if (stackWeightRounded % 1 == 0) {
                    name += ".0";
                }

                main.createDom("div", "popout_stats_item_text popout_stats_item_text_topleft", entry).innerText = "x" + item.stack_size.toString();
                main.createDom("div", "popout_stats_item_text popout_stats_item_text_bottomright", entry).innerText = name;
            }
        }
        return ce;
    }
}

xpopout._clickCatcher = function () {
    window.removeEventListener("mousedown", xpopout._clickCatcher);
    var e = document.getElementsByClassName("popout_modal_cc");
    while (e.length > 0) {
        e[0].remove();
    }
}

/* ANCHOR DOCS:
 * Anchors are expected to have the doMount(e) function, with the DOM element to mount passed in.
 * They're usually constructed here
 */

xpopout.anchors = {};
xpopout.anchors.clickCatcherAnchor = function (h) {
    //This is an abstract function and expects us to override "ccDoMount".
    h.doMount = function (e) {
        this.ccDoMount(e);
        e.addEventListener("mousedown", function (evt) {
            evt.stopPropagation();
            //Just used to stop this from disappearing.
        });
        e.classList.add("popout_modal_cc");
        window.addEventListener("mousedown", xpopout._clickCatcher);
    };
    return h;
}

xpopout.anchors.fixedAnchor = function (x, y) {
    return xpopout.anchors.clickCatcherAnchor({
        "_x": x,
        "_y": y,
        "ccDoMount": function (e) {
            e.classList.add("popout_v2_anchor_fixed");
            e.style.left = this._x.toString() + "px";
            e.style.top = this._y.toString() + "px";
            document.body.appendChild(e);
        }
    });
}

xpopout.createDownloadablePopout = function (url, failCallback, anchor, features) {
    main.serverRequest(url, {
        "failOverride": failCallback
    }, function (d) {
        xpopout.createPopout(d, anchor, features);
    });
};

xpopout.createPopout = function (data, anchor, features) {
    //Create element to add
    var e = main.createDom("div", "popout_modal");

    //Add each feature to it
    var keys = Object.keys(features);
    for (var i = 0; i < keys.length; i++) {
        var dmc = xpopout._features[keys[i]];
        var dm = dmc(data, features[keys[i]]);
        if (dm != null) {
            e.appendChild(dm);
        }
    };

    //Attach this
    anchor.doMount(e);
}

xpopout.createDino = function (id, failCallback, anchor) {
    xpopout.createDownloadablePopout(ark.session.endpoint_tribes_dino.replace("{dino}", id), failCallback, anchor, {
        "name_top": {
            "showColorPicker": true,
            "adapter": {
                "getName": function (d) { return d.dino.tamed_name; },
                "getSubtext": function (d) { return d.dino_entry.screen_name + " - Lvl " + d.dino.level; },
                "getIcon": function (d) { return d.dino_entry.icon.image_thumb_url; },
                "getId": function (d) { return d.dino_id; },
                "getColor": function (d) { return d.prefs.color_tag; },
                "setColor": function (d, c) {
                    d.prefs.color_tag = c;
                    var url = ark.session.endpoint_put_dino_prefs.replace("{dino}", d.dino_id);
                    main.serverRequest(url, {
                        "type": "POST",
                        "body": JSON.stringify(d.prefs)
                    }, function () { });
                }
            }
        },
        "stats": {
            "adapter": {
                "getCurrentStatuses": function (d) { return d.dino.current_stats; },
                "getMaxStatuses": function (d) { return d.dino.max_stats; },
                "getAgroStatus": function (d) { return d.dino.status; }
            }
        },
        "inventory": {
            "adapter": {
                "getInventory": function (d) { return d.inventory; }
            }
        }
    });
}