"use strict";

class AdminTabServerPlayers extends AdminSubTabMenuTabModule {

    constructor() {
        super("Players");
        this.page = 0;
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        this._AddTitle("Players");
        this._AddText("Only players that have joined since you added Delta Web Map to your server will be shown.");
        return this.mountpoint;
    }

    OnFirstOpened() {
        this.FetchPlayers();
    }

    async FetchPlayers() {
        //Load
        var results = await DeltaTools.WebRequest(this.server.BuildServerRequestUrl("/admin/players?page=" + this.page), {}, this.server.token);

        //Add players
        for (var i = 0; i < results.players.length; i += 1) {
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
        }
    }

    CreatePlayerDom(data) {
        var d = DeltaTools.CreateDom("div", "admintab_players_user");
        DeltaTools.CreateDom("img", "admintab_players_user_icon", d).src = data.icon;
        if (data.delta_account) {
            DeltaTools.CreateDom("div", "admintab_players_user_dwm", d, "DWM");
        }
        DeltaTools.CreateDom("div", "admintab_players_user_name", d, data.name);
        DeltaTools.CreateDom("div", "admintab_players_user_tribe", d, data.tribe_id.toString() + " / " + this.server.GetTribeByIdSafe(data.tribe_id).tribe_name);
        DeltaTools.CreateDom("div", "admintab_players_user_time", d, new moment(data.last_seen).format('MMMM Do, YYYY - h:mm A '));
        DeltaContextMenu.AddContextMenu(d, data, [
            [
                {
                    "name": "Open Steam Profile",
                    "callback": (app, dd) => {
                        window.open("http://steamcommunity.com/profiles/" + dd.steam_id, "_blank");
                    }
                },
                {
                    "name": "Copy Steam ID",
                    "callback": (app, dd) => {
                        DeltaTools.CopyToClipboard(dd.steam_id);
                    }
                },
                {
                    "name": "Copy ARK ID",
                    "callback": (app, dd) => {
                        DeltaTools.CopyToClipboard(dd.ark_id);
                    }
                }
            ],
            [
                {
                    "name": "Ban " + data.name,
                    "style": "red",
                    "callback": (app, dd) => {
                        //Check if this is an admin
                        if (dd.is_admin) {
                            var modal = this.server.app.modal.AddModal(480, 300);
                            var builder = new DeltaModalBuilder();
                            builder.AddContentTitle("Can't Ban " + dd.name);
                            builder.AddContentDescription("You cannot ban other admins or the server owner. Please remove them as an admin before banning them.");
                            modal.AddPage(builder.Build());
                            builder.AddAction("Cancel", "NEUTRAL", () => {
                                modal.Close();
                            });
                            return;
                        }
                        this.server.PromptBanMember(dd.name, dd.steam_id);
                    }
                }
            ]
        ]);
        return d;
    }

}