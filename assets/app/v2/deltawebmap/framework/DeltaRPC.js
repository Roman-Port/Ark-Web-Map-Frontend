"use strict";

class DeltaRPC {

    constructor() {
        this.subscriptions = [];
        this.fails = 0;
        this.connectTimeout = null;
        this.OpenConnection();
    }

    FireSubscription(msg) {
        //Find all subscriptions to this event
        var subs = this.FindSubscriptions({
            "server": msg.target_server,
            "opcode": msg.opcode
        });

        //Fire all
        for (var i = 0; i < subs.length; i += 1) {
            subs[i].action(msg.payload);
        }
    }

    FindSubscriptions(params) {
        //Key keys of params
        var k = Object.keys(params);

        //Create output holder
        var o = [];

        //Search subscriptions for these params
        for (var i = 0; i < this.subscriptions.length; i += 1) {
            var s = this.subscriptions[i];
            var failed = false;
            for (var j = 0; j < k.length; j += 1) {
                //Check key
                if (s[k[j]] != params[k[j]]) {
                    failed = true;
                    break;
                }
            }
            if (!failed) {
                o.push(s);
            }
        }

        return o;
    }

    RemoveSubscriptions(params) {
        //Find all
        var subs = this.FindSubscriptions(params);

        //Remove all
        for (var i = 0; i < subs.length; i += 1) {
            this.subscriptions.splice(this.subscriptions.indexOf(subs[i]), 1);
        }
    }

    SubscribeServer(serverId, tagId, opcode, callback) {
        /* This will subscribe a server to events. TagID is used for unsubscribing, and should be unique to the part of the program (but not the server). */
        this.subscriptions.push({
            "server": serverId,
            "tag": tagId,
            "opcode": opcode,
            "action": callback
        });
    }

    SubscribeGlobal(tagId, opcode, callback) {
        /* This will subscribe globally to an opcode. This will only trigger if server == null. TagID is used for unsubscribing, and should be unique to the part of the program. */
        this.subscriptions.push({
            "server": null,
            "tag": tagId,
            "opcode": opcode,
            "action": callback
        });
    }

    UnsubscribeServer(serverId, tagId) {
        this.RemoveSubscriptions({
            "server": serverId,
            "tag": tagId
        });
    }

    UnsubscribeTag(tagId) {
        this.RemoveSubscriptions({
            "tag": tagId
        });
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