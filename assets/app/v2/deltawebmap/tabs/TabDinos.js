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
        this.query = "";
        this.SORT_COLUMNS = [
            {
                "name": "",
                "render": function (e, data, sortIndex, species) {
                    e.style.backgroundImage = "url(" + species.icon.image_url;
                },
                "create": function (e) {
                    e.classList.add("v2tab_dinos_row_item_icon");
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
                    e.innerText = data./*dino.*/tamed_name;
                },
                "create": function (e) {
                    
                },
                "sort_modes": [
                    function (a, b) {
                        return a./*dino.*/tamed_name.localeCompare(b./*dino.*/tamed_name);
                    },
                    function (a, b) {
                        return b./*dino.*/tamed_name.localeCompare(a./*dino.*/tamed_name);
                    }
                ],
                "size_min": 90,
                "size_default": 250,
                "size_max": 400,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Species",
                "render": function (e, data, sortIndex, species) {
                    e.innerText = species.screen_name;
                },
                "create": function (e) {

                },
                "sort_modes": [
                    function (a, b) {
                        return a./*dino.*/classname.localeCompare(b./*dino.*/classname);
                    },
                    function (a, b) {
                        return b./*dino.*/classname.localeCompare(a./*dino.*/classname);
                    }
                ],
                "size_min": 90,
                "size_default": 200,
                "size_max": 400,
                "has_handle": true,
                "array_size": 1
            },
            {
                "name": "Sex",
                "render": function (e, data, sortIndex, species) {
                    var s = e.x_sex;
                    if (data./*dino.*/is_female) {
                        s.classList.add("v2tab_dinos_row_item_sex_female");
                        s.innerHTML = "&#9792;";
                    } else {
                        s.innerHTML = "&#9794;";
                        s.classList.remove("v2tab_dinos_row_item_sex_female");
                    }
                },
                "create": function (e) {
                    var s = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_sex", e);
                    e.x_sex = s;
                },
                "sort_modes": [
                    function (a, b) {
                        if (a./*dino.*/is_female && !b./*dino.*/is_female) {
                            return 1;
                        }
                        if (b./*dino.*/is_female && !a./*dino.*/is_female) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a./*dino.*/is_female && !b./*dino.*/is_female) {
                            return -1;
                        }
                        if (b./*dino.*/is_female && !a./*dino.*/is_female) {
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
                    var s = e.x_tag;
                    /*if (data.prefs.color_tag) {
                        s.style.backgroundColor = data.prefs.color_tag;
                    }*/
                },
                "create": function (e) {
                    e.x_tag = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_sex v2tab_dinos_row_item_sex_unknown", e);
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
                    e.innerText = data./*dino.*/level;
                },
                "create": function (e) {
                    
                },
                "sort_modes": [
                    function (a, b) {
                        if (a./*dino.*/level > b./*dino.*/level) {
                            return 1;
                        }
                        if (b./*dino.*/level > a./*dino.*/level) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a./*dino.*/level > b./*dino.*/level) {
                            return -1;
                        }
                        if (b./*dino.*/level > a./*dino.*/level) {
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
                    e.innerText = data./*dino.*/base_level;
                },
                "create": function (e) {

                },
                "sort_modes": [
                    function (a, b) {
                        if (a./*dino.*/base_level > b./*dino.*/base_level) {
                            return 1;
                        }
                        if (b./*dino.*/base_level > a./*dino.*/base_level) {
                            return -1;
                        }
                        return 0;
                    },
                    function (a, b) {
                        if (a./*dino.*/base_level > b./*dino.*/base_level) {
                            return -1;
                        }
                        if (b./*dino.*/base_level > a./*dino.*/base_level) {
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
                    if (data./*dino.*/is_cryo) {
                        e.innerText = "--";
                        return;
                    }
                    var p = this.server.GetDistanceFromMe(data./*dino.*/location.x, data./*dino.*/location.y);
                    if (p == null) {
                        e.innerText = "--";
                    } else {
                        e.innerText = DeltaTools.CreateNumberWithCommas(p / 100) + " m";
                    }
                },
                "create": function (e) {

                },
                "sort_modes": [
                    (a, b) => {
                        var aa = null
                        if (!a./*dino.*/is_cryo) {
                            aa = this.server.GetDistanceFromMe(a./*dino.*/location.x, a./*dino.*/location.y);
                        }
                        var bb = null;
                        if (!b./*dino.*/is_cryo) {
                            bb = this.server.GetDistanceFromMe(b./*dino.*/location.x, b./*dino.*/location.y);
                        }
                        if (aa == null && bb == null) { return 0; }
                        if (aa != null && bb == null) { return -1; }
                        if (aa == null && bb != null) { return 1; }
                        return TabDinos.CompareInt(aa, bb);
                    },
                    (a, b) => {
                        var aa = null
                        if (!a./*dino.*/is_cryo) {
                            aa = this.server.GetDistanceFromMe(a./*dino.*/location.x, a./*dino.*/location.y);
                        }
                        var bb = null;
                        if (!b./*dino.*/is_cryo) {
                            bb = this.server.GetDistanceFromMe(b./*dino.*/location.x, b./*dino.*/location.y);
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
                    for (var i = 0; i < 6; i += 1) {
                        var c = e.children[i];
                        if (data./*dino.*/colors.length > i) {
                            c.style.backgroundColor = "#" + data./*dino.*/colors[i];
                            c.style.display = "";
                        } else {
                            c.style.display = "none";
                        }
                    }
                },
                "create": function (e) {
                    for (var i = 0; i < 6; i += 1) {
                        var c = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_innercolor", e);
                        c.style.display = "none";
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
                    var d = statics.STATUS_STATES[data.status];
                    var ee = e.x_status;
                    ee.innerText = d.text;
                    ee.style.color = d.modal_color;
                },
                "create": function (e) {
                    e.x_status = DeltaTools.CreateDom("div", "status_box_display", e);
                    e.x_status.classList.add("v2tab_dinos_row_item_status");;
                },
                "sort_modes": [
                    function (a, b) {
                        return a./*dino.*/status.localeCompare(b.status);
                    },
                    function (a, b) {
                        return b./*dino.*/status.localeCompare(a.status);
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
                    e.x_stat_a.innerText = data./*dino.*/base_levelups_applied[index];
                    e.x_stat_b.innerText = data./*dino.*/tamed_levelups_applied[index];
                },
                "create": function (e) {
                    e.x_stat_a = DeltaTools.CreateDom("div", "v2tab_dinos_row_item_stat_box", e);
                    e.x_stat_b = DeltaTools.CreateDom("div", "", e);
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
        search.addEventListener("input", (search) => this._OnSearchChanged(search.target.value));

        this.dataContainer = DeltaTools.CreateDom("div", "dino_stats_container", this.mountpoint);
        this.dataInner = DeltaTools.CreateDom("div", "", this.dataContainer);

        this.header = this.CreateHeader();
        mountpoint.appendChild(this.header);
        this.dataContainer.addEventListener("scroll", () => {
            this.header.style.left = (-this.dataContainer.scrollLeft).toString() + "px";
        });

        this.recycler = new DeltaRecyclerView(this.dataInner, this.dataContainer, 50, 30);
        this.recycler.SetCreateRowFunction(() => {
            //Create row
            var row = DeltaTools.CreateDom("div", "v2tab_dinos_row v2tab_dinos_row_standard");

            //Add each
            var indexes = [];
            this.ForEachRowType((info, index, globalIndex) => {
                var e = DeltaTools.CreateDom("div", "v2tab_dinos_row_item v2tab_dinos_row_item_standard", row);
                e.style.width = info.size_default.toString() + "px";
                info.create(e);
                indexes.push(e);
            });

            //Set data
            row._rindexes = indexes;
            return row;
        });
        this.recycler.SetRenderRowFunction((node, data) => {
            this.ForEachRowType((info, index, globalIndex) => {
                //Get row node
                var e = node._rindexes[globalIndex];
                var species = this.server.app.GetSpeciesByClassName(data.classname);
                info.render(e, data, this.sortMode, species, this.size_default, index);
            });
        });
        this.recycler.SetSortFunction((a, b) => {
            return b.level - a.level;
        });
        this.recycler.SetGetUniqueKeyFunction((a) => {
            return a.dino_id;
        });
        this.recycler.SetNewSearchQuery((a) => {
            if (this.query == "") { return true; }
            return a.tamed_name.toLowerCase().includes(this.query) || this.server.app.GetSpeciesByClassName(a.classname).screen_name.toLowerCase().includes(this.query);
        });

        this.recycler.AddEventListener("click", (data, originalEvent, originalDom) => {
            //Show the dino modal
            var pos = originalDom.getBoundingClientRect();
            var x = pos.left + 10;
            var y = pos.top + 35;
            DeltaPopoutModal.ShowDinoModal(this.server.app, data, { "x": x, "y": y }, this.server);
        });
    }

    CreateHeader() {
        //Create row
        var row = DeltaTools.CreateDom("div", "v2tab_header");

        //Add each
        var indexes = [];
        this.ForEachRowType((info, index, globalIndex) => {
            var e = DeltaTools.CreateDom("div", "v2tab_dinos_row_item v2tab_dinos_row_item_standard", row);
            if (typeof (info.name) == "string") {
                e.innerText = info.name;
            } else {
                info.name(e, index);
            }
            e.style.width = info.size_default.toString() + "px";
            if (info.sort_modes.length > 0) {
                e._sort = info.sort_modes;
                e._index = (globalIndex * 100) + index; //only has to be unique
                e._tab = this;
                e.addEventListener("click", function () {
                    this._tab.NewSort(this._sort, this._index, this);
                });
                e.style.cursor = "pointer";
            }
            if (globalIndex == 5) {
                //Janky way of setting the sort label on the default item
                e.classList.add("v2tab_header_sort_down");
            }
            indexes.push(e);
        });
        return row;
    }

    NewSort(sortModes, index, element) {
        //Update index
        if (this.sortMode == index) {
            //Add to the sort index
            this.sortModeIndex += 1;
            if (this.sortModeIndex >= sortModes.length) {
                this.sortModeIndex = 0;
            }
        } else {
            //Set sort to this
            this.sortMode = index;
            this.sortModeIndex = 0;
        }

        //Update sort
        this.recycler.SetSortFunction(sortModes[this.sortModeIndex]);

        //Remove old sort elements
        DeltaTools.RemoveClassFromClassNames(element.parentNode, "v2tab_header_sort_down", "v2tab_header_sort_down");
        DeltaTools.RemoveClassFromClassNames(element.parentNode, "v2tab_header_sort_up", "v2tab_header_sort_up");

        //Add classname
        if (this.sortModeIndex == 0) {
            element.classList.add("v2tab_header_sort_up");
        } else if (this.sortModeIndex == 1) {
            element.classList.add("v2tab_header_sort_down");
        }
    }

    ShowDefaultLoader() {
        this.dataContainer.innerHTML = "";
        var spinnerContainer = DeltaTools.CreateDom("div", "dinos_loader_holder", this.dataContainer);
        DeltaTools.CreateDom("div", "loading_spinner", spinnerContainer);
        this.loadInfo = DeltaTools.CreateDom("div", "dinos_loader_subtext", this.dataContainer, "");
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */

        window.requestAnimationFrame(() => {
            //Set up recycler
            this.recycler._CreateTemplateDOMs();

            //Set dataset
            this.server.CreateManagedDinoDbListener((adds) => {
                this.recycler.BulkAddItems(adds);
            }, (removes) => {
                this.recycler.BulkRemoveItems(removes);
            }, () => {
                this.recycler.Reset();
            });
        });
    }

    async OnOpen() {
        /* Called when this tab is switched to */

        //Check if we need to load dinos
        /*if (this.dinoLoadTask == null) {
            this.dinoLoadTask = this.LoadDinos();
        }*/
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
        var url = this.server.GetTribesEndpointUrl("/dino_stats?limit=10000");
        var loaded = 0;
        var queuedSpecies = [];
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

        //Get all species
        for (var i = 0; i < queuedSpecies.length; i += 1) {

        }

        //Finish
        this.loaded = true;
        this.dinosLoaded = true;
        this.RefreshView();
        this.recycler.SetData(this.dinos);
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
        return;
        
    }

    ForEachRowType(run) {
        var index = 0;
        for (var i = 0; i < this.SORT_COLUMNS.length; i += 1) {
            var d = this.SORT_COLUMNS[i];
            for (var j = 0; j < d.array_size; j += 1) {
                run(d, j, index);
                index++;
            }
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

        return row;
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
                    var species = this.server.app.GetSpeciesByClassName(d.classname);
                    info.render(e, d, 0, species, width, arrayIndex);
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

    _OnSearchChanged(query) {
        this.query = query.toLowerCase();
        this.recycler.RefreshSearch();
    }

}