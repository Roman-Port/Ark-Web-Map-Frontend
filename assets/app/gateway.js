var gateway = {};
gateway.config = null;
gateway.sock = null;
gateway.sessionId = null;

gateway.ENDPOINT_VERSION = 1;
gateway.CLIENT_VERSION_MAJOR = 1;
gateway.CLIENT_VERSION_MINOR = 0;
gateway.LIB_VERSION_MAJOR = 1;
gateway.LIB_VERSION_MINOR = 0;

gateway.isConnected = false;
gateway.isFirstConnection = true;
gateway.onConnect = null;
gateway.onDisconnect = null;
gateway.onChangeSingle = null; //Only run once

gateway.create = function(callback, onDisconnect, onReconnect) {
    //Set vars
    gateway.onChangeSingle = callback;
    gateway.onDisconnect = onDisconnect;
    gateway.onConnect = onReconnect;

    //Now, connect
    gateway.connectDefault();
}

gateway.connectDefault = function() {
    gateway.connect(function() {
        //Connected
        gateway.isConnected = true;
        gateway.onConnect();
        if(gateway.onChangeSingle != null) {
            gateway.onChangeSingle(true);
            gateway.onChangeSingle = null;
        }

        //If this is not the first connection, refresh user data in case it is out of date
        if(!gateway.isFirstConnection) {
            main.serverRequest(ROOT_URL+"users/@me/", {}, function(d) {
                main.log("Gateway-Connection", 2, "Reconnected to gateway. User data refreshed.");
                main.me = d;
        
                //Set placeholders
                frontend.setUserData(d);

                //Update the server status
                var s = ark.getServerData();
                if(s != null) {
                    if(s.is_online != main.currentServerOnline) {
                        main.log("Gateway-Connection", 2, "Reconnected to gateway. User data refreshed, and server online status changed. Updating...");
                        ark.onServerStateChanged(main.currentServerId, s.is_online);
                    }
                }
            });
        }
        gateway.isFirstConnection = false;
    }, function() {
        //Disconnected
        gateway.isConnected = false;
        gateway.onDisconnect();
        if(gateway.onChangeSingle != null) {
            gateway.onChangeSingle(false);
            gateway.onChangeSingle = null;
        }

        //Try and reconnect
        window.setTimeout(gateway.connectDefault, gateway.config.reconnect_delay_seconds * 1000);
    });
}

gateway.connect = function(callback, errorCallback) {
    //Get the token
    var token = gateway.getToken();

    //Grab the config
    gateway.getConfig(function(e) {
        //Create a URL to use.
        var url = e.gateway_proto+"://"+e.gateway_host+"/v"+gateway.ENDPOINT_VERSION+"/"+e.gateway_endpoints.frontend+"?clientName=js&clientNameExtra="+encodeURIComponent(navigator.userAgent)+"&clientVersionMajor="+gateway.CLIENT_VERSION_MAJOR+"&clientVersionMinor="+gateway.CLIENT_VERSION_MINOR+"&clientLibVersionMajor="+gateway.LIB_VERSION_MAJOR+"&clientLibVersionMinor="+gateway.LIB_VERSION_MINOR+"&auth_token="+token;

        //Create connection
        gateway.sock = new WebSocket(url);

        //Add events
        gateway.sock.addEventListener('open', function (event) {
            console.log("Connected to GATEWAY at "+url);

            callback();
        });
        gateway.sock.addEventListener('message', gateway.onMsg);
        gateway.sock.addEventListener('close', errorCallback);
    });
}

gateway.log = function(topic, msg) {
    console.log("[GATEWAY / "+topic+"] "+msg);
}

gateway.getConfig = function(callback) {
    //If we already have the config, return it
    if(gateway.config != null) {
        callback(gateway.config);
        return;
    }

    //Grab the config
    main.serverRequest("https://config.deltamap.net/prod/gateway_config.json", {nocreds:true}, function(e) {
        gateway.config = e;
        callback(e);
    });
}

gateway.getToken = function() {
    return localStorage.getItem("access_token");
}

gateway.onMsg = function(evt) {
    var d = JSON.parse(evt.data);
    //If this is not the correct server ID, drop
    if(d.headers["server_id"] != null) {
        if(d.headers["server_id"] != main.currentServerId) {
            gateway.log("DROPPED", "Dropping message for Ark server "+d.headers["server_id"]+" because it is not for the current server!");
        }
    }

    //Handle
    //https://docs.google.com/spreadsheets/d/1XvR03ie2ao5SkeaVDJlV5KY9Dv46XRBBQb1VhiAU-b8/edit#gid=0
    switch(d.opcode) {
        case 4: gateway.onSwitchSessionID(d.sessionId); break;
        case 9: ark.onServerStateChanged(d.serverId, d.isUp); break;
        case 16: ark.prettyRefreshDefer(); break;
    }
}

gateway.sendMsg = function(opcode, m) {
    m.opcode = opcode;
    m.headers = {
        "server_id":main.currentServerId
    };

    var s = JSON.stringify(m);
    gateway.sock.send(s);
}

gateway.onSwitchSessionID = function(id) {
    gateway.log("SESSIONID", "Changing session ID to "+id+"...");
    gateway.sessionId = id;
}

