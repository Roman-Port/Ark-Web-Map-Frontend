"use strict";

//Bar on the top of the screen
class DeltaSystemBar {

    constructor(mountpoint) {
        this.mountpoint = mountpoint;
        this.menuCreateCallback = function () {
            return [];
        }

        //Create
        this.sysBar = DeltaTools.CreateDom("div", "sysbar", this.mountpoint);
        var server = DeltaTools.CreateDom("div", "sysbar_server", this.sysBar);
        this.serverIcon = DeltaTools.CreateDom("img", "sysbar_server_icon", server);
        this.serverName = DeltaTools.CreateDom("span", null, server);
        this.optionContainer = DeltaTools.CreateDom("div", "sysbar_nav", this.sysBar);
        this.options = [];
        this.menu = DeltaTools.CreateDom("div", "sysbar_dropdown", server);
        this.menuContent = DeltaTools.CreateDom("div", "sysbar_dropdown_content", this.menu);
        server.addEventListener("click", () => {
            this.ToggleDropdown()
        });
    }

    //Sets up the top nav bar
    //Actions is array of {"title", "callback", "context"}
    SetActiveHeaderInfo(title, icon, actions, selectedActionIndex) {
        //Set server info
        this.serverName.innerText = title;
        this.serverIcon.src = icon;

        //Clear options
        while (this.optionContainer.firstChild != null) {
            this.optionContainer.firstChild.remove();
        }
        this._options = [];

        //Create options
        for (var i = 0; i < actions.length; i += 1) {
            var item = DeltaTools.CreateDom("div", null, this.optionContainer, actions[i].title);
            item._callback = actions[i].callback;
            item._context = actions[i].context;
            item._index = i;
            item.addEventListener("click", (e) => {
                //Clear the currently selected item
                if (e.target.parentElement._selected != null) {
                    e.target.parentElement._selected.classList.remove("sysbar_nav_selected");
                }

                //Apply
                e.target.classList.add("sysbar_nav_selected");
                e.target.parentElement._selected = e.target;

                //Run callback
                e.target._callback(e.target._context);
            });
            if (selectedActionIndex == i) {
                item.classList.add("sysbar_nav_selected");
                this.optionContainer._selected = item;
            }
        }
    }

    SetActiveHeaderSearch(enabled, placeholder, value, callback) {
        if (this.input != null) {
            this.input.remove();
            this.input = null;
        }
        if (enabled) {
            this.input = DeltaTools.CreateDom("input", "sysbar_input", this.sysBar);
            this.input.type = "text";
            this.input.placeholder = placeholder;
            this.input.value = value;
            this.input._callback = callback;
            this.input.addEventListener("input", (e) => {
                e.target._callback(e.target.input);
            });
        }
    }

    SetMenuCreateCallback(c) {
        this.menuCreateCallback = c;
    }

    ToggleDropdown() {
        if (this.menu.classList.contains("system_dropdown_shown")) {
            this.HideDropdown();
        } else {
            this.ShowDropdown();
        }
    }

    HideDropdown() {
        if (!this.menu.classList.contains("system_dropdown_shown")) {
            return; //Already inactive
        }

        //Hide
        this.menu.classList.remove("system_dropdown_shown");
    }

    ShowDropdown() {
        if (this.menu.classList.contains("system_dropdown_shown")) {
            return; //Already active
        }

        //Request menu params
        var params = this.menuCreateCallback();

        //Unpack menu. It's an array of items to render
        var outputMenu = DeltaTools.CreateDom("div", null);
        for (var i = 0; i < params.length; i += 1) {
            var pack = params[i];
            if (pack.type == "BTN") {
                //Big button
                var b = DeltaTools.CreateDom("div", "system_dropdown_item_btn", outputMenu);
                DeltaTools.CreateDom("img", "system_dropdown_item_btn_icon", b).src = pack.icon;
                DeltaTools.CreateDom("span", null, b).innerText = pack.text;
                b.addEventListener("click", pack.callback);
            } else if (pack.type == "SWITCH") {
                //Switch
                var b = DeltaTools.CreateDom("div", "system_dropdown_item_btn", outputMenu);
                DeltaTools.CreateDom("img", "system_dropdown_item_btn_icon", b).src = pack.icon;
                DeltaTools.CreateDom("span", null, b).innerText = pack.text;
                b._switch = DeltaTools.CreateDom("div", "system_dropdown_item_switch", b);
                if (pack.checked) {
                    b._switch.classList.add("system_dropdown_item_switch");
                }
                b.addEventListener("click", pack.callback);
            } else if (pack.type == "HR") {
                //Group
                DeltaTools.CreateDom("div", "system_dropdown_item_hr", outputMenu);
            } else if (pack.type == "SERVER") {
                //Server
                var b = DeltaTools.CreateDom("div", "system_dropdown_item_btn", outputMenu);
                DeltaTools.CreateDom("img", "system_dropdown_item_btn_icon", b).src = pack.icon;
                if (pack.sub != null) {
                    DeltaTools.CreateDom("div", "sysmenu_dropdown_notify", b).innerText = pack.sub;
                }
                DeltaTools.CreateDom("span", null, b).innerText = pack.text;
                b.addEventListener("click", pack.callback);
            } else {
                throw "Unsupported menu type '" + pack.type + "'!";
            }
        }

        //Render
        if (this.menuContent.firstChild != null) {
            this.menuContent.firstChild.remove();
        }
        this.menuContent.appendChild(outputMenu);

        //Show
        this.menu.classList.add("system_dropdown_shown");
    }

}