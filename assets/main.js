var CLIENT_VERSION = 1;

var ark = {};
ark.session = null;
ark.session_events_url = null;
ark.session_start_time = null;

ark.statusEntries = {
    "water": {
        "icon":"/resources/ui/status/water.png",
        "name":"Water",
        "formatString":function(value) {return value;}
    },
    "unknown3": {
        "icon":"/resources/ui/status/unknown3.png",
        "name":"UNKNOWN 3",
        "formatString":function(value) {return value;}
    },
    "unknown2": {
        "icon":"/resources/ui/status/unknown2.png",
        "name":"UNKNOWN 2",
        "formatString":function(value) {return value;}
    },
    "unknown1": {
        "icon":"/resources/ui/status/unknown1.png",
        "name":"UNKNOWN 1",
        "formatString":function(value) {return value;}
    },
    "stamina": {
        "icon":"/resources/ui/status/stamina.png",
        "name":"Stamina",
        "formatString":function(value) {return value;}
    },
    "oxygen": {
        "icon":"/resources/ui/status/oxygen.png",
        "name":"Oxygen",
        "formatString":function(value) {return value;}
    },
    "movementSpeedMult": {
        "icon":"/resources/ui/status/movementSpeedMult.png",
        "name":"Movement Speed",
        "formatString":function(value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString()+"%";
        }
    },
    "meleeDamageMult": {
        "icon":"/resources/ui/status/meleeDamageMult.png",
        "name":"Melee Damage",
        "formatString":function(value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString()+"%";
        }
    },
    "inventoryWeight": {
        "icon":"/resources/ui/status/inventoryWeight.png",
        "name":"Weight",
        "formatString":function(value) {return value;}
    },
    "health": {
        "icon":"/resources/ui/status/health.png",
        "name":"Health",
        "formatString":function(value) {return value;}
    },
    "food": {
        "icon":"/resources/ui/status/food.png",
        "name":"Food",
        "formatString":function(value) {return value;}
    },
};

ark.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reply = JSON.parse(this.responseText);
            if(args.echo != null) {
                reply._echo = args.echo;
            }
            callback(reply);
        } else if(this.readyState == 4) {
            if(args.failOverride != null) {
                args.failOverride(this);
            } else {
                if (this.readyState == 4 && this.status == 502) {
                    //Host offline
                    bottom_modal.forceHideBottomModalNoArgs();
                    bottom_modal.reportError("This server is offline. Please try again later.");
                    
                } else if (this.readyState == 4 && this.status == 500) {
                    //Known server error.
                    var err = JSON.parse(this.responseText);
                    bottom_modal.forceHideBottomModalNoArgs();
                    bottom_modal.reportError("Couldn't fetch data.\n\nError: "+err.message);
                } else if (this.readyState == 4 && this.status == 521) {
                    //This is the error code returned by the Ark master server proxy. Abort.
                    if(args.overrideProxyOffline != null) {
                        args.overrideProxyOffline();
                    } else {
                        ark.onConnectedServerStop();
                    }
                    
                } else if (this.readyState == 4 && this.status == 401) {
                    //Not authenticated
                    window.location = "/login";
                } else if (this.readyState == 4) {
                    //Parse the response and display the error
                    ark.onNetError(this.status + " ("+this.statusText+")", args);
                }
            }
        }
    }
    xmlhttp.ontimeout = function () {
        if(args.failOverride != null) {
            args.failOverride(this);
        } else {
            ark.onNetError("Timed out", args);
        }
        
    }
    xmlhttp.onerror = function () {
        if(args.failOverride != null) {
            args.failOverride(this);
        } else {
            ark.onNetError("Generic error", args);
        }
        
    }
    xmlhttp.onabort = function () {
        if(args.failOverride != null) {
            args.failOverride(this);
        } else {
            ark.onNetError("Request aborted", args);
        }
        
    }
    if(args.type == null) {
        args.type = "GET";
    }
    if(url.includes("?")) {
        url += "&v="+CLIENT_VERSION;
    } else {
        url += "?v="+CLIENT_VERSION;
    }
    xmlhttp.open(args.type, url, true);
    xmlhttp.withCredentials = true;
    if(args.nocreds != null) {
        xmlhttp.withCredentials = !args.nocreds;
    }
    xmlhttp.send(args.body);
}

ark.onNetError = function(errorCode, args) {
    bottom_modal.forceHideBottomModalNoArgs();
    window.setTimeout(function() {
        if(args.customErrorText != null) {
            bottom_modal.reportError(args.customErrorText);
        } else {
            //bottom_modal.reportError("Couldn't fetch data. Error code: "+errorCode);
            ark.onNetErrorShowMsg(errorCode);
        }
    }, 400);
    
    if(args.failCallback != null) {
        args.failCallback(errorCode, args);
    }
}

ark.serverRequestWithOfflineFallback = function(url, fallbackKey, name, callback) {
    //URL: The URL to try
    //fallbackKey: The key to use in the fallback offline data
    //name: The custom error text to show
    //callback: Callback

    //If we already know the server is offline, use the offline data.
    if(!ark.isCurrentServerOnline) {
        callback(ark.currentServerOfflineData[fallbackKey]);
        return;
    }

    //AFAIK the server is up! Try
    ark.serverRequest(url, {"customErrorText":name, "overrideProxyOffline":function() {
        //Server is offline! Fetch offline data if we need to do so.
        ark.isCurrentServerOnline = false;
        if(ark.currentServerOfflineData == null) {
            ark.fetchOfflineData(function(ds) {
                ark.currentServerOfflineData = ds;
                callback(ark.currentServerOfflineData[fallbackKey]);
            });
        } else {
            callback(ark.currentServerOfflineData[fallbackKey]);
        }
    }}, function(d) {
        //Online.
        ark.isCurrentServerOnline = true;
        callback(d);
    });
}

