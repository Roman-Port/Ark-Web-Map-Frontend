"use strict";

class DeltaWebsock {

    constructor(url, onOpen, onTextMsg, onBinaryMsg, onClose) {
        this.url = url;
        this.onOpen = onOpen;
        this.onTextMsg = onTextMsg;
        this.onBinaryMsg = onBinaryMsg;
        this.onClose = onClose;

        this.fails = 0;
        this.connectTimeout = null;
        this.queue = [];
        this.connected = false;
        this.OpenConnection();
    }

    SendData(data) {
        if (this.connected) {
            this.sock.send(data);
        } else {
            this.queue.push(data);
        }
    }

    Log(topic, msg) {

    }

    OpenConnection() {
        //Create connection
        this.sock = new WebSocket(this.url);
        this.Log("OPEN", "Attempting to connect to RPC...");

        //Add events
        this.sock.addEventListener('open', () => this.OnRPCOpen());
        this.sock.addEventListener('message', (m) => this.OnRPCMsg(m));
        this.sock.addEventListener('close', () => this.OnRPCClose());

        //Add timeout
        this.connectTimeout = window.setTimeout(() => this.OnRPCTimeout(), 3000);
    }

    OnRPCTimeout() {
        this.Log("TIMEOUT", "RPC connection timed out.");
        this.connected = false;
        this.connectTimeout = null;
        this.sock.close();
    }

    OnRPCOpen() {
        this.Log("CONNECT", "RPC connected.");
        this.connected = true;
        this.fails = 0;
        if (this.connectTimeout != null) {
            clearTimeout(this.connectTimeout);
        }

        for (var i = 0; i < this.queue.length; i += 1) {
            this.sock.send(this.queue[i]);
        }
        this.queue = [];
    }

    OnRPCMsg(evt) {
        //Log
        this.Log("MSG", "Got RPC message.");

        //Check type
        if (typeof (evt.data) == "string") {
            this.onTextMsg(evt.data);
        } else {
            this.onBinaryMsg(evt.data);
        }
    }

    OnRPCClose() {
        this.fails += 1;
        this.connected = false;
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
        if (this.fails > 8) {
            time = 60000;
        }
        if (this.fails > 12) {
            time = 120000;
        }

        //Set reconnect timer
        this.Log("CLOSE", "Attempting to reconnect in " + time + "ms.");
        window.setTimeout(() => this.OpenConnection(), time);
    }

}