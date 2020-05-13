"use strict";

class DeltaUser {

    constructor(app) {
        this.app = app;

        //Subscribe to server joined event
        app.rpc.SubscribeGlobal("deltawebmap.user.server_add", 30002, () => {

        });
    }

    async RefreshData() {
        this.data = await DeltaTools.WebRequest(window.LAUNCH_CONFIG.API_ENDPOINT + "/users/@me", {}, null);
    }

}