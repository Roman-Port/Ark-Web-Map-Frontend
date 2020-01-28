"use strict";

class DeltaRPC {

    constructor() {
        this.subscriptions = [];
        this.fails = 0;
        this.connectTimeout = null;
        this.dispatcher = new DeltaEventDispatcher();
        this.OpenConnection();
    }

    FireSubscription(msg) {
        this.dispatcher.FireSubscription({
            "server": msg.target_server,
            "opcode": msg.opcode
        }, msg.payload);
    }

    SubscribeServer(serverId, tagId, opcode, callback) {
        /* This will subscribe a server to events. TagID is used for unsubscribing, and should be unique to the part of the program (but not the server). */
        this.dispatcher.PushSubscription(serverId, tagId, opcode, callback);
    }

    SubscribeGlobal(tagId, opcode, callback) {
        /* This will subscribe globally to an opcode. This will only trigger if server == null. TagID is used for unsubscribing, and should be unique to the part of the program. */
        this.dispatcher.PushSubscription(null, tagId, opcode, callback);
    }

    UnsubscribeServer(serverId, tagId) {
        this.dispatcher.UnsubscribeServer(serverId, tagId);
    }

    UnsubscribeTag(tagId) {
        this.dispatcher.UnsubscribeTag(tagId);
    }

    OpenConnection() {
        //Get access token
        var token = localStorage.getItem("access_token");

        //Create a URL to use.
        var url = "wss://rpc-prod.deltamap.net/rpc/v1" + "?access_token=" + encodeURIComponent(token);

        //Create connection
        this.sock = new WebSocket(url);
        this.Log("OPEN", "Attempting to connect to RPC...");

        //Add events
        this.sock.addEventListener('open', () => this.OnRPCOpen());
        this.sock.addEventListener('message', (m) => this.OnRPCMsg(m));
        this.sock.addEventListener('close', () => this.OnRPCClose());

        //Add timeout
        this.connectTimeout = window.setTimeout( () => this.OnRPCTimeout(), 3000);
    }

    OnRPCTimeout() {
        this.Log("TIMEOUT", "RPC connection timed out.");
        this.connectTimeout = null;
        this.sock.close();
    }

    OnRPCOpen() {
        this.Log("CONNECT", "RPC connected.");
        this.fails = 0;
        if (this.connectTimeout != null) {
            clearTimeout(this.connectTimeout);
        }
    }

    OnRPCMsg(evt) {
        //Decode RPC message
        var d = JSON.parse(evt.data);

        //Log
        this.Log("MSG", "Got RPC message with opcode " + d.opcode + ".");

        //Fire event
        this.FireSubscription(d);
    }

    OnRPCClose() {
        this.fails += 1;
        this.Log("CLOSE", "RPC closed. Fail #" + this.fails);

        //Calculate the amount of time to wait to reconnect. If this is one of the first fails, we'll wait a short amount of time. If we haven't been able to connect for a while, wait longer
        var time = 2000;
        if (this.fails > 2) {
            time = 4000;
        }
        if (this.fails > 3) {
            time = 10000;
        }
        if (this.fails > 5) {
            time = 20000;
        }

        //Set reconnect timer
        this.Log("CLOSE", "Attempting to reconnect in " + time + "ms.");
        window.setTimeout(() => this.OpenConnection(), time);
    }

    Log(topic, msg) {
        console.log("[RPC] " + topic + " -> " + msg);
    }

}