var gateway = {};
gateway.config = null;
gateway.sock = null;
gateway.sessionId = null;

gateway.ENDPOINT_VERSION = 1;
gateway.CLIENT_VERSION_MAJOR = 1;
gateway.CLIENT_VERSION_MINOR = 0;
gateway.LIB_VERSION_MAJOR = 1;
gateway.LIB_VERSION_MINOR = 0;

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
    ark.serverRequest("https://config.deltamap.net/prod/gateway_config.json", {nocreds:true}, function(e) {
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
        if(d.headers["server_id"] != ark.currentServerId) {
            gateway.log("DROPPED", "Dropping message for Ark server "+d.headers["server_id"]+" because it is not for the current server!");
        }
    }

    //Handle
    //https://docs.google.com/spreadsheets/d/1XvR03ie2ao5SkeaVDJlV5KY9Dv46XRBBQb1VhiAU-b8/edit#gid=0
    switch(d.opcode) {
        case 4: gateway.onSwitchSessionID(d.sessionId); break;
        case 3: draw_map.onRx(d); break;
        case 7: draw_map.onGatewayMapEvent(d); break;
        case 8: map.remoteUpdateMultipleRealtime(d.updates); break;
        case 9: ark.onServerStateChanged(d.serverId, d.isUp); break;
    }
}

gateway.sendMsg = function(opcode, m) {
    m.opcode = opcode;
    m.headers = {
        "server_id":ark.currentServerId
    };

    var s = JSON.stringify(m);
    gateway.sock.send(s);
}

gateway.onSwitchSessionID = function(id) {
    gateway.log("SESSIONID", "Changing session ID to "+id+"...");
    gateway.sessionId = id;
}

