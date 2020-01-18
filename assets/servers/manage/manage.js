var serverdata = null;
var clusters = null;
var serversme = null;
var permissionsconfig = null;
var permissionstoggles = {}; //Holds refs to permission switches generated at startup
var serverid = "5e181ab86853fe2f04d60b49";
var isauth = false; //Is this user authenticated or signed in?
var maplist = null; //List of compatible maps
var params = {}; //URL params

var savedSetupServerConfig = {};

function Init() {
    //Parse URL params
    params = delta.parseURLParams();

    //Request all resources
    delta.serverRequest("https://config.deltamap.net/prod/permission_indexes.json", { "nocreds": true, "failOverride": OnInitFailure}, function(pc) {
        permissionsconfig = pc;
        CreatePermissions();
        delta.serverRequest("https://deltamap.net/api/config/maps.json", { "nocreds": true, "failOverride": OnInitFailure }, function (maps) {
            maplist = maps;
            delta.serverRequest("https://deltamap.net/api/users/@me/clusters", { "failOverride": OnInitFailure }, function (c) {
                clusters = c;
                delta.serverRequest("https://deltamap.net/api/users/@me/servers", { "failOverride": OnInitFailure }, function (sc) {
                    serversme = sc;
                    SetPageFlag("state_hide", false);
                    SetPageFlag("state_loading", false);
                    isauth = true;

                    if (sc.servers.length == 0) {
                        OpenCreateServerDialog();
                    } else {
                        //Show server setup prompt if that's what we were doing
                        if (params.postlogin != null) {
                            if (params.postlogin == "true") {
                                OpenCreateServerDialog();
                            }
                        }

                        //Init behind
                        SetPageFlag("state_noauth", false);
                        InitServer(serverid);
                    }
                });
            });
        });
    });
}

function OnInitFailure(c) {
    if (c.status == 401 || c.status == 403) {
        //Not authenticated! Show the setup window
        SetPageFlag("state_hide", false);
        SetPageFlag("state_loading", false);
        OpenCreateServerDialog();
    }
}

function InitServer(id) {
    //Set loader
    SetPageFlag("state_hide", true);
    SetPageFlag("state_loading", true);

    //Download
    delta.serverRequest("https://deltamap.net/api/servers/" + id + "/manage", {}, function (c) {
        serverdata = c;

        //Set content
        SetServerContent();

        //Show
        SetPageFlag("state_hide", false);
        SetPageFlag("state_loading", false);
    });
}

function SetServerContent() {
    SetServerHeader();
    SetServerAdminList();
    SetPermissionValues();
}

function SetServerHeader() {
    //Set icon and title
    document.getElementById('server_title_icon').src = serverdata.icon;
    document.getElementById('server_title_title').innerText = serverdata.name;

    //Set the text under the title
    var s = document.getElementById('server_title_subtitle');
    s.innerHTML = "";
    if (serverdata.map_name != null) {
        delta.createDom("span", "", s, serverdata.map_name);
    } else {
        delta.createDom("i", "", s, "Incompatible Map");
    }
    delta.createDom("span", "", s).innerHTML = " &#183; ";
    if (serverdata.cluster != null) {
        delta.createDom("span", "", s, serverdata.cluster.name);
    } else {
        delta.createDom("i", "", s, "No Cluster");
    }

    //Set status light
    var light = document.getElementById('server_status_icon');
    light.className = "statusbar_status_icon";
    switch (serverdata.status) {
        case "ONLINE": light.classList.add("statusbar_status_icon__online"); break;
        case "ALERT": light.classList.add("statusbar_status_icon__alert"); break;
        case "OFFLINE": light.classList.add("statusbar_status_icon__offline"); break;
    }

    //Set status text
    document.getElementById('server_status_text').innerText = serverdata.alert;
}

function SetServerAdminList() {
    //Get container
    var container = document.getElementById('tab_admin_list_listview');
    container.innerHTML = "";

    //Add admins
    for (var i = 0; i < serverdata.admins.length; i += 1) {
        var a = serverdata.admins[i];
        CreateSeamlistEntry(a.icon, a.name, "Steam ID: " + a.steamId, container);
    }
}

