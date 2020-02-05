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
        this.session = null;
        this.first = true; //Set to false after this is opened for the first time
        this.myLocation = null; //May or may not be null
        this.downloadTask = null; //Task that is run to create a session on this server
        this.error = null;
        this.token = new DeltaCancellationToken(null);

        //Create tabs
        this.tabs = [
            new TabMap(this),
            new TabDinos(this),
            new TabAdmin(this)
        ];

        //Cached info
        this.icons = null;
        this.overview = null;
        this.structures = null;

        
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

    async OnChangedTribe() {
        //Cancel token
        this.CancelTokens();

        //Cached info
        this.icons = null;
        this.overview = null;
        this.structures = null;

        //Run on all
        var t = [];
        for (var i = 0; i < this.tabs.length; i += 1) {
            t.push(this.tabs[i].RedownloadData());
        }
        await Promise.all(t);
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

    GetEndpointUrl(endpointName) {
        return this.session["endpoint_" + endpointName].replace("{tribe_id}", this.tribe.toString());
    }

    async WebRequestToEndpoint(endpointName, args, replacements) {
        var url = this.GetEndpointUrl(endpointName);
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

        //Load session
        if (this.session == null) {
            try {
                this.SetLoaderStatus(true);
                this.session = await DeltaTools.WebRequest(this.info.endpoint_createsession, {}, null);
                this.SetLoaderStatus(false);
                this.myLocation = this.session.my_location;
            } catch (e) {
                this.ForceAbort("Couldn't download server information.");
                return false;
            }

            //Set our tribe ID
            this.tribe = this.session.target_tribe.tribe_id;
            this.nativeTribe = this.session.target_tribe.tribe_id;
        }

        return true;
    }

    async GetIconsData() {
        if (this.icons == null) {
            try {
                this.icons = await this.WebRequestToEndpoint("tribes_icons", {});
            } catch (e) {
                this.ForceAbort("Couldn't download server information.");
            }
        }
        return this.icons;
    }

    async GetStructuresData() {
        if (this.structures == null) {
            try {
                this.structures = await this.WebRequestToEndpoint("tribes_structures", {});
            } catch (e) {
                this.ForceAbort("Couldn't download server information.");
            }
        }
        return this.structures;
    }

    async GetOverviewData() {
        if (this.overview == null) {
            try {
                this.overview = await this.WebRequestToEndpoint("tribes_overview", {});
            } catch (e) {
                this.ForceAbort("Couldn't download server information.");
            }
        }
        return this.overview;
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */

        //Start downloading
        this.downloadTask = this.DownloadData();

        super.OnSwitchedTo();

        //If this hasn't been used yet, init the first tab
        if (this.first) {
            this.first = false;
            this.OnSwitchTab(0);
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

        //Verify that we have downloaded initial session data
        await this.downloadTask;

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

    OnCharacterLiveUpdate(m) {
        /* Called when there is a live update for a character. We check if this concerns US, and if it does, we will dispatch an event */
        /* BUG: This will fail if the user changes tribes without reloading the page, but since this is such a rare occurance, we're not going to worry about it. */

        //Check if our data exists
        if (this.session == null) { return; }
        if (this.session.my_profile == null) { return; }

        //Run
        for (var i = 0; i < m.updates.length; i += 1) {
            var u = m.updates[i];

            //Check if this is us
            if (u.type != 0 || u.id != this.session.my_profile.ark_id) { continue; }

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

}