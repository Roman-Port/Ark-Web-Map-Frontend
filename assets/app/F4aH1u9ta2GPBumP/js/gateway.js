var gateway = {};
gateway.sock = null;
gateway.sessionToken = "";

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
        window.setTimeout(gateway.connectDefault, dconfig.rpc_reconnect_policy_ms);
    });
}

gateway.connect = function(callback, errorCallback) {
    //Get the token
    var token = gateway.getToken();

    //Create a URL to use.
    var url = dconfig.rpc_host+"?access_token="+encodeURIComponent(token)+"&session_token="+encodeURIComponent(gateway.sessionToken);

    //Create connection
    gateway.sock = new WebSocket(url);

    //Add events
    gateway.sock.addEventListener('open', function (event) {
        console.log("Connected to GATEWAY at "+url);

        callback();
    });
    gateway.sock.addEventListener('message', gateway.onMsg);
    gateway.sock.addEventListener('close', errorCallback);
}

gateway.log = function(topic, msg) {
    console.log("[GATEWAY / "+topic+"] "+msg);
}

gateway.getToken = function() {
    return localStorage.getItem("access_token");
}

gateway.onMsg = function(evt) {
    var d = JSON.parse(evt.data);
    //If this is not the correct server ID, drop
    if(d.target_server != main.currentServerId && d.target_server != null) {
        gateway.log("DROPPED", "Dropping message for Ark server "+d.target_server+" because it is not for the current server!");
        return;
    }

    //Handle
    //https://docs.google.com/spreadsheets/d/1XvR03ie2ao5SkeaVDJlV5KY9Dv46XRBBQb1VhiAU-b8/edit#gid=0
    switch(d.opcode) {
        case 0: gateway.onOpenSession(d.payload); break;
        case 1: gateway._onDinoUpdateEvent(d.payload); break;
        case 3: map.canvas.onGatewayUpdate(d.payload); break;
        case 4: break;
        case 5: map.remoteUpdateDinoPrefs(d.payload); break;
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

gateway.onOpenSession = function(data) {
    gateway.log("Set-Session", "Changing session token to "+data.session_id+"...");
    gateway.sessionToken = data.session_id;
}

/* Gateway calls */
gateway._onDinoUpdateEvent = function(payload) {
    for(var i = 0; i<payload.dinos.length; i+=1) {
        map.remoteUpdateDino(payload.dinos[i]);
    }
}