var usettings = {};

//Defines setting options
usettings.USER_SETTINGS_DEFS = [
    {
        "type":"SWITCH",
        "title":"Word Filter",
        "subtitle":"Hides dinosaurs with bad words in their names.",
        "get":function() {
            return main.me.user_settings.vulgar_filter_on;
        },
        "set":function(d) {
            main.me.user_settings.vulgar_filter_on = d;
        }
    },
    {
        "type":"SWITCH",
        "title":"Report Analytics",
        "subtitle":"Analytics are used to track problems on the platform. Turning off this option will delete your saved analytics data.",
        "get":function() {
            return main.me.user_settings.vulgar_filter_on;
        },
        "set":function(d) {
            main.me.user_settings.vulgar_filter_on = d;
        }
    },
    {
        "type":"BUTTONS",
        "title":"Log Out",
        "subtitle":"You can also <a href=\"javascript:usettings._logout('@all')\">log out everywhere</a> to log out of other computers.",
        "buttons":[
            {
                "style":"master_btn_red",
                "text":"Log Out",
                "callback":function() {
                    usettings._logout("@this");
                }
            }
        ]
    },
    {
        "type":"BUTTONS",
        "title":"Download Data",
        "subtitle":"You can choose to download all of your personal data.",
        "buttons":[
            {
                "style":"master_btn_blue",
                "text":"Download Data",
                "callback":function() {
                    alert("This'll be working very soon!"); //TODO
                }
            }
        ]
    },
    {
        "type":"BUTTONS",
        "title":"Delete Data",
        "subtitle":"This won't delete saved ARK game data.",
        "buttons":[
            {
                "style":"master_btn_red_outline",
                "text":"Delete Account",
                "callback":function() {
                    alert("This'll be working very soon!"); //TODO
                }
            }
        ]
    }
];

usettings.SERVER_SETTINGS_DEFS = [
    {
        "type":"BUTTONS",
        "title":"Delete Server",
        "subtitle":"If your server no longer uses Delta Web Map, you can remove it for <u>all users</u>. Be sure to uninstall the mod before choosing this option.",
        "buttons":[
            {
                "style":"master_btn_red",
                "text":"Delete",
                "callback":function(data) {
                    usettings.promptConfirmDeleteGeneric("Delete Server", "This won't delete any of your ARK data. However, you'll need to uninstall the server mod to prevent your server from reappearing.", data.display_name, "Delete", function() {});
                }
            }
        ]
    }
];

usettings.SETTINGS_TYPES_DEFS = {
    "SWITCH":function(content, options) {
        var e = main.createDom("div", "settings_option_body", content);
        var title = main.createDom("div", "settings_subtitle", e, options.title);
        if(options.subtitle != null) {
            main.createDom("div", "settings_text", e).innerHTML = options.subtitle;
        }
        var swi = main.createDom("div", "settings_option_switch", title);
        var knob = main.createDom("div", "settings_option_knob", swi);
        if(options.get()) {
            swi.classList.add("switch_active");
        }
        swi.x_options = options;
        e.x_switch = swi;
        e.addEventListener("click", function() {
            var context = this.x_switch;
            context.classList.toggle("switch_active");
            context.x_options.set(context.classList.contains("switch_active"));
        });
    },
    "BUTTONS":function(content, options, data) {
        var e = main.createDom("div", "settings_option_body", content);
        for(var i = 0; i<options.buttons.length; i+=1) {
            var btno = options.buttons[i];
            var btn = main.createDom("div", "master_btn settings_option_btn "+btno.style, e);
            btn.innerText = btno.text;
            btn.x_data = data;
            btn.addEventListener("click", function() {
                btno.callback(this.x_data);
            });
        }
        var title = main.createDom("div", "settings_subtitle", e, options.title);
        if(options.subtitle != null) {
            main.createDom("div", "settings_text", e).innerHTML = options.subtitle;
        }
    }
};

usettings.createDom = function (view) {
    var e = main.createDom("div", "");

    //Create top
    var top = main.createDom("div", "settings_top_container", e);
    var headerBg = view.icon;
    if(view.override_header != null) {headerBg = view.override_header;}
    main.createDom("div", "settings_top_background", top).style.backgroundImage = "url("+headerBg+")";
    main.createDom("div", "settings_top_icon", top).style.backgroundImage = "url("+view.icon+")";
    main.createDom("div", "settings_top_title", top).innerText = view.title;
    main.createDom("div", "settings_top_username", top).innerText = view.subtitle;

    //Create content
    var content = main.createDom("div", "settings_content", e);
    for(var i = 0; i<view.settings.length; i+=1) {
        var option = view.settings[i];
        usettings.SETTINGS_TYPES_DEFS[option.type](content, option, view.data);
    }

    //Create bottom
    var bottom = main.createDom("div", "settings_bottom", e);
    main.createDom("div", "master_btn master_btn_blue settings_bottom_save_btn", bottom, "Save").addEventListener("click", view.callback);
    if(view.show_terms) {
        var bottomleft = main.createDom("div", "settings_bottom_terms", bottom);
        main.createDom("span", "", main.createDom("div", "", bottomleft), "© Delta Web Map 2019 • " + main.getVersionString());
        var terms = main.createDom("div", "", bottomleft);
        main.createLink(terms, "Privacy", "/privacy/");
        main.createDom("span", "", terms, " • ");
        main.createLink(terms, "Discord", "https://discord.gg/99TcfCT");
    }

    return e;
}

