var dinosidebar = {};

dinosidebar.ready = false;
dinosidebar.data = null;
dinosidebar.filter = -1;
dinosidebar.token = 0;
dinosidebar.lastQuery = "";
dinosidebar.sortType = 0;

dinosidebar.makeItemDoms = function(query, done) {
    //Fetch data
    main.serverRequest(ark.session.endpoint_tribes_itemsearch.replace("{query}", encodeURIComponent(query)), {"failOverride": function() {
        //Error. Make fake one to keep it happy
        done(main.createDom("div", ""), false);
    }, "enforceServer":true}, function(d) {
        //Loop through items
        var o = main.createDom("div", "");
        for(var i = 0; i<d.items.length; i+=1) {
            var item = d.items[i];

            //Create structure.
            var e = main.createDom("div", "dino_sidebar_item", o);
            var e_icon = main.createDom("img", "sidebar_item_search_entry_icon", e);
            var e_title = main.createDom("div", "sidebar_item_search_entry_text", e);
            var e_sub = main.createDom("div", "sidebar_item_search_entry_sub", e);
            var e_dinos = main.createDom("div", "sidebar_item_search_entry_dinos", e);

            //Set some values
            e_icon.src = item.item_icon;
            e_title.innerText = item.item_displayname;
            e_sub.innerText = main.createNumberWithCommas(item.total_count)+" total";

            //Loop through connected inventories
            for(var j = 0; j<item.owner_inventories.length; j+=1) {
                var inventory_ref = item.owner_inventories[j];
                var inventory = d.inventories[inventory_ref.type.toString()][inventory_ref.id.toString()];
                var e_dom = null;
                if(inventory_ref.type == 0) {
                    //Dino
                    e_dom = (main.createCustomDinoEntry(inventory.img, "", inventory.displayName + " (x"+main.createNumberWithCommas(inventory_ref.count)+")", "dino_entry_offset dino_entry_mini"));
                    e_dom.x_id = inventory_ref.id;
                } else if(inventory_ref.type == 1) {
                    //Inventory
                    e_dom = (main.createCustomDinoEntry(inventory.img, "", inventory.displayName + " (x"+main.createNumberWithCommas(inventory_ref.count)+")", "dino_entry_offset dino_entry_mini dino_entry_no_invert"));
                    e_dom.x_id = inventory_ref.id;
                } else {
                    //Character
                    e_dom = (main.createCustomDinoEntry(inventory.icon, "", inventory.name + " (x"+main.createNumberWithCommas(inventory_ref.count)+")", "dino_entry_offset dino_entry_mini dino_entry_no_invert"));
                    e_dom.x_id = inventory_ref.id;
                }
                e_dom.x_type = inventory_ref.type;
                e_dinos.appendChild(e_dom);
            }
        }
        done(o, d.items.length);
    });
}

dinosidebar.SECTIONS = [
    {
        "name":"Tribemates",
        "id":1,
        "type":"template",
        "requires_online":false,
        "getData":function() {
            //Used because type=template
            var output = [];
            for(var i = 0; i<dinosidebar.data.tribemates.length; i+=1) {
                var d = dinosidebar.data.tribemates[i];
                output.push({
                    "head":d.steamName,
                    "sub":d.arkName,
                    "img":d.img,
                    "img_classes":"",
                    "meta":d,
                    "level":0
                });
            }
            return output;
        },
        "onClick":function(d) {
            map.flyToMarkerByName("players", d.arkId);
        },
        "extras":[

        ]
    },
    {
        "name":"Dinos",
        "id":3,
        "type":"template",
        "requires_online":false,
        "getData":function() {
            //Used because type=template
            var output = [];
            for(var i = 0; i<dinosidebar.data.dinos.length; i+=1) {
                var d = dinosidebar.data.dinos[i];
                output.push({
                    "head":d.displayName,
                    "sub":d.classDisplayName+" - Lvl "+d.level.toString(),
                    "img":d.img,
                    "img_classes":"dino_sidebar_item_invertedimg",
                    "meta":d,
                    "level":d.level,
                    "x_status":d.status
                });
            }
            return output;
        },
        "onClick":function(d) {
            map.flyToMarkerByName("dinos", d.id);
        },
        "extras":[
            "DINO_STATUS"
        ]
    },
    {
        "name":"Items",
        "id":2,
        "type":"custom-async",
        "requires_online":true,
        "makeDoms":dinosidebar.makeItemDoms
    }
]

