"use strict";

class DeltaUserSettingsTabView extends DeltaTabView {

    constructor(app) {
        super(app);
    }

    async Init(mountpoint) {
        super.Init(mountpoint);
        this.CreateView(mountpoint);
    }

    CreateView(mount) {
        var root = new DeltaFormRoot("vf_fullscreen_container");

        new DeltaFormContainerBox(root);

        root.Mount(mount);
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */
        super.OnSwitchedTo();
    }

    OnSwitchedAway() {
        /* Called when this server is switched away from */
        super.OnSwitchedAway();
    }

    GetDisplayName() {
        return "User Settings";
    }

    GetUrl() {
        return "settings";
    }

}