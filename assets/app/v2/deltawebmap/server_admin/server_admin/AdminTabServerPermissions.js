"use strict";

class AdminTabServerPermissions extends AdminSubTabMenuTabModule {

    constructor() {
        super("Permissions");
        this.mountpoint = null;
        this.settings = [];
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        this._AddText("Here, you can fine tune what features are available to players. You can choose if features are available to players or only admins. Changing what preset you are using will reset these settings.");

        //Add permissions
        var flagParams = this.server.app.config.permission_flags;
        for (var i = 0; i < flagParams.length; i += 1) {
            if (flagParams[i].visibility == "UNUSED") { continue; }
            var f = DeltaTools.CreateDom("div", "admintab_permissions_perm", this.mountpoint);
            DeltaTools.CreateDom("div", "admintab_permissions_perm_name", f, flagParams[i].name);
            DeltaTools.CreateDom("div", "admintab_permissions_perm_description", f, flagParams[i].description);

            var perm = DeltaTools.CreateDom("div", "admintab_permissions_perm_select", f);
            perm._left = DeltaTools.CreateDom("div", "admintab_permissions_perm_select_tribe", perm);
            perm._left._value = true;
            perm._right = DeltaTools.CreateDom("div", "admintab_permissions_perm_select_admin", perm);
            perm._right._value = false;
            perm._index = flagParams[i].index;
            this.SetPermissionFlagInterface(perm, this.server.ReadPermissionValue(flagParams[i].index));
            perm._left.addEventListener("click", (evt) => this.OnPermClicked(evt));
            perm._right.addEventListener("click", (evt) => this.OnPermClicked(evt));
            this.settings.push(perm);

            //Add labels to the first one
            if (i == 0) {
                DeltaTools.CreateDom("div", "admintab_permissions_perm_select_label", perm._left, "Tribe");
                DeltaTools.CreateDom("div", "admintab_permissions_perm_select_label", perm._right, "Admin");
            }
        }

        //Subscribe to refresh events
        this.server.SubscribeRPCEvent("tab-admin-permissions-perms", 20005, (m) => {
            for (var i = 0; i < this.settings.length; i += 1) {
                this.SetPermissionFlagInterface(this.settings[i], 1 == ((m.flags >> this.settings[i]._index) & 1));
            }
        });

        return this.mountpoint;
    }

    OnPermClicked(e) {
        var status = e.target._value;
        var rootElement = e.target.parentNode;
        var index = rootElement._index;
        this.SetPermissionFlagInterface(rootElement, status);
        if (status != this.server.ReadPermissionValue(index)) {
            this.server.SetPermissionValue(index, status);
        }
    }

    SetPermissionFlagInterface(perm, isActive) {
        if (isActive) {
            perm._left.classList.add("admintab_permissions_perm_select_tribe_active");
            perm._right.classList.remove("admintab_permissions_perm_select_admin_active");
        } else {
            perm._left.classList.remove("admintab_permissions_perm_select_tribe_active");
            perm._right.classList.add("admintab_permissions_perm_select_admin_active");
        }
    }

    OnFirstOpened() {

    }

}