dinosidebar.SORT_NAMES = [
    "Species",
    "Name",
    "Level"
]

dinosidebar.SORT_FUNCTIONS = [
    function(data) {
        data.sort(function(a, b) { 
            return a.sub.localeCompare(b.sub);
        });
    },
    function(data) {
        data.sort(function(a, b) { 
            return a.head.localeCompare(b.head);
        });
    },
    function(data) {
        data.sort(function(a, b) { 
            return b.level - a.level;
        });
    }
];

dinosidebar.init = function() {
    //Loads initial data, then starts this
    ark.downloadData(ark.session.endpoint_tribes_overview, "overview", {}, function(d) {
        dinosidebar.data = d;
        dinosidebar.ready = true;
        ark.loading_status += 1;
        main.log("Dino Sidebar", 0, "Dino sidebar data loaded.");
        dinosidebar.query("");
    }, ark.fatalError);
}

dinosidebar.deinit = function() {
    //Removes data
    dinosidebar.ready = false;
    dinosidebar.data = null;
}

dinosidebar.redownload = function() {
    ark.downloadData(ark.session.endpoint_tribes_overview, "overview", {}, function(d) {
        dinosidebar.data = d;
        dinosidebar.ready = true;
        main.log("Dino Sidebar", 0, "Dino sidebar data reloaded.");
        dinosidebar.refresh();
    }, ark.fatalError);
}

dinosidebar.refresh = function() {
    dinosidebar.query(dinosidebar.lastQuery);
}

dinosidebar.getSortSpan = function(parent) {
    var e = main.createDom("span", "dino_sidebar_top_nav_sort_type", parent);
    e.innerText = " "+dinosidebar.SORT_NAMES[dinosidebar.sortType];
    return e;
}

dinosidebar.changeSort = function() {
    //Add to sort index
    dinosidebar.sortType += 1;

    //Check if overflows
    if(dinosidebar.sortType >= dinosidebar.SORT_FUNCTIONS.length) {
        dinosidebar.sortType = 0;
    }

    //Save
    localStorage.setItem("latest_sort_type", dinosidebar.sortType);

    //Update buttons
    var a = document.getElementById('dino_sidebar');
    var rb = document.getElementsByClassName("dino_sidebar_top_nav_right")[0];
    rb.getElementsByClassName("dino_sidebar_top_nav_sort_type")[0].remove();
    dinosidebar.getSortSpan(rb);

    //Refresh
    dinosidebar.refresh();
}

dinosidebar.query = function(query) {
    //Stop if we're not ready
    dinosidebar.lastQuery = query;
    if(!dinosidebar.ready) {
        return;
    }

    //Count number that we need
    var a = document.getElementById('dino_sidebar');
    dinosidebar.token++;
    a.innerHTML = "";

    var token = dinosidebar.token;
    var waitingCount = 0; //How many we're waiting on
    var waitingFinishedCount = 0; //How many have finished
    var waitingOutputs = {}; //Holds where outputted data should go
    var waitingResults = 0; //How many we're waiting on that actually have responses
    for(var i = 0; i<dinosidebar.SECTIONS.length; i+=1) {
        var s = dinosidebar.SECTIONS[i];

        //Apply filter
        if(dinosidebar.filter != -1 && dinosidebar.filter != s.id) { continue; }

        //Apply online requirement
        if(!main.currentServerOnline && s.requires_online) { continue; }

        //Count
        waitingCount++;
    }

    //Actually commit
    for(var i = 0; i<dinosidebar.SECTIONS.length; i+=1) {
        var s = dinosidebar.SECTIONS[i];

        //Apply filter
        if(dinosidebar.filter != -1 && dinosidebar.filter != s.id) { continue; }

        //Apply online requirement
        if(!main.currentServerOnline && s.requires_online) { continue; }

        //Create
        var section = main.createDom("div", "", a);
        waitingOutputs[s.id] = section;

        //Make it
        dinosidebar.addCategoryAsync(query.toLowerCase(), s, function(category, goingToken, data, areResultsFound) {
            //Check that the token is still valid
            if(goingToken != dinosidebar.token) { return; }

            //Set
            waitingOutputs[category.id].appendChild(data);
            waitingFinishedCount++;
            if(areResultsFound) {
                waitingResults++;
            }

            //Check if we're done
            if(waitingFinishedCount == waitingCount) {
                //We're done loading.
                dinosidebar.queryLoadComplete(waitingOutputs, waitingCount, waitingResults);
            }
        }, token);
    }

    //Show no results now if no sections were triggered
    if(waitingCount == 0) {
        if(dinosidebar.filter == -1) {
            dinosidebar.addNoResultsMsg("No results found.", "Try adjusting your query.");
        } else {
            dinosidebar.addNoResultsMsg("No results found.", "Try adjusting your query or removing the filter.");
        }
    }

    //If we're still loading, show a "loading" dialog
    if(waitingCount > 0 && waitingCount != waitingFinishedCount) {
        main.createDom("div", "dino_sidebar_noresults_sub dino_sidebar_stillloading", document.getElementById('dino_sidebar')).innerText = "Still Loading...";
    }
}

