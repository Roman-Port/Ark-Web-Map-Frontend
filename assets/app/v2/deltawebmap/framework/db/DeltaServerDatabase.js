"use strict";

class DeltaServerDatabase {

    constructor(server) {
        //Set info
        this.server = server;
        this.name = "PROD_GUILD_" + server.id;

        //Set up DB
        this.db = new Dexie(this.name);
        this.db.version(1).stores({
            dinos: 'dino_id, tamed_name, classname, level, is_baby'
        });

        //Add collections
        this.collections = [];
        this.collections.push(new DeltaServerSyncCollectionDinos(this, "dinos"));
        for (var i = 0; i < this.collections.length; i += 1) {
            this[this.collections[i].name] = this.collections[i];
        }
    }

    async Sync() {
        //Sync all
        for (var i = 0; i < this.collections.length; i += 1) {
            await this.collections[i].Sync();
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