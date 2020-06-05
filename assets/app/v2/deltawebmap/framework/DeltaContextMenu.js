"use strict";

class DeltaContextMenu {

    constructor(target, context, options) {
        if (target != null) {
            target.__contextMenu = this;
        }
        this.options = options;
        this.context = context;
    }

    //Listens for context menu clicks. Doesn't actually show a context menu
    static AddContextListener(target, app) {
        target.__contextMenuApp = app;
        target.addEventListener("contextmenu", function (evt) {
            //Prevent a real context menu
            evt.preventDefault();

            //Loop through and look for content to use as a menu
            var target = evt.target;
            while (target.parentNode != null) {
                if (target.__contextMenu != null) {
                    target.__contextMenu.Show(evt.x, evt.y, this.__contextMenuApp);
                    evt.stopPropagation();
                    break;
                }
                target = target.parentNode;
            }
        });
    }

    //Adds a context menu to a target
    static AddContextMenu(target, context, options) {
        return new DeltaContextMenu(target, context, options);
    }

    //Shows a context menu now
    static ForceOpenContextMenu(x, y, app, context, options) {
        var m = new DeltaContextMenu(null, context, options);
        m.Show(x, y, app);
    }

    static AddSpecial_DinoContextMenu(m, dino) {
        return DeltaContextMenu.AddContextMenu(m, dino, [
            [
                {
                    "name": "Copy ID",
                    "callback": (app, ddd) => {
                        DeltaTools.CopyToClipboard(ddd.id);
                    }
                }
            ]
        ]);
    }

    Show(x, y, app) {
        //If a menu is already open, close it
        if (this.menu != null) {
            this.Close();
        }

        //Create menu
        var menu = DeltaTools.CreateDom("div", "contextmenu_container", app.settings.mountpoint);
        this.menu = menu;

        //Loop through groups
        var first = true;
        for (var i = 0; i < this.options.length; i += 1) {
            //Loop through items in group
            var group = this.options[i];
            var d = DeltaTools.CreateDom("div", null);
            var added = 0;
            for (var j = 0; j < group.length; j += 1) {
                //Get defaults
                var item = group[j];
                var name = "NO_NAME";
                var style = null;
                var callback = function () {
                    console.warn("Context menu created with no callback!");
                }
                var enabled = true;
                var btnContext = true;

                //Read settings
                if (item.name != null) {
                    name = item.name;
                }
                if (item.style != null) {
                    style = item.style;
                }
                if (item.callback != null) {
                    callback = item.callback;
                }
                if (item.enabled != null) {
                    enabled = item.enabled;
                }
                if (item.btnContext != null) {
                    btnContext = item.btnContext;
                }

                //Cancel if needed
                if (!enabled) {
                    continue;
                }

                //Create
                var btn = DeltaTools.CreateDom("div", "contextmenu_option", d, name);
                added++;
                if (style != null) {
                    btn.classList.add("contextmenu_option_style_" + style);
                }
                btn._callback = callback;
                btn._menu = this;
                btn._app = app;
                btn._btnContext = btnContext;
                btn.addEventListener("click", function () {
                    this._menu.Close();
                    if (this._callback != null) {
                        this._callback(this._app, this._menu.context, this._btnContext);
                    }
                });
            }

            //Add seperator between groups
            if (!first && added > 0) {
                DeltaTools.CreateDom("div", "contextmenu_seperator", menu);
            }

            //Add
            if (added > 0) {
                first = false;
                menu.appendChild(d);
            }
        }

        //Position the menu on the screen
        menu.style.left = x.toString() + "px";
        menu.style.top = y.toString() + "px";

        //Add close event
        app.settings.mountpoint.addEventListener("mousedown", (evt) => this.ClickEvent(evt));
    }

    ClickEvent(evt) {
        if (!DeltaTools.IsElementInEventPath(evt, this.menu)) {
            this.Close();
        }
    }

    Close() {
        if (this.menu == null) { return; }
        this.menu.remove();
        this.menu = null;
    }

}