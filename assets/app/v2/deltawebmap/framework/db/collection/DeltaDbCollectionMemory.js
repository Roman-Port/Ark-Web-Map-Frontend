"use strict";

class DeltaDbCollectionMemory extends DeltaSyncCollection {

    constructor(db, name) {
        super(db, name);

        this.memoryMap = {}; //Maps primary key to items
    }

    AddObjectIndexedDbStores(stores) {
        //Do nothing
    }

    async GetAllItems() {
        var items = [];
        var keys = Object.keys(this.memoryMap);
        for (var i = 0; i < keys.length; i += 1) {
            items.push(this.memoryMap[keys[i]]);
        }
        return items;
    }

    GetByFilter(filter) {
        var items = [];
        var keys = Object.keys(this.memoryMap);
        for (var i = 0; i < keys.length; i += 1) {
            if (filter(this.memoryMap[keys[i]])) {
                items.push(this.memoryMap[keys[i]]);
            }
        }
        return items;
    }

    async Init() {

    }

    async Sync() {
        //Get
        var r = await this.RequestWebData("0");

        //Add adds
        await this._BatchUpdate(r.adds, [], false);
    }

    async _BatchUpdate(adds, removes, propagateOnly) {
        /* Called whenever we add or update elements. Spins off everything else 
        /* propagateOnly will cause us to only send events, not push to the database */

        super._BatchUpdate(adds, removes, propagateOnly);

        //Push to DB
        var pKey = this.GetPrimaryKey();
        if (!propagateOnly) {
            for (var i = 0; i < adds.length; i += 1) {
                this.memoryMap[adds[i][pKey]] = adds[i];
            }
        }

        //Run post update
        this.OnPostUpdate();
    }

    GetDbCollection() {
        return this.db.db[this.name];
    }

    GetSyncUrlBase() {
        throw "This must be overriden.";
    }

    GetPrimaryKey() {
        throw "This must be overriden.";
    }

    async GetById(id) {
        return this.memoryMap[id];
    }

    _ReplaceByPrimaryKey(target, data) {
        //Loops through an array, target, and replaces anything with a matching primary key with data
        var primaryKey = this.GetPrimaryKey();
        for (var i = 0; i < target.length; i += 1) {
            if (target[i][primaryKey] == data[primaryKey]) {
                target.splice(i, 1);
                i--;
            }
        }
        target.push(data);
    }
}