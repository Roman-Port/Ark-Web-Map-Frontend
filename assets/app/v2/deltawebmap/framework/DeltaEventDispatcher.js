"use strict";

class DeltaEventDispatcher {

    constructor() {
        this.subscriptions = [];
    }

    FireSubscription(params, data) {
        //Find all subscriptions to this event
        var subs = this.FindSubscriptions(params);

        //Fire all
        for (var i = 0; i < subs.length; i += 1) {
            subs[i].action(data);
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

    PushSubscription(serverId, sourceTag, opcode, callback) {
        this.subscriptions.push({
            "server": serverId,
            "tag": sourceTag,
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

}