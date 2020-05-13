"use strict";

class TabAdmin extends DeltaServerTab {

    constructor(server) {
        super(server);
        this.switch = null;
        this.active = false;
        this.loader = null;
        this.busy = false;
    }

    GetDisplayName() {
        return "Admin";
    }

    GetId() {
        return "admin";
    }

    CreateMenuItem(container) {
        var btn = super.CreateMenuItem(container);
        this.switch = DeltaTools.CreateDom("div", "admin_tab_toggle", btn);
        this.loader = DeltaTools.CreateDom("div", "admin_tab_loader loading_spinner", btn);
        this.switch.addEventListener("click", (e) => this.OnSwitchToggled(e));
        return btn;
    }

    OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        super.OnInit(mountpoint);
        this.LayoutDom(mountpoint);
    }

    LayoutDom(mountpoint) {
        this.mountpoint = mountpoint;
        
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */

    }

    async OnOpen() {
        /* Called when this tab is switched to */

    }

    async OnClose() {
        /* Called when this tab is switched away from */

    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        this.server.UnsubscribeRPCEvent("tab.admin");
        this.server.UnsubscribeEvent("tab.admin");
    }

    OnSwitchToggled(e) {
        if (this.active) {
            this.OnSwitchedOff();
        } else {
            this.OnSwitchedOn();
        }
        e.stopPropagation();
    }

    async OnSwitchedOn() {
        //Check if we're busy
        if (this.CheckIfBusy()) {
            return;
        }

        //Set UI
        this.active = true;
        this.switch.classList.add("admin_tab_toggle_active");

        //Change
        await this.RunWaitingFunction(this.ChangeTribe('*'));
    }

    async OnSwitchedOff() {
        //Check if we're busy
        if (this.CheckIfBusy()) {
            return;
        }

        //Set UI
        this.active = false;
        this.switch.classList.remove("admin_tab_toggle_active");
        
        //Change
        await this.RunWaitingFunction(this.ChangeTribe(this.server.nativeTribe));
    }

    async ChangeTribe(nextTribeId) {
        await this.server.ChangeTribe(nextTribeId);
    }

    CheckIfBusy() {
        if (!this.server.ready) {
            return true;
        }
        return this.busy;
    }

    async RunWaitingFunction(promise) {
        //Runs a function that should block other changes. This will also show the loading symbol
        if (this.busy) {
            //We're already doing something!
            return false;
        }

        //Set the loader
        this.busy = true;
        this.loader.classList.add("admin_tab_loader_active");

        //Run
        var r = await promise;

        //Unset the loader
        this.busy = false;
        this.loader.classList.remove("admin_tab_loader_active");

        return r;
    }
}