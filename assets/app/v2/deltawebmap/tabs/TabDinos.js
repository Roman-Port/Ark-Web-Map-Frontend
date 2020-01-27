"use strict";

class TabDinos extends DeltaServerTab {

    constructor(server, mountpoint) {
        super(server, mountpoint);
        this.dinos = [];
        this.species = {};
        this.loaded = false;
        this.sortMode = 1;
        this.sortModeIndex = 0;
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

    async OnInit() {
        /* Called when this tab (and thus, the server) is initially created */
        
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        this.LoadDinos();
        
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



    async LoadDinos() {
        /* Load dinos until we reach a blank page */
        var url = this.server.GetEndpointUrl("tribes_dino_stats");
        while (url != null) {
            //Fetch
            var r = await DeltaTools.WebRequest(url, {});

            //Check end behavior
            if (r.dinos.length == 0) {
                url = null;
            } else {
                url = r.next;
            }

            //Write
            for (var i = 0; i < r.dinos.length; i += 1) {
                this.dinos.push(r.dinos[i]);
            }
            var keys = Object.keys(r.dino_entries);
            for (var i = 0; i < keys.length; i += 1) {
                this.species[keys[i]] = r.dino_entries[keys[i]];
            }

            //Refresh
            this.RefreshView();
        }

        //Finish
        this.loaded = true;
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
        //Redraw the view entirely; Clear
        var holder = document.getElementById('dino_stats_container');
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
        }, "v2tab_dinos_row_header", "v2tab_dinos_row_item_header");

        //Sort dinos
        this.dinos.sort(this.SORT_COLUMNS[this.sortMode].sort_modes[this.sortModeIndex]);

        //Add all rows
        for (var i = 0; i < this.dinos.length; i += 1) {
            var d = this.dinos[i];
            this.CreateRow(holder, (e, info, width, arrayIndex, index) => {
                info.render(e, d, 0, this.species[d.dino.classname], width, arrayIndex);
            }, "v2tab_dinos_row_standard", "v2tab_dinos_row_item_standard");
        }
    }

    CreateRow(holder, render, extraRowClassname, extraItemClassname) {
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
    }

}