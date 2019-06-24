var dinosidebar = {};
dinosidebar.latest_data = null;

//Web resources, assuming they automatically cancel themself if the query changes.
dinosidebar.currentWebToken = 0;
dinosidebar.webResources = {
    "itemSearch":function(query, webToken, callback) {
        itemsearch.fetchResultsCreateDom(query, 0, function(d) {
           if(d.args.webToken == dinosidebar.currentWebToken) {
               callback(d.dom, d.args.webToken);
           } 
        }, {
            "webToken":webToken
        });
    }
}

dinosidebar.sectionNames = [
    "Items",
    "Tribemembers",
    "Tribe Items",
    "Dinos",
    "Baby Dinos"
]

dinosidebar.sectionWebResourceNames = [
    ["itemSearch"],
    [],
    ["itemSearch"],
    [],
    []
]

dinosidebar.sectionCount = 5;
dinosidebar.activeSection = 0; //0 being all

dinosidebar.fetchAndGenerate = function(callback) {
    ark.serverRequestWithOfflineFallback(ark.session.endpoint_tribes_overview, "overview", "Failed to fetch tribe overview data.", function(d) {
        dinosidebar.latest_data = d;
        dinosidebar.generate(d);
        ark.setTribeName(d.tribeName);
        callback();
    });
}

dinosidebar.latestQuery = "";
dinosidebar.onSearch = function(query) {
    dinosidebar.latestQuery = query;
    dinosidebar.refresh();
}

dinosidebar.refresh = function() {
    var query = dinosidebar.latestQuery;
    if(query.length == 0) {
        dinosidebar.generate(dinosidebar.latest_data, null);
    } else {
        dinosidebar.generate(dinosidebar.latest_data, query);
    }
}

dinosidebar.switchSection = function(id) {
    //Switch section and reload
    dinosidebar.activeSection = id;
    dinosidebar.refresh();

    //Update slider
    var left = id / dinosidebar.sectionCount;
    //document.getElementById('dino_sidebar_filter_cursor').style.left = (left * 100).toString()+"%";
}

dinosidebar.generate = function(webData, searchQuery) {
    //Advance webtoken
    dinosidebar.currentWebToken++;
    var wt = dinosidebar.currentWebToken;

    //Create a request for the create command
    var req = [
        {
            "type":"custom",
            "name":"Baby Dinos",
            "data":webData.baby_dinos,
            "onInflate":function(d) {
                return bman.addDinoTimer(d);
            },
            "onClick":function() {

            },
            "id":4
        },
        {
            "type":"auto",
            "name":"Tribemates",
            "data":webData.tribemates,
            "onClick":function() {
                //Open Steam URL
                window.open(this.x_data.steamUrl, "_blank");
            },
            "subKeyName":"arkName",
            "imageKeyName":"img",
            "nameKeyName":"steamName",
            "doInvertImage":false,
            "id":1
        },
        {
            "type":"auto",
            "name":"Tribe Dinos",
            "data":webData.dinos,
            "onClick":function() {
                //Show dino on the map
                ark.locateDinoById(this.x_data.id);
            },
            "subKeyName":"classDisplayName",
            "imageKeyName":"img",
            "nameKeyName":"displayName",
            "additionalSubName":"level",
            "additionalSubDisplayName":"Lvl",
            "doInvertImage":true,
            "id":3
        }
    ]
    dinosidebar.create(req, searchQuery);

    //If we can reach the server, load web resources
    if(ark.isCurrentServerOnline) {
        dinosidebar.addLoadingDialog();
        //Add callback for after all web resources are loaded
        var afterWebResourcesLoaded = function() {
            //Validate that we're still ok
            if(dinosidebar.currentWebToken == wt) {
                //Hide loader
                dinosidebar.removeLoadingDialog();

                //If nothing was found, show that
                if(document.getElementById('dino_sidebar').childElementCount == 0) {
                    dinosidebar.addNoResultsMsg();
                }
            }
        }

        //Now, load web resources
        var resources = dinosidebar.sectionWebResourceNames[dinosidebar.activeSection];
        var resourcesLoaded = 0;
        var resourcesToLoad = resources.length;
        for(var name = 0; name<resources.length; name++) {
            var resrc = dinosidebar.webResources[resources[name]];
            resrc(searchQuery, wt, function(d, nwt) {
                dinosidebar.addAsync(d, wt);
                if(nwt == dinosidebar.currentWebToken) {
                    resourcesLoaded++;
                    if(resourcesLoaded == resourcesToLoad) {
                        afterWebResourcesLoaded();
                    }
                }
            })
        }
        if(resources.length == 0) {
            afterWebResourcesLoaded();
        }
    } else {
        if(dinosidebar.sectionWebResourceNames[dinosidebar.activeSection].length != 0) {
            //Show error dialog
            dinosidebar.addErrorLoadingDialog();
        }

        //If nothing was found, show that
        if(document.getElementById('dino_sidebar').childElementCount == 0) {
            dinosidebar.addNoResultsMsg();
        }
    }

    
}

