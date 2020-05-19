"use strict";

class AdminTabServerPermissions extends AdminSubTabMenuTabModule {

    constructor() {
        super("Permissions");
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