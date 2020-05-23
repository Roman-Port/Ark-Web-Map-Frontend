"use strict";

class DeltaServer extends DeltaTabView {

    constructor(app, info) {
        super(app);

        //Set vars
        this.info = info;
        this.menu = null;
        this.mountpoint = null; //This is the main location where we will be able to attach our own stuff
        this.dispatcher = new DeltaEventDispatcher();
        this.id = info.id;
        this.tribe = 0;
        this.nativeTribe = 0;
        this.activeTab = -1;
        this.menu = null;
        this.prefs = info.user_prefs;
        this.first = true; //Set to false after this is opened for the first time
        this.myLocation = null; //May or may not be null
        this.downloadTask = null; //Task that is run to create a session on this server
        this.error = null;
        this.token = new DeltaCancellationToken(null);
        this.db = new DeltaServerDatabase(this);
        this.db_sessions = []; //Managed DB sessions. In format [collection_key, session_token, options];
        this.ready = false; //Set to true when all data has been synced
        this.bottomBanner = null;
        this.tribes = [];
        this.admin_mode = false;

        //Create tabs
        this.tabs = [
            new TabMap(this),
            new TabDinos(this),
            new TabItems(this),
            new TabAdmin(this)
        ];

        //Set some content
        this.myLocation = this.info.my_location;
        if (this.info.target_tribe != null) {
            this.tribe = this.info.target_tribe.tribe_id;
            this.nativeTribe = this.info.target_tribe.tribe_id;
        } else {
            this.tribe = '*';
            this.nativeTribe = '*';
        }
    }

    GetDisplayName() {
        return this.info.display_name;
    }

    GetUrl() {
        if (this.activeTab == -1) {
            return this.info.id;
        } else {
            return this.info.id + "/" + this.tabs[this.activeTab].GetId();
        }
    }

    CreateMenuItem() {
        //Get server info
        var info = this.info;

        //Create the server on the sidebar
        var menu = DeltaTools.CreateDom("div", "v3_nav_server");
        this.menu = menu;
        var top = DeltaTools.CreateDom("div", "v3_nav_server_top", menu);
        DeltaTools.CreateDom("img", "v3_nav_server_top_icon", top).src = info.image_url;
        var alertBadge = DeltaTools.CreateDom("div", "sidebar_server_error_badge", top, "!");
        menu.alertBadge = alertBadge;
        var loaderBadge = DeltaTools.CreateDom("div", "loading_spinner server_loader", top, "");
        menu.loaderBadge = loaderBadge;
        DeltaTools.CreateDom("span", "", top).innerText = info.display_name;
        var bottom = DeltaTools.CreateDom("div", "v3_nav_server_bottom", menu);

        //Add padlock
        DeltaTools.CreateDom("div", "v3_nav_server_bottom_secure", bottom).addEventListener("click", () => {
            //Show dialog about secure mode
            var modal = this.modal.AddModal(480, 290);
            var e = new DeltaModalBuilder();
            e.AddContentTitle("Server Using Secure Mode");
            e.AddContentDescription("The owner of this server has opted to enable secure mode. This prevents any other user, including server admins, from viewing or accessing your tribe information without being in your tribe.");
            e.AddContentDescription("Your server owner can opt out of this at any time, but you will be notified. This feature is built to make admin abuse using this app impossible.");
            e.AddAction("Close", "NEUTRAL", () => {
                modal.Close();
            });
            e.Build();
            modal.AddPage(e.Build());
        });

        //Finish creating menu
        for (var j = 0; j < this.tabs.length; j += 1) {
            var btn = this.tabs[j].CreateMenuItem(bottom);
            btn.x_index = j;
            btn.x_server = this;
            this.tabs[j].menu = btn;
            btn.addEventListener("click", function () {
                this.x_server.OnSwitchTab(this.x_index);
            });
        }

        //Add context menu
        DeltaContextMenu.AddContextMenu(menu, this, [
            [
                {
                    "name": "Hide Server",
                    "style": "red",
                    "callback": (app, server) => {
                        if (server.IsOwner()) {
                            return;
                        }
                        app.OpenPromptModal("Hide " + server.info.display_name, "Are you sure you want to hide " + server.info.display_name + "? Hiding a server will make it disappear from Delta Web Map until you rejoin the server in-game.", "Hide", "Cancel", () => {
                            if (server.IsAdmin()) {
                                //Warn about losing admin
                                app.OpenPromptModal("Give Up Admin", "Hiding " + server.info.display_name + " will give up your admin access on this server. Are you sure you want to hide it?", "Accept", "Cancel", () => {
                                    //Leave now
                                    server.HideServer();
                                }, () => { }, "NEGATIVE", "NEUTRAL");
                            } else {
                                //Leave now
                                server.HideServer();
                            }
                        }, () => { }, "NEGATIVE", "NEUTRAL");
                    },
                    "enabled": !this.IsOwner()
                }
            ],
            [
                {
                    "name": "Copy ID",
                    "callback": (app, server) => {
                        DeltaTools.CopyToClipboard(server.info.id);
                    }
                }
            ]
        ]);

        //Add event
        top.x_id = info.id;
        top.x_app = this.app;
        top.addEventListener("click", function () {
            this.x_app.SwitchServer(this.x_app.servers[this.x_id]);
        });

        return menu;
    }

