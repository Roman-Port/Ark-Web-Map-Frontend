"use strict";

class DeltaServer extends DeltaTabView {

    constructor(app, info, menu) {
        super(app);

        //Set vars
        this.info = info;
        this.menu = menu;
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

        //Create tabs
        this.tabs = [
            new TabMap(this),
            new TabDinos(this),
            new TabAdmin(this)
        ];

        //Set some content
        this.myLocation = this.info.my_location;
        this.tribe = this.info.target_tribe.tribe_id;
        this.nativeTribe = this.info.target_tribe.tribe_id;
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
        return m;
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

    async Init(mountpoint) {
        /* Called when we are adding this server to the list of servers. */
        /* Returns null if we can load this server, or else it will return a string that will be displayed as an error. */
        await super.Init(mountpoint);

        //Init our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            var m = DeltaTools.CreateDom("div", "main_tab", this.mountpoint); //This is the mountpoint for the tab
            await this.tabs[i].OnInit(m);
        }

        //Add RPC events
        this.SubscribeRPCEvent("server", 7, (m) => this.OnCharacterLiveUpdate(m));

        return null;
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
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/" + this.id + "/tribes/" + this.tribe + extra;
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

    async DownloadData() {
        /* Downloads all of the server info */
        /* Returns true if this loaded OK, or else returns false */

        //Download data
        await this.db.Init();

        this.SetLoaderStatus(false);
        this.ready = true;

        return true;
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */
        super.OnSwitchedTo();

        //If this hasn't been used yet, init the first tab
        if (this.first) {
            //Switch
            this.first = false;
            this.OnSwitchTab(0);

            //Start downloading
            this.SetLoaderStatus(true);
            this.downloadTask = this.DownloadData();
        }
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

    async ResetTabs() {
        /* Clears out all information in tabs and resets them entirely. */
        /* Usually used when switching data tracks */

        //Clear cached info
        this.icons = null;
        this.overview = null;

        //Cancel token and create new 
        this.token.Cancel();
        this.token = new DeltaCancellationToken(null);

        //Loop through and deinit tabs
        for (var i = 0; i < this.tabs.length; i += 1) {
            var menu = this.tabs[i].menu; //Get a ref to the menu
            await this.tabs[i].OnDeinit(); //Deinit
            this.tabs[i] = new this.tabs[i].constructor(this); //Create new 
            this.tabs[i].menu = menu; //Set menu
            var m = DeltaTools.CreateDom("div", "main_tab", this.mountpoint); //Create mountpoint
            await this.tabs[i].OnInit(m); //Init
        }

        //Open first tab
        var t = this.activeTab;
        this.activeTab = -1;
        this.OnSwitchTab(t);
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

    OnCharacterLiveUpdate(m) {
        /* Called when there is a live update for a character. We check if this concerns US, and if it does, we will dispatch an event */
        /* BUG: This will fail if the user changes tribes without reloading the page, but since this is such a rare occurance, we're not going to worry about it. */

        //Check if our data exists
        if (this.info.my_profile == null) { return; }

        //Run
        for (var i = 0; i < m.updates.length; i += 1) {
            var u = m.updates[i];

            //Check if this is us
            if (u.type != 0 || u.id != this.info.my_profile.ark_id) { continue; }

            //Check if this is a location update
            if (u.x == null || u.y == null || u.z == null) { continue; }

            //Create location vector
            var vector = {
                "x": u.x,
                "y": u.y,
                "z": u.z
            };

            //Update the location
            this.myLocation = vector;

            //This is valid. Dispatch
            this.DispatchEvent(R.server_events.EVT_SERVER_MY_LOCATION_UPDATE, vector);
        }
    }

    async PushUserPrefs() {
        /* Pushes user prefs for this server */
        this.prefs = await DeltaTools.WebPOSTJson(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/put_user_prefs", this.prefs, this.token);
        return this.prefs;
    }

    async ChangeTribe(nextTribeId) {
        //Set the var for this
        this.tribe = nextTribeId;

        //Update managed DBs
        for (var i = 0; i < this.db_sessions.length; i += 1) {
            var d = this.db_sessions[i];
            this.db[d[0]].RefreshManagedFilterListener(d[1]);
        }

        //Sync DB - this will also update managed DBs with changes
        await this.db.Sync();
    }

    CreateManagedDbListener(collection, tribeKey, callback) {
        //Create
        var token = this.db[collection].AddManagedFilterListener((add, remove) => callback(add, remove), (item) => {
            return item[tribeKey] == parseInt(this.tribe) || this.tribe == "*";
        });

        //Add to collection
        this.db_sessions.push([collection, token, null]);

        return token;
    }
}