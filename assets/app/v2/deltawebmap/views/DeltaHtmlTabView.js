"use strict";

class DeltaHtmlTabView extends DeltaTabView {

    constructor(app, title, url, message) {
        super(app);
        this.message = message;
        this.title = title;
        this.url = url;
    }

    async Init(mountpoint) {
        super.Init(mountpoint);
        this.CreateView(mountpoint);
    }

    CreateView(mount) {
        var e = DeltaTools.CreateDom("div", "centered_container", mount);
        DeltaTools.CreateDom("div", "msg_tab_contents", e).innerHTML = this.message;
    }

    GetDisplayName() {
        return this.title;
    }

    GetUrl() {
        return this.url;
    }

}