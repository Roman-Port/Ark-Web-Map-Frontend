"use strict";

class DeltaGuildCreator {

    constructor(app) {
        this.app = app;

        this.settings = {
            "host":null
        }

        //Create modal
        this.modal = app.modal.AddModal(480, 640);

        //Create loading slide
        this.modal.AddPage(DeltaModalBuilder.GetLoadingView());

        //Subscribe
        this.app.rpc.SubscribeGlobal("DELAWEBMAP.DELTAGUILDCREATOR.CLAIMED", 30001, (d) => {
            this._ShowGuildClaimedPrompt(d.guild);
        });

        //Begin loading
        DeltaTools.WebRequest(window.LAUNCH_CONFIG.CONFIG_API_ENDPOINT + "/" + window.LAUNCH_CONFIG.CONFIG_ENV + "/frontend/guild_setup.json", {"noauth":true}, null).then((config) => {
            //Set config
            this.config = config;

            //Show first slide
            this._ShowPlatformSelector();
        });
    }

    _Cancel() {
        this.app.rpc.UnsubscribeTag("DELAWEBMAP.DELTAGUILDCREATOR.CLAIMED");
        this.modal.Close();
    }

    _PromptCancel() {
        this.app.OpenPromptModal("Cancel Server Creation", "Are you sure you would like to cancel server creation?", "Exit", "Return", () => {
            //Exit
            this._Cancel();
        }, () => {
            //Continue
        }, "NEGATIVE", "NEUTRAL");
    }

    _CreateWaffleMenu(data, adapter, callback) {
        var w = DeltaTools.CreateDom("div", "gs_wafflebtn_container");
        for (var i = 0; i < data.length; i += 1) {
            var b = DeltaTools.CreateDom("div", "gs_wafflebtn", w);
            b._id = adapter(data[i], b);
            b._callback = callback;
            b.addEventListener("click", function () {
                this._callback(this._id);
            });
        }
        return w;
    }

    _CreateWideBtn(title, subtitle, callback) {
        var b = DeltaTools.CreateDom("div", "gs_widebtn");
        DeltaTools.CreateDom("div", "gs_widebtn_title", b, title);
        DeltaTools.CreateDom("div", "", b, subtitle);
        b.addEventListener("click", callback);
        return b;
    }

    _CreateMidBtn(title, callback) {
        var b = DeltaTools.CreateDom("div", "gs_midbtn", null, title);
        b.addEventListener("click", callback);
        return b;
    }

    _ShowPlatformSelector() {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Add ARK Server");
        builder.AddContentCustomText("gs_subtitle", "To get started, we need to make sure your server is compatible. Select the platform your server is on.");
        builder.AddContentCustom(this._CreateWaffleMenu(["Steam", "Other"], (data, btn) => {
            btn.innerText = data;
            return data.toLowerCase();
        }, (id) => {
            if (id == "steam") {
                this._ShowMapSelector();
            } else {
                this._ShowPlatformSelectorError();
            }
        }));

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowPlatformSelectorError() {
        //Complains about the user selecting the wrong platform
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Not Supported");
        builder.AddContentCustomText("gs_subtitle", "Unfortunately, due to restrictions on consoles, Delta Web Map is not supported on platforms other than Steam.");
        builder.AddContentCustomText("gs_subtitle", "You won't be able to set up Delta Web Map at this time.");

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowMapSelector() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Choose Map");
        builder.AddContentCustomText("gs_subtitle", "Choose the map that your server will be running.");
        builder.AddContentCustom(this._CreateWaffleMenu(Object.keys(this.app.maps.maps), (data, btn) => {
            if (data != "DEFAULT") {
                btn.innerText = this.app.maps.maps[data].displayName;
            } else {
                btn.innerText = "Other";
            }
            return data;
        }, (id) => {
                if (id == "DEFAULT") {
                    this._ShowMapSelectorWarning();
                } else {
                    this._ShowProviderPrompt();
                }
        }));

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowMapSelectorWarning() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Limited Functionality");
        builder.AddContentCustomText("gs_subtitle", "You do not have a supported map. While you can continue to use Delta Web Map, some functionality may be limited.");

        builder.AddAction("Continue", "POSITIVE", () => {
            this._ShowProviderPrompt();
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowProviderPrompt() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Choose Hosting");
        builder.AddContentCustomText("gs_subtitle", "This is only used to help you with the setup process.");

        builder.AddContentCustom(this._CreateWideBtn("Provider", "Choose this option if you pay a company (Nitrado, ArkServers.IO, etc) to host your ARK server for you.", () => {
            this._ShowProviderSpecificPrompt();
        }));
        builder.AddContentCustom(this._CreateWideBtn("Self Hosted", "Choose this option if you host the server from your own computer. You'll know if you need to choose this option.", () => {
            this.settings.host = "SELF";
            this._ShowModInstallPrompt();
        }));

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowProviderSpecificPrompt() {
        //Prompt for the actual provider the user is using
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Choose Hosting");
        builder.AddContentCustomText("gs_subtitle", "This is only used to help you with the setup process.");

        builder.AddContentCustom(this._CreateWaffleMenu(this.config.listed_providers, (data, btn) => {
            var p = this.config.hosts[data];
            btn.innerText = p.name;
            return data;
        }, (id) => {
                this.settings.host = id;
                this._ShowModInstallPrompt();
        }));

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowModInstallPrompt() {
        var builder = new DeltaModalBuilder();

        var video = DeltaTools.CreateDom("div", "gs_videobox");
        var videoPlayer = DeltaTools.CreateDom("video", "gs_videobox_player", video);
        videoPlayer.controls = true;
        var videoSource = DeltaTools.CreateDom("source", null, videoPlayer);
        videoSource.type = "video/mp4";
        videoSource.src = this.config.hosts[this.settings.host].tutorial_install_url;

        builder.AddContentCustomText("gs_title", "Install Mod");
        builder.AddContentCustomText("gs_subtitle", "Install the Delta Web Map mod from the Steam Workshop.");
        builder.AddContentCustom(video);
        builder.AddContentCustomText("gs_subtitle", "Mod ID " + this.config.mod_id);
        builder.AddContentCustom(this._CreateMidBtn("Open Steam Workshop", () => {
            window.open("https://steamcommunity.com/sharedfiles/filedetails/?id=" + this.config.mod_id, "_blank");
        }));

        builder.AddAction("Continue", "POSITIVE", () => {
            this._ShowWaitingPrompt();
            videoPlayer.remove();
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowWaitingPrompt() {
        var builder = new DeltaModalBuilder();
       
        builder.AddContentCustomText("gs_title", "Start Your Server");
        builder.AddContentCustomText("gs_subtitle", "Waiting for your server to connect...");
        var d = DeltaTools.CreateDom("div", "gs_loading_waiting");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        builder.AddContentCustom(d);

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowGuildClaimedPrompt(guild) {
        //Showed when the guild was claimed
        console.log(guild);
    }
}