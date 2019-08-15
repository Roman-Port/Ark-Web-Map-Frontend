var ark = {};

ark.cachedOfflineData = null;
ark.session = null;

ark.MIN_DATA_VERSION = 2;

ark.loading_status = 0; //Target: 5

ark.init = function(d) {
    //Change token
    main.sessionToken += 1;

    //Deinit the current server if one is active
    if(main.currentServerId != null) {
        ark.deinit();
    }

    //Set data
    frontend.setServerData(d);
    main.currentServerId = d.id;
    if(!main.isDemo) {
        localStorage.setItem("latest_server", d.id);
    }

    //Set offline/online status
    if(d.is_online) {
        ark.onServerGoOnline(false);
    } else {
        ark.onServerGoOffline();
    }

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
        ark.downloadData(s.endpoint_tribes, "tribe", {}, function(m) {
            map.onEnableTribeDinos(m);
            ark.loading_status += 1;
        }, ark.fatalError);
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
    //Check data version
    if(d.report_data_version < ark.MIN_DATA_VERSION || d.offline_data_version < ark.MIN_DATA_VERSION) {
        if(doShowMsg) {
            if(isFirstStart) {
                form.add("The Last Server You Used Can No Longer Be Used", [
                    {
                        "type":"text",
                        "text":"The last server you used is too far out of date to be used. Ask your server owner to start the Delta Web Map service. Select a new server."
                    }
                ], [
                    {
                        "type":0,
                        "name":"Okay",
                        "callback":function() {
                            ark.showServerPicker(false);
                            if(msgDismissCallback != null) {msgDismissCallback()}
                        }
                }], "xform_area_interrupt");
            } else {
                form.add("This Server Can't Be Used", [
                    {
                        "type":"text",
                        "text":"This server has not been started in a while and the data is too far out of date. Ask your server owner to start the Delta Web Map service."
                    }
                ], [
                    {
                        "type":0,
                        "name":"Okay",
                        "callback":function() {
                            if(msgDismissCallback != null) {msgDismissCallback()}
                        }
                }], "xform_area_interrupt");
            }
        }
        return false;
    }

    return true;
}

ark.deinit = function() {
    //Kill dino picker
    dinosidebar.deinit();

    //Kill map
    map.deinit();

    //Remove offline message
    main.removeHUDMessage("server-offline");
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

ark.getOfflineData = function(callback, failCallback) {
    //Check if we already have it.
    if(ark.cachedOfflineData != null) {
        callback(ark.cachedOfflineData);
        return;
    }

    //We'll need to download it
    main.log("ark-subserver", 1, "Downloading offline data...");
    main.serverRequest(ark.getServerData().endpoint_offline_data, {"failOverride":function() {
        failCallback("Couldn't download offline data. Try again later, or choose a new server.");
    }, "enforceServer":true}, function(d) {
        //Set it in the cache
        ark.cachedOfflineData = d;
        callback(d);
    });
}

ark.downloadData = function(url, offlineDataKey, args, callback, failCallback) {
    //If we already know the server is offline, use offline data
    if(!main.currentServerOnline) {
        ark.getOfflineData(function(offline) {
            //Get this from the key
            if(offline[offlineDataKey] == null) {
                failCallback();
            } else {
                callback(offline[offlineDataKey]);
            }
        }, failCallback);
        return;
    }

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
            failCallback();
        }
    };
    args.failOverride = fail;
    args.enforceServer = true;
    main.serverRequest(url, args, callback);
}

ark.onServerGoOffline = function() {
    //Add HUD message
    main.addHUDMessage("This server is offline. Data may not be up to date.", "#eb3434", "/assets/icons/baseline-offline_bolt-24px.svg", "server-offline", 2);
    main.currentServerOnline = false;
}

ark.onServerGoOnline = function(doReload) {
    //Remove HUD message
    main.removeHUDMessage("server-offline");
    main.currentServerOnline = true;
    if(doReload) {
        ark.prettyRefreshDefer();
    }
}

ark.onServerStateChanged = function(id, status) {
    if(id != main.currentServerId) { return; }
    if(status) {
        ark.onServerGoOnline(true);
    } else {
        ark.onServerGoOffline();
    }
}

ark.isRefreshDeferred = false;

ark.prettyRefreshDefer = function() {
    //Defers to prevent agressive server load
    if(ark.isRefreshDeferred) {return;}
    var defer = 3000 + (Math.random() * 10000);
    main.log("Pretty-Refresh-Defer", 2, "Deferring session reload by "+defer+"ms...");
    ark.isRefreshDeferred = true;
    window.setTimeout(ark.prettyRefresh, defer);
}

ark.prettyRefresh = function() {
    //Refreshes the page in a pretty manner that doesn't interrupt the user.
    ark.isRefreshDeferred = false;
    ark.cachedOfflineData = null;
    main.log("Pretty-Refresh", 2, "Refreshing all session data...");
    main.sessionToken += 1;
    ark.downloadData(ark.getServerData().endpoint_createsession, "session", {}, function(s) {
        ark.session = s;

        //ReDownload sidebar data
        dinosidebar.redownload();

        //Download tribes
        ark.downloadData(s.endpoint_tribes, "tribe", {}, function(m) {
            //Remove existing
            map.removeMarkerLayer("players");
            map.removeMarkerLayer("dinos");

            //Add
            map.onEnableTribeDinos(m);
        }, ark.fatalError);
    }, ark.fatalError);
}