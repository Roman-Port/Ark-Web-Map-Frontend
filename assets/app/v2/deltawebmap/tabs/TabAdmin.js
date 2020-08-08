"use strict";

class TabAdmin extends SubTabMenuTab {

    constructor(server) {
        super(server);
        this.switch = null;
        this.active = false;
        this.loader = null;
        this.busy = false;
    }

    GetCurrentLayout() {
        return [
            "Server Settings",
            new AdminTabServerOverview(),
            new AdminTabServerAdmins(),
            new AdminTabServerSecure(),
            new AdminTabServerPermissions(),
            new AdminTabServerPresets(),
            new AdminTabServerDelete(),
            "Server Admin",
            new AdminTabServerPlayers(),
            new AdminTabServerTribes()
        ];
    }

    GetDisplayName() {
        return "Manage";
    }

    GetId() {
        return "admin";
    }

    GetIsSearchQueryEnabled() {
        //Returns if we should enable the search query
        return false;
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
        //Stop this from toggling anything
        e.stopPropagation();

        //If we're in secure mode and attempting to turn this on, warn the user
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
                    this.server.AdminSetSecureMode(false);
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

        //Switch
        this.server.SetAdminMode(!this.server.admin_mode);
    }

    SetLoadingSymbol(active) {
        DeltaTools.SetClassStatus(this.loader, "admin_tab_loader_active", active);
    }

    SetActiveStatus(active) {
        DeltaTools.SetClassStatus(this.switch, "admin_tab_toggle_active", active);
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

class AdminSubTabMenuTabModule extends SubTabMenuTabModule {

    constructor(name) {
        super(name);
    }

    _AddTitle(name) {
        return DeltaTools.CreateDom("div", "admin_title", this.mountpoint, name);
    }

    _AddText(text) {
        return DeltaTools.CreateDom("div", "admin_text", this.mountpoint, text);
    }

    _AddWarning(text) {
        return DeltaTools.CreateDom("div", "admin_warning_box", this.mountpoint, text);
    }

    _AddRedBtn(text, callback) {
        var btn = DeltaTools.CreateDom("div", "admin_btn_red", this.mountpoint, text);
        btn.addEventListener("click", callback);
        return btn;
    }

    _AddPianoKeys(options, currentOption, callback) {
        //Accepts type {name, description, color, id}. Calls back with the data when changed
        var c = DeltaTools.CreateDom("div", null, this.mountpoint);
        c._lastItem = null;
        c._callback = callback;
        for (var i = 0; i < options.length; i += 1) {
            var d = DeltaTools.CreateDom("div", "gs_widebtn admin_piano_key gs_widebtn_nomargin", c);
            DeltaTools.CreateDom("div", "gs_widebtn_title", d, options[i].name);
            DeltaTools.CreateDom("div", null, d, options[i].description);
            d._data = options[i];

            //Set as active if it is
            if (options[i].id == currentOption) {
                d.style.backgroundColor = options[i].color;
                d.style.borderColor = options[i].color;
                d.style.color = "white";
                c._lastItem = d;
            }

            //Add event
            d.addEventListener("click", (evt) => {
                //Get data
                var t = evt.currentTarget;
                var o = t._data;

                //Clear
                if (t.parentNode._lastItem != null) {
                    t.parentNode._lastItem.style.backgroundColor = null;
                    t.parentNode._lastItem.style.borderColor = null;
                    t.parentNode._lastItem.style.color = null;
                }

                //Set the status of the current button
                t.style.backgroundColor = o.color;
                t.style.borderColor = o.color;
                t.style.color = "white";
                t.parentNode._lastItem = t;

                //Callback
                t.parentNode._callback(o);
            });
        }
        return c;
    }

}