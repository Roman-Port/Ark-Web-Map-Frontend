"use strict";

class DeltaDatabase {

    constructor(app) {
        //Set info
        this.app = app;
    }

    _Init() {
        //Set info
        this.name = this.GetDbName();

        //Set up DB
        this.db = new Dexie(this.name);
        var stores = this.GetDbStores();
        var storeKeys = Object.keys(stores);
        var storeTypes = this.GetDbStoreTypes();
        this.db.version(this.GetDbVersion()).stores(stores);

        //Add collections
        this.collections = [];
        for (var i = 0; i < storeKeys.length; i += 1) {
            var k = storeKeys[i];

            //Create
            var collec = new storeTypes[k](this, k);
            this.collections.push(collec);
            this[k] = collec;
        }
    }

    GetDbVersion() {
        return 1;
    }

    GetDbName() {
        //Returns the name of the DB
        throw "Must be overriden!";
    }

    GetDbStores() {
        //Returns the collections inside, using the same syntax of 
        /*this.db.version(1).stores({
            dinos: 'dino_id, tamed_name, classname, level, is_baby'
        });*/
        throw "Must be overriden!";
    }

    GetDbStoreTypes() {
        //Returns the types of high level collections to use, mapped to the index from GetDbStores
        throw "Must be overriden!";
    }

    async Init() {
        //Init and sync all
        for (var i = 0; i < this.collections.length; i += 1) {
            await this.collections[i].Init();
        }
    }

    async Sync() {
        //Sync all
        for (var i = 0; i < this.collections.length; i += 1) {
            await this.collections[i].Sync();
        }
    }

}