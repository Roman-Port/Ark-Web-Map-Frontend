"use strict";

class TabDinos extends DeltaServerTab {

    constructor(server) {
        super(server);
        this.dinos = [];
        this.dinoViews = {};
        this.species = {};
        this.loaded = false;
        this.sortMode = 1;
        this.sortModeIndex = 0;
        this.dinoLoadTask = null;
        this.dinosLoaded = false;
        this.SORT_COLUMNS = [
            {
                "name": "",
                "render": function (e, data, sortIndex, species) {
                    e.classList.add("v2tab_dinos_row_item_icon");
                    e.style.backgroundImage = "url(" + species.icon.image_url;
                },
                "sort_modes": [],
                "size_min": 20,
                "size_default": 20,
                "size_max": 20,
                "has_handle": false,
                "array_size": 1
            },
            {
                "name": "Name",
                "render": function (e, data, sortIndex, species) {
                    e.innerText = data.dino.tamed_name;
                },
                "sort_modes": [
                    function (a, b) {
                        return a.dino.tamed_name.localeCompare(b.dino.tamed_name);
                    },
                    function (a, b) {
                        return b.dino.tamed_name.localeCompare(a.dino.tamed_name);
                    }
                ],
                "size_min": 90,
                "size_default": 200,
                "size_max": 400,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Species",
                "render": function (e, data, sortIndex, species) {
                    e.innerText = species.screen_name;
                },
                "sort_modes": [
                    function (a, b) {
                        return a.dino.classname.localeCompare(b.dino.classname);
                    },
                    function (a, b) {
                        return b.dino.classname.localeCompare(a.dino.classname);
                    }
                ],
                "size_min": 90,
                "size_default": 150,
                "size_max": 400,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Sex",
                "render": function (e, data, sortIndex, species) {
                    var s = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_sex", e);
                    if (data.dino.is_female) {
                        s.classList.add("v2tab_dinos_row_item_sex_female");
                        s.innerHTML = "&#9792;";
                    } else {
                        s.innerHTML = "&#9794;";
                    }
                },
                "sort_modes": [
                    function (a, b) {
                        if (a.dino.is_female && !b.dino.is_female) {
                            return 1;
                        }
                        if (b.dino.is_female && !a.dino.is_female) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a.dino.is_female && !b.dino.is_female) {
                            return -1;
                        }
                        if (b.dino.is_female && !a.dino.is_female) {
                            return 1;
                        }
                        return 0;
                    }
                ],
                "size_min": 35,
                "size_default": 35,
                "size_max": 35,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Tag",
                "render": function (e, data, sortIndex, species) {
                    var s = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_sex v2tab_dinos_row_item_sex_unknown", e);
                    if (data.prefs.color_tag) {
                        s.style.backgroundColor = data.prefs.color_tag;
                    }
                },
                "sort_modes": [],
                "size_min": 35,
                "size_default": 35,
                "size_max": 35,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Lvl.",
                "render": function (e, data, sortIndex, species) {
                    e.innerText = data.dino.level;
                },
                "sort_modes": [
                    function (a, b) {
                        if (a.dino.level > b.dino.level) {
                            return 1;
                        }
                        if (b.dino.level > a.dino.level) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a.dino.level > b.dino.level) {
                            return -1;
                        }
                        if (b.dino.level > a.dino.level) {
                            return 1;
                        }
                        return 0;
                    }
                ],
                "size_min": 50,
                "size_default": 50,
                "size_max": 70,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "B. Lvl.",
                "render": function (e, data, sortIndex, species) {
                    e.innerText = data.dino.base_level;
                },
                "sort_modes": [
                    function (a, b) {
                        if (a.dino.base_level > b.dino.base_level) {
                            return 1;
                        }
                        if (b.dino.base_level > a.dino.base_level) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a.dino.base_level > b.dino.base_level) {
                            return -1;
                        }
                        if (b.dino.base_level > a.dino.base_level) {
                            return 1;
                        }
                        return 0;
                    }
                ],
                "size_min": 50,
                "size_default": 50,
                "size_max": 100,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Distance",
                "render": (e, data, sortIndex, species) => {
                    if (data.dino.is_cryo) {
                        e.innerText = "--";
                        return;
                    }
                    var p = this.server.GetDistanceFromMe(data.dino.location.x, data.dino.location.y);
                    if (p == null) {
                        e.innerText = "--";
                    } else {
                        e.innerText = DeltaTools.CreateNumberWithCommas(p / 100) + " m";
                    }
                },
                "sort_modes": [
                    (a, b) => {
                        var aa = null
                        if (!a.dino.is_cryo) {
                            aa = this.server.GetDistanceFromMe(a.dino.location.x, a.dino.location.y);
                        }
                        var bb = null;
                        if (!b.dino.is_cryo) {
                            bb = this.server.GetDistanceFromMe(b.dino.location.x, b.dino.location.y);
                        }
                        if (aa == null && bb == null) { return 0; }
                        if (aa != null && bb == null) { return -1; }
                        if (aa == null && bb != null) { return 1; }
                        return TabDinos.CompareInt(aa, bb);
                    },
                    (a, b) => {
                        var aa = null
                        if (!a.dino.is_cryo) {
                            aa = this.server.GetDistanceFromMe(a.dino.location.x, a.dino.location.y);
                        }
                        var bb = null;
                        if (!b.dino.is_cryo) {
                            bb = this.server.GetDistanceFromMe(b.dino.location.x, b.dino.location.y);
                        }
                        if (aa == null && bb == null) { return 0; }
                        if (aa != null && bb == null) { return -1; }
                        if (aa == null && bb != null) { return 1; }
                        return TabDinos.CompareInt(bb, aa);
                    }
                ],
                "size_min": 100,
                "size_default": 120,
                "size_max": 150,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Colors",
                "render": function (e, data, sortIndex, species, width) {
                    var m = (width / 20) / data.dino.colors.length;
                    for (var i = 0; i < data.dino.colors.length; i += 1) {
                        var c = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_innercolor", e);
                        c.style.backgroundColor = "#" + data.dino.colors[i];
                    }
                },
                "sort_modes": [],
                "size_min": 90,
                "size_default": 90,
                "size_max": 90,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Status",
                "render": function (e, data, sortIndex, species, width) {
                    DeltaTools.CreateStatusBox(data.dino.status, e).classList.add("v2tab_dinos_row_item_status");
                },
                "sort_modes": [
                    function (a, b) {
                        return a.dino.status.localeCompare(b.status);
                    },
                    function (a, b) {
                        return b.dino.status.localeCompare(a.status);
                    }
                ],
                "size_min": 110,
                "size_default": 110,
                "size_max": 110,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": function (e, arrayIndex) {
                    var index = TabDinos.ConvertColumnStatIndexToArkIndex(arrayIndex);
                    var t = DeltaTools.CreateDom("div", "v2tab_dinos_row_header_stat", e);
                    t.style.backgroundImage = "url(" + statics.STATUS_ENTRIES[index].icon + ")";
                },
                "render": function (e, data, sortIndex, species, width, arrayIndex) {
                    var index = TabDinos.ConvertColumnStatIndexToArkIndex(arrayIndex);//statics.ARK_DINO_STAT.Health;
                    DeltaTools.CreateDom("div", "v2tab_dinos_row_item_stat_box", e, data.dino.base_levelups_applied[index]);
                    DeltaTools.CreateDom("div", "", e, data.dino.tamed_levelups_applied[index]);
                },
                "sort_modes": [],
                "size_min": 40,
                "size_default": 50,
                "size_max": 60,
                "has_handle": true,
                "array_size": 6
            }
        ];
    }

    static CompareInt(a, b) {
        if (a > b) {
            return 1;
        }
        if (b > a) {
            return -1;
        }
        return 0;
    }

    static ConvertColumnStatIndexToArkIndex(i) {
        switch (i) {
            case 0: return 0;
            case 1: return 1;
            case 2: return 3;
            case 3: return 4;
            case 4: return 7;
            case 5: return 8;
            case 6: return 9;
        }
    }

    GetDisplayName() {
        /* Returns the display name as a string */
        return "Dinos";
    }

    GetId() {
        return "dinos";
    }

    async RedownloadData() {
        /* Used when tribes are changing */

        //Clear
        this.dinos = [];
        this.dinoViews = {};
        this.species = {};
        this.dinosLoaded = false;
        this.dinoLoadTask = null;

        //Show default
        this.ShowDefaultLoader();
    }

    async OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        super.OnInit(mountpoint);
        this.LayoutDom(mountpoint);

        this.server.SubscribeRPCEvent("tab.dinos", 1, (m) => this.OnDinoFullRefreshed(m));
        this.server.SubscribeEvent("tab.dinos", R.server_events.EVT_SERVER_MY_LOCATION_UPDATE, (d) => this.RefreshView());

        this.RefreshView();
    }

    LayoutDom(mountpoint) {
        this.mountpoint = mountpoint;
        var search = DeltaTools.CreateDom("input", "dino_stats_search", this.mountpoint);
        search.type = "text";
        search.placeholder = "Search Tribe Dinos";

        this.dataContainer = DeltaTools.CreateDom("div", "dino_stats_container", this.mountpoint);

        this.ShowDefaultLoader();
    }

    ShowDefaultLoader() {
        this.dataContainer.innerHTML = "";
        var spinnerContainer = DeltaTools.CreateDom("div", "dinos_loader_holder", this.dataContainer);
        DeltaTools.CreateDom("div", "loading_spinner", spinnerContainer);
        this.loadInfo = DeltaTools.CreateDom("div", "dinos_loader_subtext", this.dataContainer, "");
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        
    }

    async OnOpen() {
        /* Called when this tab is switched to */

        //Check if we need to load dinos
        if (this.dinoLoadTask == null) {
            this.dinoLoadTask = this.LoadDinos();
        }
    }

    async OnClose() {
        /* Called when this tab is switched away from */
        
    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        this.server.UnsubscribeRPCEvent("tab.dinos");
        this.server.UnsubscribeEvent("tab.dinos");
    }

    async LoadDinos() {
        /* Load dinos until we reach a blank page */
        this.dinosLoaded = false;
        var url = this.server.GetEndpointUrl("tribes_dino_stats");
        var loaded = 0;
        while (url != null) {
            //Fetch
            var r = await DeltaTools.WebRequest(url, {}, this.token);

            //Check end behavior
            if (r.dinos.length == 0) {
                url = null;
            } else {
                url = r.next;
            }

            //Write
            for (var i = 0; i < r.dinos.length; i += 1) {
                this.UpdateOrReplaceDino(r.dinos[i]);
                loaded++;
            }
            var keys = Object.keys(r.dino_entries);
            for (var i = 0; i < keys.length; i += 1) {
                this.species[keys[i]] = r.dino_entries[keys[i]];
            }

            //Update
            if (this.loadInfo != null) {
                var percent = Math.round((loaded / r.total) * 100);
                this.loadInfo.innerText = loaded.toString() + "/" + r.total.toString() + " (" + percent.toString() + "%)";
            }
        }

        //Finish
        this.loaded = true;
        this.dinosLoaded = true;
        this.RefreshView();
    }

    static StaticOnHeaderSortBtnClicked() {
        var t = this.x_this;
        var index = this.x_index;
        if (t.sortMode == index) {
            /* Add to sub sort mode */
            t.sortModeIndex++;
            if (t.sortModeIndex >= t.SORT_COLUMNS[index].sort_modes.length) {
                t.sortModeIndex = 0;
            }
        } else {
            /* Change to this sort mode */
            t.sortModeIndex = 0;
            t.sortMode = index;
        }
        t.RefreshView();
    }

    RefreshView() {
        //If dinos aren't yet loaded, ignore
        if (!this.dinosLoaded) {
            return;
        }

        //Redraw the view entirely; Clear
        var holder = this.dataContainer;
        holder.innerHTML = "";

        //Add title row
        this.CreateRow(holder, (e, d, width, arrayIndex, index) => {
            //Set name
            if (typeof (d.name) == "string") {
                e.innerText = d.name;
            } else {
                d.name(e, arrayIndex);
            }

            //Show handle
            if (d.has_handle) {
                e.classList.add("v2tab_dinos_row_item_header_hold");
            }

            //Show sort highlighting and events
            if (d.sort_modes.length > 0) {
                e.classList.add("v2tab_dinos_row_item_header_sortable");
                e.x_this = this;
                e.x_index = index;
                e.x_index_sub = arrayIndex;
                e.addEventListener("click", TabDinos.StaticOnHeaderSortBtnClicked);
            }

            //If this is the active sort object, show it
            if (this.sortMode == index) {
                var sortUrl = "";
                switch (this.sortModeIndex) {
                    case 0: sortUrl = "/assets/app/icons/tab_dino_list/sort_up.svg"; break;
                    case 1: sortUrl = "/assets/app/icons/tab_dino_list/sort_down.svg"; break;
                }
                e.style.backgroundImage = "url(" + sortUrl + ")";
            }
        }, "v2tab_dinos_row_header", "v2tab_dinos_row_item_header", null);

        //Sort dinos
        this.dinos.sort(this.SORT_COLUMNS[this.sortMode].sort_modes[this.sortModeIndex]);

        //Add all rows
        for (var i = 0; i < this.dinos.length; i += 1) {
            var d = this.dinos[i];
            this.CreateRow(holder, (e, info, width, arrayIndex, index) => {
                info.render(e, d, 0, this.species[d.dino.classname], width, arrayIndex);
            }, "v2tab_dinos_row_standard", "v2tab_dinos_row_item_standard", d.dino_id);
        }
    }

    CreateRow(holder, render, extraRowClassname, extraItemClassname, cacheTag) {
        //Create row
        var row = DeltaTools.CreateDom("div", "v2tab_dinos_row " + extraRowClassname, holder);

        //Add each column
        for (var i = 0; i < this.SORT_COLUMNS.length; i += 1) {
            var d = this.SORT_COLUMNS[i];
            for (var j = 0; j < d.array_size; j += 1) {
                var e = DeltaTools.CreateDom("div", "v2tab_dinos_row_item " + extraItemClassname, row);
                e.style.width = d.size_default.toString() + "px";
                render(e, d, d.size_default, j, i);
            }
        }

        //Add to the list of elements
        if (cacheTag != null) {
            this.dinoViews[cacheTag] = row;
        }
    }

    SortRows() {
        //Will sort existing rows (or add new ones) in the DOM
        var holder = this.dataContainer;

        //Sort dinos
        this.dinos.sort(this.SORT_COLUMNS[this.sortMode].sort_modes[this.sortModeIndex]);

        //Add all rows
        for (var i = 0; i < this.dinos.length; i += 1) {
            var d = this.dinos[i];

            //Check if this already exists
            if (this.dinoViews[d.dino_id] != null) {
                //Does exist
                holder.appendChild(this.dinoViews[d.dino_id]);
            } else {
                //Does not exist
                this.CreateRow(holder, (e, info, width, arrayIndex, index) => {
                    info.render(e, d, 0, this.species[d.dino.classname], width, arrayIndex);
                }, "v2tab_dinos_row_standard", "v2tab_dinos_row_item_standard", d.dino_id);
            }
        }
    }

    OnDinoFullRefreshed(m) {
        //Add all
        for (var i = 0; i < m.dinos.length; i += 1) {
            this.UpdateFullDino(m.dinos[i]);
        }

        //Refresh
        this.RefreshView();
    }

    UpdateFullDino(m) {
        //Set the updated species
        this.species[m.species.classname] = m.species;

        //Create replacement data
        var replacement = {
            "dino": m.dino,
            "prefs": m.prefs,
            "dino_id": m.dino_id
        };

        //Update
        this.UpdateOrReplaceDino(replacement);
    }

    UpdateOrReplaceDino(replacement) {
        //Find and replace (or add) this dino
        var exists = false;
        for (var i = 0; i < this.dinos.length; i += 1) {
            if (this.dinos[i].dino_id == replacement.dino_id) {
                exists = true;
                this.dinos[i] = replacement;
            }
        }

        //Add it if needed
        if (!exists) {
            this.dinos.push(replacement);
        }
    }

}