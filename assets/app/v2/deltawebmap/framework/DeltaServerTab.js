"use strict";

class DeltaServerTab {

    /* This is an abstract class that defines a tab shown to the user */

    constructor(server) {
        this.server = server;
        this.openCount = 0;
        this.menu = null;
        this.token = new DeltaCancellationToken(server.token);
    }

    GetDisplayName() {
        /* Returns the display name as a string */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    GetId() {
        /* Returns the display name as a string */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    CreateMenuItem(container) {
        var btn = DeltaTools.CreateDom("div", "v3_nav_server_bottom_item", container);
        btn.innerText = this.GetDisplayName();
        return btn;
    }

    async RedownloadData() {
        /* Used when tribes are changing */
    }

    async OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    async OnOpen() {
        /* Called when this tab is switched to */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    async OnClose() {
        /* Called when this tab is switched away from */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        throw new Error("DeltaServerTab cannot be constructed; Please implement it!");
    }

}