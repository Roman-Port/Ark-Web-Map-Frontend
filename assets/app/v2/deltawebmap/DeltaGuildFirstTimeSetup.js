"use strict";

class DeltaGuildFirstTimeSetup {

    constructor(server, modal /* optional */, cancelCallback) {
        this.guild = server;
        this.cancelCallback = cancelCallback;
        this.app = this.guild.app;
        this.iconBuilderSpecies = this.app.guildSetupConfig.dino_icon_templates;
        this.modal = modal;
        this.serverSettings = {
            "name": null,
            "permissions": null
        }
        if (this.modal == null) {
            //Create modal
            this.modal = app.modal.AddModal(480, 640);
        }

        //Show
        this._ShowIntro();
    }

    _Cancel() {
        this.modal.Close();
        this.cancelCallback();
    }

    _PromptCancel() {
        var modal = app.modal.AddModal(480, 240);
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Cancel Server Setup");
        builder.AddContentDescription("Are you sure you'd like to cancel server setup? Players are unable to use your Delta Web Map server until it's finished.");

        builder.AddAction("Continue", "POSITIVE", () => {
            modal.Close();
        });
        builder.AddAction("Delete Server", "NEGATIVE", () => {
            this.server.DeleteServer();
            modal.Close();
            this._Cancel();
        });
        builder.AddAction("Exit", "NEUTRAL", () => {
            modal.Close();
            this._Cancel();
        });
        modal.AddPage(builder.Build());
    }

    _CreateWideBtn(title, subtitle, callback) {
        var b = DeltaTools.CreateDom("div", "gs_widebtn");
        DeltaTools.CreateDom("div", "gs_widebtn_title", b, title);
        DeltaTools.CreateDom("div", "", b, subtitle);
        b.addEventListener("click", callback);
        return b;
    }

    _ShowIntro() {
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("A Wild Server Appears!");
        builder.AddContentDescription("Your ARK server \"" + this.guild.info.display_name + "\" just connected to Delta Web Map!");
        builder.AddContentDescription("We'll set up your server and get it ready for use. You can modify the name here if you'd like.");
        builder.AddFormInput("server_name", "Server Name", this.guild.info.display_name, {
            "fValidate": (v) => {
                if (v.length > 32) {
                    return "Maximum length of the name is 32 characters.";
                }
                if (v.length == 0) {
                    return "This field is required.";
                }
                if (v.length < 2) {
                    return "Minimum length of the name is 2 characters.";
                }
                return null;
            }
        });

        builder.AddAction("Save", "POSITIVE", () => {
            //Validate
            if (builder.ValidateForm()) {
                //Get form data
                var form = builder.GetFormValues();
                this.serverSettings.name = form.server_name;

                //Go
                this._ShowIconPrompt();
            }
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    _ShowIconPrompt(errored) {
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Customize Icon");
        builder.AddContentDescription("Personalize your server by giving it a custom icon.");

        //Add warning
        if (errored) {
            builder.AddContentWarningBox("There was an error uploading your icon. Try again.");
        }

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
        var rand = Math.floor(Math.random() * this.iconBuilderSpecies.length);
        for (var i = 0; i < this.iconBuilderSpecies.length; i += 1) {
            var d = DeltaTools.CreateDom("img", "gs_iconmaker_dino", dinoHolder);
            if (i == rand) {
                //Default
                canvasDino.src = this.iconBuilderSpecies[i].icon_url_full;
                canvasDino.classList.add("gs_iconmaker_canvas_dino_" + this.iconBuilderSpecies[i].icon_align);
                d.classList.add("gs_iconmaker_dino_selected");
                dinoHolder._active = d;
                makerIcon = this.iconBuilderSpecies[i].icon_url_full;
                makerAlign = this.iconBuilderSpecies[i].icon_align;
            }
            d.src = this.iconBuilderSpecies[i].icon_url_thumb;
            d._align = this.iconBuilderSpecies[i].icon_align;
            d._full = this.iconBuilderSpecies[i].icon_url_full;
            d.addEventListener("click", (e) => {
                canvasDino.src = "";
                canvasDino.src = e.target._full;
                canvasDino.classList.remove("gs_iconmaker_canvas_dino_left");
                canvasDino.classList.remove("gs_iconmaker_canvas_dino_right");
                canvasDino.classList.add("gs_iconmaker_canvas_dino_" + e.target._align);
                dinoHolder._active.classList.remove("gs_iconmaker_dino_selected");
                dinoHolder._active = e.target;
                e.target.classList.add("gs_iconmaker_dino_selected");
                makerIcon = e.target._full;
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
        builder.AddContentTitle("Uploading Icon");
        builder.AddContentDescription("Wait a moment...");
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
            this._ShowIconPrompt(true);
            return;
        }

        this._ShowTemplatePrompt();
    }

    _ShowTemplatePrompt() {
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Set Up Permissions");
        builder.AddContentDescription("The security of your server is important to us. Choose a permission level that best fits your server. You can change specific settings later.");

        var activeBtn = null;
        for (var i = 0; i < this.app.guildSetupConfig.config.security_presets.length; i += 1) {
            var s = this.app.guildSetupConfig.config.security_presets[i];
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
            this.serverSettings.permissions = activeBtn._level;
            this._Save();
        });
        builder.AddAction("Cancel", "NEUTRAL", () => {
            this._PromptCancel();
        });
        this.modal.AddPage(builder.Build());
    }

    async _Save() {
        //Show
        var builder = new DeltaModalBuilder();
        builder.AddContentTitle("Saving Settings");
        builder.AddContentDescription("Wait just a second...");
        var d = DeltaTools.CreateDom("div", "gs_loading_waiting");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        builder.AddContentCustom(d);
        this.modal.AddPage(builder.Build());

        //Apply
        await this.guild.SetName(this.serverSettings.name);
        await this.guild.SetPermissionTemplate(this.serverSettings.permissions);
        await this.guild.SetLocked(false);

        this._ShowFinishPage();
    }

    _ShowFinishPage() {
        var builder = new DeltaModalBuilder();

        builder.AddContentTitle("Server Ready!");
        builder.AddContentDescription("You're ready to go! It'll take a few minutes for all of your ARK content to be loaded into Delta Web Map. Players can now see your server in Delta Web Map once they log into ARK.");
        builder.AddContentDescription("Head into the admin tab to further refine your settings. From there, you can also add server admins.");

        builder.AddAction("Finish", "POSITIVE", () => {
            this._Cancel();
            this.app.SwitchServer(this.guild);
        });
        this.modal.AddPage(builder.Build());
    }

}