"use strict";

class DeltaRPC {

    constructor(app) {
        this.app = app;
        this.subscriptions = [];
        this.fails = 0;
        this.connectTimeout = null;
        this.dispatcher = new DeltaEventDispatcher();
        this.OnConnectedEvent = new DeltaBasicEventDispatcher();
        this.OnDisconnectedEvent = new DeltaBasicEventDispatcher();
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
        //Create a URL to use.
        var url = LAUNCH_CONFIG.RPC_HOST + "/rpc/v1";

        //Create connection
        this.sock = new WebSocket(url);
        this.Log("OPEN", "Attempting to connect to RPC...");

        //Add events
        this.sock.addEventListener('open', () => this.OnRPCOpen());
        this.sock.addEventListener('message', (m) => this.OnCommand(m));
        this.sock.addEventListener('close', () => this.OnRPCClose());

        //Add timeout
        this.connectTimeout = window.setTimeout( () => this.OnRPCTimeout(), 6000);
    }

    OnRPCTimeout() {
        this.Log("TIMEOUT", "RPC connection timed out.");
        this.connectTimeout = null;
        this.sock.close();
    }

    OnRPCOpen() {
        //We've connected, but we aren't done yet. We need to authenticate
        //Log
        this.Log("CONNECT", "RPC connected. Now authenticating...");

        //Send authentication
        this.SendRPCData("LOGIN", {
            "ACCESS_TOKEN": localStorage.getItem("access_token")
        });
    }

    OnCommand(evt) {
        //Decode command
        var d = JSON.parse(evt.data);

        //Log
        this.Log("COMMAND", "Got command of type " + d.command + ".");
        if (d.command == "LOGIN_COMPLETED") {
            this.OnCommandLogin(d.payload);
        } else if (d.command == "GROUPS_UPDATED") {

        } else if (d.command == "RPC_MESSAGE") {
            this.OnCommandRPC(d.payload);
        } else {
            this.Log("COMMAND", "Unknown command. Disconnecting...");
            this.sock.close();
        }
    }

    OnCommandLogin(p) {
        if (p.success) {
            //Stop timeout
            this.fails = 0;
            if (this.connectTimeout != null) {
                clearTimeout(this.connectTimeout);
            }

            //Log
            this.Log("LOGIN", "Authenticated with RPC. Using user \"" + p.user.name + "\" (" + p.user.id + ")!");

            //Send event
            this.OnConnectedEvent.Fire({});
        } else {
            //Close
            this.sock.close();
        }
    }

    OnCommandRPC(d) {
        //Log
        this.Log("MSG", "Got RPC message with opcode " + d.opcode + ". Server: " + d.target_server);

        //Fire event
        this.FireSubscription(d);
    }

    OnRPCClose() {
        this.fails += 1;
        this.Log("CLOSE", "RPC closed. Fail #" + this.fails);

        //Stop timeout
        if (this.connectTimeout != null) {
            clearTimeout(this.connectTimeout);
        }

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
        if (this.fails > 8) {
            time = 40000;
        }

        //Set reconnect timer
        this.Log("CLOSE", "Attempting to reconnect in " + time + "ms.");
        window.setTimeout(() => this.OpenConnection(), time);

        //Send event
        this.OnDisconnectedEvent.Fire({});
    }

    Log(topic, msg) {
        //console.log("[RPC] " + topic + " -> " + msg);
    }

    SendRPCData(opcode, data) {
        //Create payload
        var p = {
            "command": opcode,
            "payload": data
        };

        //Send
        this.sock.send(JSON.stringify(p));
    }

}