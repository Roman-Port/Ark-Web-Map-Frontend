"use strict";

class AdminTabServerOverview extends AdminSubTabMenuTabModule {

    constructor() {
        super("Overview");
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