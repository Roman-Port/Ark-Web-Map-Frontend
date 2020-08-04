"use strict";

class DeltaDbCollectionIndexedDB extends DeltaSyncCollection {

    constructor(db, name) {
        super(db, name);
    }

    AddObjectIndexedDbStores(stores) {
        stores[this.name] = this.GetDbStore();
    }

    GetDbStore() {
        throw "This must be overriden.";
    }

    async GetByFilter(filter) {
        return await this.GetDbCollection().filter((x) => {
            return filter(x);
        }).toArray();
    }

    async GetAllItems() {
        return await this.GetDbCollection().toArray();
    }

    async Init() {

    }

    async Sync() {
        //Get the epoch (if any)
        var epoch = localStorage.getItem(this.GetEpochKeyName());
        if (epoch == null) {
            epoch = "0";
        }

        //Get
        var r = await this.RequestWebData(epoch);

        //Set epoch
        localStorage.setItem(this.GetEpochKeyName(), r.epoch);

        //Add adds
        await this._BatchUpdate(r.content, [], false);
    }

    async _BatchUpdate(adds, removes, propagateOnly) {
        /* Called whenever we add or update elements. Spins off everything else 
        /* propagateOnly will cause us to only send events, not push to the database */

        super._BatchUpdate(adds, removes, propagateOnly);

        //Push to DB
        if (!propagateOnly) {
            await this.GetDbCollection().bulkPut(adds);
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
        return await this.GetDbCollection().get(id);
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