var ark = {};

ark.cachedOfflineData = null;
ark.session = null;

ark.MIN_DATA_VERSION = 2;

ark.loading_status = 0; //Target: 5

ark.init = function(d) {
    //Check if this server is already active
    if(main.currentServerId == d.id) {
        return;
    }

    //Change token
    main.sessionToken += 1;

    //Deinit the current server if one is active
    if(main.currentServerId != null) {
        ark.deinit();
    }

    //Set data
    frontend.setServerData(d);
    frontend.setServerListSelectedServer(d.id);
    main.currentServerId = d.id;
    if(!main.isDemo) {
        localStorage.setItem("latest_server", d.id);
    }

    //Set the window title and URL
    document.title = "Delta Web Map / "+d.display_name;
    history.replaceState({}, "Delta Web Map / "+d.display_name, "/app/"+d.id+"/");

    //Download session data
    ark.downloadData(d.endpoint_createsession, "session", {}, function(s) {
        ark.session = s;
        ark.loading_status += 1;

        //Init map
        map.init();
        map.addGameMapLayer(s.maps[0]);

        //Download sidebar data
        dinosidebar.init();

        //Download tribes
        ark.downloadData(s.endpoint_tribes_icons, "tribe", {}, function(m) {
            map.onEnableTribeDinos(m);
            ark.loading_status += 1;
        }, ark.fatalError);

        //Run init on all
        for (var i = 0; i < statics.SERVER_NAV_OPTIONS.length; i += 1) {
            statics.SERVER_NAV_OPTIONS[i].init();
        }
    }, ark.fatalError);
}

ark.initAndVerify = function(d, isFirstStart, msgDismissCallback) {
    var status = ark.verify(d, true, isFirstStart, msgDismissCallback);
    if(status) {
        ark.init(d);
    }
    return status;
}

ark.verify = function(d, doShowMsg, isFirstStart, msgDismissCallback) {
    //No longer needed
    return true;
}

ark.deinit = function() {
    //Get thumbnail
    /*map.getThumbnail(function(e) {
        e.classList.add("debug_top_256");
        document.body.appendChild(e);
    }, 89214.33, -3728.693, 6000, 512, 512, 40, true);*/

    //Submit map settings
    main.forceSubmitUserServerPrefs();
    
    //Kill dino picker
    dinosidebar.deinit();

    //Clear log
    tribelogs.clear();

    //Kill map
    map.deinit();

    //Run init on all
    for (var i = 0; i < statics.SERVER_NAV_OPTIONS.length; i += 1) {
        statics.SERVER_NAV_OPTIONS[i].deinit();
    }

    //Remove offline message
    main.currentServerOnline = true;

    //Reset vars
    main.currentServerId = null;
    ark.cachedOfflineData = null;
    ark.session = null;
}

ark.showServerPicker = function() {
    //Shows a server picker a user must accept.
    if(main.me.servers.length == 0) {
        form.add("No ARK Servers", [
            {
                "type":"text",
                "text":"You aren't part of any ARK servers. Join an ARK server with Delta Web Map, or add your own server."
            }
        ], [
            {
                "type":0,
                "name":"Add Server",
                "callback":function() {
                    window.location = "/app/servers/create/";
                }
            },
            {
                "type":1,
                "name":"Log Out",
                "do_hide":false,
                "callback":function() {
                    main.logout();
                }
        }], "xform_area_interrupt");
    } else {
        form.add("Choose Server", [
            {
                "type":"text",
                "text":"Please select a server."
            },
            {
                "type":"server_list",
                "include_add":true
            }
        ], [], "xform_area_interrupt");
    }
}

ark.fatalError = function(reason) {
    //Called if there was a fatal error while initializing
    form.add("This Server Can't Be Used", [
        {
            "type":"text",
            "text":reason
        }
    ], [
        {
            "type":0,
            "name":"Okay",
            "callback":function() {
                ark.showServerPicker();
            }
    }], "xform_area_interrupt");
}

ark.getServerData = function() {
    return ark.getServerDataById(main.currentServerId);
}

ark.getServerDataById = function(id) {
    //Finds the current ID in this list to get the updated data
    for(var i = 0; i<main.me.servers.length; i+=1) {
        if(main.me.servers[i].id == id) {
            return main.me.servers[i];
        }
    }
    return null;
}

ark.switch = function(d) {
    //Deinit last server and reinit current
    ark.deinit();
    ark.init(d);
}

ark.downloadData = function(url, offlineDataKey, args, callback, failCallback) {
    //Function used back when offline data was used
    
    //Download
    var fail = function(d) {
        //Failed. Check the status.
        if(d.status == 401) {
            //Not authenticated
            window.location = "/login";
        } else if (d.status == 502) {
            //Subserver offline. Fetch offline data
            ark.getOfflineData(function(offline) {
                //Get this from the key
                if(offline[offlineDataKey] == null) {
                    failCallback();
                } else {
                    callback(offline[offlineDataKey]);
                }
            }, failCallback);
        } else {
            //Other error.
            failCallback("There was a server error downloading resources. Try again later.");
        }
    };
    args.failOverride = fail;
    args.enforceServer = true;
    main.serverRequest(url, args, callback);
}