dinosidebar.create = function(data, searchQuery) {
    var a = document.getElementById('dino_sidebar');
    a.innerHTML = "";
    var hasPlacedTop = false;
    for(var sid = 0; sid < data.length; sid += 1) {
        var section = data[sid];
        if(section.data.length == 0) {
            continue;
        }
        if(section.id != dinosidebar.activeSection && dinosidebar.activeSection != 0) {
            //Not the active section.
            continue;
        }
        //Section data: type, data, name
        //If type == 'auto', use onClick, subKeyName, nameKeyName, imageKeyName, additionalSubName, additionalSubDisplayName, doInvertImage
        //If type == 'custom', have onInflate, onClick
        if(hasPlacedTop) {
            var title = ark.createDom('div', 'dino_sidebar_section_header', a);
        }
        
        //title.innerText = section.name;
        for(var i = 0; i<section.data.length; i+=1) {
            var d = section.data[i];
            if(section.type == 'auto') {
                //If we're searching, skip this if the search query does not match
                if(searchQuery != null) {
                    if(!d[section.nameKeyName].toLowerCase().includes(searchQuery.toLowerCase()) && !d[section.subKeyName].toLowerCase().includes(searchQuery.toLowerCase())) {
                        //Does not match
                        continue;
                    }
                }

                //Check profanities
                var isBlocked = !ark.checkWordFilter(d[section.nameKeyName]);
                if(isBlocked && !ark_users.me.user_settings.vulgar_show_censored_on) {
                    //Do not show censored names and the name was filter caught
                    continue;
                }
                
                hasPlacedTop = true;
                var e = ark.createDom('div', 'dino_sidebar_item', a);
                var img;
                if(section.doInvertImage) {
                    img = ark.createDom('img', 'dino_sidebar_item_invertedimg', e);
                } else {
                    img = ark.createDom('img', '', e);
                }
                var name = ark.createDom('div', 'dino_sidebar_item_title', e);
                var sub = ark.createDom('div', 'dino_sidebar_item_sub', e);
                img.src = d[section.imageKeyName];
                name.innerText = d[section.nameKeyName];
                if(ark_users.me.user_settings.vulgar_show_censored_on && isBlocked) {
                    //Replace name with censored version
                    name.innerText = "(Filtered Name)";
                    name.classList.add("dino_sidebar_item_title_censored");
                }
                sub.innerText = d[section.subKeyName];
                if(section.additionalSubName != null) {
                    //Append to sub
                    sub.innerText += " - "+section.additionalSubDisplayName+" "+d[section.additionalSubName];
                }
                e.x_data = d;
                e.addEventListener('click', section.onClick);
            } else if (section.type == 'custom') {
                //Make it inflate itself
                var e = section.onInflate(d);
                e.addEventListener('click', section.onClick);
                a.appendChild(e);
                hasPlacedTop = true;
            } else if (section.type == "disabled") {
                continue;
            } else {
                //Unknown
                throw "Unknown type.";
            }
        }
    }

    
}

dinosidebar.addNoResultsMsg = function() {
    ark.createDom("div", "dino_sidebar_noresults_title", document.getElementById('dino_sidebar')).innerText = "No "+dinosidebar.sectionNames[dinosidebar.activeSection]+" Found";
    var subtext = "Try adjusting your search query.";
    if(dinosidebar.activeSection != 0) {
        subtext = "Try adjusting your search query or removing the filter.";
    }
    ark.createDom("div", "dino_sidebar_noresults_sub", document.getElementById('dino_sidebar')).innerText = subtext;
}

dinosidebar.addLoadingDialog = function() {
    ark.createDom("div", "dino_sidebar_noresults_sub dino_sidebar_stillloading", document.getElementById('dino_sidebar')).innerText = "Still Loading Items...";
}

dinosidebar.addErrorLoadingDialog = function() {
    ark.createDom("div", "dino_sidebar_noresults_sub dino_sidebar_stillloading", document.getElementById('dino_sidebar')).innerText = "Couldn't load additional items; The server is offline";
}

dinosidebar.removeLoadingDialog = function() {
    var itemsFound = document.getElementsByClassName("dino_sidebar_stillloading");
    for(var i = 0; i<itemsFound.length; i+=1) {
        itemsFound[i].remove();
    }
}

dinosidebar.createTemplate = function(count) {
    dinosidebar.latest_data = null;
    var a = document.getElementById('dino_sidebar');
    a.innerHTML = "";
    for(var i = 0; i<count; i+=1) {
        var e = ark.createDom('div', 'dino_sidebar_item', a);
        var img = ark.createDom('div', 'dino_sidebar_item_templateimg', e);
        var name = ark.createDom('div', 'dino_sidebar_item_title', e);
        var sub = ark.createDom('div', 'dino_sidebar_item_sub', e);
        
        //Fill with templates
        name.appendChild(ark.generateTextTemplate(16, "#404144", 250));
        sub.appendChild(ark.generateTextTemplate(12, "#37383a", 150));
    }
}

dinosidebar.addAsync = function(dom, expectedWebToken) {
    //Check if the expected web token is still valid
    if(dinosidebar.currentWebToken != expectedWebToken) {
        return false;
    }

    //Append name, if needed
    var area = document.getElementById('dino_sidebar');
    if(dom.childElementCount > 0) {
        //1 item could be the loader
        if(area.childElementCount > 1) {
            ark.createDom('div', 'dino_sidebar_section_header', area);
        }

        //Append all of these
        area.appendChild(dom);

        return true;
    }
    return false;
}