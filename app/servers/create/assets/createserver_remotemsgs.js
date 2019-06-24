var comms = {};

comms.rxUrl = null;
comms.txUrl = null;
comms.rxLoop = null;

comms.open = function(url) {
    console.log("[COMMS] Opening sub-server proxy connection on "+url);
    comms.rxUrl = url;
    comms.txUrl = url;

    //Start loop
    comms.rxLoop = window.setInterval(comms.rx, 1000);
}

comms.close = function() {
    console.log("[COMMS] Shutting down sub-server proxy connection");
    clearInterval(comms.rxLoop);
}

comms.tx = function(typeId, data) {
    //Create msg
    var payload = {
        "type":typeId,
        "data":data
    };

    //Log
    console.log("[COMMS] <===[ME] "+JSON.stringify(payload));

    //Submit
    ark_users.serverRequest(comms.txUrl, {
        "method":"post",
        "body":JSON.stringify(payload)
    }, function(f) {
        //Should never be bad
    });
}

comms.rx = function() {
    ark_users.serverRequest(comms.rxUrl, {
        "method":"get"
    }, function(r) {
        //Handle all incoming msgs
        for(var i = 0; i<r.length; i+=1) {
            comms.handleIncoming(r[i]);
        }
    });
}

/* Actions */
comms.actionsTable = {};
/*
WebClientHello = 0,
ServerHello = 1,

WebClientRequestServerTestPort = 2, //The client would like to request the server to begin running a test TCP server on a port.
ServerPortTestReadyToClient = 3, //Server has port test ready and the client should run it.

CheckArkFile = 4, //Client prompts the server to check for an Ark file
CheckArkFileResponse = 5, //Server responds wether or not the file existed.

UploadConfigAndFinish = 6, //Client uploads a configuration file to the server to use.
ServerGoodbye = 7, //Essentially a goodbye from the server before it shuts down and stops responding to requests.*/

comms.actionsTable["1"] = function() {
    console.log("[COMMS] Sub-server acknowledged our existence!");
}
comms.actionsTable["3"] = cs.nct.onGetOpenReply;
comms.actionsTable["5"] = cs.save.onTypeReply;
comms.actionsTable["7"] = cs.onFinishSubmittingFinal;


/* End actions */

comms.handleIncoming = function(msg) {
    //Log
    console.log("[COMMS] ===>[ME] "+JSON.stringify(msg));

    //Execute
    var type = msg.type.toString();
    if(comms.actionsTable[type] != null) {
        try {
            comms.actionsTable[type](msg.data, msg.type, msg.from_ip);
        } catch (e) {
            console.warn("[COMMS] Rx msg execution threw an error!");
        }
    }
}