    RemoveServer() {
        //If we're currently viewing this server, switch
        if (this.app.lastServer.id == this.id) {
            this.app.SwitchServer(this.app.msgViewServerRemoved);
        }

        //Remove menu
        this.menu.remove();

        //Remove our mountpoint. This might cause errors but the user won't see them
        this.mountpoint.remove();
    }

    GetTribeById(id) {
        for (var i = 0; i < this.tribes.length; i += 1) {
            if (this.tribes[i].tribe_id == id) {
                return this.tribes[i];
            }
        }
        return null;
    }

    GetTribeByIdSafe(id) {
        var t = this.GetTribeById(id);
        if (t != null) {
            return t;
        }
        //Return placeholder data
        return {
            "last_seen": "1980-01-01T01:00:00.000Z",
            "tribe_id": id,
            "tribe_name": "UNKNOWN TRIBE"
        };
    }

    SubscribeRPCEvent(tag, opcode, event) {
        app.rpc.SubscribeServer(this.info.id, tag, opcode, event);
    }

    UnsubscribeRPCEvent(tag) {
        app.rpc.UnsubscribeServer(this.info.id, tag);
    }

    SetLoaderStatus(shown) {
        if (shown) {
            this.menu.loaderBadge.classList.add("server_loader_active");
        } else {
            this.menu.loaderBadge.classList.remove("server_loader_active");
        }
    }

    GetMapInfo() {
        var m = this.app.maps.maps[this.info.map_id];
        if (m == null) {
            return this.app.maps.maps["DEFAULT"];
        }
        return m;
    }

    GetIsMapSupported() {
        return this.app.maps.maps[this.info.map_id] != null;
    }

    ForceAbort(error) {
        /* Aborts a server and triggers the error badge */

        //Set state
        this.error = error;
        this.menu.alertBadge.classList.add("sidebar_server_error_badge_active");
        this.SetLoaderStatus(false);

        //If we are the active server, boot the user out
        if (this.app.lastServer == this) {
            console.log("Kicking the user out of the active server due to an error.");
            this.app.SwitchServer(this.app.msgViewActiveServerErr);
        }
    }

    CancelTokens() {
        this.token.Cancel();
        this.token = new DeltaCancellationToken(null);
        for (var i = 0; i < this.tabs.length; i += 1) {
            this.tabs[i].token = new DeltaCancellationToken(this.token);
        }
    }

