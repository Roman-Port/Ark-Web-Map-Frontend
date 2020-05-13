"use strict";

class DeltaSystemDatabase extends DeltaDatabase {

    constructor(app) {
        super(app);
        this._Init();
    }

    GetDbName() {
        //Returns the name of the DB
        return "PROD_SYSTEM";
    }

    GetDbStores() {
        return {
            species: 'classname',
            items: 'classname, structure_classname'
        }
    }

    GetDbStoreTypes() {
        return {
            species: DeltaSystemSyncCollectionSpecies,
            items: DeltaSystemSyncCollectionItems
        }
    }

    GetDbVersion() {
        return 1;
    }

}