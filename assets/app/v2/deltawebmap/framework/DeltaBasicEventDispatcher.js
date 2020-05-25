"use strict";

class DeltaBasicEventDispatcher {

    constructor() {
        this._subscriptions = {};
    }

    Subscribe(tag, callback) {
        if (tag == null) {
            throw "No subscription tag specified!";
        }
        this._subscriptions[tag] = callback;
    }

    Unsubscribe(tag) {
        delete this._subscriptions[tag];
    }

    Fire(params) {
        var k = Object.keys(this._subscriptions);
        for (var i = 0; i < k.length; i += 1) {
            this._subscriptions[k[i]](params);
        }
    }

}