dinosidebar.queryLoadComplete = function(waitingOutputs, waitingCount, waitingResults) {
    //We're done loading. Check if any results were found
    if(waitingResults == 0) {
        if(dinosidebar.filter == -1) {
            dinosidebar.addNoResultsMsg("No results found.", "Try adjusting your query.");
        } else {
            dinosidebar.addNoResultsMsg("No results found.", "Try adjusting your query or removing the filter.");
        }
    }

    //Remove "still loading" message, if it's there
    var loadingMsgs = document.getElementById('dino_sidebar').getElementsByClassName("dino_sidebar_stillloading");
    if(loadingMsgs.length == 1) {
        loadingMsgs[0].remove();
    }
}

dinosidebar.addNoResultsMsg = function(title, sub) {
    main.createDom("div", "dino_sidebar_noresults_title", document.getElementById('dino_sidebar')).innerText = title;
    main.createDom("div", "dino_sidebar_noresults_sub", document.getElementById('dino_sidebar')).innerText = sub;
}

dinosidebar.addCategoryAsync = function(query, category, done, token) {
    //Decide from the type
    if(category.type == "template") {
        //Create from a template
        //Get the data. This'll be an array of results.
        var data = category.getData();
        var o = main.createDom("div", "");
        var count = 0;

        //Sort the data
        dinosidebar.SORT_FUNCTIONS[dinosidebar.sortType](data);

        for(var i = 0; i<data.length; i+=1) {
            var d = data[i];
            
            //Check if our query matches
            if(!d.head.toLowerCase().includes(query) && !d.sub.toLowerCase().includes(query) && query.length > 0) { continue; }
            count += 1;

            //Convert
            var e = main.createDom('div', 'dino_sidebar_item', o);
            var img = main.createDom('img', d.img_classes, e);
            var name = main.createDom('div', 'dino_sidebar_item_title', e);
            var sub = main.createDom('div', 'dino_sidebar_item_sub', e);
            img.src = d.img;
            name.innerText = d.head;
            sub.innerText = d.sub;

            //Add extras
            if(category.extras.includes("DINO_STATUS")) {
                var status = main.createDom('div', 'dino_sidebar_item_sub dino_sidebar_item_sub_state', e);
                if(d.x_status != null) {
                    var statusData = statics.STATUS_STATES[d.x_status];
                    if (statusData != null) {
                        status.innerText = statusData.text.toUpperCase();
                        status.style.color = statusData.modal_color;
                    } else {
                        status.innerText = d.x_status;
                        status.style.color = "#E0E0E0";
                    }
                } else {
                    status.innerText = "UNKNOWN";
                    status.style.color = "#E0E0E0";
                }
            }

            e.x_data = d.meta;
            e.x_category = category;
            e.addEventListener('click', dinosidebar.onClick);
        }

        done(category, token, o, count > 0);
    } else if (category.type == "custom-async") {
        //Let it create it's own DOM elements
        category.makeDoms(query, function(e, hasResults) {
            done(category, token, e, hasResults);
        });
    } else {
        throw "Unknown type.";
    }
}

dinosidebar.onClick = function() {
    this.x_category.onClick(this.x_data);
}

if(localStorage.getItem("latest_sort_type") != null) {
    dinosidebar.sortType = parseInt(localStorage.getItem("latest_sort_type"));
    if(dinosidebar.sortType < 0 || dinosidebar.sortType >= dinosidebar.SORT_FUNCTIONS.length) {
        dinosidebar.sortType = 0;
    }
}

