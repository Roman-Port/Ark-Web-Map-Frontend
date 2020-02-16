"use strict";

class DeltaApp {

    /* This class is the main class that sets up the rest of the app */

    constructor() {
        this.servers = {};
        this.rpc = null;
        this.user = null;
        this.lastServer = null;
        this.viewUserSettings = new DeltaUserSettingsTabView(this);
        this.maps = {};
        this.SIDEBAR_OPTIONS = [
            {
                "name": "User Settings",
                "view": this.viewUserSettings,
                "icon": "/assets/app/icons/left_nav_v3/user_settings.svg"
            }
        ];
    }

    async Init() {
        /* Called when the app is first loaded */

        //Set up the user
        this.user = await this.InitUser();

        //Get map list
        this.maps = await DeltaTools.WebRequest(LAUNCH_CONFIG.API_ENDPOINT + "/maps.json", {}, null);

        //Create DOM
        this.LayoutDom(document.body);

        //Create message views
        this.msgViewNoServers = this.CreateMessageView("", "No Servers", "Sorry, you don't seem to have any servers. Join an ARK server with Delta Web Map to get started.");
        this.msgViewActiveServerErr = this.CreateMessageView("", "D'oh!", "D'oh!<br><br>Looks like the current ARK server has become unavailable. Check back soon!");
        this.msgViewServerNotFound = this.CreateMessageView("", "Server Not Found", "Hmph.<br><br>You don't have access to this ARK server, the server was removed, or it never existed to begin with.");
        this.msgViewServerRequestedNotOk = this.CreateMessageView("", "Server Not Found", "Hmph.<br><br>The server you attempted to access is unavailable. Try again later.");

        //Create RPC
        this.rpc = new DeltaRPC();

        //Set up servers
        if (this.user.data.servers.length > 0) {
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
                //Get server info
                var info = this.user.data.servers[i];

                //Create the server on the sidebar
                var menu = DeltaTools.CreateDom("div", "v3_nav_server");
                var top = DeltaTools.CreateDom("div", "v3_nav_server_top", menu);
                DeltaTools.CreateDom("img", "v3_nav_server_top_icon", top).src = info.image_url;
                var alertBadge = DeltaTools.CreateDom("div", "sidebar_server_error_badge", top, "!");
                menu.alertBadge = alertBadge;
                var loaderBadge = DeltaTools.CreateDom("div", "loading_spinner server_loader", top, "");
                menu.loaderBadge = loaderBadge;
                DeltaTools.CreateDom("span", "", top).innerText = info.display_name;
                var bottom = DeltaTools.CreateDom("div", "v3_nav_server_bottom", menu);

                //Create server
                var server = new DeltaServer(this, info, menu);
                var m = DeltaTools.CreateDom("div", "server_mountpoint", this.mainHolder);
                var canSwitch = await server.Init(m); //TODO: Handle this returning false

                //Finish creating menu
                for (var j = 0; j < server.tabs.length; j += 1) {
                    var btn = server.tabs[j].CreateMenuItem(bottom);
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
                    this.x_app.SwitchServer(this.x_app.servers[this.x_id]);
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
        }

        //Add "add server" button
        DeltaTools.CreateDom("div", "v3_nav_server_add", this.serverListHolder, "Add Server").addEventListener("click", function () {
            window.open("/servers/", "_blank");
        });

        //Swtich to the default server
        this.SwitchServer(this.GetDefaultServer());
    }

    LayoutLoginScreen(mount) {

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

        var top = DeltaTools.CreateDom("div", "top_nav", mount); //Top strip. Pretty much has no use except to show a darker color at this point, though
        DeltaTools.CreateDom("div", "delta_nav_badge", top, "DeltaWebMap");

        var leftSidebar = DeltaTools.CreateDom("div", "dino_sidebar smooth_anim dino_sidebar_open v3_nav_area", mount);
        this.serverListHolder = DeltaTools.CreateDom("div", "v3_nav_server_area", leftSidebar);
        var bottom = DeltaTools.CreateDom("div", "v3_nav_bottom", leftSidebar);

        //Add bottom options
        for (var i = 0; i < this.SIDEBAR_OPTIONS.length; i += 1) {
            var o = this.SIDEBAR_OPTIONS[i];

            //Create view
            var view = o.view;
            var m = DeltaTools.CreateDom("div", "server_mountpoint", this.mainHolder);
            view.Init(m);

            //Create menu
            var c = DeltaTools.CreateDom("div", "v3_nav_server", bottom);
            var cc = DeltaTools.CreateDom("div", "v3_nav_server_top", c);
            DeltaTools.CreateDom("img", "v3_nav_server_top_icon", cc).src = o.icon;
            DeltaTools.CreateDom("span", "", cc).innerText = o.name;
            view.menu = c;
            c.x_app = this;
            c.x_view = view;
            c.addEventListener("click", function () {
                this.x_app.SwitchServer(this.x_view);
            });
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

    SwitchServer(server) {
        /* This will switch to a new server, switching away from the last one */
        
        //Check if we're already on this server
        if (this.lastServer == server) {
            return;
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

}