"use strict";

class DeltaGuildCreator {

    constructor(app, guild) {
        this.app = app;
        //SPECIFY THE GUILD TO SET THAT GUILD UP, or leave it null to start from the beginning

        //Set as active creator
        this.app.active_creator = this;

        this.settings = {
            "host": null
        }

        this.guild = guild; //When we connect for the first time, this will be set

        this.ICON_BUILDER_SPECIES = [
            { "name": "Allo_Character_BP", "align": "right" },
            { "name": "Argent_Character_BP", "align": "right" },
            { "name": "Raptor_Character_BP", "align": "right" },
            { "name": "Baryonyx_Character_BP", "align": "left" },
            { "name": "Basilisk_Character_BP", "align": "right" },
            { "name": "BionicPara_Character_BP", "align": "left" },
            { "name": "BionicGigant_Character_BP", "align": "left" },
            { "name": "Bigfoot_Character_BP", "align": "left" },
            { "name": "Rex_Character_BP", "align": "right" },
            { "name": "BionicQuetz_Character_BP", "align": "right" },
            { "name": "BionicStego_Character_BP", "align": "right" },
            { "name": "CaveWolf_Character_BP", "align": "right" },
            { "name": "Compy_Character_BP_Child_GNS", "align": "left" },
            { "name": "CrystalWyvern_Character_BP_Base", "align": "right" },
            { "name": "Deinonychus_Character_BP", "align": "left" },
            { "name": "Equus_Character_BP", "align": "right" },
            { "name": "Enforcer_Character_BP", "align": "left" },
            { "name": "Galli_Character_BP", "align": "right" },
            { "name": "Griffin_Character_BP", "align": "left" },
            { "name": "IceKaiju_Character_BP", "align": "right" },
            { "name": "Kapro_Character_BP_Race", "align": "right" },
            { "name": "Microraptor_Character_BP", "align": "right" },
            { "name": "Pachy_Character_BP", "align": "right" },
            { "name": "Phoenix_Character_BP", "align": "right" },
            { "name": "Ptero_Character_BP", "align": "right" },
            { "name": "Procoptodon_Character_BP", "align": "left" },
            { "name": "Sarco_Character_BP", "align": "right" },
            { "name": "Snow_Rhino_Character_BP", "align": "right" },
            { "name": "Yutyrannus_Character_BP", "align": "right" },
            { "name": "Therizino_Character_BP", "align": "left" },
            { "name": "Spino_Character_BP", "align": "left" }
        ];

        //Create modal
        this.modal = app.modal.AddModal(480, 640);

        //Create loading slide
        this.modal.AddPage(DeltaModalBuilder.GetLoadingView());

        //Begin loading
        DeltaTools.WebRequest(window.LAUNCH_CONFIG.CONFIG_API_ENDPOINT + "/" + window.LAUNCH_CONFIG.CONFIG_ENV + "/frontend/guild_setup.json", {"noauth":true}, null).then((config) => {
            //Set config
            this.config = config;

            //Show first slide
            if (this.guild == null) {
                this._ShowPlatformSelector();
            } else {
                this._OnFoundServer(this.guild);
            }
        });
    }

