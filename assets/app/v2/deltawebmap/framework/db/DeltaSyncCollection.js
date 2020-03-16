"use strict";

class DeltaSyncCollection {

    constructor(db, name) {
        this.db = db;
        this.name = name;
        this.fullname = this.db.name + "_" + this.name;
        this.subscriptions = {};
        this.items = []; //Stores items in the database in memory for quick access
        this.sessions = {};
    }

    async Init() {
        //Get initial items
        this.items = await this.GetDbCollection().toArray();
        this.OnPostUpdate();

        //Sync from server
        await this.Sync();
    }

    GetEpochKeyName() {
        return this.fullname + "~LAST_EPOCH";
    }

    async Sync() {
        //Get the epoch (if any)
        var epoch = localStorage.getItem(this.GetEpochKeyName());
        if (epoch == null) {
            epoch = "0";
        }

        //Get
        var r = await DeltaTools.WebRequest(this.GetSyncUrlBase() + "?last_epoch=" + epoch, {});

        //Set epoch
        localStorage.setItem(this.GetEpochKeyName(), r.epoch);

        //Add adds
        await this._BatchUpdate(r.adds);
    }

    async _BatchUpdate(data) {
        /* Called whenever we add or update elements. Spins off everything else */

        //Add data here
        var key = this.GetPrimaryKey();
        for (var i = 0; i < data.length; i += 1) {
            //Check if we already have data for this
            var exists = false;
            for (var j = 0; j < this.items.length; j += 1) {
                if (this.items[j][key] == data[i][key]) {
                    exists = true;
                    this.items[j] = data[i];
                    break;
                }
            }
            if (!exists) {
                this.items.push(data[i]);
            }
        }

        //Dispatch to sessions
        DeltaTools.ForEachKey(this.sessions, (s) => {
            this._PushAddUpdateToSession(s.key, data);
        });

        //Send events
        this._RunBatchOperation("onAdd", data);

        //Push to DB
        for (var i = 0; i < data.length; i += 1) {
            await new Promise((resolve, reject) => {
                this.GetDbCollection().put(data[i]).then(resolve());
            });
        }

        //Run post update
        this.OnPostUpdate();
    }

    OnPostUpdate() {
        //You are free to override this in children
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

    GetById(id) {

    }

    _ForEachSubscriptions(callback) {
        /* Runs callback for each subscription */
        var k = Object.keys(this.subscriptions);
        for (var i = 0; i < k.length; i += 1) {
            callback(this.subscriptions[k[i]]);
        }
    }

    _RunBatchOperation(name, datas) {
        this._ForEachSubscriptions((d) => {
            for (var i = 0; i < datas.length; i += 1) {
                d[name](datas[i], i == datas.length - 1);
            }
        });
    }

    _RunBatchOperationSingular(callback, datas) {
        for (var i = 0; i < datas.length; i += 1) {
            callback(datas[i], i == datas.length - 1);
        }
    }

    Subscribe(key, onAdd, onRemove) {
        /* Subscribes functions to add (or modify)/remove operations in the DB */
        /* onAdd and onRemove: (data, doRefresh) */
        /* doRefresh will be false until the last item in a batch operation */
        this.subscriptions[key] = {
            onAdd: onAdd,
            onRemove: onRemove
        };
    }

    async SubscribeAndRead(key, onAdd, onRemove) {
        /* Sends all existing data, then subscrbes a user */
        this._RunBatchOperationSingular(onAdd, this.items);
        this.Subscribe(key, onAdd, onRemove);
    }

    CreateSession(onCheckItem, context, onDatasetUpdated) {
        /* Creates a search session. This follows some key parts
         * onCheckItem(item, context): Run for each item added and returns true/false if we care about it. If it returns true, it will be added to the dataset
         * context: Any kind of item. Passed into onCheckItem and serves as data user can change. Usually a filter of some sort
         * onDatasetUpdated(datas, context): Returns a new array of objects to use
         * 
         * This function will return a key that can be used to do other actions, such as changing filters or removing the session.
         * Sessions should be removed using this key every time.
         * 
         * This function is used to update live data in the UI, and will update the dataset whenever new data comes in.
         */

        //Create the key to use
        var key = 0;
        while (this.sessions[key] != null) {
            key++;
        }

        //Create a metadata object
        this.sessions[key] = {
            "onCheckItem": onCheckItem,
            "context": context,
            "onDatasetUpdated": onDatasetUpdated,
            "dataset": [], /* Cached dataset */
            "key": key
        };

        //Push existing data
        this._PushAddUpdateToSession(key, this.items);

        return key;
    }

    RefreshSessionDataset(key) {
        //Refreshes a dataset for a session using it's onCheckItem functions.
        var dataset = [];
        for (var i = 0; i < this.items.length; i += 1) {
            if (this.sessions[key].onCheckItem(this.items[i], this.sessions[key].context)) {
                dataset.push(this.items[i]);
            }
        }

        //Push changes
        this.sessions[key].dataset = dataset;
        this.sessions[key].onDatasetUpdated(dataset, this.sessions[key].context);
    }

    _PushAddUpdateToSession(key, data) {
        /* Pushes all data passed into the dataset, if it matches filters */
        //Get data in dataset
        var dataset = this.sessions[key].dataset;
        for (var i = 0; i < data.length; i += 1) {
            if (this.sessions[key].onCheckItem(data[i], this.sessions[key].context)) {
                //This is an item we want. Check if it's primary key will replace something
                this._ReplaceByPrimaryKey(dataset, data[i]);
            }
        }

        //Push changes
        this.sessions[key].onDatasetUpdated(dataset, this.sessions[key].context);
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