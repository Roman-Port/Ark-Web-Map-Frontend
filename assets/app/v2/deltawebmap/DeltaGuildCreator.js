"use strict";

class DeltaGuildCreator {

    constructor(app, cancelCallback) {
        this.app = app;
        this.cancelCallback = cancelCallback;
        //SPECIFY THE GUILD TO SET THAT GUILD UP, or leave it null to start from the beginning
        //Set as active creator

        //Create modal
        this.modal = app.modal.AddModal(480, 640);

        //Show
        this._ShowIntro();
    }

    _Cancel() {
        this.modal.Close();
        this.cancelCallback();
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

    

    _CreateMidBtn(title, callback) {
        var b = DeltaTools.CreateDom("div", "gs_midbtn", null, title);
        b.addEventListener("click", callback);
        return b;
    }

    _CreateChecklistItem(number, title, text) {
        var b = DeltaTools.CreateDom("div", "gs_checklist_step", null);
        DeltaTools.CreateDom("div", "gs_checklist_step_number", b, number.toString());
        DeltaTools.CreateDom("div", "gs_checklist_step_title", b, title);
        DeltaTools.CreateDom("div", "gs_checklist_step_text", b, text);
        return b;
    }

    _ShowIntro() {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Add ARK Server");
        builder.AddContentDescription("Thanks for considering Delta Web Map! Delta Web Map works as a workshop ARK mod you install onto your server.");
        builder.AddContentDescription("When players join your ARK server, the mod will automatically determine what tribe they're in and make your server appear on their account. They'll only be able to see their own tribe content.");
        builder.AddContentDescription("Server admins will automatically be given admin access on Delta Web Map when they connect. With admin access, you can see other tribes and change server permissions.");

        builder.AddContentBigNav([
            {
                "title": "Continue",
                "callback": () => {
                    this._ShowChecklist();
                },
                "is_big": false
            }
        ]);
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowChecklist() {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Add ARK Server");
        builder.AddContentDescription("To get your server ready, you'll be guided through the following to-do list.");
        builder.AddContentCustom(this._CreateChecklistItem(1, "Answer a few questions about your server", "These questions will make sure that your server is supported and that you'll get the most out of Delta Web Map."));
        builder.AddContentCustom(this._CreateChecklistItem(2, "Install the Delta Web Map mod", "We'll help you install the Delta Web Map ARK mod. It'll run quietly in the background to make your server sync with Delta Web Map."));
        builder.AddContentCustom(this._CreateChecklistItem(3, "Join your ARK server in-game", "Log in as an admin so Delta Web Map can find out who owns the server."));
        builder.AddContentCustom(this._CreateChecklistItem(4, "Configure Server", "Configure permissions, the server name, and the server icon from this setup window."));
        builder.AddContentCustom(this._CreateChecklistItem(5, "Your players join the ARK server and can use Delta Web Map", "Delta Web Map will automatically add players to their tribes."));

        builder.AddContentBigNav([
            {
                "title": "Continue",
                "callback": () => {
                    this._ShowQuestionForm();
                },
                "is_big": false
            }
        ]);
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowQuestionForm() {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        //Create maps
        var maps = [];
        for (var i = 0; i < app.guildSetupConfig.supported_maps.length; i += 1) {
            maps.push({
                "id": app.guildSetupConfig.supported_maps[i],
                "text": app.guildSetupConfig.supported_maps[i]
            });
        }
        maps.push({
            "id": "OTHER",
            "text": "Not Listed"
        });

        //Create hosts
        var hosts = [];
        for (var i = 0; i < app.guildSetupConfig.config.supported_hosts.length; i += 1) {
            hosts.push({
                "id": app.guildSetupConfig.config.supported_hosts[i].id,
                "text": app.guildSetupConfig.config.supported_hosts[i].display_name
            });
        }

        builder.AddContentTitle("Collecting Information");
        builder.AddContentDescription("Answer the following questions about your server.");
        builder.AddFormSelect("platform", "Server Platform", [
            {
                "id": "steam",
                "text": "Steam"
            },
            {
                "id": "console",
                "text": "Other"
            }
        ], "", {
            "fValidate": (v) => {
                if (v == "") {
                    //Not selected
                    return "This question is required.";
                } else if (v != "steam") {
                    //Failed
                    return "Sorry, due to limitations of other platforms, we can't support them. You won't be able to set up Delta Web Map.";
                } else {
                    //OK
                    return null;
                }
            }
        });
        builder.AddFormSelect("map", "Server Map", maps, "", {
            "fValidate": (v) => {
                if (v == "") {
                    //Not selected
                    return "This question is required.";
                } else {
                    //OK
                    return null;
                }
            }
        });
        builder.AddFormSelect("host", "Server Hosting", hosts, "", {
            "fValidate": (v) => {
                if (v == "") {
                    //Not selected
                    return "This question is required.";
                } else {
                    //OK
                    return null;
                }
            }
        });
        builder.AddContentDescription("Server hosting information is just used to guide you through setup. If you're not sure, choose \"Other Hosting\".");

        builder.AddContentBigNav([
            {
                "title": "Continue",
                "callback": () => {
                    //Validate
                    if (builder.ValidateForm()) {
                        //Get form data
                        var form = builder.GetFormValues();
                        var provider = form.host;
                        if (form.map == "OTHER") {
                            this._ShowMapNotSupported(provider);
                        } else {
                            this._ShowInstallStep(provider);
                        }
                    }
                },
                "is_big": false
            }
        ]);
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowMapNotSupported(provider) {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Map Not Supported");
        builder.AddContentDescription("The map you selected isn't currently supported by Delta Web Map. Support may be added in the future.");
        builder.AddContentDescription("You can continue to use Delta Web Map, but you won't see any map tiles yet.");

        builder.AddContentBigNav([
            {
                "title": "Continue",
                "callback": () => {
                    this._ShowInstallStep(provider);
                },
                "is_big": false
            }
        ]);
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowInstallStep(providerId) {
        //Get provider info from ID
        var provider = null;
        for (var i = 0; i < this.app.guildSetupConfig.config.supported_hosts.length; i += 1) {
            if (this.app.guildSetupConfig.config.supported_hosts[i].id == providerId) {
                provider = this.app.guildSetupConfig.config.supported_hosts[i];
            }
        }

        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Install Mod");
        builder.AddContentDescription("Install the Delta Web Map mod. The mod ID and a link to the Steam Workshop are below.");
        if (provider.type == "SELF") {
            builder.AddContentWarningBox("Due to limitations of ARK, we're unable to use an encrypted connection (SSL). Make sure your ARK server is running on a secure network.");
        }

        //Create video
        var video = DeltaTools.CreateDom("iframe", "modal_preset_subtitle");
        video.width = "440px";
        video.height = "248px";
        video.style.border = "none";
        video.allow = "autoplay; encrypted-media";
        video.allowFullscreen = true;
        video.src = "https://www.youtube-nocookie.com/embed/" + provider.tutorial_video_id + "?rel=0";
        builder._AddContent(video);

        //Create mod ID 
        var modIdArea = DeltaTools.CreateDom("div", "gs_modid");
        DeltaTools.CreateDom("span", null, modIdArea, "Mod ID " + this.app.guildSetupConfig.config.steam_mod_id + " - ");
        var modIdLink = DeltaTools.CreateDom("a", null, modIdArea, "Open Steam Workshop");
        modIdLink.href = "https://steamcommunity.com/sharedfiles/filedetails/?id=" + this.app.guildSetupConfig.config.steam_mod_id;
        modIdLink.target = "_blank";
        builder._AddContent(modIdArea);

        builder.AddContentBigNav([
            {
                "title": "Continue",
                "callback": () => {
                    video.remove();
                    this._ShowWaitingPrompt(providerId);
                },
                "is_big": false
            }
        ]);
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowWaitingPrompt(providerId) {
        //Prompts the user for their platform
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Join Server");
        builder.AddContentDescription("Start your ARK server and log into it as an admin. This screen will automatically change within a minute once you connect as an admin.");
        builder.AddContentDescription("Missed a step? Click here to go back.").addEventListener("click", () => {
            this._ShowInstallStep(providerId);
        });

        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());

        //From this point, we wait until we get a notification of a server waiting
    }
}