    Init(mountpoint) {
        super.Init(mountpoint);

        //Add banner mounts
        this.bottomBanner = new DeltaBannerMount(DeltaTools.CreateDom("div", "server_bottom_banner", mountpoint), null);

        //Check if the current map is compatible
        if (!this.GetIsMapSupported()) {
            this.bottomBanner.AddBanner("advanced_banner_style_red", "This map isn't supported. You won't be able to view map tiles for now. Sorry about that.", [], () => { });
        }

        //Check if we have a tribe
        if (!this.info.has_tribe && this.info.secure_mode) {
            this.bottomBanner.AddBanner("advanced_banner_style_red", "You don't have a tribe on this server, and secure mode is off. Turn off secure mode to view other tribes.", [], () => { });
        }

        //Check if secure mode has recently been toggled
        //TODO
        if (false) {
            this.bottomBanner.AddBanner("advanced_banner_style_red", "Server admins may have viewed your tribe content, as server security settings were recently changed by the server owner. Secure mode is currently " + (this.info.secure_mode ? "on" : "off") + ".", [
                {
                    "text": "Learn More",
                    "callback": () => {
                        this.app.OpenNoticeModal("About Secure Mode", "Secure mode is a setting that server owners can opt into. Secure mode prevents any other user, including server admins, from viewing or accessing your tribe information without being in your tribe.\n\nThis feature is built to make admin abuse using this app impossible. A padlock will appear next to the name of this server when secure mode is on.");
                    }
                }
            ], () => { });
        }

        //Init our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            var m = DeltaTools.CreateDom("div", "main_tab", this.mountpoint); //This is the mountpoint for the tab
            this.tabs[i].OnInit(m);
        }

        //Apply settings
        this.ApplyNewPermissions();