usettings.openUserSettings = function() {
    var container = main.createDom("div", "xform_element");
    var body = main.createDom("div", "xform_element_box", container);
    var view = {
        "title":"USER SETTINGS",
        "subtitle":main.me.screen_name,
        "icon":main.me.profile_image_url,
        "settings":usettings.USER_SETTINGS_DEFS,
        "callback":usettings.saveUserSettings,
        "show_terms":true
    }
    var gen = usettings.createDom(view);
    body.appendChild(gen);
    form.add_raw(container, 'xform_area_dim', {});
}

usettings.openServerSettings = function(id) {
    var server = ark.getServerDataById(id);
    var container = main.createDom("div", "xform_element");
    var body = main.createDom("div", "xform_element_box", container);
    var view = {
        "title":"SERVER SETTINGS",
        "subtitle":server.display_name,
        "icon":server.image_url,
        "settings":usettings.SERVER_SETTINGS_DEFS,
        "callback":usettings.saveServerSettings,
        "show_terms":false,
        "override_header":"/assets/app/img/default_icon_header.png",
        "data":server
    }
    var gen = usettings.createDom(view);
    body.appendChild(gen);
    form.add_raw(container, 'xform_area_dim', {});
}

usettings.saveUserSettings = function() {
    //Save settings
    main.serverRequest(ROOT_URL+"users/@me/user_settings", {
        "type":"POST",
        "body":JSON.stringify(main.me.user_settings)
    }, function() {});

    //Close window
    form.pop();
}

usettings.saveServerSettings = function() {
    //Save settings
    main.serverRequest(ROOT_URL+"users/@me/user_settings", {
        "type":"POST",
        "body":JSON.stringify(main.me.user_settings)
    }, function() {});

    //Close window
    form.pop();
}

usettings._logout = function(type) {
    main.serverRequest(ROOT_URL+"users/@me/tokens/"+type+"/devalidate", {"type":"POST"}, function() {});
    form.add("Logged Out", [ { "type":"text", "text":"You signed out." } ], [ { "type":0, "name":"Sign In Again", "callback":function() { main.signin(); } } ], "xform_area_interrupt");
}

usettings.promptConfirmDeleteGeneric = function(title, extraSubtitle, entry, btnText, callback) {
    //Create content
    var e = main.createDom("div", "");
    var content = main.createDom("div", "confirm_box_content", e);
    main.createDom("div", "settings_title", content, title);
    if(extraSubtitle != null) {
        main.createDom("div", "settings_text", content, extraSubtitle);
    }
    var sub = main.createDom("div", "settings_text", content);
    main.createDom("span", "", sub, "You can't undo this action. To confirm, type ");
    main.createDom("span", "settings_code", sub, entry);
    main.createDom("span", "", sub, " into the box below.");

    //Create bottom
    var bottom = main.createDom("div", "settings_bottom", e);
    main.createDom("div", "master_btn master_btn_red settings_bottom_save_btn master_btn_no_frame", bottom, "Cancel").addEventListener("click", form.pop);
    var btn = main.createDom("div", "master_btn master_btn_red settings_bottom_save_btn master_btn_disabled", bottom, btnText);
    btn.addEventListener("click", function() {
        if(!this.classList.contains("master_btn_disabled")) {
            callback(this.x_callback);
            form.pop();
        }
    });
    btn.x_callback = callback;

    //Add entry
    var box = main.createDom("input", "confirm_box_input", content);
    box.x_btn = btn;
    box.x_confirm = entry;
    box.addEventListener("input", function() {
        if(this.value == this.x_confirm) {
            this.x_btn.classList.remove("master_btn_disabled");
        } else {
            this.x_btn.classList.add("master_btn_disabled");
        }
    });
    window.setTimeout(function() {
        box.focus();
    }, 500);

    //Show
    var container = main.createDom("div", "xform_element");
    var body = main.createDom("div", "xform_element_box", container);
    body.appendChild(e);
    form.add_raw(container, 'xform_area_dim', {});
}