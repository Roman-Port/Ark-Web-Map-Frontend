"use strict";

class DeltaSpeciesDatabase {

    constructor() {
        //Set up DB
        this.db = new Dexie("PROD_SPECIES");
        this.db.version(1).stores({
            dinos: 'classname'
        });

        //Start sync
        this.sync_task = this.Sync();
    }

    async Sync() {
        var r = await DeltaTools.WebRequest(LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/species.json", {});

        //Add adds
        for (var i = 0; i < r.species.length; i += 1) {
            await new Promise((resolve, reject) => {
                this.db.dinos.put(r.species[i]).then(resolve());
            });
        }
    }

    async GetSpeciesById(id) {
        await this.sync_task;
        return await new Promise((resolve, reject) => {
            try {
                this.db.dinos.get(id, (d) => resolve(d));
            } catch (e) {
                reject(e);
            }
        });
    }

}