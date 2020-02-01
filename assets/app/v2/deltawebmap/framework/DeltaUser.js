"use strict";

class DeltaUser {

    constructor() {
        
    }

    async RefreshData() {
        this.data = await DeltaTools.WebRequest("https://deltamap.net/api/users/@me/", {}, null);
    }

}