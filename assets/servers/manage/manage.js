var serverdata = null;
var clusters = null;
var serversme = null;
var permissionsconfig = null;

var savedSetupServerConfig = {};

function Init() {
    //Get server ID
    //Todo...

    //Request all resources
    delta.serverRequest("https://config.deltamap.net/prod/permission_indexes.json", {"nocreds":true}, function(pc) {
        permissionsconfig = pc;
        delta.serverRequest("https://deltamap.net/api/users/@me/clusters", {}, function(c) {
            clusters = c;
            delta.serverRequest("https://deltamap.net/api/users/@me/servers", {}, function (sc) {
                serversme = sc;
                SetPageFlag("state_hide", false);
                SetPageFlag("state_loading", false);
                OpenCreateServerDialog();
            });
        });
    });
}

function InitDebug() {
    delta.serverRequest("https://config.deltamap.net/prod/permission_indexes.json", { "nocreds": true }, function (pc) {
        permissionsconfig = pc;
        clusters = [];
        serversme = {
            "token": "[SESSION RUNNING IN DEBUG MODE; NO TOKEN]",
            "servers": [
            ]
        };
        SetPageFlag("state_hide", false);
        SetPageFlag("state_loading", false);
        OpenCreateServerDialog();
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
    ShowSlide(2, 0);
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
    savedSetupServerConfig = {};
    ShowSlide(0, 0);
    document.body.classList.add("state_add");
}

InitDebug();