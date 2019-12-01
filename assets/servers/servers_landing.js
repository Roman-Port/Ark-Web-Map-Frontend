var server_data = null;
var content_mount = document.getElementById('content_mount');

function Init() {
    delta.serverRequest("https://deltamap.net/api/users/@me/servers", {
        "failOverride":function(s) {
            if(s.status == 401) {
                IniNoAuth();
            } else {
                delta.createDom("div", "rightmost_nav_button_middle", content_mount, "There was an error, sorry. Try again later.");
            }
        }
    }, function(d) {
        server_data = d;
        InitAuth();
    });
}

function IniNoAuth() {
    delta.createDom("div", "rightmost_nav_button", content_mount, "Add ARK Server").addEventListener('click', ShowAddServer);
    delta.createDom("div", "rightmost_nav_button_middle", content_mount, "OR");
    delta.createDom("div", "rightmost_nav_button", content_mount, "Manage DeltaWebMap Servers").addEventListener('click', delta.loginAndReturn);
}

function InitAuth() {
    for(var i = 0; i<server_data.servers.length; i+=1) {
        var e = delta.createDom("div", "rightmost_server_button", content_mount);
        var img = delta.createDom("div", "rightmost_server_button_icon", e);
        var top = delta.createDom("div", "rightmost_server_button_text_top", e);
        var bottom = delta.createDom("div", "rightmost_server_button_text_bottom", e);
        img.style.backgroundImage = "url("+server_data.servers[i].icon+")";
        top.innerText = server_data.servers[i].name;
        bottom.innerText = server_data.servers[i].map;
    }
    delta.createDom("div", "rightmost_nav_button", content_mount, "Add ARK Server").addEventListener('click', ShowAddServer);
}

function ShowAddServer() {
    document.getElementById('add_server_dialog').classList.add("add_server_dialog_shown");
    window.setTimeout(function() {
        window.location = "/servers/add/";
    }, 200);
}

Init();