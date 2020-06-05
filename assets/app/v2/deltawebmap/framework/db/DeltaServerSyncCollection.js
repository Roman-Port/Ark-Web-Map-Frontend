"use strict";

class DeltaServerSyncCollection extends DeltaDbCollectionMemory {

    constructor(db, name) {
        super(db, name);

        //Get RPC sync type
        this.rpcSyncType = this.GetRPCSyncType();

        //Create queue
        this.addQueue = [];

        //Subscribe to RPC events
        this.db.app.rpc.SubscribeServer(this.GetServerId(), "DBSUB~" + this.fullname, 20001, (d) => {
            if (d.type != this.rpcSyncType) {
                return; //Only respond if the sync type matches
            }

            //Update
            this.addQueue.push(d.content);
        });

        //Start update loop
        this.updateLoop = window.setInterval(() => {
            this._BatchUpdate(this.addQueue, []);
            this.addQueue = [];
        }, 2000);
    }

    GetServerId() {
        return this.db.server.id;
    }

    GetRPCSyncType() {
        throw "Not implimented!";
    }

}