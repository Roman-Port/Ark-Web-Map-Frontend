var main = {};

var CLIENT_VERSION = 1;

main.ark_config = {
    "compatible_maps": [
    {
        "friendly_name":"Extinction",
        "internal_name":"Extinction",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_orange.png",
        "tiles_supported":true
    },
    {
        "friendly_name":"The Center",
        "internal_name":"TheCenter",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_blue.png",
        "tiles_supported":true
    },
    {
        "friendly_name":"The Island",
        "internal_name":"TheIsland",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_blue.png",
        "tiles_supported":false
    },
    {
        "friendly_name":"Scorched Earth",
        "internal_name":"ScorchedEarth",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_orange.png",
        "tiles_supported":false
    },
    {
        "friendly_name":"Aberration",
        "internal_name":"Aberration",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_violet.png",
        "tiles_supported":false
    },
    {
        "friendly_name":"Ragnorok",
        "internal_name":"Ragnorok",
        "icon_url":"https://ark.romanport.com/assets/images/map_icons/generic_blue.png",
        "tiles_supported":false
    }
]};

main.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reply = JSON.parse(this.responseText);
            main.hideLoader(null);
            callback(reply);
        } else if(this.readyState == 4) {
            main.hideLoader("Server failed.");
            if(args.failOverride != null) {
                args.failOverride(this);
            } else {
                if (this.readyState == 4 && this.status == 500) {
                    console.warn("Unhandled error:");
                } else if (this.readyState == 4 && this.status == 401) {
                    //Not authenticated
                    window.location = "/login/providers/";
                } else if (this.readyState == 4) {
                    //Parse the response and display the error
                    ark.onNetError(this.status + " ("+this.statusText+")", args);
                }
            }
        }
    }
    if(args.type == null) {
        args.type = "GET";
    }
    if(url.includes("?")) {
        url += "&v="+CLIENT_VERSION;
    } else {
        url += "?v="+CLIENT_VERSION;
    }
    if(args.name != null) {
        main.showLoader(args.name);
    }
    xmlhttp.open(args.type, url, true);
    if(args.nocreds == null || !args.nocreds) {
        //Include auth. If we don't have a token, redirect to login now
        if(localStorage.getItem("provider_access_token") == null) {
            window.location = "/login/providers/";
        } else {
            xmlhttp.setRequestHeader("Authorization", "Bearer "+localStorage.getItem("provider_access_token"));
        }
    }
    xmlhttp.send(args.body);
}

main.me = null;

main.init = function() {
    //Fetch our user data
    main.serverRequest("https://ark.romanport.com/api/providers/@me", {}, function(me) {
        main.me = me;

        //Fill UI
        document.getElementById('me_name').innerText = me.name;
        document.getElementById('me_img').src = me.icon;
    });
}

main.createDom = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    return e;
}
main.removeAllChildren = function(e) {
    while(e.firstChild != null) {
        e.firstChild.remove();
    }
}

main.switchingTabsBusy = false;
main.currentTab = -1;
main.chooseTab = function(id) {
    //If already switching tabs, stop
    if(main.switchingTabsBusy) {
        return;
    }

    //Get data
    var data = main.tabs[id];
    main.currentTab = id;
    main.switchingTabsBusy = true;

    //Hide everything else
    var tops = document.getElementsByClassName('top_bar_section');
    for(var i = 0; i<tops.length; i+=1) { tops[i].classList.remove("top_bar_section_selected"); }
    var contents = document.getElementsByClassName('content_tab');
    for(var i = 0; i<contents.length; i+=1) { contents[i].classList.remove("content_tab_active"); }

    //Select the top tab
    document.getElementById('tab_top_'+id.toString()).classList.add("top_bar_section_selected");

    //Call switch
    data.onSwitch(function() {
        //Callback. Finally show content
        document.getElementById('tab_content_'+id.toString()).classList.add("content_tab_active");

        //Unbusy
        main.switchingTabsBusy = false;
    });
}

main.refreshTab = function() {
    //If already switching tabs, stop
    if(main.switchingTabsBusy) {
        return;
    }

    //Hide
    var contents = document.getElementsByClassName('content_tab');
    for(var i = 0; i<contents.length; i+=1) { contents[i].classList.remove("content_tab_active"); }

    //Process
    var data = main.tabs[main.currentTab];
    main.switchingTabsBusy = true;

    //Call switch
    data.onSwitch(function() {
        //Callback. Finally show content
        document.getElementById('tab_content_'+main.currentTab.toString()).classList.add("content_tab_active");

        //Unbusy
        main.switchingTabsBusy = false;
    });
}

main.showLoader = function(text) {
    var e = document.getElementById('bottom_modal');
    e.innerText = text;
    e.classList.add("bottom_modal_active");
}

main.hideLoader = function(text) {
    var e = document.getElementById('bottom_modal');
    //If text was provided, we set it and wait. If not, we hide now
    var delay = 1;
    if(text != null) {
        e.innerText = text;
        delay = 2000;
    }
    window.setTimeout(function() {
        e.classList.remove("bottom_modal_active");
    }, delay);
}

main.tableHelper = function(table, data, lineExecute) {
    //Clear all lines
    var lines = table.tBodies[0].children;
    while(lines.length > 1) {
        lines[lines.length - 1].remove();
    }

    //Start adding lines
    for(var i = 0; i<data.length; i+=1) {
        var results = lineExecute(data[i]);
        var d = main.createDom("tr", "", table.tBodies[0]);
        for(var j = 0; j<results.length; j+=1) {
            var place = main.createDom("td", "", d); 
            var r = results[j];
            var rType = typeof(r);
            if(rType == "string") {
                place.innerText = r;
            } else if (rType == "function") {
                place.appendChild(rType(data[i]));
            } else {
                place.appendChild(r);
            }
        }
    }
} 

