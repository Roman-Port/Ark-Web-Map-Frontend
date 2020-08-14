"use strict";

class SubTabMenuTab extends DeltaServerTab {

    /* This has tabs on the left and a content view in the center */

    constructor(server) {
        super(server);

        //Layout takes in an array. Two kinds can be inside: SubTabMenuTabModule and a string. Strings are used as labels
        this.layout = this.GetCurrentLayout();
        this.tabs = [];
        this.currentTab = -1;
    }

    GetCurrentLayout() {
        //Overwrite this
        return [];
    }

    OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        super.OnInit(mountpoint);

        //Create views
        this.nav = DeltaTools.CreateDom("div", "subtab_nav", mountpoint);
        this.holder = DeltaTools.CreateDom("div", "subtab_holder", mountpoint);
        for (var i = 0; i < this.layout.length; i += 1) {
            if (typeof (this.layout[i]) == "string") {
                //Create title
                DeltaTools.CreateDom("div", "subtab_nav_label", this.nav, this.layout[i]);
            } else {
                //Create tab
                var menu = DeltaTools.CreateDom("div", "subtab_nav_btn", this.nav, this.layout[i].name);

                //Create content
                this.layout[i].Bind(this.server, this);
                var content = this.layout[i].Attach();
                this.layout[i].content = content;
                this.layout[i].menu = menu;
                var tabIndex = this.tabs.length;
                this.tabs.push(this.layout[i]);
                content.classList.add("subtab_content");
                this.holder.appendChild(content);

                //Add event
                menu.x_index = tabIndex;
                menu.addEventListener("click", (evt) => {
                    this.SwitchSubTabs(evt.target.x_index);
                });
            }
        }
    }

    SwitchSubTabs(index) {
        //Make sure this isn't the same tab
        if (this.currentTab == index) {
            return;
        }

        //Set last tab to inactive
        if (this.currentTab != -1) {
            this.tabs[this.currentTab].menu.classList.remove("subtab_nav_btn_active");
            this.tabs[this.currentTab].content.classList.remove("subtab_content_active");
        }

        //Set current
        this.currentTab = index;
        this.tabs[this.currentTab].menu.classList.add("subtab_nav_btn_active");
        this.tabs[this.currentTab].content.classList.add("subtab_content_active");

        //Run startup
        if (this.tabs[this.currentTab].first) {
            this.tabs[this.currentTab].OnFirstOpened();
        }
        this.tabs[this.currentTab].first = false;
        this.tabs[this.currentTab].OnOpened();
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */

        //Switch to default
        this.SwitchSubTabs(0);
    }

    async OnOpen() {
        /* Called when this tab is switched to */

    }

    async OnClose() {
        /* Called when this tab is switched away from */

    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */

    }

}

class SubTabMenuTabModule {

    /* Abstract class used for the SubTabMenuTab */

    constructor(name) {
        this.name = name;
        this.first = true;
    }

    Bind(server, holder) {
        this.server = server;
        this.holder = holder;
    }

    OnFirstOpened() {

    }

    OnOpened() {

    }

    Attach() {
        /* Returns a DOM element to use */
        return DeltaTools.CreateDom("div", null);
    }

}