        //Add RPC events
        this.SubscribeRPCEvent("guild-secure-mode", 20004, (m) => this.OnRemoteSecureModeChanged(m));
        this.SubscribeRPCEvent("guild-permissions", 20005, (m) => {
            this.info.permission_flags = m.flags;
            this.ApplyNewPermissions();
        });
        this.SubscribeRPCEvent("guild-leave", 30004, (m) => {
            this.RemoveServer();
        });
    }

    OnRemoteSecureModeChanged(data) {
        var secure = data.secure;
        this.info.secure_mode = secure;
        this.SetUserInterfaceSecureStatus(secure);
        if (this.IsAdmin()) {
            if (secure) {
                this.app.OpenNoticeModal("Secure Mode Enabled", "Secure mode was enabled by the server owner. You may no longer view other tribes.");
                this.SetAdminMode(false);
                this.OnApiPermissionsChanged();
            } else {
                this.app.OpenNoticeModal("Secure Mode Disabled", "Secure mode was disabled. You may now access other tribes!");
                this.SetAdminMode(true);
                this.OnApiPermissionsChanged();
            }
        } else {
            if (secure) {
                this.app.OpenNoticeModal("Secure Mode Enabled", "Secure mode has been enabled by the server owner. Server admins may no longer access tribe data.");
            } else {
                this.app.OpenNoticeModal("Secure Mode Disabled", "Secure mode was disabled. Server admins may now be able to access your tribe data.");
            }
        }
    }

    CheckStatus() {
        /* Returns null if all is OK to change to this server, else returns a string */

        return this.error;
    }

    async Deinit() {
        //Cancel
        this.token.Cancel();

        //Deinit our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            await this.tabs[i].OnDeinit();
            this.tabs[i].mountpoint.remove();
        }

        //Unsubscribe from RPC events
        this.UnsubscribeRPCEvent("server");
    }

    GetTribesEndpointUrl(extra) {
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/" + this.id + "/tribes/*" + /*this.tribe + */extra;
    }

    async WebRequestToEndpoint(extra, args, replacements) {
        var url = this.GetTribesEndpointUrl(extra);
        if (replacements !== undefined) {
            var keys = Object.keys(replacements);
            for (var i = 0; i < keys.length; i += 1) {
                url = url.replace(keys[i], replacements[keys[i]]);
            }
        }
        return await DeltaTools.WebRequest(url, args, this.token);
    }

    //Syncs content from the server locally
    async SyncContent() {
        await this.db.Sync();
    }

    async DownloadDataCritical() {
        //Downloads server data that we need to even begin loading. Returns the status

        //Fetch tribes
        try {
            var tribeListing = await DeltaTools.WebRequest(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/tribes", {}, this.token);
            this.tribes = tribeListing.tribes;
        } catch (e) {
            this.ForceAbort("Couldn't fetch tribe listing.");
            return false;
        }

        //Set up DB
        await this.db.Init();

        return true;
    }

    async DownloadDataBackground() {
        //Downloads server data in the background while the tabs are shown

        //Download data
        await this.SyncContent();
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */
        super.OnSwitchedTo();

        //If this hasn't been used yet, init the first tab
        if (this.first) {
            this.OnSwitchedToFirst();
            this.first = false;
        }
    }

    async OnSwitchedToFirst() {
        //Called when this server is first switched to and we need to begin downloading
        this.SetLoaderStatus(true);

        //Set admin mode if we can
        if (!this.info.has_tribe && this.IsAdmin() && !this.info.secure_mode) {
            this.SetAdminMode(true);
        }

        //Download critical data first
        if (!await this.DownloadDataCritical()) {
            this.SetLoaderStatus(false);
            this.ready = true;
            return;
        }

        //Switch to the first tab
        this.OnSwitchTab(0);

        //Begin background loading
        await this.DownloadDataBackground();

        //Finish
        this.SetLoaderStatus(false);
        this.ready = true;
    }

    OnSwitchedAway() {
        /* Called when this server is switched away from */

        super.OnSwitchedAway();
    }

    async OnSwitchTab(index) {
        /* Called when we switch tabs */

        //Check to make sure this isn't the active tab
        if (this.activeTab == index) {
            return;
        }

        //Close the old tab
        if (this.activeTab != -1 && this.activeTab != index) {
            //Hide
            this.tabs[index].mountpoint.classList.remove("main_tab_active");

            //Hide on the menu
            this.tabs[index].menu.classList.remove("v3_nav_server_bottom_item_selected");

            //Deactivate
            this.tabs[this.activeTab].OnClose();
        }

        //Remove active tabs and menu tabs
        DeltaTools.RemoveClassFromClassNames(this.mountpoint, "main_tab_active", "main_tab_active");
        DeltaTools.RemoveClassFromClassNames(this.menu, "v3_nav_server_bottom_item_selected", "v3_nav_server_bottom_item_selected");

        //Go to this tab
        if (this.activeTab != index) {
            //Run first open on this tab, if needed
            if (this.tabs[index].openCount == 0) {
                await this.tabs[index].OnFirstOpen();
            }

            //Show
            this.tabs[index].mountpoint.classList.add("main_tab_active");

            //Show on the menu
            this.tabs[index].menu.classList.add("v3_nav_server_bottom_item_selected");

            //Open the new tab
            await this.tabs[index].OnOpen();

            //Set vars
            this.tabs[index].openCount += 1;
            this.activeTab = index;
        }

        //Update
        this.app.RefreshBrowserMetadata();
    }

    SubscribeEvent(sourceTag, eventTag, callback) {
        this.dispatcher.PushSubscription(this.id, sourceTag, eventTag, callback);
    }

    UnsubscribeEvent(sourceTag) {
        this.dispatcher.UnsubscribeServer(this.id, sourceTag);
    }

    DispatchEvent(eventTag, data) {
        this.dispatcher.FireSubscription({
            "opcode": eventTag
        }, data);
    }

    GetDistanceFromMe(x, y) {
        if (this.myLocation == null) {
            return null;
        }
        var a1 = Math.abs(this.myLocation.x - x);
        var a2 = Math.abs(this.myLocation.y - y);
        return Math.sqrt(Math.pow(a1, 2) + Math.pow(a2, 2));
    }

    async PushUserPrefs() {
        /* Pushes user prefs for this server */
        this.prefs = await DeltaTools.WebPOSTJson(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/put_user_prefs", this.prefs, this.token);
        return this.prefs;
    }

    CreateManagedDinoDbListener(add, remove, reset) {
        //Create
        var token = this.db["dinos"].AddManagedFilterListener((adds, removes) => {
            if (adds.length > 0) {
                add(adds);
            }
            if (removes.length > 0) {
                remove(removes);
            }
        }, (item) => {
            return this.CheckFilterDino(item);
        });

        //Add to collection

        return token;
    }

    CreateManagedStructureDbListener(callback) {
        //Create
        var token = this.db["structures"].AddManagedFilterListener((add, remove) => callback(add, remove), (item) => {
            return this.CheckFilterStructure(item);
        });

        //Add to collection

        return token;
    }

    CheckFilterDino(dino) {
        /* Checks if a dino fits the criteria for the active filter */
        return true;
    }

    CheckFilterStructure(structure) {
        /* Checks if a structure fits the criteria for the active filter */
        return true;
    }

    async OpenSortDialog() {
        var builder = new DeltaModalBuilder();
        var modal = this.app.modal.AddModal(670, 380);

        //Fetch dinos and get their name and ID
        var species = await app.db.species.GetAllItems();
        species.sort((a, b) => {
            return a.screen_name.localeCompare(b.screen_name);
        });
        var speciesTitles = ["Any"];
        var speciesIds = ["*"];
        for (var i = 0; i < species.length; i += 1) {
            speciesTitles.push(species[i].screen_name);
            speciesIds.push(species[i].classname);
        }

        var commonGridBuilder = new DeltaModalBuilder(false, "sort_menu_grid", "sort_menu_grid_item");
        commonGridBuilder.AddContentInputSelect("Status", ["Alive", "(Wanted) Dead or Alive", "Dead"], ["alive", "any", "dead"], "alive");
        commonGridBuilder.AddContentInputSelect("Cryo Status", ["Any", "In World", "In Cryo"], ["any", "world", "cryo"], "any");
        commonGridBuilder.AddContentInputSelect("Species", speciesTitles, speciesIds, "*");
        commonGridBuilder.AddContentInputSelect("Sex", ["Any", "Male", "Female"], ["any", "male", "female"], "any");
        builder.AddContentBuilder(commonGridBuilder);

        builder.AddAction("Apply", "POSITIVE", () => {
            modal.Close();
        });
        builder.AddAction("Clear", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    SetUserInterfaceSecureStatus(status) {
        if (status) {
            this.menu.classList.add("v3_nav_server_flag_secure");
        } else {
            this.menu.classList.remove("v3_nav_server_flag_secure");
        }
    }

    BuildServerRequestUrl(extra) {
        return LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + extra;
    }

    async AdminSetSecureMode(status) {
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/secure"), {
            "secure": status
        }, this.token);
    }

    //Sets if we're using admin mode
    SetAdminMode(admin) {
        var adminTab = this.tabs[3];

        //If we aren't changing anything, abort
        if (this.admin_mode == admin) {
            return false;
        }

        //Set loader and switch
        this.admin_mode = admin;
        adminTab.SetLoadingSymbol(true);
        adminTab.SetActiveStatus(admin);

        //Set loader
        adminTab.SetLoadingSymbol(false);

        return true;
    }

    //Called when our access to the API is changed (we're granted admin access, secure mode changed, etc)
    async OnApiPermissionsChanged() {
        //Set loader
        this.SetLoaderStatus(true);

        //Sync
        await this.SyncContent();

        //Set loader
        this.SetLoaderStatus(false);
    }

    IsAdmin() {
        return this.info.is_admin;
    }

    IsOwner() {
        return this.info.owner_uid == this.app.user.data.id;
    }

    //Reads the permission index directly
    ReadPermissionValue(index) {
        return 1 == ((this.info.permission_flags >> index) & 1);
    }

    //Sets a permission and saves it to the server
    async SetPermissionValue(index, value) {
        //Set
        if (value) {
            this.info.permission_flags |= 1 << index;
        } else {
            this.info.permission_flags &= ~(1 << index);
        }

        //Send
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/permissions"), {
            "flags": this.info.permission_flags
        }, this.token);

        //Apply
        this.ApplyNewPermissions();
    }

    //Applies new permissions to the user interface
    ApplyNewPermissions() {

    }

    async HideServer() {
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/hide"), {
            
        }, this.token);
    }

    async DeleteServer() {
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/delete"), {

        }, this.token);
    }
}