//Used for capturing screenshots of the app.
dinosidebar.loadExampleData = function() {
    dinosidebar.data = {
        "tribemates":[
           {
              "arkName":"RomanPort",
              "steamName":"RomanPort",
              "arkId":"960312129",
              "steamId":"76561198300124500",
              "steamUrl":"https://steamcommunity.com/id/RomanPort/",
              "img":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/32/3212a8c5a45904e73f3b72142f9eb0c0946ba34e_full.jpg"
           }
        ],
        "dinos":[
           {
              "displayName":"Sandy",
              "classDisplayName":"Raptor",
              "level":5,
              "id":"561539911593408725",
              "img":"https://icon-assets.deltamap.net/charlie/190C80C3F814C875462F05EC.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Red",
              "classDisplayName":"Raptor",
              "level":30,
              "id":"1563867278415987223",
              "img":"https://icon-assets.deltamap.net/charlie/190C80C3F814C875462F05EC.png",
              "status":"PASSIVE",
              "color_tag":null
           },
           {
              "displayName":"Abyssal Jr.",
              "classDisplayName":"Dodo",
              "level":73,
              "id":"1075916778298862812",
              "img":"https://icon-assets.deltamap.net/charlie/0EB0535DBCA10E5559465E14.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"E. Rex",
              "classDisplayName":"Rex",
              "level":61,
              "id":"1411546821925700271",
              "img":"https://icon-assets.deltamap.net/charlie/7DF547E36C61578A7B657EA8.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Tegu",
              "classDisplayName":"Megalania",
              "level":9,
              "id":"1326884434882602707",
              "img":"https://icon-assets.deltamap.net/charlie/738332A237F3CB079EC7798F.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Kato",
              "classDisplayName":"Rock Drake",
              "level":75,
              "id":"1207874950199271865",
              "img":"https://icon-assets.deltamap.net/charlie/50B5A4210E5617A62C9D6348.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Fuzzy Christmas Sock",
              "classDisplayName":"Yutyrannus",
              "level":18,
              "id":"48389919478367332",
              "img":"https://icon-assets.deltamap.net/charlie/3E87882A6A75B7E66BCBF2FB.png",
              "status":"PASSIVE",
              "color_tag":null
           },
           {
              "displayName":"Blake",
              "classDisplayName":"Yutyrannus",
              "level":81,
              "id":"1368637899377035387",
              "img":"https://icon-assets.deltamap.net/charlie/3E87882A6A75B7E66BCBF2FB.png",
              "status":"PASSIVE",
              "color_tag":null
           },
           {
              "displayName":"Frank",
              "classDisplayName":"Yutyrannus",
              "level":26,
              "id":"428714539215034174",
              "img":"https://icon-assets.deltamap.net/charlie/3E87882A6A75B7E66BCBF2FB.png",
              "status":"AGGRESSIVE",
              "color_tag":null
           },
           {
              "displayName":"Dream",
              "classDisplayName":"Equus",
              "level":2,
              "id":"1210215982108671406",
              "img":"https://icon-assets.deltamap.net/charlie/36C4DE96E0C436EC765BF0C4.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Delta",
              "classDisplayName":"Velonasaur",
              "level":86,
              "id":"344069516976210771",
              "img":"https://icon-assets.deltamap.net/charlie/0C0AF33DB184D6D99CBC623E.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Sir Compy",
              "classDisplayName":"Compy",
              "level":15,
              "id":"790975724759274364",
              "img":"https://icon-assets.deltamap.net/charlie/0BD4B3C918B176BD7B8A9CC3.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Pickle Juice",
              "classDisplayName":"Pachy",
              "level":4,
              "id":"1004836268251108703",
              "img":"https://icon-assets.deltamap.net/charlie/1931DBBFAA53F9BC37CC6442.png",
              "status":"AGGRESSIVE",
              "color_tag":null
           },
           {
              "displayName":"Velvet Cake Jr",
              "classDisplayName":"Archaeopteryx",
              "level":14,
              "id":"452173967967632857",
              "img":"https://icon-assets.deltamap.net/charlie/E717974393BD3E3F8582E38D.png",
              "status":"NEUTRAL",
              "color_tag":null
           },
           {
              "displayName":"Phil",
              "classDisplayName":"Argentavis",
              "level":66,
              "id":"461391685345400189",
              "img":"https://icon-assets.deltamap.net/charlie/70483BFBF37EB31FFAD24242.png",
              "status":"NEUTRAL",
              "color_tag":null
           }
        ],
        "tribeName":"The TSA"
     };
    dinosidebar.refresh();
}