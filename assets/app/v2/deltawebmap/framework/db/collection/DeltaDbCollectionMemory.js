"use strict";

class DeltaDbCollectionMemory extends DeltaSyncCollection {

    constructor(db, name) {
        super(db, name);

        this.OnFilteredDataAdded = new DeltaBasicEventDispatcher();
        this.OnFilteredDataRemoved = new DeltaBasicEventDispatcher();
        this.OnFilteredDatasetUpdated = new DeltaBasicEventDispatcher();

        this.memoryMap = {}; //Maps primary key to items
        this.filter = null;
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

    GetAllItemsSynchronous() {
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

        //Run events
        this._SendFilteredEvents(adds, removes);

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

    _SendFilteredEvents(adds, removes) {
        //Run adds
        var filteredAdds = [];
        var filteredRemoves = removes;
        var k = this.GetPrimaryKey();
        for (var i = 0; i < adds.length; i += 1) {
            if (this.CheckFilter(adds[i])) {
                filteredAdds.push(adds[i]); //Add
            } else {
                filteredRemoves.push(adds[i][k]); //We'll remove this too
            }
        }

        //Send to clients
        this.OnFilteredDataAdded.Fire(filteredAdds);
        this.OnFilteredDataRemoved.Fire(filteredRemoves);
        this.OnFilteredDatasetUpdated.Fire(this.GetFilteredDataset());
    }

    GetFilteredDataset() {
        var items = [];
        var keys = Object.keys(this.memoryMap);
        for (var i = 0; i < keys.length; i += 1) {
            if (this.CheckFilter(this.memoryMap[keys[i]])) {
                items.push(this.memoryMap[keys[i]]);
            }
        }
        return items;
    }

    //Subscribes a recycler view to the filtered events
    SubscribeRecyclerViewToFiltered(recycler, tag) {
        //Add events
        this.OnFilteredDatasetUpdated.Subscribe(tag, (m) => recycler.SetData(m));

        //Set filtered data now
        recycler.SetData(this.GetFilteredDataset());
    }

    CheckFilter(data) {
        if (this.filter == null) {
            return true;
        } else {
            return this.filter.CheckFilter();
        }
    }

    //Refreshes the filter and updates data
    RefreshFilter() {
        //Get adds and removes
        var adds = [];
        var removes = [];
        var keys = Object.keys(this.memoryMap);
        for (var i = 0; i < keys.length; i += 1) {
            if (this.CheckFilter(this.memoryMap[keys[i]])) {
                adds.push(this.memoryMap[keys[i]]);
            } else {
                removes.push(this.memoryMap[keys[i]]);
            }
        }

        //Send events
        this.OnFilteredDataAdded.Fire(adds);
        this.OnFilteredDataRemoved.Fire(removes);
        this.OnFilteredDatasetUpdated.Fire(adds);
    }
}