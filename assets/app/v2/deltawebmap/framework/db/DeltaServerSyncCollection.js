"use strict";

class DeltaServerSyncCollection extends DeltaDbCollectionMemory {

    constructor(db, name) {
        super(db, name);

        //Get RPC sync type
        this.rpcSyncType = this.GetRPCSyncType();

        //Subscribe to RPC events
        this.db.app.rpc.SubscribeServer(this.GetServerId(), "DBSUB~" + this.fullname, 20001, (d) => {
            if (d.type != this.rpcSyncType) {
                return; //Only respond if the sync type matches
            }

            //Update
            this._BatchUpdate([d.content], []);
        });
    }

    GetServerId() {
        return this.db.server.id;
    }

    GetRPCSyncType() {
        throw "Not implimented!";
    }

}