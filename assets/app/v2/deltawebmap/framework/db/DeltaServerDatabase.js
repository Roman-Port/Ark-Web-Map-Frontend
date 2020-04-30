"use strict";

class DeltaServerDatabase extends DeltaDatabase {

    constructor(server) {
        super(server.app);
        this.server = server;
        this._Init();
    }

    GetDbName() {
        return "PROD_GUILD_" + this.server.id;
    }

    GetDbStores() {
        return {
            dinos: 'dino_id, tamed_name, classname, level, is_baby',
            structures: 'structure_id, tribe_id, classname',
            inventories: 'holder_id, holder_type, tribe_id, classname, item_id'
        };
    }

    GetDbStoreTypes() {
        return {
            dinos: DeltaServerSyncCollectionDinos,
            structures: DeltaServerSyncCollectionStructures,
            inventories: DeltaServerSyncCollectionInventories
        }
    }

    GetSpeciesById(id) {
        return this.server.app.species.GetSpeciesById(id);
    }

    async GetDinoPackageById(id) {
        //Get dino
        var d = await this.dinos.GetById(id);
        if (d == null) { return null; }

        //Get species
        var s = await this.GetSpeciesById(d.classname);
        if (s == null) { return null; }

        return {
            "dino": d,
            "species": s
        };
    }

}