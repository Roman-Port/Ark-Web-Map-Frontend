var serverid = "5de0a83d67bca6989c01b822";
var serverdata = null;
var clusters = null;
var permissionsconfig = null;

function Init() {
    //Get server ID
    //Todo...

    //Request all resources
    delta.serverRequest("https://config.deltamap.net/prod/permission_indexes.json", {"nocreds":true}, function(pc) {
        permissionsconfig = pc;
        delta.serverRequest("https://deltamap.net/api/users/@me/clusters", {}, function(c) {
            clusters = c;
            delta.serverRequest("https://deltamap.net/api/servers/"+serverid+"/manage", {
                "failOverride":function() {
                    window.location = "/servers/";
                }
            }, function(s) {
                serverdata = s;
                SetServerInfo(s);
                SetPageFlag("state_hide", false);
                SetPageFlag("state_loading", false);
            });
        });
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
    var t = document.getElementsByClassName("left_sidebar_button_active");
    for(var i = 0; i<t.length; i+=1) {
        t[i].classList.remove("left_sidebar_button_active");
    }

    //Disable old frame
    t = document.getElementsByClassName("active_delta_tab");
    for(var i = 0; i<t.length; i+=1) {
        t[i].classList.remove("active_delta_tab");
    }

    //Activate new button
    c.classList.add("left_sidebar_button_active");

    //Find and activate new frame
    document.getElementById('tab_'+c.getAttribute("data-tab")).classList.add("active_delta_tab");
}