    _Cancel() {
        this.modal.Close();
        this.app.active_creator = null;
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
            this._ShowInsecureWarning();
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

    _ShowInsecureWarning() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Traffic Unencrypted");
        builder.AddContentWarningBox("Wildcard does not allow us to use an encrypted connection to communicate with your ARK server. Make sure that the network you are running your ARK server on is secure. This won't matter to the majority of server owners.");

        builder.AddAction("Continue", "POSITIVE", () => {
            this._ShowModInstallPrompt();
        });
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









    _OnFoundServer(guild) {
        this.guild = guild;
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "A Wild Server Appears!");
        builder.AddContentCustomText("gs_subtitle", "Your ARK server \"" + guild.info.display_name + "\" just connected to Delta Web Map!");
        builder.AddContentCustomText("gs_subtitle", "We'll set up your server and get it ready for use. You can modify the name here if you'd like.");
        var name = DeltaTools.CreateDom("input", "gs_name");
        name.placeholder = "Server Name";
        name.value = guild.info.display_name;
        name.type = "text";
        name.addEventListener("input", () => {
            if (name.value.length < 2 || name.value.length > 32) {
                name.classList.add("gs_name_invalid");
            } else {
                name.classList.remove("gs_name_invalid");
            }
        });
        builder.AddContentCustom(name);

        builder.AddAction("Save", "POSITIVE", () => {
            if (name.value.length >= 2 && name.value.length <= 32) {
                this._ApplyName(name.value);
            }
        });
        builder.AddAction("Delete Server", "NEGATIVE", () => {
            this._PromptDeleteServer();
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    async _ApplyName(name) {
        //Show
        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("gs_title", "Applying Settings");
        builder.AddContentCustomText("gs_subtitle", "Wait just a second...");
        var d = DeltaTools.CreateDom("div", "gs_loading_waiting");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        builder.AddContentCustom(d);
        this.modal.AddPage(builder.Build());

        //Apply
        await this.guild.SetName(name);

        this._ShowIconPrompt();
    }

    _PromptDeleteServer() {
        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("modal_preset_title", "Delete " + this.guild.info.display_name);
        builder.AddContentCustomText("modal_preset_subtitle", "Cancel setup and delete this server? This will not impact the game server.");
        builder.AddAction("Delete", "NEGATIVE", () => {
            this.modal.AddPage(DeltaModalBuilder.GetLoadingView());
            this.guild.DeleteServer().then(() => {
                //Open end dialog
                var builder = new DeltaModalBuilder();
                builder.AddContentCustomText("modal_preset_title", "Finish Removal");
                builder.AddContentCustomText("modal_preset_subtitle", "To finish removing Delta Web Map, remove the mod from your server and reboot.");
                builder.AddContentCustomText("modal_preset_subtitle", "Not removing the mod from your server will cause Delta Web Map to enable again next time you reboot the server.");
                builder.AddAction("Okay", "NEUTRAL", () => {
                    this._Cancel();
                });
                this.modal.AddPage(builder.Build());
            });
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._OnFoundServer(this.guild);
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowIconPrompt() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Customize Icon");
        builder.AddContentCustomText("gs_subtitle", "Personalize your server by giving it a custom icon.");

        //Create top bit
        builder.AddContentCustomText("gs_icon_upload", "Click to upload icon").addEventListener("click", () => {
            DeltaTools.OpenImageFileDialog((f) => {
                this._SubmitIcon({
                    "type": "file",
                    "blob": f
                });
            });
        });
        builder.AddContentCustomText("gs_iconmaker_title", "Or, Create a custom icon now");

        //Define settings
        var makerColor = "hsl(0, 74%, 57%)";
        var makerIcon = "";
        var makerAlign = "";

        //Create canvas
        var canvas = DeltaTools.CreateDom("div", "gs_iconmaker_canvas");
        var canvasDino = DeltaTools.CreateDom("img", "gs_iconmaker_canvas_dino", canvas);
        builder.AddContentCustom(canvas);

        //Create color bar
        var colorBar = DeltaTools.CreateDom("div", "gs_iconmaker_colorbar");
        var colorGrabber = DeltaTools.CreateDom("div", "gs_iconmaker_colorbar_grabber", colorBar);
        var colorBarMouseDown = false;
        colorBar.addEventListener("mousedown", () => {
            colorBarMouseDown = true;
        });
        colorBar.addEventListener("mouseup", () => {
            colorBarMouseDown = false;
        });
        colorBar.addEventListener("mousemove", (e) => {
            if (!colorBarMouseDown) { return; }
            var x = e.x - colorBar.getBoundingClientRect().left;
            colorGrabber.style.left = (x - 5).toString() + "px";
            var color = "hsl(" + ((x / colorBar.clientWidth) * 360) + ", 74%, 57%)";
            colorGrabber.style.backgroundColor = color;
            canvas.style.backgroundColor = color;
            makerColor = color;
        });
        builder.AddContentCustom(colorBar);

        //Create the dino holder
        var dinoHolder = DeltaTools.CreateDom("div", "gs_iconmaker_dino_holder");
        for (var i = 0; i < this.ICON_BUILDER_SPECIES.length; i += 1) {
            var s = this.app.db.species.species[this.ICON_BUILDER_SPECIES[i].name];
            if (s == null) { continue; }
            var d = DeltaTools.CreateDom("img", "gs_iconmaker_dino", dinoHolder);
            if (s.classname == "Raptor_Character_BP") {
                //Default
                canvasDino.src = s.icon.image_url;
                canvasDino.classList.add("gs_iconmaker_canvas_dino_right");
                d.classList.add("gs_iconmaker_dino_selected");
                dinoHolder._active = d;
                makerIcon = s.icon.image_url;
                makerAlign = "right";
            }
            d.src = s.icon.image_thumb_url;
            d._name = s.classname;
            d._align = this.ICON_BUILDER_SPECIES[i].align;
            d.addEventListener("click", (e) => {
                canvasDino.src = "";
                canvasDino.src = this.app.db.species.species[e.target._name].icon.image_url;
                canvasDino.classList.remove("gs_iconmaker_canvas_dino_left");
                canvasDino.classList.remove("gs_iconmaker_canvas_dino_right");
                canvasDino.classList.add("gs_iconmaker_canvas_dino_" + e.target._align);
                dinoHolder._active.classList.remove("gs_iconmaker_dino_selected");
                dinoHolder._active = e.target;
                e.target.classList.add("gs_iconmaker_dino_selected");
                makerIcon = this.app.db.species.species[e.target._name].icon.image_url;
                makerAlign = e.target._align;
            });
        }
        builder.AddContentCustom(dinoHolder);

        builder.AddAction("Save", "POSITIVE", () => {
            this._SubmitIcon({
                "type": "maker",
                "makerColor": makerColor,
                "makerIcon": makerIcon,
                "makerAlign": makerAlign
            });
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    async _SubmitIcon(payload) {
        //Create view
        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("gs_title", "Uploading Icon");
        builder.AddContentCustomText("gs_subtitle", "Wait a moment...");
        var d = DeltaTools.CreateDom("div", "gs_loading_waiting");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        builder.AddContentCustom(d);
        this.modal.AddPage(builder.Build());

        //Build and upload
        var blob;
        if (payload.type == "maker") {
            //Download dino icon
            var icon = await DeltaTools.DownloadImageAsync(payload.makerIcon);

            //Create canvas
            var c = DeltaTools.CreateDom("canvas", null);
            c.width = icon.width;
            c.height = icon.height;
            var ctx = c.getContext('2d');

            //Fill with background
            ctx.beginPath();
            ctx.rect(0, 0, c.width, c.height);
            ctx.fillStyle = payload.makerColor;
            ctx.fill();

            //Add image
            var y = c.height * 0.08;
            var x;
            if (payload.makerAlign == "right") {
                x = c.width * 0.20;
            } else {
                x = c.width * -0.20;
            }
            ctx.filter = 'invert(1)'
            ctx.drawImage(icon, x, y);

            //Generate
            blob = await new Promise((resolve, reject) => {
                c.toBlob((b) => {
                    resolve(b);
                })
            });
        } else if (payload.type == "file") {
            blob = payload.blob;
        }
        
        //Upload
        try {
            await this.guild.UploadNewIcon(blob);
        } catch (e) {
            console.error("ERROR UPLOADING ICON");
            this._ShowIconPrompt();
            return;
        }

        this._ShowTemplatePrompt();
    }

    _ShowTemplatePrompt() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "Set Up Permissions");
        builder.AddContentCustomText("gs_subtitle", "The security of your server is important to us. Choose a permission level that best fits your server. You can change specific settings later.");

        var activeBtn = null;
        for (var i = 0; i < this.config.security_levels.length; i += 1) {
            var s = this.config.security_levels[i];
            var b = this._CreateWideBtn(s.name, s.description, (e) => {
                //Clear current active button
                activeBtn.style.backgroundColor = null;
                activeBtn.style.borderColor = null;
                activeBtn.style.color = null;

                //Set the status of the current button
                var bb = e.currentTarget;
                var bs = bb._level;
                bb.style.backgroundColor = bs.color;
                bb.style.borderColor = bs.color;
                bb.style.color = "white";
                activeBtn = bb;
            });
            b._level = s;
            if (s.default) {
                b.style.backgroundColor = s.color;
                b.style.borderColor = s.color;
                b.style.color = "white";
                activeBtn = b;
            }
            builder.AddContentCustom(b);
        }

        builder.AddAction("Save", "POSITIVE", () => {
            this._ApplyTemplate(activeBtn._level);
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    async _ApplyTemplate(template) {
        //Show
        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("gs_title", "Applying Settings");
        builder.AddContentCustomText("gs_subtitle", "Wait just a second...");
        var d = DeltaTools.CreateDom("div", "gs_loading_waiting");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        builder.AddContentCustom(d);
        this.modal.AddPage(builder.Build());

        //Apply
        await this.guild.SetPermissionTemplate(template);
        await this.guild.SetLocked(false);

        this._ShowFinishPage();
    }

    _ShowFinishPage() {
        var builder = new DeltaModalBuilder();

        builder.AddContentCustomText("gs_title", "All Done!");
        builder.AddContentCustomText("gs_subtitle", "You're ready to go! It'll take a few minutes for all of your ARK content to be loaded into Delta Web Map.");
        builder.AddContentCustomText("gs_subtitle", "Head into the admin tab to further refine your settings. From there, you can also add server admins.");

        builder.AddAction("Finish", "POSITIVE", () => {
            this.app.SwitchServer(this.guild);
            this._Cancel();
        });
        this.modal.AddPage(builder.Build());
    }
}