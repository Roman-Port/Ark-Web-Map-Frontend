"use strict";

class AdminTabServerAdmins extends AdminSubTabMenuTabModule {

    constructor() {
        super("Admins");
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