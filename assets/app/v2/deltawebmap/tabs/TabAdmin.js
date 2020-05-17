"use strict";

class TabAdmin extends SubTabMenuTab {

    constructor(server) {
        super(server, [
            "Server Settings",
            "Server Admin",
            new AdminTabServerPlayers()
        ]);
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
        if (!this.server.IsAdmin()) {
            btn.classList.add("v3_nav_server_bottom_item_disabled");
        }
        return btn;
    }

    OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        super.OnInit(mountpoint);
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        await super.OnFirstOpen();
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

        //Check if we're in secure mode
        if (this.server.info.secure_mode) {
            //Show dialog about secure mode
            if (this.server.IsOwner()) {
                var modal = this.server.app.modal.AddModal(480, 290);
                var e = new DeltaModalBuilder();
                e.AddContentTitle("Server Using Secure Mode");
                e.AddContentDescription("Secure mode is currently on. This mode prevents admin abuse by blocking admins from viewing information about other tribes.");
                e.AddContentDescription("You must turn off secure mode before you can use admin mode. Turning it off will remove the padlock from your server.");
                e.AddContentWarningBox("Changing this setting will notify members, even if you change it back.");
                e.AddAction("Turn Off", "POSITIVE", () => {
                    modal.Close();
                });
                e.AddAction("Cancel", "NEUTRAL", () => {
                    modal.Close();
                });
                e.Build();
                modal.AddPage(e.Build());
            } else {
                var modal = this.server.app.modal.AddModal(480, 290);
                var e = new DeltaModalBuilder();
                e.AddContentTitle("Server Using Secure Mode");
                e.AddContentDescription("The owner of this server has opted to enable secure mode. Secure mode must be turned off before you can switch to admin mode.");
                e.AddContentDescription("Only the server owner can change this setting. Please ask them to turn secure mode off.");
                e.AddAction("Cancel", "NEUTRAL", () => {
                    modal.Close();
                });
                e.Build();
                modal.AddPage(e.Build());
            }
            
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