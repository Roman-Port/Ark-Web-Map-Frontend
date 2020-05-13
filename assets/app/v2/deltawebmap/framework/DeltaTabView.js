"use strict";

class DeltaTabView {

    constructor(app) {
        this.app = app;
        this.mountpoint = null;
    }

    Init(mountpoint) {
        this.mountpoint = mountpoint;
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */

        //Show
        this.mountpoint.classList.add("server_mountpoint_active");

        //Expand on the sidebar
        if (this.menu != null) {
            this.menu.classList.add("v3_nav_server_active");
        }
    }

    OnSwitchedAway() {
        /* Called when this server is switched away from */

        //Hide
        this.mountpoint.classList.remove("server_mountpoint_active");

        //Hide on the sidebar
        if (this.menu != null) {
            this.menu.classList.remove("v3_nav_server_active");
        }
    }

    GetDisplayName() {
        //This should be overridden
        return "{unknown}";
    }

    GetUrl() {
        //This should be overridden
        return "";
    }
}