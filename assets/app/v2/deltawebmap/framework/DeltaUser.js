"use strict";

class DeltaUser {

    constructor() {
        
    }

    async RefreshData() {
        this.data = await DeltaTools.WebRequest(window.LAUNCH_CONFIG.API_ENDPOINT + "/users/@me", {}, null);
    }

}