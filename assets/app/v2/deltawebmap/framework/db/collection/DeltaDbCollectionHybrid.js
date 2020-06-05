"use strict";

class DeltaDbCollectionHybrid extends DeltaDbCollectionMemory {

    constructor(db, name) {
        super(db, name);
    }

    async Init() {
        await super.Init();

        //Load all content from the IndexedDB database into memory
    }

    AddObjectIndexedDbStores(stores) {
        stores[this.name] = this.GetDbStore();
    }

    GetDbStore() {
        throw "This must be overriden.";
    }

    GetDbCollection() {
        return this.db.db[this.name];
    }

    async _BatchUpdate(adds, removes, propagateOnly) {
        /* Called whenever we add or update elements. Spins off everything else 
        /* propagateOnly will cause us to only send events, not push to the database */

        super._BatchUpdate(adds, removes, propagateOnly);

        //Push to DB
        if (!propagateOnly) {
            await this.GetDbCollection().bulkPut(adds);
        }
    }

    async Sync() {
        //Get epoch
        var epoch = localStorage.getItem(this.GetEpochKeyName());
        if (epoch == null) {
            epoch = "0";
        }

        //Get
        var r = await this.RequestWebData(epoch);
        console.log(r);

        //Add adds
        await this._BatchUpdate(r.adds, [], false);
    }
}