"use strict";

class DeltaServerSyncCollection {

    constructor(db, name) {
        this.db = db;
        this.name = name;
        this.subscriptions = {};
    }

    async Sync() {
        var r = await DeltaTools.WebRequest(this.GetSyncUrlBase(), {});

        //Add adds
        for (var i = 0; i < r.adds.length; i += 1) {
            await new Promise((resolve, reject) => {
                this.GetDbCollection().put(r.adds[i]).then(resolve());
            });
        }

        //Send events
        this._RunBatchOperation("onAdd", r.adds);
    }

    GetDbCollection() {
        return this.db.db[this.name];
    }

    GetSyncUrlBase() {
        throw "This must be overriden.";
    }

    async GetById(id) {
        return await new Promise((resolve, reject) => {
            try {
                this.GetDbCollection().get(id, (d) => resolve(d));
            } catch (e) {
                reject(e);
            }
        });
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
        var d = await this.GetDbCollection().toArray();
        this._RunBatchOperationSingular(onAdd, d);
        this.Subscribe(key, onAdd, onRemove);
    }

}