ark.openSession = function(callback, url) {
    ark.serverRequest(url, {"customErrorText":"Failed to create session.", "overrideProxyOffline":function() {
        //Server is offline! Fetch offline data.
        ark.isCurrentServerOnline = false;
        ark.fetchOfflineData(function(ds) {
            var d = ds.session;
            ark.session = d;
            ark.session_events_url = d.endpoint_events;

            //Reset start time
            ark.session_start_time = new Date();

            //Set last updated time
            ark.updateLastEditedUi();

            callback(d);
        });
    }}, function(d) {
        ark.isCurrentServerOnline = true;
        ark.session = d;
        ark.session_events_url = d.endpoint_events;

        //Reset start time
        ark.session_start_time = new Date();

        //Set last updated time
        ark.updateLastEditedUi();

        callback(d);
    });
}

ark.addAlert = function(iconUrl, text, id, onClick) {
    //Cancel if it already exists
    if(document.getElementById("badgealert-"+id) != null) {
        return;
    }

    //Add
    var e = ark.createDom("div", "top_nav_btn_alert", document.getElementById('alerts_area'));
    e.style.backgroundImage = iconUrl;
    e.id = "badgealert-"+id;
    e.addEventListener('click', onClick);
    
    //Show popup
    var ie = ark.createDom("div", "");
    ie.innerText = text;
    var popup = ark.openTopBtnDialog(e, ie);

    //Show sectioner
    document.getElementById('alerts_area_s').style.display = "inline-block";

    //Add delay 
    window.setTimeout(function() {
        popup.remove();
        e.addEventListener('mouseover', function() {
            e.x_dialog = ark.openTopBtnDialog(e, ie);
        });
        e.addEventListener('mouseout', function() {
            e.x_dialog.remove();
        });
    }, 4000);
}

ark.removeAlert = function(id) {
    var e = document.getElementById("badgealert-"+id);
    if(e != null) {
        e.remove();
    }

    //Remove sectioner if empty
    if(document.getElementById('alerts_area').childElementCount == 0) {
        document.getElementById('alerts_area_s').style.display = "none";
    }
}

ark.dateToString = function(d) {
    var hour = d.getHours();
    var pmam = "AM";
    if(hour >= 12) {
        pmam = "PM";
        
    }

    if(hour > 12) {
        hour -= 12;
    }

    return (d.getMonth() + 1).toString() + "/" + ark.timeIntToPaddedString(d.getDate()) + "/" + d.getFullYear() + " at " + ark.timeIntToPaddedString(hour) + ":" + ark.timeIntToPaddedString(d.getMinutes()) + " " + pmam;
}

ark.timeIntToPaddedString = function(i) {
    var e = i.toString();
    if(e.length == 1) {
        e = "0"+e;
    }
    return e;
}

ark.openTopBtnDialog = function(btnContext, dom) {
    //Find the width of the button
    var btnWidth = btnContext.offsetWidth;
    var offset = (btnWidth / 2) - (232 / 2);

    //Create elements
    var p = ark.createDom("div", "top_nav_popup", btnContext);
    ark.createDom("div", "top_nav_popup_arrow", p);
    p.style.left = offset.toString()+"px";
    p.appendChild(dom);

    return p;
}

ark.fetchOfflineData = function(callback) {
    var url = "https://ark.romanport.com/api/servers/"+ark.currentServerId+"/offline_data";
    console.log("Fetching offline server info from "+url);
    ark.serverRequest(url, {"customErrorText":"Failed to grab offline server data."}, function(d) {
        ark.currentServerOfflineData = d;
        callback(d);
    });
}

ark.getCurrentGameTime = function() {
    //Calculate the current game time
    return ark.session.dayTime + ark.session.mapTimeOffset + ((new Date() - ark.session_start_time) / 1000);
}

ark.getGameTimeOffset = function() {
    //Calculate the offset from the file time to the current time. This is to calculate the in-game values, even without a world save.
    return ark.getCurrentGameTime() - ark.session.dayTime;
}

ark.onActiveServerDown = function() {
    //Called when the current server goes offline
    console.log("Active server just went down.");

    //Show warning
    //bottom_modal.showBottomModal("This server is offline. Some features may be unavailable.", function(){}, "bottom_modal_error", 0);
    var d = new Date(ark.currentServer.lastReportTime);
    ark.addAlert("/assets/icons/baseline-view_quilt-24px.svg", "This server is offline\nAs of "+ark.dateToString(d), "server-offline", function(){});
}

ark.onActiveServerUp = function(doReload) {
    //Called when the current server goes online
    console.log("Active server just went up.");

    //Hide warning
    ark.removeAlert("server-offline");
}

ark.onClickOnlineFeatureOffline = function() {
    //Called when a user clicks a feature that cannot be done while the server is offline.
    bottom_modal.blow();
}

ark.currentServer = null;
ark.isCurrentServerOnline = false;
ark.currentServerOfflineData = null;

ark.switchServer = function(serverData) {
    //Ignore if we're still loading a server
    if(ark.loadingStatus != 0) {
        console.log("Will not switch server; A server is already loading!");
        return;
    }

    //Ignore if this is already the active server
    if(ark.currentServerId == serverData.id) {
        return;
    }

    //If a session is already open, kill
    if(ark.session != null) {
        ark.deinitCurrentServer();
    }
    ark.currentServerId = serverData.id;

    //Remove the active markers, if any
    var activeBadges = document.getElementsByClassName('sidebar_server_badge_active');
    for(var i = 0; i<activeBadges.length; i+=1) {
        activeBadges[i].remove();
    }

    //First, open a session.
    ark.currentServer = serverData;
    ark.forceJoinServer(serverData.endpoint_createsession, serverData.id, serverData.display_name, serverData.owner_uid, serverData);
    
}

ark.loadingStatus = 0; //Counts down as items are loaded
//0: Done loading
//1: Awaiting the 0.5 second cooldown between switching servers
//2: Tribes endpoint loading
//3: Overview endpoint loading
//4: Main data loading