function SetPermissionValues() {
    //Loop through switches and set them
    var keys = Object.keys(permissionstoggles);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var s = permissionstoggles[k];
        var v = serverdata.permissions[k];
        if (v) {
            s.classList.add("switch_active");
        } else {
            s.classList.remove("switch_active");
        }
    }
}

function PushUpdate() {
    //Pushes update data, then refreshes
    SetPageFlag("state_loading", true);
    delta.serverRequest("https://deltamap.net/api/servers/" + serverid + "/manage", {
        "type": "POST",
        "body": JSON.stringify(serverdata),
        "failOverride": function () {
            window.location.reload();
        }
    }, function (s) {
        serverdata = s;
        SetPageFlag("state_loading", false);
        SetServerContent();
    });
}

function SetPageFlag(flag, active) {
    if(active) {
        document.body.classList.add(flag);
    } else {
        document.body.classList.remove(flag);
    }
}

function GetClusterById(id) {
    for(var i = 0; i<clusters.length; i+=1) {
        if(clusters[i].id == id) {
            return clusters[i];
        }
    }
    return null;
}

function SetServerInfo(d) {
    document.getElementById('load_img').src = d.icon;
    document.getElementById('load_title').innerText = d.name;
    if(d.cluster_id == null) {
        document.getElementById('load_cluster').innerText = "No Cluster";
    } else {
        document.getElementById('load_cluster').innerText = GetClusterById(d.cluster_id).name;
    }
}

function CreatePermissions() {
    //Create the permissions list
    var l = document.getElementById('permissions_list');
    l.innerHTML = "";
    permissionstoggles = {};

    //Add each
    for (var i = 0; i < permissionsconfig.length; i += 1) {
        var p = permissionsconfig[i];
        if (p.visibility != "UNUSED") {
            var t = CreatePermissionsSwitch(l, p.name, p.description, false, p.index, OnTogglePermission);
        }
    }
}

function OnTogglePermission(state, id) {
    //Sent when we change one of the permissions switches
    serverdata.permissions[id] = state;
    PushUpdate();
}

function OnSwitchTab(c) {
    //Disable all other buttons
    var t = document.getElementsByClassName("right_content_nav_option_selected");
    for(var i = 0; i<t.length; i+=1) {
        t[i].classList.remove("right_content_nav_option_selected");
    }

    //Disable old frame
    t = document.getElementsByClassName("active_delta_tab");
    for(var i = 0; i<t.length; i+=1) {
        t[i].classList.remove("active_delta_tab");
    }

    //Activate new button
    c.classList.add("right_content_nav_option_selected");

    //Find and activate new frame
    document.getElementById('tab_'+c.getAttribute("data-tab")).classList.add("active_delta_tab");
}

function OnMapChosen() {
    if (isauth) {
        ShowSlide(6, null);
    } else {
        ShowSlide(5, null);
    }
}

function ShowCustomModStep(data) {
    var e = document.getElementById('serverdialog_custom_steps');
    e.innerHTML = "";
    delta.createDom("h2", "", e, data.title);
    delta.createDom("p", "", e, data.description);
    for (var i = 0; i < data.steps.length; i += 1) {
        var step = data.steps[i];
        var o = delta.createDom("div", "serverctab_steps_step", e);
        delta.createDom("div", "serverctab_steps_bubble", o, (i + 1).toString());
        delta.createDom("b", "", o, step.title);
        delta.createDom("div", "", o).innerHTML = DecodeStaticText(step.text);
        if (step.image != null) {
            var img = delta.createDom("div", "serverctab_steps_bubble_thumb", o);
            img.style.backgroundImage = "url(" + step.image + ")";
            img.x_url = step.image;
            img.addEventListener("click", function () {
                ShowMedia(this.x_url);
            });
        }
    }
}

function DecodeStaticText(data) {
    var t = typeof (data);
    if (t == "string") {
        return data;
    } else if (t == "function") {
        return data();
    }
    return "INVALID_DATA";
}

