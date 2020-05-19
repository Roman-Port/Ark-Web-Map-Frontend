"use strict";

class AdminTabServerPresets extends AdminSubTabMenuTabModule {

    constructor() {
        super("Presets");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        return this.mountpoint;
    }

    OnFirstOpened() {

    }

}