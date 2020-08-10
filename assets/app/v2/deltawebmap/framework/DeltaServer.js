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
        this.ready = false; //Set to true when all data has been synced
        this.bottomBanner = null;
        this.tribes = [];
        this.primalInterface = null;
        this.filter = new DeltaFilter();
        this.adminEnabled = false;

        //Create tabs
        this.tabs = [
            new TabMap(this),
            new TabDinos(this),
            new TabItems(this),
            new TabAdmin(this)
        ];

        //Create server data packages
        this.dinos = new ServerDataPackageDinos(this);
        this.inventories = new ServerDataPackageInventories(this);
        this.structures = new ServerDataPackageStructures(this);
        this._packages = [
            this.inventories,
            this.structures,
            this.dinos
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

    RemoveServer() {
        //If we're currently viewing this server, switch
        if (this.app.lastServer.id == this.id) {
            this.app.SwitchServer(this.app.msgViewServerRemoved);
        }

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
        this.SubscribeRPCEvent("guild-update", 20010, (m) => {
            //Update info
            this.info.display_name = m.guild.display_name;
            this.info.image_url = m.guild.image_url;
            this.info.flags = m.guild.flags;
            this.info.permission_flags = m.guild.permission_flags;
            this.info.permissions_template = m.guild.permissions_template;
            this.info.secure_mode = m.guild.secure_mode;

            //Update UI
            this.menu_icon.src = m.guild.image_url;
            this.menu_name.innerText = m.guild.display_name;
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

    GetEchoEndpointUrl(extra) {
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/v1/" + this.id + extra;
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
        //Create interface
        var dialog = DeltaTools.CreateDom("div", "contentdownload_container", this.mountpoint);
        var label = DeltaTools.CreateDom("div", "contentdownload_text", dialog, "Downloading content...");
        var bar = DeltaTools.CreateDom("div", "contentdownload_bar", dialog);
        var filling = DeltaTools.CreateDom("div", "contentdownload_filling", bar);

        //Get primal data interface
        label.innerText = "Fetching mod content list...";
        this.primalInterface = await this.app.primalPackageManager.RequestInterface(["0"]);

        //Get tribe list
        label.innerText = "Fetching tribe list...";
        var tribeListing = await DeltaTools.WebRequest(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/tribes", {}, this.token);
        this.tribes = tribeListing.tribes;

        //Get the total count for all
        var totalEntityCount = this.primalInterface.GetTotalEntityCount();
        var totalEntitiesDownloaded = 0;
        for (var i = 0; i < this._packages.length; i += 1) {
            totalEntityCount += await this._packages[i].FetchCount();
        }

        //Download mod content
        await this.primalInterface.DownloadContent((count) => {
            totalEntitiesDownloaded += count;
            filling.style.width = ((totalEntitiesDownloaded / totalEntityCount) * 100).toString() + "%";
            label.innerText = "Downloading mod content...";
        });

        //Add UI update event to all
        var uiC = (e) => {
            totalEntitiesDownloaded += e.delta;
            filling.style.width = ((totalEntitiesDownloaded / totalEntityCount) * 100).toString() + "%";
            label.innerText = "Downloading " + e.source.name.toLowerCase() + "...";
        };
        for (var i = 0; i < this._packages.length; i += 1) {
            this._packages[i].OnContentChunkReceived.Subscribe("deltawebmap.server.synccontent.ui", uiC);
        }

        //Download content for all packages
        for (var i = 0; i < this._packages.length; i += 1) {
            console.log("[DeltaServer-SyncContent] Beginning download of package \"" + this._packages[i].name + "\"...");
            await this._packages[i].LoadContent();
            console.log("[DeltaServer-SyncContent] Download of package \"" + this._packages[i].name + "\" completed successfully.");
        }

        //Remove UI
        dialog.remove();
    }

    //Called when our access to the API is changed (we're granted admin access, secure mode changed, etc)
    async OnApiPermissionsChanged() {
        //TODO
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */
        super.OnSwitchedTo();

        //Update bar
        this.UpdateSystemBar();

        //If this hasn't been used yet, init the first tab
        if (this.first) {
            this.OnSwitchedToFirst();
            this.first = false;
        }

        //Run open callback on the current tab
        if (this.activeTab != -1) {
            this.tabs[this.activeTab].OnOpen();
        }
    }

    UpdateSystemBar() {
        //Create tabs
        var items = [];
        for (var i = 0; i < this.tabs.length; i += 1) {
            items.push({
                "title": this.tabs[i].GetDisplayName(),
                "context": i,
                "callback": (e) => {
                    this.OnSwitchTab(e);
                }
            });
        }
        
        //Set header
        this.app.SetActiveHeaderInfo(this.info.display_name, this.info.image_url, items, this.activeTab);

        //Set menu bar input
        if (this.activeTab == -1) {
            this.app.SetActiveHeaderSearch(false, null, null, null);
        } else {
            var t = this.tabs[this.activeTab];
            this.app.SetActiveHeaderSearch(t.GetIsSearchQueryEnabled(), t.GetQueryPlaceholder(), t.lastQuery, (q) => {
                this.tabs[this.activeTab].OnQueryChanged(q);
            });
        }

        //Set menu creation
        this.app.SetActiveHeaderMenuCreateCallback(() => {
            return this.CreateSystemMenu();
        });
    }

    CreateSystemMenu() {
        var items = [];

        //Add server actions
        items.push({
            "type": "BTN",
            "text": "Filter...",
            "callback": () => {
                this.OpenFilterDialog();
            },
            "icon": "/assets/app/icons/system_menu/filter.svg"
        });
        items.push({
            "type": "SWITCH",
            "text": "Admin Mode",
            "callback": () => {
                this.SetAdminMode(!this.adminEnabled);
            },
            "icon": "/assets/app/icons/system_menu/manage.svg",
            "checked": this.adminEnabled
        });
        items.push({
            "type": "BTN",
            "text": "Hide Server",
            "callback": () => {
                this.PromptLeaveServer();
            },
            "icon": "/assets/app/icons/system_menu/close.svg",
            "modifier": "negative"
        });

        //Break
        items.push({ "type": "HR" });

        //Add server create button
        items.push({
            "type": "BTN",
            "text": "Add Your Server",
            "callback": () => {
                new DeltaGuildCreator(this.app, null);
            },
            "icon": "/assets/app/icons/system_menu/add.svg",
        });

        //Add other servers
        var k = Object.keys(this.app.servers);
        for (var i = 0; i < k.length; i += 1) {
            var s = this.app.servers[k[i]];
            if (s != this) {
                items.push({
                    "type": "SERVER",
                    "text": s.info.display_name,
                    "callback": (e) => {
                        var id = e.currentTarget._context;
                        this.app.SwitchServer(this.app.servers[id]);
                    },
                    "icon": s.info.image_url,
                    "context": s.id
                });
            }
        }

        return items;
    }

    PromptLeaveServer() {
        this.app.OpenPromptModal("Hide " + this.info.display_name, "Are you sure you want to hide " + this.info.display_name + "? Hiding a server will make it disappear from Delta Web Map until you rejoin the server in-game.", "Hide", "Cancel", () => {
            if (this.IsAdmin()) {
                //Warn about losing admin
                this.app.OpenPromptModal("Give Up Admin", "Hiding " + this.info.display_name + " will give up your admin access on this server. Are you sure you want to hide it?", "Accept", "Cancel", () => {
                    //Leave now
                    this.HideServer();
                }, () => { }, "NEGATIVE", "NEUTRAL");
            } else {
                //Leave now
                this.HideServer();
            }
        }, () => { }, "NEGATIVE", "NEUTRAL");
    }

    SetAdminMode(status) {
        //Set
        this.adminEnabled = status;

        //Clear filter
        this.ApplyNewFilter({});
    }

    async OnSwitchedToFirst() {
        //Switch to the first tab
        this.OnSwitchTab(0);

        //Begin background loading
        await this.SyncContent();

        //Finish
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
            this.tabs[this.activeTab].mountpoint.classList.remove("main_tab_active");

            //Deactivate
            this.tabs[this.activeTab].OnClose();
        }

        //Run first open on this tab, if needed
        if (this.tabs[index].openCount == 0) {
            await this.tabs[index].OnFirstOpen();
        }

        //Show
        this.tabs[index].mountpoint.classList.add("main_tab_active");

        //Open the new tab
        await this.tabs[index].OnOpen();

        //Set vars
        this.tabs[index].openCount += 1;
        this.activeTab = index;

        //Update
        this.app.RefreshBrowserMetadata();

        //Update bar
        this.UpdateSystemBar();
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

    async PushDinoPrefs(dino) {
        /* Pushes user prefs for this server */
        var p = await DeltaTools.WebPOSTJson(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/put_dino_prefs", {
            "dino_id": dino.dino_id,
            "prefs": dino.tribe_prefs
        }, this.token);
        return p;
    }

    OpenFilterDialog() {
        var builder = new DeltaModalBuilder();
        var modal = this.app.modal.AddModal(670, 380);

        //Fetch dinos and get their name and ID
        var species = this.primalInterface.GetAllContentOfType("SPECIES");
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
        //commonGridBuilder.AddContentInputSelect("Status", ["Alive", "(Wanted) Dead or Alive", "Dead"], ["alive", "any", "dead"], "alive");
        //commonGridBuilder.AddContentInputSelect("Cryo Status", ["Any", "In World", "In Cryo"], ["any", "world", "cryo"], "any");
        var selectSpecies = commonGridBuilder.AddContentInputSelect("Species", speciesTitles, speciesIds, "*");
        var selectSex = commonGridBuilder.AddContentInputSelect("Sex", ["Any", "Male", "Female"], ["any", "male", "female"], "any");
        builder.AddContentBuilder(commonGridBuilder);

        builder.AddAction("Apply", "POSITIVE", () => {
            //Build filters
            var filters = {};
            if (selectSpecies.value != "*")
                filters["SPECIES"] = selectSpecies.value;
            if (selectSex.value != "any")
                filters["SEX"] = selectSex.value;

            //Apply filter
            this.ApplyNewFilter(filters);

            //Close
            modal.Close();
        });
        builder.AddAction("Clear", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }

    ApplyNewFilter(filters) {
        //Set
        this.filter.SetNewFilters(filters);

        //Refresh items
        for (var i = 0; i < this._packages.length; i += 1) {
            this._packages[i].FilterUpdated();
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

    async SetPermissionTemplate(data) {
        //Set
        this.info.permission_flags = data.flags;

        //Send
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/permissions"), {
            "flags": this.info.permission_flags,
            "template": data.id
        }, this.token);

        //Apply
        this.ApplyNewPermissions();
    }

    async SetName(name) {
        //Set
        this.info.display_name = name;

        //Send
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/rename"), {
            "name": name
        }, this.token);
    }

    async SetLocked(isLocked) {
        //Send
        await DeltaTools.WebPOSTJson(this.BuildServerRequestUrl("/admin/locked"), {
            "locked": isLocked
        }, this.token);

        //Update locally, just in case RPC is down
        //Clear setup flag
        this.info.flags &= ~(1 << 1);

        //Change lock flag
        if (isLocked) {
            this.info.flags |= 1 << 0;
        }
        else {
            this.info.flags &= ~(1 << 0);
        }
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

    async FetchAdminStats() {
        return await DeltaTools.WebRequest(this.BuildServerRequestUrl("/admin/stats"), {}, this.token);
    }

    FlyToLocation(location) {
        this.tabs[0].FlyToLocation(location);
        this.OnSwitchTab(0);
    }

    RunArkRpcEndpoint(url, params, callback, failedCallback) {
        //Request
        DeltaTools.WebPOSTJson(url, params, null).then((r) => {
            //Get the RPC ID
            var id = r.rpc_id;

            //Create timeout
            var t = window.setTimeout(() => {
                //Unsubscribe
                this.UnsubscribeRPCEvent("deltawebmap.server.arkrpc." + id);

                //Fire
                failedCallback();
            }, 10000);

            //Subscribe to RPC event
            this.SubscribeRPCEvent("deltawebmap.server.arkrpc." + id, 20008, (d) => {
                //Make sure this is the correct token
                if (d.rpc_id != id) { return; }

                //Unsubscribe
                this.UnsubscribeRPCEvent("deltawebmap.server.arkrpc." + id);

                //Cancel
                window.clearTimeout(t);

                //Fire
                callback(d.custom_data);
            });
        });
    }

    RunArkRpcEndpointInterface(url, params, successTitle, successText, failTitle, failText) {
        //Create modal
        var modal = this.app.modal.AddModal(480, 300);
        modal.AddPage(DeltaModalBuilder.GetLoadingView());

        //Start
        this.RunArkRpcEndpoint(url, params, () => {
            var builder = new DeltaModalBuilder();
            builder.AddContentTitle(successTitle);
            builder.AddContentDescription(successText);
            modal.AddPage(builder.Build());
            builder.AddAction("Close", "NEUTRAL", () => {
                modal.Close();
            });
        }, () => {
            var builder = new DeltaModalBuilder();
            builder.AddContentTitle(failTitle);
            builder.AddContentDescription(failText);
            modal.AddPage(builder.Build());
            builder.AddAction("Cancel", "NEUTRAL", () => {
                modal.Close();
            });
        });

        return modal;
    }

    PromptBanMember(userName, userSteamId) {
        //Prompt
        this.app.OpenPromptModal("Ban " + userName, "This will ban " + userName + " from both the ARK game server and Delta Web Map.", "Ban", "Cancel", () => {
            //Ban
            this.RunArkRpcEndpointInterface(this.BuildServerRequestUrl("/admin/ban_player"), {
                "steam_id": userSteamId
            },
                "Ban Successful",
                userName + " has successfully been banned from the game server and Delta Web Map.",
                "Ban Failed",
                "Could not communicate with the ARK server. It might not be running. Your ban will process next time it connects to DeltaWebMap."
            );
        }, () => {
            //Ignore
        }, "NEGATIVE", "NEUTRAL");
    }

    async UploadNewIcon(data) {
        await DeltaTools._BaseWebRequest(this.BuildServerRequestUrl("/admin/upload_icon"), "json", "POST", data, null, {});
    }

    GetEntrySpecies(classname, defaultToNull) {
        //Try to get
        var species = this.primalInterface.GetContentByClassName(classname, "SPECIES");
        if (species != null) {
            return species;
        }

        //Check if we should default to null. By default we don't
        if (defaultToNull != null && defaultToNull == true) {
            return null;
        }

        //This doesn't exist! Create a template so we don't cause errors
        return {
            "screen_name": classname,
            "colorizationIntensity": 1,
            "babyGestationSpeed": -1,
            "extraBabyGestationSpeedMultiplier": -1,
            "babyAgeSpeed": 0.000003,
            "extraBabyAgeSpeedMultiplier": 0,
            "useBabyGestation": false,
            "extraBabyAgeMultiplier": 1.7,
            "statusComponent": {
                "baseFoodConsumptionRate": -0.001852,
                "babyDinoConsumingFoodRateMultiplier": 25.5,
                "extraBabyDinoConsumingFoodRateMultiplier": 20,
                "foodConsumptionMultiplier": 1,
                "tamedBaseHealthMultiplier": 1
            },
            "adultFoods": [],
            "childFoods": [],
            "classname": classname,
            "icon": {
                "image_url": "https://icon-assets.deltamap.net/unknown_dino.png",
                "image_thumb_url": "https://icon-assets.deltamap.net/unknown_dino.png"
            },
            "baseLevel": [100, 100, 100, 100, 100, 100, 0, 0, 1, 1, 0, 1],
            "increasePerWildLevel": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "increasePerTamedLevel": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "additiveTamingBonus": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "multiplicativeTamingBonus": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "statImprintMult": null
        }
    }

    GetEntryItem(classname, defaultToNull) {
        //Trim classname
        if (classname.endsWith("_C")) {
            classname = classname.substr(0, classname.length - 2);
        }

        //Try to get
        var item = this.primalInterface.GetContentByClassName(classname, "ITEMS");
        if (item != null) {
            return item;
        }

        //Check if we should default to null. By default we don't
        if (defaultToNull != null && defaultToNull == true) {
            return null;
        }

        //This doesn't exist! Create a template so we don't cause errors
        return {
            "classname": classname,
            "icon": {
                "image_url": "https://icon-assets.deltamap.net/unknown_dino.png",
                "image_thumb_url": "https://icon-assets.deltamap.net/unknown_dino.png"
            },
            "hideFromInventoryDisplay": false,
            "useItemDurability": false,
            "isTekItem": false,
            "allowUseWhileRiding": false,
            "name": classname,
            "description": "Unknown item. It may be modded and is unsupported at this time.",
            "spoilingTime": 0.0,
            "baseItemWeight": 0.0,
            "useCooldownTime": 0.0,
            "baseCraftingXP": 1.0,
            "baseRepairingXP": 0.0,
            "maxItemQuantity": 0,
            "addStatusValues": {

            }
        };
    }

    GetEntryItemByStructureClassName(classname) {
        //Search for the item
        return this.primalInterface.GetContentByFilter("ITEMS", (x) => {
            return x.structure_classname == classname;
        });
    }
}