ark.forceJoinServer = function(url, id, name, ownerId, serverInfo) {
    if(ark.loadingStatus != 0) {
        console.log("Already loading a map. Ignoring!");
        return;
    }

    //Set up UI
    //Add active badge
    var badge = document.getElementById('server_badge_'+id);
    if(badge != null) {
        ark.createDom("div", "sidebar_server_badge_active", badge);
    }  
    
    //Fill UI
    document.getElementById('map_title').innerText = name;
    document.getElementById('map_sub_title').innerText = serverInfo.map_name;

    //Show buttons on the top
    var isOwner = serverInfo.owner_uid == ark_users.me.id;
    ark.setNavBtnVis("edit", isOwner);
    ark.setNavBtnVis("leave", !isOwner);
    ark.setNavBtnVis("public", serverInfo.is_public);
    ark.setNavBtnVis("private", !serverInfo.is_public);

    //Clear alerts
    ark.removeAllChildren(document.getElementById('alerts_area'));
    document.getElementById('alerts_area_s').style.display = "none";
    
    //Show
    ark.setMainContentVis(true);
    ark.loadingStatus = 4;
    ark.isCurrentServerOnline = true; //TEMP, TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    ark.currentServerOfflineData = null;
    ark.openSession(function(session) {
        //Set blank tribe name while loading
        ark.setTribeName("...");

        //Kill window
        ark.hideCustomArea();
        
        //Init the map
        map.init(session.endpoint_game_map);

        //Set pemrissions
        perms.p = session.permissions;
        perms.refreshPerms();

        if(ark.isCurrentServerOnline) {
            //Clear out the tribe item search
            ark.refreshTribeItemSearch("");   
        } else {
            //TODO: Show error here
        }

        //Fetch tribes
        map.onEnableTribeDinos(function() { 
            //Hide hub
            hub.close();

            ark.loadingStatus--;
        });

        //Fetch overview
        dinosidebar.fetchAndGenerate(function() {
            ark.loadingStatus--;
        });

        //Update the UI if the server is offline/offline
        if(ark.isCurrentServerOnline) {
            ark.onActiveServerUp(false);
        } else {
            ark.onActiveServerDown();
        }

        //Loaded
        ark.loadingStatus--;
        ark.loadingStatus--;
    }, url);
}

ark.removeAllChildren = function(e) {
    while(e.firstChild != null) {
        e.firstChild.remove();
    }
}

ark.setNavBtnVis = function(name, isShown) {
    var e = document.getElementById('nav_btn_'+name);
    if(isShown) {
        e.classList.remove("top_nav_btn_hidden");
    } else {
        e.classList.add("top_nav_btn_hidden");
    }
}

ark.refreshServers = function(callback) {
    ark_users.refreshUserData(function(user) { 
        //Nuke list
        var serverList = document.getElementById('bottom_nav_servers');
        serverList.innerHTML = "";
        var floatingNames = document.getElementsByClassName('sidebar_badge_text_popout');
        for(var i = 0; i<floatingNames.length; i+=1) {
            floatingNames[i].remove();
        }

        //Add first entries
        ark.createDom("div", "bottom_nav_server_badge bottom_nav_server_badge_hub", serverList).addEventListener('click', function() {
            collap.setState("ui_hub", true);  
        });
        //ark.createDom("div", "bottom_nav_server_badge_sep", serverList);

        //Add the users' servers
        for(var i = 0; i<user.servers.length; i+=1) {
            var e = ark.createServerEntryBadge(user.servers[i], function() {
                ark.switchServer(this.x_server_data);
            });
            if(e != null) {
                serverList.appendChild(e);
            }
        }

        //Try and add the active server badge back
        ark.setActiveServerBadge(ark.currentServerId);

        //Call callback
        callback(user);
    }, function(err) {
        //Error.
        ark.onNetErrorShowMsg(err);
    });
}

ark.createServerEntryBadge = function(s, clickCallback) {
    //Don't display if this server has never gone online
    if(!s.has_ever_gone_online || s.is_hidden) {
        return null;
    }

    var e = ark.createDom("div","bottom_nav_server_badge");
    var ee = ark.createDom("div", "sidebar_server_badge_text", e);
    ee.innerText = s.display_name;
    var et = ark.createDom("div", "sidebar_server_badge_text_triangle", ee);
    
    e.id = "server_badge_"+s.id;
    e.style.backgroundImage = "url("+s.image_url+")";
    e.x_server_data = s;
    e.x_server_data.has_pinged = false;
    e.addEventListener('click', clickCallback);

    //If this is the data for the current server, update it
    if(ark.currentServer != null) {
        if(ark.currentServer.id == s.id) {
            ark.currentServer = s;
        }
    }

    return e;
}

ark.setActiveServerBadge = function(id) {
    var badge = document.getElementById('server_badge_'+id);
    if(badge != null) {
        ark.createDom("div", "sidebar_server_badge_active", badge);
    }  
}

ark.onNetErrorShowMsg = function(err) {
    ark.showWarning("Can't connect to server, try again later");
}

ark.onFinishPing = function(ping){
    var pele = document.getElementById("server_badge_"+ping.id);
    var ele = pele.e_modal;
    pele.x_server_data.ping_ok = ping.online;
    pele.x_server_data.has_pinged = true;
    if(ping.online) {
        //Show ping
        ele.firstChild.innerText = ping.display_name+" ("+Math.round(ping.ping).toString()+" ms)";
    } else {
        //Set to offline icon
        ele.firstChild.innerText = ping.display_name + " (Server Offline)";
        pele.style.backgroundImage = "url(/assets/server_offline.png), url("+pele.x_server_data.image_url+")";
        ele.firstChild.classList.add("badge_errbg");
        ele.lastChild.classList.add("badge_errbg_triangle");
    }
}

