"use strict";

class DeltaServerSyncCollectionDinos extends DeltaServerSyncCollection {

    constructor(db, name) {
        super(db, name);
    }

    GetSyncUrlBase() {
        return this.db.server.GetTribesEndpointUrl("/dinos");
    }

    GetPrimaryKey() {
        return "dino_id";
    }

}