main.createMachines = function(next) {
    //Create table
    main.tableHelper(document.getElementById('machines_table'), main.me.machines, function(d) {
        var man = main.createDom("span", "link");
        man.innerText = "Manage";
        var count = 0;
        for(var i = 0; i<main.me.servers.length; i+=1) {
            if(main.me.servers[i].machine_id == d.id) {
                count++;
            }
        }
        return [
            d.name,
            d.location,
            "ARK: Survival Evolved",
            count.toString(),
            "Yes",
            man
        ];
    });

    //Done
    next();
}

main.createServers = function(next) {
    //Create table
    main.tableHelper(document.getElementById('servers_table'), main.me.servers, function(d) {
        var machine = null;
        for(var i = 0; i<main.me.machines.length; i+=1) {
            if(main.me.machines[i].id == d.machine_id) {
                machine = main.me.machines[i];
                break;
            }
        }

        var client = null;
        var clientText = main.createDom("span", "");
        if(client == null) {
            clientText.classList.add("i");
            clientText.innerText = "No Client Linked";
        }

        var man = main.createDom("span", "link");
        man.innerText = "Manage";
        return [
            d.name,
            clientText,
            machine.name,
            "ARK: Survival Evolved",
            d.game_settings.map_name,
            "Yes",
            man
        ];
    });

    //Done
    next();
}

main.tabs = [
    {
        onSwitch:main.createServers
    },
    {
        onSwitch:main.createMachines
    },
    {
        onSwitch:function(next){next();}
    },
    {
        onSwitch:function(next){next();}
    }
];

main.showMachineEnrollForm = function() {
    pform.show([
        {
            "type":"bottom",
            "text":"Machines represent physical hardware on a specific game. You only need to register one machine per game per physical computer. You can configure multiple servers inside each machine."
        },
        {
            "type":"input",
            "name":"Name",
            "id":"f_name"
        },
        {
            "type":"input",
            "name":"Location",
            "id":"f_location"
        },
        {
            "type":"select",
            "name":"Game",
            "id":"f_name",
            "options":[
                {"name":"ARK: Survival Evolved", "value":"0"}
            ]
        },
    ], "Create New Machine", "Create Machine", function(){

        //Verify
        var name = document.getElementById('f_name').value;
        if(name.length > 24 || name.length < 2) {
            return [
                {
                    "id":"f_name",
                    "text":"2-24 characters are required."
                }
            ];
        }
        
        var location = document.getElementById('f_location').value;
        if(location.length > 24 || location.length < 2) {
            return [
                {
                    "id":"f_location",
                    "text":"2-24 characters are required."
                }
            ];
        }
        
        //Send
        var body = {
            "name":name,
            "location":location
        };
        main.serverRequest("https://ark.romanport.com/api/providers/machines/@new", {
            "type":"post",
            "body":JSON.stringify(body),
            "name":"Creating Machine..."
        }, function(c) {
            main.me.machines.push(c);
            main.refreshTab();
        });
    }, function(){});
}

main.showServerEnrollForm = function() {
    var machineOptions = [];
    for(var i = 0; i<main.me.machines.length; i+=1) {
        var m = main.me.machines[i];
        machineOptions.push({
            "name":m.name,
            "value":m.id
        });
    }

    var mapOptions = [];
    for(var i = 0; i<main.ark_config.compatible_maps.length; i+=1) {
        var m = main.ark_config.compatible_maps[i];
        mapOptions.push({
            "name":m.friendly_name,
            "value":m.internal_name
        });
    }

    pform.show([
        {
            "type":"bottom",
            "text":"Servers are what a client actually sees. They appear the same as a normal, consumer server."
        },
        {
            "type":"input",
            "name":"Name",
            "id":"f_name"
        },
        {
            "type":"select",
            "name":"Machine",
            "id":"f_machine",
            "options":machineOptions
        },
        {
            "type":"select",
            "name":"Linked Client",
            "id":"f_user",
            "options":[
                {"name":"No Client", "value":"@none"}
            ]
        },
        {
            "type":"bottom",
            "text":"A client represents one of your customers. You should create a client for the server owner in the \"Users\" tab. Multiple servers can be assigned to one client. Clients can use the account you create to manage their Delta Web Map servers as a normal consumer would. For more info, view the \"Users\" tab."
        },
        {
            "type":"select",
            "name":"ARK Map",
            "id":"f_ark_map",
            "options":mapOptions
        },
        {
            "type":"input",
            "name":"Save Pathname",
            "id":"f_ark_path"
        },
    ], "Create New Server", "Create Server", function(){

        //Verify
        var name = document.getElementById('f_name').value;
        if(name.length > 24 || name.length < 2) {
            return [
                {
                    "id":"f_name",
                    "text":"2-24 characters are required."
                }
            ];
        }

        var clientId = document.getElementById('f_user').value;
        if(clientId == "") {
            clientId = null;
        }
        
        //Send
        var body = {
            "name":name,
            "clientId":clientId,
            "machineId":document.getElementById('f_machine').value,
            "mapName":document.getElementById('f_ark_map').value,
            "mapPath":document.getElementById('f_ark_path').value,
            "serverName":name
        };
        main.serverRequest("https://ark.romanport.com/api/providers/servers/@new", {
            "type":"post",
            "body":JSON.stringify(body),
            "name":"Creating Server..."
        }, function(c) {
            main.me.servers.push(c);
            main.refreshTab();
        });
    }, function(){});
}