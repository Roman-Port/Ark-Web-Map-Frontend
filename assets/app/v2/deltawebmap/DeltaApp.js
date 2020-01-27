"use strict";

class DeltaApp {

    /* This class is the main class that sets up the rest of the app */

    constructor() {
        this.servers = {};
        this.rpc = null;
        this.user = null;
    }

    async Init() {
        /* Called when the app is first loaded */

        //Set up the user
        this.user = await this.InitUser();

        //Create RPC
        this.rpc = new DeltaRPC();

        //Get the menu container
        var menuContainer = document.getElementById('server_list_v3');

        //Create default cluster
        var clusterMenus = {};
        var defaultClusterMenu = this.CreateServerListClusterLabel(menuContainer, "UNCATEGORIZED");

        //Add clusters
        for (var i = 0; i < this.user.data.clusters.length; i += 1) {
            var cluster = this.user.data.clusters[i];
            clusterMenus[cluster.id] = this.CreateServerListClusterLabel(menuContainer, cluster.name);
        }

        //Boot up servers
        for (var i = 0; i < this.user.data.servers.length; i += 1) {
            //Create server
            var info = this.user.data.servers[i];
            var server = new DeltaServer(info);
            var canSwitch = await server.Init(); //TODO: Handle this returning false

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

        //Swtich to the server
        await this.SwitchServer("5e181ab86853fe2f04d60b49");
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

    async SwitchServer(id) {
        /* This will switch to a new server, deiniting the last one */

        var server = this.servers[id];
        var ok = await server.DownloadData();
        await server.OnSwitchedTo();
    }

}