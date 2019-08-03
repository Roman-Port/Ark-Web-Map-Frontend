var ark = {};

ark.cachedOfflineData = null;
ark.session = null;

ark.init = function(d) {
    //Set data
    frontend.setServerData(d);
    main.currentServerId = d.id;

    //Set offline/online status
    if(d.is_online) {
        ark.onServerGoOnline(false);
    } else {
        ark.onServerGoOffline();
    }

    //Download session data
    ark.downloadData(d.endpoint_createsession, "session", {}, function(s) {
        ark.session = s;

        //Init map
        map.init();
        map.addGameMapLayer(s.maps[0]);

        //Download sidebar data
        dinosidebar.init();

        //Download tribes
        ark.downloadData(s.endpoint_tribes, "tribe", {}, function(m) {
            map.onEnableTribeDinos(m);
        }, ark.fatalError);
    }, ark.fatalError);
}

ark.deinit = function() {
    dinosidebar.deinit();
}

ark.fatalError = function() {
    //Called if there was a fatal error while initializing
    console.error("FATAL ERROR while initializing server.");
}

ark.getServerData = function() {
    //Finds the current ID in this list to get the updated data
    for(var i = 0; i<main.me.servers.length; i+=1) {
        if(main.me.servers[i].id == main.currentServerId) {
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
    main.serverRequest(ark.getServerData().endpoint_offline_data, {"failOverride":failCallback}, function(d) {
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
}

ark.onServerStateChanged = function(id, status) {
    if(id != main.currentServerId) { return; }
    if(status) {
        ark.onServerGoOnline(true);
    } else {
        ark.onServerGoOffline();
    }
}