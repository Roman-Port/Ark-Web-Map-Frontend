"use strict";

class AdminTabServerPresets extends AdminSubTabMenuTabModule {

    constructor() {
        super("Presets");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle(this.name);
        this._AddText("The security of your server is important to us. Here, you can change the permissions template your server uses. You can further fine tune these settings in the permissions tab.");
        this._AddWarning("Changing your preset will clear any permission customizations you've made.");

        DeltaTools.WebRequest(window.LAUNCH_CONFIG.CONFIG_API_ENDPOINT + "/" + window.LAUNCH_CONFIG.CONFIG_ENV + "/frontend/guild_setup.json", { "noauth": true }, null).then((config) => {
            this._AddPianoKeys(config.security_levels, this.server.info.permissions_template, (d) => {
                this.server.SetPermissionTemplate(d);
            });
        });

        return this.mountpoint;
    }

    OnFirstOpened() {

    }

}