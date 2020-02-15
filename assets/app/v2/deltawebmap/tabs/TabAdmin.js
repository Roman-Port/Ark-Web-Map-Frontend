"use strict";

class TabAdmin extends DeltaServerTab {

    constructor(server) {
        super(server);
        this.switch = null;
        this.active = false;
        this.loader = null;
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

    async OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
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
        //Set UI
        this.active = true;
        this.switch.classList.add("admin_tab_toggle_active");
        this.loader.classList.add("admin_tab_loader_active");

        //Change the current tab
        this.server.tribe = '*';

        //Refresh all
        await this.RefreshViews();

        //Set UI
        this.loader.classList.remove("admin_tab_loader_active");
    }

    async OnSwitchedOff() {
        //Set UI
        this.active = false;
        this.switch.classList.remove("admin_tab_toggle_active");
        this.loader.classList.add("admin_tab_loader_active");

        //Change the current tribe
        this.server.tribe = this.server.nativeTribe;

        //Refresh all
        await this.RefreshViews();

        //Set UI
        this.loader.classList.remove("admin_tab_loader_active");
    }

    async RefreshViews() {
        await this.server.ResetTabs();
    }
}