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
        this.table = new DeltaSimpleTableView(this.mountpoint, null, "steam_id", [
            "",
            "Name",
            "Tribe ID",
            "Tribe Name",
            "Last Seen",
            ""
        ], (item) => {
                //Create icon
                var icon = DeltaTools.CreateDom("img", "admintab_players_icon");
                icon.src = item.icon;

                //Create flags
                var flags = DeltaTools.CreateDom("div", null);
                if (item.delta_account) {
                    DeltaTools.CreateDom("div", "admintab_players_user_dwm", flags, "DWM");
                }

                return [
                    icon,
                    item.ark_name,
                    item.tribe_id.toString(),
                    this.server.GetTribeByIdSafe(item.tribe_id).tribe_name,
                    new moment(item.last_seen).format('MM/DD/YYYY h:mm A '),
                    flags
                ];
        });
        this.table.SetCustomColumnClassName(0, "admintab_players_icon_holder");
        this.table.SetCustomColumnClassName(5, "admintab_players_flags");
        this.table.SetCustomContextMenu([
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
                    "name": "Ban Player",
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
        return this.mountpoint;
    }

    OnFirstOpened() {
        this.FetchPlayers();
    }

    async FetchPlayers() {
        //Load
        var results = await DeltaTools.WebRequest(this.server.BuildServerRequestUrl("/admin/players?page=" + this.page), {}, this.server.token);
        this.table.AddContent(results.players);
    }

}