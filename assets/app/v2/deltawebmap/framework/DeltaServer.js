"use strict";

class DeltaServer {

    constructor(info) {
        //Set vars
        this.info = info;
        this.id = info.id;
        this.tribe = 0;
        this.nativeTribe = 0;
        this.activeTab = -1;
        this.menu = null;
        this.session = null;
        this.myLocation = null; //May or may not be null

        //Create tabs
        this.tabs = [
            new TabMap(this, document.getElementById('tab_map')),
            new TabDinos(this, document.getElementById('tab_dinos'))
        ];

        //Cached info
        this.icons = null;
        this.overview = null;
        this.structures = null;
    }

    async ChangeTribeToDefault() {
        await this.ChangeTribe(this.nativeTribe);
    }

    async ChangeTribe(tribeId) {
        //Check
        if (this.tribe == tribeId) {
            return;
        }

        //Update
        this.tribe = tribeId;

        //Deinit all tabs
        for (var i = 0; i < this.tabs.length; i++) {
            await this.tabs[i].OnDeinit();
            this.tabs[i].openCount = 0;
        }

        //Clear saved data
        this.icons = null;
        this.overview = null;
        this.structures = null;
        this.activeTab = -1;

        //Reinit
        await this.Init();
        await this.OnSwitchedTo();
    }

    async Init() {
        /* Called when we are adding this server to the list of servers. */
        /* Returns null if we can load this server, or else it will return a string that will be displayed as an error. */

        //Init our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            await this.tabs[i].OnInit();
        }

        return null;
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
        return await DeltaTools.WebRequest(url, args);
    }

    async DownloadData() {
        /* Downloads all of the server info */
        /* Returns true if this loaded OK, or else returns false */

        //Load session
        if (this.session == null) {
            try {
                this.session = await DeltaTools.WebRequest(this.info.endpoint_createsession, {});
                this.myLocation = this.session.my_location;
            } catch (e) {
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
            this.icons = await this.WebRequestToEndpoint("tribes_icons", {});
        }
        return this.icons;
    }

    async GetStructuresData() {
        if (this.structures == null) {
            this.structures = await this.WebRequestToEndpoint("tribes_structures", {});
        }
        return this.structures;
    }

    async GetOverviewData() {
        if (this.overview == null) {
            this.overview = await this.WebRequestToEndpoint("tribes_overview", {});
        }
        return this.overview;
    }

    async OnSwitchedTo() {
        /* Called when this server is switched to */

        //Expand on the sidebar
        this.menu.classList.add("v3_nav_server_active");

        this.OnSwitchTab(0);
    }

    async OnSwitchTab(index) {
        /* Called when we switch tabs */

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
        DeltaTools.RemoveClassFromClassNames(document.body, "main_tab_active", "main_tab_active");
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
    }

    async OnSwitchedAway() {
        /* Called when this server is switched away from */

        //Expand on the sidebar
        this.menu.classList.remove("v3_nav_server_active");
    }

    GetDistanceFromMe(x, y) {
        if (this.myLocation == null) {
            return null;
        }
        var a1 = Math.abs(this.myLocation.x - x);
        var a2 = Math.abs(this.myLocation.y - y);
        return Math.sqrt(Math.pow(a1, 2) + Math.pow(a2, 2));
    }

}