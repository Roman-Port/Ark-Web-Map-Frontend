"use strict";

class DeltaSyncCollection {

    constructor(db, name) {
        this.db = db;
        this.name = name;
        this.fullname = this.db.name + "_" + this.name;
        this.listeners = {};
        this.listenerArgs = {}; //Args for the above listener, same index
        this.listenersIndex = 0;
    }

    AddObjectIndexedDbStores(stores) {
        throw "This must be overriden.";
    }

    async GetAllItems() {
        throw "This must be overriden.";
    }

    async Init() {
        throw "This must be overriden.";
    }

    GetEpochKeyName() {
        return this.fullname + "~LAST_EPOCH";
    }

    async Sync() {
        throw "This must be overriden.";
    }

    async RequestWebData(epoch) {
        var r = await DeltaTools.WebRequest(this.GetSyncUrlBase() + "?last_epoch=" + epoch, {});
        return r;
    }

    async _BatchUpdate(adds, removes, propagateOnly) {
        /* Called whenever we add or update elements. Spins off everything else 
        /* propagateOnly will cause us to only send events, not push to the database */

        //Send events
        var listenerKeys = Object.keys(this.listeners);
        for (var i = 0; i < listenerKeys.length; i += 1) {
            this.listeners[listenerKeys[i]](adds, removes, this.listenerArgs[listenerKeys[i]]);
        }

        //Send filtered events
        

        //Users should add here what they want to do with incoming data
    }

    OnPostUpdate() {
        //You are free to override this in children
    }

    GetSyncUrlBase() {
        throw "This must be overriden.";
    }

    async GetById(id) {
        throw "This must be overriden.";
    }

    _ReplaceByPrimaryKey(target, data) {
        //Loops through an array, target, and replaces anything with a matching primary key with data
        throw "This must be overriden.";
    }

    AddListener(callback, ctx) {
        /* Adds a listener to add/remove events. Callback args: (add, remove, args) */

        //Add listener
        var key = this.listenersIndex;
        this.listeners[key] = callback;
        this.listenerArgs[key] = ctx;
        this.listenersIndex++;

        //Add all existing items
        this.GetAllItems().then((items) => {
            callback(items, [], this.listenerArgs[key]);
        });

        //Return token
        return key;
    }

    AddManagedFilterListener(callback, initialFilter) {
        var d = function (adds, removes, ctx) {
            //Find items that match the filter
            var realAdds = [];
            for (var i = 0; i < adds.length; i += 1) {
                if (ctx._filter(adds[i])) {
                    realAdds.push(adds[i]);
                }
            }

            //Submit
            ctx._callback(realAdds, removes);
        };
        var dtx = {};
        dtx._callback = callback;
        dtx._filter = initialFilter;
        return this.AddListener(d, dtx);
    }

    async RefreshManagedFilterListener(key) {
        /* Triggers a refresh of the current filter in an item */
        var callback = this.listeners[key];
        var ctx = this.listenerArgs[key];

        //Rescan
        var items = await this.GetAllItems();
        var adds = [];
        var removes = [];
        for (var i = 0; i < items.length; i += 1) {
            if (ctx._filter(items[i])) {
                adds.push(items[i]);
            } else {
                removes.push(items[i]);
            }
        }

        //Apply
        ctx._callback(adds, removes);
    }

    RemoveListener(token) {
        delete this.listeners[token];
        delete this.listenerArgs[token];
    }
}