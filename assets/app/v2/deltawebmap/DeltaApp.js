"use strict";

class DeltaApp {

    /* This class is the main class that sets up the rest of the app */

    constructor() {
        this.servers = {};
        this.rpc = null;
        this.user = null;
        this.lastServerId = null;
        this.SIDEBAR_OPTIONS = [
            {
                "name": "Add Server",
                "action": function () { },
                "icon": "/assets/app/icons/left_nav_v3/add_server.svg"
            },
            {
                "name": "User Settings",
                "action": function () { },
                "icon": "/assets/app/icons/left_nav_v3/user_settings.svg"
            }
        ];
    }

    async Init() {
        /* Called when the app is first loaded */

        //Create DOM
        this.LayoutDom(document.body);

        //Set up the user
        this.user = await this.InitUser();

        //Create RPC
        this.rpc = new DeltaRPC();

        //Create default cluster
        var clusterMenus = {};
        var defaultClusterMenu = this.CreateServerListClusterLabel(this.serverListHolder, "UNCATEGORIZED");

        //Add clusters
        for (var i = 0; i < this.user.data.clusters.length; i += 1) {
            var cluster = this.user.data.clusters[i];
            clusterMenus[cluster.id] = this.CreateServerListClusterLabel(this.serverListHolder, cluster.name);
        }

        //Boot up servers
        for (var i = 0; i < this.user.data.servers.length; i += 1) {
            //Create server
            var info = this.user.data.servers[i];
            var server = new DeltaServer(this, info);
            var m = DeltaTools.CreateDom("div", "server_mountpoint", this.mainHolder);
            var canSwitch = await server.Init(m); //TODO: Handle this returning false

            //Create the server on the sidebar
            var menu = DeltaTools.CreateDom("div", "v3_nav_server");
            var top = DeltaTools.CreateDom("div", "v3_nav_server_top", menu);
            DeltaTools.CreateDom("img", "v3_nav_server_top_icon", top).src = info.image_url;
            DeltaTools.CreateDom("span", "", top).innerText = info.display_name;
            var bottom = DeltaTools.CreateDom("div", "v3_nav_server_bottom", menu);
            for (var j = 0; j < server.tabs.length; j += 1) {
                var btn = DeltaTools.CreateDom("div", "v3_nav_server_bottom_item", bottom);
                btn.innerText = server.tabs[j].GetDisplayName();
                btn.x_index = j;
                btn.x_server = server;
                server.tabs[j].menu = btn;
                btn.addEventListener("click", function () {
                    this.x_server.OnSwitchTab(this.x_index);
                });
            }

            //Add event
            top.x_id = info.id;
            top.x_app = this;
            top.addEventListener("click", function () {
                this.x_app.SwitchServer(this.x_id);
            });

            //Mount the server menu to the sidebar
            if (info.cluster_id == null) {
                //Add to default cluster
                defaultClusterMenu.appendChild(menu);
            } else {
                //Mount to this cluster ID
                clusterMenus[info.cluster_id].appendChild(menu);
            }

            //Add to list of servers
            server.menu = menu;
            this.servers[info.id] = server;
        }

        //Swtich to the default server
        this.SwitchServer(this.GetDefaultServer().id);
    }

    LayoutDom(mount) {
        //Create top banner
        var banner = DeltaTools.CreateDom("div", "error_box_generic error_box_fixed_top_banner", mount);

        //Create main view
        this.LayoutMainView(mount);
    }

    LayoutMainView(parent) {
        var mount = DeltaTools.CreateDom("div", "main_view", parent);
        this.mainHolder = mount;

        DeltaTools.CreateDom("div", "top_nav", mount); //Top strip. Pretty much has no use except to show a darker color at this point, though

        var leftSidebar = DeltaTools.CreateDom("div", "dino_sidebar smooth_anim dino_sidebar_open v3_nav_area", mount);
        this.serverListHolder = DeltaTools.CreateDom("div", "v3_nav_server_area", leftSidebar);
        var bottom = DeltaTools.CreateDom("div", "v3_nav_bottom", leftSidebar);

        //Add bottom options
        for (var i = 0; i < this.SIDEBAR_OPTIONS.length; i += 1) {
            var o = this.SIDEBAR_OPTIONS[i];
            var c = DeltaTools.CreateDom("div", "v3_nav_server", bottom);
            var cc = DeltaTools.CreateDom("div", "v3_nav_server_top", c);
            DeltaTools.CreateDom("img", "v3_nav_server_top_icon", cc).src = o.icon;
            DeltaTools.CreateDom("span", "", cc).innerText = o.name;
            c.addEventListener("click", o.action);
        }
    }

    CreateServerListClusterLabel(container, name) {
        //Create the label itself
        DeltaTools.CreateDom("div", "v3_nav_server_label", container).innerText = name;

        //Now, create the container
        return DeltaTools.CreateDom("div", "", container);
    }

    async InitUser() {
        var user = new DeltaUser();
        await user.RefreshData();
        return user;
    }

    SwitchServer(id) {
        /* This will switch to a new server, switching away from the last one */
        
        //Check if we're already on this server
        if (this.lastServerId == id) {
            return;
        }

        //Switch away from the last server, if any
        if (this.lastServerId != null) {
            this.servers[this.lastServerId].OnSwitchedAway();
        }

        //Switch to this server
        console.log("About to switch to server ID " + id);
        var server = this.servers[id];
        var status = server.CheckStatus();
        if (status != null) {
            console.log("Failed to switch with error " + status);
            return status;
        }
        this.lastServerId = id;
        server.OnSwitchedTo();
        this.RefreshBrowserMetadata();
        return null;
    }

    GetDefaultServer() {
        /* This will get the default server, used when running the app. If no servers can be switched to, this will display a generic error screen */

        //Check the latest server
        var id = localStorage.getItem("latest_server");
        var server = null;
        var status = null;
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
        for (var i = 0; i < app.user.data.servers.length; i += 1) {
            server = user.data.servers[i];
            status = server.CheckStatus();
            if (status == null) {
                return server;
            }
        }

        //No default to load!
        return null; //TODO!
    }

    GetCurrentUrl() {
        /* Gets the current url, relative to the project. Generated on the fly */
        if (this.lastServerId == null) {
            return "/app/";
        }
        var s = this.servers[this.lastServerId];
        if (s.activeTab == -1) {
            return "/app/" + s.id;
        }
        return "/app/" + s.id + "/" + s.tabs[s.activeTab].GetId();
    }

    RefreshBrowserMetadata() {
        /* Refreshes native browser stuff, like tab title and URL*/

        //Get the tab name
        var name = "Delta Web Map";
        if (this.lastServerId != null) {
            name = this.servers[this.lastServerId].info.display_name + " - " + name;
        }

        //Update title
        document.title = name;

        //Update URL
        history.replaceState(null, name, this.GetCurrentUrl());
    }

}