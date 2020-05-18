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