ark.init = function() {
    //Update user content
    ark.refreshServers(function(user) {
        console.log(user);
        ark.onInitStepComplete();

        //Set the icon image
        document.getElementById('my_badge').style.backgroundImage = "url("+user.profile_image_url+")";
        document.getElementById('me_badge_title').innerText = user.screen_name;
    });

    //Create template view
    ark.createTemplateView();

    //Open the hub
    hub.show();

    //Connect to GATEWAY
    gateway.connect(function() {
        ark.gatewayWasConnected = true;
        ark.onInitStepComplete();
    }, ark.onGatewayDisconnect);
}

ark.onGatewayDisconnect = function() {
    //Reshow loader
    if(ark.gatewayWasConnected) {
        ark.initStepsCompleted--;
        document.getElementById('loader_view').classList.remove("loader_view_hidden");
    }
    ark.gatewayWasConnected = false;
    

    //Retry connection
    window.setTimeout(function() {
        gateway.connect(function() {
            ark.gatewayWasConnected = true;
            ark.onInitStepComplete();
        }, ark.onGatewayDisconnect);
    }, gateway.config.reconnect_delay_seconds * 1000);
}

ark.gatewayWasConnected = false;
ark.initStepsCompleted = 0;
ark.onInitStepComplete = function() {
    ark.initStepsCompleted++;
    if(ark.initStepsCompleted == 3) {
        //Ready. Remove loader
        document.getElementById('loader_view').classList.add("loader_view_hidden");
    }
}

ark.setTribeName = function(name) {
    document.getElementById('me_badge_tribe').innerText = name;
}

ark.hiddenServersToUnhide = "";
ark.showHiddenServers = function() {
    //Add server entries
    ark.hiddenServersToUnhide = "";
    var p = ark.createDom("div", "");
    ark.createDom("div", "nb_title nb_big_padding_bottom", p).innerText = "Hidden Servers";
    ark.createDom("div", "np_sub_title nb_big_padding_bottom", p).innerText = "This list shows servers you've hidden from the main list. Any server running ArkWebMap that you have joined will appear here.";
    ark.createDom("div", "window_close_btn", p).addEventListener('click', function() {
        ark.serverRequest("https://ark.romanport.com/api/users/@me/servers/remove_ignore_mass/?ids="+ark.hiddenServersToUnhide, {}, function() {
            //Refresh
            ark.refreshServers(function() {
                //Hide menu
                ark.hideCustomMenu();
            })
        });
    });
    var p_list = ark.createDom("div", "scrollable archived_servers_entry_scrollable", p);
    for(var i = 0; i<ark_users.me.servers.length; i+=1) {
        var s = ark_users.me.servers[i];
        //Create entry
        var e = ark.createDom("div", "archived_servers_entry", p_list);
        ark.createDom("div", "archived_servers_entry_title", e).innerText = s.display_name;
        ark.createDom("div", "archived_servers_entry_image", e).style.backgroundImage = "url("+s.image_url+")";
        var btn = ark.createDom("div", "nb_button_blue archived_servers_entry_button nb_button_blue_inverted", e);
        btn.innerText = "Unhide Server";
        btn.x_id = s.id;
        btn.addEventListener('click', function() {
            ark.hiddenServersToUnhide += this.x_id+",";
            this.parentNode.remove();
        });
    }

    //Show
    ark.showNewCustomMenu(p, "");
}

ark.dinoPickerCallback = null;

ark.showDinoPicker = function(callback) {
    //Blur background.
    document.getElementById('main_view').className = "main_view_blurred";
    document.getElementById('html').className = "html_blurred";

    //Clear
    ark.searchDinoPicker("");

    //Set callbacks
    ark.dinoPickerCallback = callback;

    //Show dino picker
    document.getElementById('dino_selector').className = "dino_selector dino_selector_active";
}

ark.createDinoClassEntry = function(dinoData) {
    //Create html node
    var e = document.createElement('div');
    e.className = "dino_entry";

    var img = document.createElement('img');
    img.src = dinoData.icon_url;
    e.appendChild(img);

    var title = document.createElement('div');
    title.className = "dino_entry_title";
    title.innerText = dinoData.screen_name;
    e.appendChild(title);

    var sub = document.createElement('div');
    sub.className = "dino_entry_sub";
    sub.innerText = dinoData.classname;
    e.appendChild(sub);

    e.x_dino_data = dinoData;

    return e;
}

ark.latestDinoPickerSearch = null;
ark.searchDinoPicker = function(search, callback) {
    ark.latestDinoPickerSearch = search;
    //Devalidate the results box
    var box = document.getElementById('configure_dino_selector_results');
    box.classList.add("dino_search_content_load");

    //Web request
    ark.serverRequest(ark.session.endpoint_dino_class_search.replace("{query}",encodeURIComponent(search)), {}, function(d) {
        //Ensure this is the most recent requset
        if(d.query != ark.latestDinoPickerSearch) {
            return;
        }
        //Recreate results
        box.innerHTML = "";
        for(var i = 0; i<d.results.length; i+=1) {
            var data = d.results[i];
            var e = ark.createDinoClassEntry(data);
            e.addEventListener('click', function() {
                var dinoData = this.x_dino_data;
                callback(dinoData);
            });
            box.appendChild(e);
        }
        //Validate results box
        box.classList.remove("dino_search_content_load");
    });
}

ark.displayFullscreenText = function(text) {
    var d = document.createElement('div');
    d.className = "text_center";
    var de = document.createElement('p');
    de.innerText = text;
    d.appendChild(de);
    return ark.showCustomArea(d);
}

ark.displayActionableFullscreenText = function(text, actionText, actionCallback) {
    var d = document.createElement('div');
    d.className = "text_center";
    var de = document.createElement('p');
    de.innerText = text;
    d.appendChild(de);

    var btn = ark.createDom("div", "text_center_action", d);
    var btn_btn = ark.createDom("input", "", btn);
    btn_btn.type = "button";
    btn_btn.value = actionText;
    btn_btn.addEventListener('click', actionCallback);

    return ark.showCustomArea(d);
}

ark.showCustomArea = function(domContent) {
    ark.showNewCustomMenu(domContent, "");
}

