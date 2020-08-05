"use strict";

var SYSTEM_VERSION_MAJOR = 0;
var SYSTEM_VERSION_MINOR = 1;
var SYSTEM_RELEASE_ENV = "ALPHA";

class DeltaApp {

    /* This class is the main class that sets up the rest of the app */

    constructor(settings) {
        this.servers = {};
        this.settings = settings;
        /* SETTINGS:
         * mountpoint [dom] - Where the app will be mounted
         * 
         */
        this.loaderScreen = null;
        this.species = null;
        this.rpc = new DeltaRPC(this);
        this.user = new DeltaUser(this);
        this.lastServer = null;
        this.structureMetadata = null;
        this.viewUserSettings = new DeltaUserSettingsTabView(this);
        this.maps = {};
        this.modal = null;
        this.config = null;
        this.clusterItems = {};
        this.structureTool = null;
        this.primalPackageManager = null;
    }

    async Init() {
        /* Called when the app is first loaded */

        //Create DOM
        this.LayoutDom(this.settings.mountpoint);

        //Load network resources
        await this.InitNetworkResources();

        //Create package manager
        this.primalPackageManager = new PrimalPackageManager();

        //Set up full DOM
        this.TriggerLoaderHide();
        this.LayoutMainView(this.settings.mountpoint);

        //Create message views
        this.msgViewNoServers = this.CreateMessageView("", "No Servers", "Sorry, you don't seem to have any servers. Join an ARK server with Delta Web Map to get started.");
        this.msgViewActiveServerErr = this.CreateMessageView("", "D'oh!", "D'oh!<br><br>Looks like the current ARK server has become unavailable. Check back soon!");
        this.msgViewServerNotFound = this.CreateMessageView("", "Server Not Found", "Hmph.<br><br>You don't have access to this ARK server, the server was removed, or it never existed to begin with.");
        this.msgViewServerRequestedNotOk = this.CreateMessageView("", "Server Not Found", "Hmph.<br><br>The server you attempted to access is unavailable. Try again later.");
        this.msgViewServerRemoved = this.CreateMessageView("", "Server Removed", "The server you were viewing has been removed.");

        //Boot up servers
        for (var i = 0; i < this.user.data.servers.length; i += 1) {
            //Get server info
            var info = this.user.data.servers[i];
            this.BootServer(info);
        }

        //Add "add server" button
        DeltaTools.CreateDom("div", "v3_nav_server_add", this.serverListHolder, "Add Server").addEventListener("click", () => {
            new DeltaGuildCreator(this);
        });

        //Swtich to the default server
        this.SwitchServer(this.GetDefaultServer());

        //Bind to RPC events
        this.rpc.SubscribeGlobal("app-server-joined", 30001, (m) => {
            //We've just joined a server. Add it to the server list
            this.user.data.servers.push(m.guild);
            var server = this.BootServer(m.guild);
            this.SwitchServer(server);
        });
    }

    BootServer(info) {
        //Get a cluster to place this in
        var clusterTarget;
        if (info.cluster_id == null) {
            clusterTarget = "_UNCLUSTERED";
        } else {
            clusterTarget = info.cluster_id;
        }
        var cluster;
        /*if (this.clusterItems[clusterTarget] == null) {
            //We must create it
            if (info.cluster_id == null) {
                cluster = this.CreateServerListClusterLabel(this.serverListHolder, "UNCATEGORIZED");
            } else {
                cluster = this.CreateServerListClusterLabel(this.serverListHolder, "UNCATEGORIZED");
            }
            this.clusterItems[clusterTarget] = cluster;
        } else {
            //Already exists
            cluster = this.clusterItems[clusterTarget];
        }*/
        cluster = this.serverListHolder;

        //Create server and it's menu
        var server = new DeltaServer(this, info);
        this.servers[info.id] = server;

        //Create menu
        cluster.appendChild(server.CreateMenuItem());
        server.SetUserInterfaceSecureStatus(info.secure_mode);

        //Create mountpoint and init
        var m = DeltaTools.CreateDom("div", "server_mountpoint", this.mainHolder);
        server.Init(m);

        return server;
    }

