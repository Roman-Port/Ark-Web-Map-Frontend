"use strict";

class DeltaServerSyncCollectionDinos extends DeltaDbCollectionMemory {

    constructor(db, name) {
        super(db, name);
    }

    GetSyncUrlBase() {
        return this.db.server.GetTribesEndpointUrl("/dinos");
    }

    GetPrimaryKey() {
        return "dino_id";
    }

    GetEpochKeyName() {
        return this.fullname + "~" + this.db.server.tribe + "~LAST_EPOCH";
    }

    GetRPCSyncType() {
        return 0;
    }

    GetDbStore() {
        return "dino_id, tamed_name, classname, level, is_baby";
    }

}