ark.hideCustomArea = function() {
    ark.hideCustomMenu();
}

ark.createDom = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    return e;
}

ark.createForm = function(names, items, parent) {
    var tbl = ark.createDom("table", "np_form", parent);
    for(var i = 0; i<names.length; i+=1) {
        var h1 = ark.createDom("tr", "", tbl);
        if(typeof(names[i]) == "string") {
            ark.createDom("td", "np_form_title", h1).innerText = names[i];
        } else {
            ark.createDom("td", "np_form_title", h1).appendChild(names[i]);
        }
        ark.createDom("td", "", h1).appendChild(items[i]);
    }
    return tbl;
}

ark.createNumberWithCommas = function(data) {
    //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return Math.round(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

ark.createCustomDinoEntry = function(img_url, title_text, sub_text, customClass) {
    //Create html node
    var e = document.createElement('div');
    e.className = "dino_entry "+customClass;

    var img = document.createElement('img');
    img.src = img_url;
    e.appendChild(img);

    var title = document.createElement('div');
    title.className = "dino_entry_title";
    title.innerText = title_text;
    e.appendChild(title);

    var sub = document.createElement('div');
    sub.className = "dino_entry_sub";
    sub.innerText = sub_text;
    e.appendChild(sub);

    return e;
}

ark.latestTribeItemSearchQuery = null;
ark.tribeItemSearchPage = 0;

ark.refreshTribeItemSearch = function(query) {
    ark.latestTribeItemSearchQuery = query;
    ark.tribeItemSearchPage = 0;
    
    //Get element
    var parent = document.getElementById('dino_search_window_content');

    ark.appendToDinoItemSearch(query, ark.tribeItemSearchPage, true);
}

ark.appendToDinoItemSearch = function(query, page, doClear) {
    //Deactivate
    var parent = document.getElementById('dino_search_window_content');
    parent.classList.add("sidebar_search_content_load");
    //Make a request
    
    ark.serverRequest(ark.session.endpoint_tribes_itemsearch.replace("{query}", query)+"&p="+page.toString(), {}, function(d) {
        //Check if this matches the latest
        if(d.query != ark.latestTribeItemSearchQuery) {
            return;
        }

        if(doClear) {
            parent.innerHTML = "";
        }

        //Create for each
        for(var i = 0; i<d.items.length; i+=1) {
            var r = d.items[i];

            //Create structure.
            var e = ark.createDom("div", "sidebar_item_search_entry", parent);
            var e_icon = ark.createDom("img", "sidebar_item_search_entry_icon", e);
            var e_title = ark.createDom("div", "sidebar_item_search_entry_text", e);
            var e_sub = ark.createDom("div", "sidebar_item_search_entry_sub", e);
            var e_dinos = ark.createDom("div", "sidebar_item_search_entry_dinos", e);

            //Set some values
            e_icon.src = r.item_icon;
            e_title.innerText = r.item_displayname;
            e_sub.innerText = ark.createNumberWithCommas(r.total_count)+" total";
            
            //Add all of the dinos.
            for(var j = 0; j< r.owner_inventories.length; j+=1) {
                var inventory = r.owner_inventories[j];
                var dino = d.owner_inventory_dino[inventory.id];
                
                var e_dom = (ark.createCustomDinoEntry(dino.img, dino.displayName, dino.displayClassName + " - x"+ark.createNumberWithCommas(inventory.count), "dino_entry_offset"));
                e_dom.x_dino_id = dino.id;
                e_dom.addEventListener('click', function() {
                    ark.locateDinoById(this.x_dino_id);
                });
                e_dinos.appendChild(e_dom);
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

        //Reactivate
        parent.classList.remove("sidebar_search_content_load");
    });
}

ark.locateDinoById = function(id) {
    //Locate on map.
    var mapPointer = map.dino_marker_list[id];
    var pin = mapPointer.map_icons[0];
    pin._map.flyTo(pin._latlng, 9, {
        "animate":true,
        "duration":0.5,
        "easeLinearity":0.25,
        "noMoveStart":false
    });
}

ark.getDinoUrl = function(id) {
    return ark.session.endpoint_tribes_dino.replace("{dino}", id);
}

ark.showNewCustomMenu = function(dom, customClasses) {
    //Set content
    var b = document.getElementById('new_custom_box');
    b.className = "new_custom_box "+customClasses;
    b.innerHTML = "";
    b.appendChild(dom);

    //Show
    document.getElementById('new_custom_area').classList.remove("new_custom_area_inactive");
    document.getElementById('main_view').classList.add("main_view_blurred");
}

ark.hideCustomMenu = function() {
    document.getElementById('new_custom_area').classList.add("new_custom_area_inactive");
    document.getElementById('main_view').classList.remove("main_view_blurred");
}

ark.deinitCurrentServer = function() {
    //Stop baby update loop
    bman.sessions = [];

    //Deinit map
    map.map.remove();

    //If the name editor is open, cancel
    ark.toggleServerNameEdit(false, true);

    //Remove top buttons
    ark.setNavBtnVis("edit", false);
    ark.setNavBtnVis("leave", false);
    ark.setNavBtnVis("public", false);
    ark.setNavBtnVis("private", false);

    //Restore default background color
    map.restoreDefaultBackgroundColor();

    //Collapse current dino
    map_menu.hide();

    //Clear baby dino list
    document.getElementById('dino_n_card_holder').innerHTML = "";

    //Hide dino search
    ark.hideSearchWindow();

    //Delete session data
    ark.session = null;
    ark.currentServerId = null;
    ark.isCurrentServerOnline = false;
    ark.currentServerOfflineData = null;

    //Hide warnings
    bottom_modal.forceHideBottomModalNoArgs();

    //Set tribe name back
    ark.setTribeName("Hub");

    //Show the template view
    ark.createTemplateView();

    
}

ark.setMainContentVis = function(active) {
    //Set message
    if(!active) {
        document.getElementById('no_session_mask').classList.remove("no_session_mask_disable");
    } else {
        document.getElementById('no_session_mask').classList.add("no_session_mask_disable");
    }
}

ark.onHideServerButtonClick = function() {
    var d = ark.createDom("div", "");
    ark.createDom("div","nb_title nb_big_padding_bottom", d).innerText = "Hide Server?";
    ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "Are you sure you would like to hide this server? You may unhide it at any time by clicking on the 'archive' button in the lower left of the screen."

    var b = ark.createDom("div", "nb_button_blue nb_button_back", d);
    b.innerText = "Cancel";
    b.addEventListener('click', function() {
        ark.hideCustomArea();
    });

    var bf = ark.createDom("div", "nb_button_blue nb_button_forward", d);
    bf.innerText = "Hide Server";
    bf.addEventListener('click', function() {
        ark.serverRequest("https://ark.romanport.com/api/users/@me/servers/add_ignore/?id="+ark.currentServerId, {}, function() {
            document.getElementById('server_badge_'+ark.currentServerId).remove();
            ark.hideCustomArea();
            ark.deinitCurrentServer();
        });
    });

    ark.showNewCustomMenu(d, "");
}

ark.currentSearchType = "tribeInventory";
ark.onStartSearchTyping = function(query) {
    //The user is typing into the search. Based on the type, decide what to do
    if(ark.currentSearchType == "tribeInventory") {
        ark.refreshTribeItemSearch(query);
    }
}

ark.showSearchWindow = function(type) {
    //If this is a offline session, stop
    if(!ark.isCurrentServerOnline) {
        ark.onClickOnlineFeatureOffline();
        return;
    }

    //Grab handles
    var p = document.getElementById('dino_search_window');
    var ps = document.getElementById('dino_search_window_content');

    //Clear
    ps.innerHTML = "";
    document.getElementById('dino_search_window_input').value = "";

    //Search
    ark.currentSearchType = type;
    ark.onStartSearchTyping("");

    //Show
    p.classList.remove('dino_search_window_disabled');
};

ark.hideSearchWindow = function() {
    //Hide
    var p = document.getElementById('dino_search_window');
    p.classList.add('dino_search_window_disabled');
}

/* Heatmap settings */
ark.chosen_filter_heatmap_dino = null;
ark.chosen_heatmap_pending_toggle_state = false; //State to set of the map.

ark.showHeatmapSettings = function() {
    //If this is a offline session, stop
    if(!ark.isCurrentServerOnline) {
        ark.onClickOnlineFeatureOffline();
        return;
    }

    var d = ark.createDom("div", "");
    ark.createDom("div","nb_title nb_big_padding_bottom", d).innerText = "Heatmap Settings";
    ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "The heatmap shows general locations of wild dinos on the map."

    var toggleBtn = ark.createDom("div", "nb_button_blue");
    toggleBtn.innerText = "Turn On"
    if(ark.chosen_heatmap_pending_toggle_state == true) {
        toggleBtn.innerText = "Turn Off";
        toggleBtn.classList.add("nb_button_blue_inverted");
    }
    toggleBtn.style.width = "unset";
    toggleBtn.addEventListener('click', function() {
        ark.chosen_heatmap_pending_toggle_state = !ark.chosen_heatmap_pending_toggle_state;
        ark.showHeatmapSettings();
    });

    var searchArea;
    if(ark.chosen_filter_heatmap_dino == null) {
        //No dino chosen.
        searchArea = ark.createDom("div", "configureheatmap_dinoform");
        var searchAreaInput = ark.createDom("input", "dino_search_window_input", searchArea)
        searchAreaInput.type = "text";
        searchAreaInput.addEventListener('input', function() {
            ark.searchDinoPicker(searchAreaInput.value, ark.heatmapDinoEntryClicked);
        });
        var searchAreaOutput = ark.createDom("div", "dino_search_window_content", searchArea);
        searchAreaOutput.id = "configure_dino_selector_results";
    } else {
        searchArea = ark.createDinoClassEntry(ark.chosen_filter_heatmap_dino);
        searchArea.classList.add("configureheatmap_selected_dino_entry");
        searchArea.addEventListener('click', function() {
            //Reset dino data and show list
            ark.chosen_filter_heatmap_dino = null;
            ark.showHeatmapSettings();
        });
    }

    ark.createForm([
        "Is Shown",
        "Filter Dino Class"
    ], [
        toggleBtn,
        searchArea
    ], d);

    ark.createDom("div", "window_close_btn", d).addEventListener('click', function() {
        //Hide menu
        ark.hideCustomArea();

        //Apply settings.
        var classname = "";
        if(ark.chosen_filter_heatmap_dino != null) {
            classname = ark.chosen_filter_heatmap_dino.classname;
        }
        map.resetPopulationMap(ark.chosen_heatmap_pending_toggle_state, classname);
    });

    ark.showNewCustomMenu(d, "new_custom_box_tall");    

    if(ark.chosen_filter_heatmap_dino == null) {
        ark.searchDinoPicker("", ark.heatmapDinoEntryClicked);
    }
}

ark.heatmapDinoEntryClicked = function(dinoData) {
    //Set dino and reshow
    ark.chosen_filter_heatmap_dino = dinoData;
    ark.showHeatmapSettings();
}

ark.logoutBtnPressed = function() {
    var d = ark.createDom("div", "");
    ark.createDom("div","nb_title nb_big_padding_bottom", d).innerText = "Logout?";
    ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "Are you sure you'd like to log out of Ark Web Map? You may sign in later at any time using Steam."

    var b = ark.createDom("div", "nb_button_blue nb_button_back", d);
    b.innerText = "Cancel";
    b.addEventListener('click', function() {
        ark.hideCustomArea();
    });

    var bf = ark.createDom("div", "nb_button_blue nb_button_forward", d);
    bf.innerText = "Logout";
    bf.addEventListener('click', function() {
        ark.serverRequest("https://ark.romanport.com/api/users/@me/servers/logout", {}, function() {
            window.location.reload();
        });
    });

    ark.showNewCustomMenu(d, "");
};

ark.onClickOfflineServer = function(name, isOwner, id) {
    var d = ark.createDom("div", "");
    ark.createDom("div","nb_title nb_big_padding_bottom", d).innerText = "Server Offline";
    if(isOwner) {
        ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "Your server, '"+name+"', is offline. Start the ArkWebMap service, or delete the server if you no longer use ArkWebMap. Deleting a server will remove the ability to access ArkWebMap from all users."
    } else {
        ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "'"+name+"' is offline. Ask your server owner to start the ArkWebMap service to use it, or hide the server to remove it."
    }

    var bf = ark.createDom("div", "nb_button_blue nb_button_forward nb_button_red_color", d);
    if(isOwner) {
        bf.innerText = "Delete Server";
        bf.addEventListener('click', function() {
            ark.promptDeleteServer(id);
        });
    } else {
        bf.innerText = "Hide Server";
        bf.addEventListener('click', function() {
            ark.hideCustomArea();
        });
    }

    ark.createDom("div", "window_close_btn", d).addEventListener('click', function() {
        ark.hideCustomArea();
    });

    ark.showNewCustomMenu(d, "");
}

ark.promptDeleteServer = function(serverId) {
    var d = ark.createDom("div", "");
    ark.createDom("div","nb_title nb_big_padding_bottom", d).innerText = "Delete Server";
    ark.createDom("div","np_sub_title nb_big_padding_bottom", d).innerText = "You are about to delete this server. This action cannot be undone, however it can be restored by recompleting the ArkWebMap setup. This will not impact your Ark server, but will remove access to the ArkWebMap from all users."

    var bf = ark.createDom("div", "nb_button_blue nb_button_forward nb_button_red_color", d);
    bf.innerText = "Confirm Deletion";
    bf.addEventListener('click', function() {
        ark.serverRequest("https://ark.romanport.com/api/servers/"+serverId+"/delete", {"type":"post"}, function(d) {
            //Reload
            window.location.reload();
        });
        
    });

    ark.createDom("div", "window_close_btn", d).addEventListener('click', function() {
        ark.hideCustomArea();
    });

    ark.showNewCustomMenu(d, "");   
}

ark.onConnectedServerStop = function() {
    //Deinit
    ark.deinitCurrentServer();

    //Refresh user server list
    ark.refreshServers(function(){});

    //Show message
    ark.showWarning("Lost connection to this ARK server, try again later");
}

ark.showWarning = function(text) {
    //Set content
    document.getElementById('warning_top_content').innerText = text;

    //Show
    collap.setState("warning_banner", true);
}

ark.convertTimeSpan = function(ms) {
    var output = {};
    var totalMs = ms;

    output.days = Math.floor(ms / (1000 * 60 * 60 * 24));
    ms -=  output.days * (1000 * 60 * 60 * 24);

    output.hours = Math.floor(ms / (1000 * 60 * 60));
    ms -= output.hours * (1000 * 60 * 60);

    output.mins = Math.floor(ms / (1000 * 60));
    ms -= output.mins * (1000 * 60);

    output.seconds = Math.floor(ms / (1000));
    ms -= output.seconds * (1000);

    output.totalMilliseconds = totalMs;
    output.totalSeconds = output.seconds + (output.mins * 60) + (output.hours * 60 * 60) + (output.days * 60 * 60 * 24);
    output.totalMinutes = (output.mins) + (output.hours * 60) + (output.days * 60 * 24);
    output.totalHours = (output.hours) + (output.days * 24);
    output.totalDays = output.days;

    return output;
}

ark.pluralToString = function(num, name) {
	if(num == 1) {
		return num+" "+name;
    } else {
		return num+" "+name+"s";
    }
}

ark.createLastUpdatedString = function(span) {
    //Check if it's been less than 1 minute
	if(span.totalMinutes == 0) {
		return "Last updated less than a minute ago";
    }
	
	//If it's under an hour, say the number of minutes ago it was updated only
	if(span.totalHours == 0) {
		return "Last updated "+ark.pluralToString(span.mins, "minute")+" ago";
    }

	//If it's under a day, say the number of hours and minutes
	if(span.totalDays == 0) {
		return "Last updated "+ark.pluralToString(span.hours, "hour")+", "+ark.pluralToString(span.mins, "minute")+" ago";
    }

	//Now, fallback to hours and days
	return "Last updated "+ark.pluralToString(span.days, "day")+", "+ark.pluralToString(span.hours, "hour")+" ago";
}

ark.updateLastEditedUi = function() {
    //Get the timespan
    var span = ark.convertTimeSpan(ark.getGameTimeOffset() * 1000);

    //Create string
    var stringName = ark.createLastUpdatedString(span);

    //Set in UI
    //document.getElementById('map_sub_title').innerText = stringName;
    //No longer used. Replace later?
}

ark.openDemoServer = function() {
    var demoServerId = "EzUn7Rab7e4BSM9JFrOsPpn0";
    ark.forceJoinServer("https://ark.romanport.com/api/servers/"+demoServerId+"/create_session", demoServerId, "ArkWebMap Demo","Z6O9vFPiDNGSfSfURZyV2ZcS");
}

ark.inflateMainMenu = function(data) {
    //Data is split into sections. Loop through
    var a = document.getElementById('sidebar_btns');
    a.innerHTML = "";
    for(var sectionId = 0; sectionId < data.length; sectionId+=1) {
        var section = data[sectionId];
        for(var i = 0; i<section.length; i+=1) {
            var item = section[i];
            var e = ark.createDom('div', 'sidebar_button '+item.customClass, a);
            e.innerText = item.name;
            var img = ark.createDom('img', '', e);
            img.src = item.img;
            e.addEventListener('click', item.callback);
        }
        if(sectionId != data.length - 1) {
            ark.createDom("div", "sidebar_button_spacer", a);
        }
    }
}

ark.inflateTemplateMainMenu = function(count) {
    //Data is split into sections. Loop through
    var a = document.getElementById('sidebar_btns');
    a.innerHTML = "";
    for(var i = 0; i<count; i+=1) {
        var e = ark.createDom('div', 'sidebar_button', a);
        e.appendChild(ark.generateTextTemplate(22, "#404144", 200));
        var img = ark.createDom('div', 'sidebar_button_templateimg', e);
    }
}

ark.createAndInflateMainMenu = function(session, isOwner) {
    //Base menu
    var b = [
        [
            {
                "img":"/assets/icons/baseline-search-24px.svg",
                "name":"Search Inventories",
                "customClass":"",
                "callback":function() {
                    ark.showSearchWindow('tribeInventory');
                }
            }
        ],
        [

        ]
    ]

    //If permitted, add the heatmap options
    if(session.permissions.includes("allowHeatmap")) {
        b[0].push({
            "img":"/assets/icons/baseline-map-24px.svg",
            "name":"Heatmap Options",
            "customClass":"",
            "callback":function() {
                ark.showHeatmapSettings();
            }
        })
    }

    //Add server leave buttons
    if(session.isDemoServer) {
        b[1].push({
            "img":"/assets/icons/baseline-add_circle-24px.svg",
            "name":"Add Your Own Server",
            "customClass":"sidebar_button_accent",
            "callback":function() {
                create_server_d.onCreate();
            }
        });
    } else {
        if(isOwner) {
            b[1].push({
                "img":"/assets/icons/baseline-exit_to_app-24px.svg",
                "name":"Delete Server",
                "customClass":"sidebar_button_danger",
                "callback":function() {
                    ark.promptDeleteServer(ark.currentServerId);
                }
            });
        } else {
            b[1].push({
                "img":"/assets/icons/baseline-exit_to_app-24px.svg",
                "name":"Hide Server",
                "customClass":"sidebar_button_danger",
                "callback":function() {
                    ark.onHideServerButtonClick();
                }
            });
        }
    }

    //Inflate
    ark.inflateMainMenu(b);
}

ark.isInServerEditState = false;
ark.serverEditState = {};
ark.toggleServerNameEdit = function(isActive, force) {
    //No longer used...
}

ark.onImagePickerClick = function() {
    //Open file picker for image
    document.getElementById('image_picker').click();
}

ark.onImagePickerChooseImage = function() {
    console.log("Chose server image. Uploading...");

    //Create form data
    var formData = new FormData();
    formData.append("f", document.getElementById('image_picker').files[0]);

    //Send
    ark.serverRequest("https://user-content.romanport.com/upload?application_id=Pc2Pk44XevX6C42m6Xu3Ag6J", {
        "type":"post",
        "body":formData,
        "nocreds":true,
        "failOverride":function() {
            //Image failed to upload.
            bottom_modal.reportError("Sorry, image upload failed.");
        }
    }, function(f) {
        //Update the image here
        var e = document.getElementById('image_picker_image');
        e.style.backgroundImage = "url('"+f.url+"')";
        ark.serverEditState["iconToken"] = f.token;
    });
}

ark.checkServerNameEntry = function(context) {
    if(context.value.length > 24 || context.value.length < 2) {
        context.classList.add("map_title_overflow");
    } else {
        context.classList.remove("map_title_overflow");
    }
}

ark.generateTextTemplate = function(fontHeight, color, maxWidth) {
    //Generate a random length
    var length = maxWidth * ((Math.random() * 0.5) + 0.25);
    var height = (fontHeight - 2);

    //Create element
    var e = ark.createDom("div", "glowing");
    e.style.width = length.toString()+"px";
    e.style.height = height.toString()+"px";
    e.style.marginTop = "1px";
    e.style.marginBottom = "1px";
    e.style.borderRadius = height.toString()+"px";
    e.style.backgroundColor = color;
    e.style.display = "inline-block";

    return e;
}

ark.createTemplateView = function() {
    //Create a view that is shown while we load data
    dinosidebar.createTemplate(20);

    //Set the title of the session to a loader view
    var title = document.getElementById('map_title');
    title.innerHTML = "";
    title.appendChild(ark.generateTextTemplate(23, "#8d8d8d", 270));

    //Now, set the template of the sub title
    var sub = document.getElementById('map_sub_title');
    sub.innerHTML = "";
    sub.appendChild(ark.generateTextTemplate(17, "#565758", 130));
}

ark.destroyAllWithMsg = function(msg) {
    //Destorys the view. No going back from this.
    //Kill events timer
    if(ark.session.eventLoop != null) {
        clearInterval(ark.session.eventLoop);
    }

    //Show msg
    if(bottom_modal.bottomModalActive) {
        bottom_modal.forceHideBottomModalNoArgs();
    }
    bottom_modal.showBottomModal(msg, function(){}, "bottom_modal_error", 0);

    //Kill views
    document.getElementById('main_view').remove();
    document.getElementById('warning_top').remove();
    document.getElementById('fs_popup').remove();
    document.getElementById('new_custom_area').remove();
}

ark.checkWordFilter = function(term) {
    //Checks the term against the word filter. Returns true if the word is okay, false if it is blocked.
    //If the word filter is off, always return true.
    if(!ark_users.me.user_settings.vulgar_filter_on) {return true;}

    //Check against the default list of profanities
    for(var i = 0; i<blocked_words.length; i+=1) {
        if(term.toLowerCase().includes(blocked_words[i])) {
            return false;
        }
    }

    //Check against the custom list of profanities
    for(var i = 0; i<ark_users.me.user_settings.custom_vulgar_words.length; i+=1) {
        if(term.toLowerCase().includes(ark_users.me.user_settings.custom_vulgar_words[i])) {
            return false;
        }
    }

    //All checks passed.
    return true;
}

ark.setSwitchActive = function(active, element) {
    if(active) {
        element.classList.add("master_switch_active");
    } else {
        element.classList.remove("master_switch_active");
    }
}

var create_server_d = {
    onCreate: function() {
        window.location = "/create";
    }
};