    async InitNetworkResources() {
        var tries = 0;
        while (true) {
            try {
                //Get config
                this.config = await DeltaTools.WebRequest(LAUNCH_CONFIG.CONFIG_API_ENDPOINT + "/prod/frontend/config.json", { "noauth": true }, null);

                //Get structure metadata
                this.structureMetadata = await DeltaTools.WebRequest(LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/structure_metadata.json", {}, null);

                //Begin init of structure tool (this will take a bit)
                this.structureTool = new DeltaStructureTool(this, this.structureMetadata.metadata);
                var structureToolSetup = this.structureTool.Init();

                //Set up the user
                await this.user.RefreshData();

                //Get map list
                this.maps = await DeltaTools.WebRequest(LAUNCH_CONFIG.API_ENDPOINT + "/maps.json", {}, null);

                //Wait for structure setup to finish
                await structureToolSetup;

                break;
            } catch (e) {
                //Log
                console.error("Hit exception while initializing on attempt " + tries + "!");
                console.error(e);

                //Set error state
                if (tries > 0) {
                    this.TriggerLoaderError();
                }
                tries++;

                //Try again shortly
                await DeltaTools.AsyncDelay(3000);
            }
        }
    }

    GetStructureEntryByClassName(name) {
        for (var i = 0; i < this.structureMetadata.metadata.length; i += 1) {
            if (this.structureMetadata.metadata[i].names.includes(name)) {
                return this.structureMetadata.metadata[i];
            }
        }
        return null;
    }

    TriggerLoaderError() {
        this.loaderScreen.classList.add("intro_slide_state_error");
    }

    TriggerLoaderHide() {
        this.loaderScreen.classList.add("intro_slide_hide");
    }

    LayoutLoginScreen(mount) {

    }

    LayoutDom(mount) {
        //Create the intro page
        var intro = DeltaTools.CreateDom("div", "intro_slide", mount);
        DeltaTools.CreateDom("div", "intro_slide_info", intro, "(C) DeltaWebMap, RomanPort 2020 - " + SYSTEM_RELEASE_ENV + " v" + SYSTEM_VERSION_MAJOR + "." + SYSTEM_VERSION_MINOR);
        var introContent = DeltaTools.CreateDom("div", "intro_slide_content", intro);
        var introBody = DeltaTools.CreateDom("div", "", introContent);
        DeltaTools.CreateDom("div", "intro_slide_body_title", introBody, "DeltaWebMap");
        DeltaTools.CreateDom("div", "loading_spinner", DeltaTools.CreateDom("div", "intro_slide_body_loader", introBody));
        var introWarning = DeltaTools.CreateDom("div", "intro_slide_warning intro_slide_warning_base", intro);
        DeltaTools.CreateDom("div", "intro_slide_warning_box", introWarning, "Hang tight! We're having troubles connecting.");
        var introSpecies = DeltaTools.CreateDom("div", "intro_slide_first intro_slide_warning_base", intro);
        DeltaTools.CreateDom("div", "intro_slide_warning_box intro_slide_warning_box_blue", introSpecies, "Hang tight! We're downloading first time information. This may take a moment, but will only happen once.");
        this.loaderScreen = intro;

        //Create modal view
        this.modal = new DeltaModalContainer(mount, this);
    }

    LayoutMainView(parent) {
        //Create top banner
        var banner = DeltaTools.CreateDom("div", "error_box_generic error_box_fixed_top_banner", parent);

        var mount = DeltaTools.CreateDom("div", "main_view", parent);
        this.mainHolder = mount;

        var leftSidebar = DeltaTools.CreateDom("div", "dino_sidebar smooth_anim dino_sidebar_open v3_nav_area", mount);
        this.serverListHolder = DeltaTools.CreateDom("div", "v3_nav_server_area", leftSidebar);
        var bottom = DeltaTools.CreateDom("div", "v3_nav_bottom", leftSidebar);

        var top = DeltaTools.CreateDom("div", "top_nav", leftSidebar); //Top strip. Pretty much has no use except to show a darker color at this point, though
        DeltaTools.CreateDom("span", "delta_nav_badge_beta", DeltaTools.CreateDom("div", "delta_nav_badge", top, "DeltaWebMap"), "BETA").addEventListener("click", () => {
            this.OpenDebugInfoPanel();
        });

        //Add bottom options
        this._AddBottomButton(bottom, "v3_nav_bottom_btn_settings", () => {

        });
        this._AddBottomButton(bottom, "v3_nav_bottom_btn_flag", () => {

        });

        //Add context menu listener
        DeltaContextMenu.AddContextListener(parent, this);
    }

    _AddBottomButton(mount, icon, callback) {
        var b = DeltaTools.CreateDom("div", "v3_nav_bottom_btn", mount);
        b.classList.add(icon);
        b.addEventListener("click", callback);
        return b;
    }

    CreateServerListClusterLabel(container, name) {
        //Create the label itself
        DeltaTools.CreateDom("div", "v3_nav_server_label", container).innerText = name;

        //Now, create the container
        return DeltaTools.CreateDom("div", "", container);
    }

    SwitchServer(server) {
        /* This will switch to a new server, switching away from the last one */
        
        //Check if we're already on this server
        if (this.lastServer == server) {
            return;
        }

        //If this server hasn't been set up yet, do so
        if (server.info != null) {
            if (server.info.flags == 3) {
                //TODO, fix these args
                if (this.active_creator != null) {
                    if (this.active_creator.guild == null) {
                        this.active_creator._OnFoundServer(server);
                        return;
                    } else {
                        //Ignore for now
                        return;
                    }
                }

                //Open guild creator
                new DeltaGuildCreator(this, server);

                //TODO
                return;
            }
        }

        //Check status (if needed)
        var status = null;
        if (server.CheckStatus != null) {
            status = server.CheckStatus();
        }
        if (status != null) {
            console.log("Failed to switch with error " + status);
            return status;
        }

        //Switch away from the last server, if any
        if (this.lastServer != null) {
            this.lastServer.OnSwitchedAway();
        }

        //Switch to this server
        this.lastServer = server;
        server.OnSwitchedTo();
        this.RefreshBrowserMetadata();
        return null;
    }

    GetDefaultServer() {
        /* This will get the default server, used when running the app. If no servers can be switched to, this will display a generic error screen */

        var id = null;
        var server = null;
        var status = null;

        //Check the url
        var urlParts = window.location.pathname.split('/');
        if (urlParts.length >= 3) {
            id = urlParts[2];

            //Check ID length to see if this is a server ID
            if (id.length == 24) {
                //This is a server ID. Try to see if this server exists
                server = this.servers[id];
                if (server != null) {
                    status = server.CheckStatus();
                    if (status == null) {
                        return server;
                    } else {
                        return this.msgViewServerRequestedNotOk;
                    }
                } else {
                    return this.msgViewServerNotFound;
                }
            }

            //Check if this is a special ID
            if (id == "settings") {
                //Open settings
                return this.viewUserSettings; //TODO
            }
        }

        //Check the latest server
        id = localStorage.getItem("latest_server");
        server = null;
        status = null;
        if (id != null) {
            server = this.servers[id];
            if (server != null) {
                status = server.CheckStatus();
                if (status == null) {
                    return server;
                }
            }
        }

        //If we have a server, use it
        for (var i = 0; i < this.user.data.servers.length; i += 1) {
            server = this.servers[this.user.data.servers[i].id];
            status = server.CheckStatus();
            if (status == null) {
                return server;
            }
        }

        //No default to load!
        return this.msgViewNoServers;
    }

    RefreshBrowserMetadata() {
        /* Refreshes native browser stuff, like tab title and URL*/

        if (this.lastServer != null) {
            document.title = this.lastServer.GetDisplayName() + " - Delta Web Map";
            history.replaceState(null, name, "/app/" + this.lastServer.GetUrl());
        } else {
            document.title = "Delta Web Map";
            history.replaceState(null, name, "/app/");
        }
    }

    CreateMessageView(url, title, message) {
        var e = new DeltaHtmlTabView(this, title, url, message);
        e.Init(DeltaTools.CreateDom("div", "server_mountpoint", this.mainHolder));
        return e;
    }

    OpenPromptModal(title, subtitle, positiveText, negativeText, positiveAction, negativeAction, positiveType, negativeType) {
        var modal = this.modal.AddModal(480, 250);

        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("modal_preset_title", title);
        builder.AddContentCustomText("modal_preset_subtitle", subtitle);
        builder.AddAction(positiveText, positiveType, () => {
            modal.Close();
            positiveAction();
        });
        builder.AddAction(negativeText, negativeType, () => {
            modal.Close();
            negativeAction();
        });
        modal.AddPage(builder.Build());
    }

    OpenNoticeModal(title, subtitle) {
        var modal = this.modal.AddModal(480, 290);

        var builder = new DeltaModalBuilder();
        builder.AddContentCustomText("modal_preset_title", title);
        builder.AddContentCustomText("modal_preset_subtitle", subtitle);
        builder.AddAction("Okay", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    async OpenDebugInfoPanel() {
        var modal = this.modal.AddModal(480, 590);

        var builder = new DeltaModalBuilder();
        builder.AddContentTitle("Delta Debug Panel");
        builder.AddContentDescription("Use the information on this page for support during the beta period.");
        builder.AddLabledText("Account Info", "Delta ID: " + this.user.data.id + "\nSteam ID: " + this.user.data.steam_id + "\nName: " + this.user.data.screen_name);
        builder.AddLabledText("Account Settings", JSON.stringify(this.user.data.user_settings));
        builder.AddLabledText("App Version", SYSTEM_RELEASE_ENV + " at " + SYSTEM_VERSION_MAJOR.toString() + "." + SYSTEM_VERSION_MINOR.toString());

        builder.AddAction("Close", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    async CaptureScreenshot() {
        //Show loader
        var loader = DeltaTools.CreateDom("div", "screenshot_working", this.settings.mountpoint);
        DeltaTools.CreateDom("div", "loading_spinner", loader);

        //Load JS script
        var script = document.createElement('script');
        var scriptLoad = new Promise(function (resolve, reject) {
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject();
            }
        });
        script.src = "/assets/app/external/html2canvas.min.js";
        document.head.appendChild(script);
        await scriptLoad;

        //Capture
        var canvas = await html2canvas(this.settings.mountpoint, {
            useCORS: true,
            ignoreElements: loader
        });

        console.log(canvas);
    }

    ShowNews() {
        var modal = this.modal.AddModal(480, 590);

        var builder = new DeltaModalBuilder();
        builder.AddContentTitle("👋 Welcome to Delta Web Map!");
        builder.AddContentDescription("Thanks for using Delta Web Map! We're so excited to bring you the latest news and updates to the app.");

        builder.AddLabledText("How do I get started?", "To get started with Delta Web Map, you can either join an ARK server with Delta Web Map installed using Steam, or you can add Delta Web Map to your own server.");

        builder.AddBulletList("Features on the horizon", [
            "Steam Workshop mod support",
            "ARK Smart Breeder Integration",
            "Interactive map canvases, shared with your tribe",
            "Dinosaur raising features"
        ]);

        builder.AddBulletList("Features planned a little farther out", [
            "Fully-featured Android app",
            "Push notifications"
        ]);

        builder.AddContentDescription("Don't forget to [join our Discord server](https://discord.gg/99TcfCT) for the latest news and updates! You can also use the flag button in the bottom left of the app to report any problems.");

        builder.AddAction("Okay", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

}