"use strict";

class DeltaDbSession {

    constructor(primaryKey, collection) {
        this.primaryKey = primaryKey;
        this._dataset = {};
        this._collection = collection;
        this._filter = null;

        this.OnDataAdded = new DeltaBasicEventDispatcher();
        this.OnDataRemoved = new DeltaBasicEventDispatcher();
        this.OnDatasetUpdated = new DeltaBasicEventDispatcher();
    }

    //Required to call before we can begin using this
    async Init() {
        //Get data
        var data = await this._collection.GetAllItems();

        //Add to our array
        for (var i = 0; i < data.length; i += 1) {
            this._dataset[data[i][this.primaryKey]] = data[i];
        }
    }

    _DatasetToList() {
        var k = Object.keys(this._dataset);
        var o = [];
        for (var i = 0; i < k.length; i += 1) {
            o.push(this._dataset[k[i]]);
        }
        return o;
    }

    GetCurrentData() {
        return this._DatasetToList();
    }

    //Called when data is added. Data is an array of items
    OnDbDataAdded(data) {
        //Add to our array
        for (var i = 0; i < data.length; i += 1) {
            this._dataset[data[i][this.primaryKey]] = data[i];
        }

        //Notify clients
        this.OnDataAdded.Fire(data);
        this._SendDatasetUpdated();
    }

    //Called when data is added. Data is an array of primary keys
    OnDbDataRemoved(data) {
        //Add to our array
        for (var i = 0; i < data.length; i += 1) {
            delete this._dataset[data[i]];
        }

        //Notify clients
        this.OnDataRemoved.Fire(data);
        this._SendDatasetUpdated();
    }

    //Sends the dataset being updated to clients
    _SendDatasetUpdated() {
        this.OnDatasetUpdated.Fire(this._DatasetToList());
    }

}