function ShowMedia(url) {
    document.getElementById('mediabox_content').style.backgroundImage = "url(" + url + ")";
    document.body.classList.add('state_media');
}

function ShowSlide(index, context) {
    //Get contents
    var container = document.getElementById('serverdialog_box_content');
    var slide = container.children[index];
    var flow = FLOWS[index];

    //Hide other tabs
    delta.loopElementsByClassname("serveridalog_box_tab", function (d) {
        d.classList.remove("serveridalog_box_tab_active");
    }, container);

    //Show this slide
    flow.oncreate(slide, context);
    slide.classList.add("serveridalog_box_tab_active");

    //Update data
    container.x_last_ctx = context;
    container.x_last_index = index;
    container.x_next_enabled = flow.nextEnabled;
    document.getElementById('serverdialog_box_bottom_bar_filling').style.width = (flow.getProgress(context) * 100).toString() + "%";
    if (!flow.nextEnabled) {
        document.getElementById('serverdialog_box_bottom_btn').classList.add("dbtn_disabled");
    } else {
        document.getElementById('serverdialog_box_bottom_btn').classList.remove("dbtn_disabled");
    }
}

function OnPickSetupProvider(id) {
    savedSetupServerConfig[KEY_SERVERSETUP_PROVIDER] = id;
    ShowSlide(7, 0);
}

function LoginSetupBox() {
    delta.loginAndReturnTo("https://" + window.location.host + window.location.pathname + "?postlogin=true");
}

function SetServerLockStatus(isLocked) {
    var c = document.getElementById('serverctab_lock_btns').children;
    if (isLocked) {
        c[0].classList.remove("serverctab_lock_btn_active");
        c[1].classList.add("serverctab_lock_btn_active");
    } else {
        c[1].classList.remove("serverctab_lock_btn_active");
        c[0].classList.add("serverctab_lock_btn_active");
    }
}

function OnSlideNextBtn() {
    var c = document.getElementById('serverdialog_box_content');
    var slide = c.children[c.x_last_index];
    var flow = FLOWS[c.x_last_index];
    var context = c.x_last_ctx;

    if (!c.x_next_enabled) {
        return;
    }

    flow.onnext(function (ctx) {
        ShowSlide(c.x_last_index + 1, ctx);
    }, function (i, ctx) {
        ShowSlide(i, ctx);
    }, context);
}

function OpenCreateServerDialog() {
    //Reset settings
    savedSetupServerConfig = {};

    //Check if this is a postlogin
    var isPost = false;
    if (params.postlogin != null) {
        isPost = params.postlogin == "true";
    }
    if (isPost && isauth) {
        ShowSlide(6, 0);
    } else {
        ShowSlide(0, 0);
    }

    //Show
    document.body.classList.add("state_add");
}

function CreateSeamlistEntry(img, title, subtitle, container) {
    var e = delta.createDom("seamlist", "", container);
    delta.createDom("img", "seamlist_image", e).src = img;
    delta.createDom("div", "seamlist_top_text", e).innerText = title;
    delta.createDom("div", "seamlist_bottom_text", e).innerText = subtitle;
    return e;
}

function CreatePermissionsSwitch(container, title, subtitle, state, id, callback) {
    var e = delta.createDom("div", "permissions_item", container);
    CreateSwitch(state, id, callback, e).classList.add("permissions_item_switch");
    delta.createDom("div", "permissions_item_title", e, title);
    delta.createDom("div", "permissions_item_text", e, subtitle);
    return e;
}

function CreateSwitch(state, id, callback, container) {
    var e = delta.createDom("switch", "", container);
    if (state) {
        e.classList.add("switch_active");
    }
    e.x_id = id;
    e.x_callback = callback;
    e.addEventListener('click', function () {
        //Toggle
        this.classList.toggle("switch_active");

        //Get state
        var nState = this.classList.contains("switch_active");

        //Trigger callback
        this.x_callback(nState, this.x_id);
    });
    permissionstoggles[id] = e;
    return e;
}

Init();