"use strict";

class AdminTabServerTribes extends AdminSubTabMenuTabModule {

    constructor() {
        super("Tribes");
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle("Tribes");
        this._AddText("Only tribes that have joined since you added Delta Web Map to your server will be shown.");
        return this.mountpoint;
    }

    OnFirstOpened() {
        //Add tribes
        for (var i = 0; i < this.server.tribes.length; i += 1) {
            this.mountpoint.appendChild(this.CreatePlayerDom(this.server.tribes[i]));
        }
    }

    CreatePlayerDom(data) {
        var d = DeltaTools.CreateDom("div", "admintab_players_user");
        DeltaTools.CreateDom("div", "admintab_players_user_name", d, data.tribe_name);
        DeltaTools.CreateDom("div", "admintab_players_user_tribe", d, data.tribe_id.toString());
        DeltaTools.CreateDom("div", "admintab_players_user_time", d, new moment(data.last_seen).format('MMMM Do, YYYY - h:mm A '));
        return d;
    }

}