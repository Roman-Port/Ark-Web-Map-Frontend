var marea = document.getElementById('main');
var AREA_ANIMATION_TIME = 100;
var hasInit = false;
var activeArea = null;
var introSettings = null;
var serverSettings = null;
var serverCreds = null;

var MAP_DATA = {
    "4":{
        "name":"Extinction",
        "internal_name":"Extinction"
    }
}

var slides = {
    "intro":{
        "template":document.getElementById('slide_intro'),
        "init":function(e, context, next){next();}
    },
    "login":{
        "template":document.getElementById('slide_login'),
        "init":function(e, context, next) {
            //Check if we're already signed in
            delta.serverRequest("https://deltamap.net/api/users/@me/", {
                "failOverride":function() {
                    next();
                }
            }, function(d) {
                //We are signed in. Show after login
                if(introSettings.type == "cluster") {
                    //Go to cluster config
                    next("cluster_setup", context);
                } else {
                    //Go to main config
                    next("setup", context);
                }
            });
        }
    },
    "cluster_setup":{
        "template":document.getElementById('slide_cluster_setup'),
        "init": function(e, context, next) {
            next();
        }
    },
    "setup":{
        "template":document.getElementById('slide_setup'),
        "init":function(e, context, next){
            //Set the active map to the first one we've chosen
            var maps = e.getElementsByClassName("form_map")[0].querySelector("user-option-form-options");
            for(var i = 0; i<maps.children.length; i+=1) {
                if(maps.children[i].dataset.name == introSettings.maps[0]) {
                    maps.children[i].classList.add("user-option-element-active");
                }
            }

            //If we're not a cluster, don't show map selection. We already know what it is!
            if(introSettings.type == "single") {
                e.getElementsByClassName("form_map")[0].style.display = "none";
            }

            //Clear latest icon
            latestImgToken = null;

            //Next
            next();
        }
    },
    "setup_download":{
        "template":document.getElementById('slide_setup_download'),
        "init":function(e, context, next) {
            next();
        }
    },
    "setup_files":{
        "template":document.getElementById('slide_setup_files'),
        "init":function(e, context, next) {
            next();
        }
    },
    "load_configure_server":{
        "template":document.getElementById('slide_setup_doconfig'),
        "init":function(e, context, next) {
            SendRscMessage(6, {
                "config":JSON.stringify(context)
            });
            serverSettings.timer = window.setInterval(function() {
                delta.serverRequest("https://deltamap.net/api/servers/"+serverCreds.id+"/status", {}, function(d) {
                    if(d.ready) {
                        //Done!
                        clearInterval(serverSettings.timer);
                    
                        //If this is a cluster, show next. Else, animate into it
                        if(introSettings.type == "single") {
                            //Transition into the app
                            localStorage.setItem("latest_server", serverCreds.id);
                            var tgo = delta.createDom("div", "transition_loader", document.body);
                            window.setTimeout(function() {
                                tgo.classList.add("transition_loader_go");
                            }, 100);
                            window.setTimeout(function() {
                                window.location = "/app/";
                            }, 200);
                        } else {
                            //Do it again
                            ShowSlide("done_configure_server");
                        }
                    }
                });
            }, 1000);
            next();
        }
    },
    "done_configure_server":{
        "template":document.getElementById('slide_setup_done'),
        "init":function(e, context, next) {
            console.log("Server added!");
        }
    }
};

function ShowSlide(id, context, skipHide) {
    //Get the slide data
    var d = slides[id];

    //Get time
    var time = AREA_ANIMATION_TIME;
    if(hasInit) {
        //Hide current slide
        marea.classList.add("hidden_slide_area");
    } else {
        //Show now
        time = 1;
        hasInit = true;
    }
    if(skipHide != null && skipHide == true) {
        time = 1;
    }

    //Wait
    window.setTimeout(function() {
        //Erase and show
        var content = document.importNode(d.template.content.firstElementChild, true);
        activeArea = content;
        
        //Run init. If we return anything, assume it is a slide ID to load instead
        d.init(content, context, function(status, ncontext) {
            //Check if we need something else
            if(status != null) {
                ShowSlide(status, ncontext, true);
                return;
            }

            //Show
            if(marea.firstChild != null) {
                marea.firstChild.remove();
            }
            marea.appendChild(content);
            marea.classList.remove("hidden_slide_area");
        });
    }, time);
}

function FormClickElement(c) {
    //Get parent
    var p = c.parentNode;

    //Deactivate all
    var active = p.getElementsByClassName('user-option-element-active');
    for(var i = 0; i<active.length; i+=1) {
        active[i].classList.remove("user-option-element-active");
    }

    //Activate us
    c.classList.add("user-option-element-active");

    //Get data and update
    var isError = c.dataset.error != "-1";
    var errorBanner = c.parentNode.parentNode.querySelector("user-option-form-error");
    if(isError) {
        c.parentNode.parentNode.classList.add("user-option-errored");
        errorBanner.style.display = "block";
    } else {
        c.parentNode.parentNode.classList.remove("user-option-errored");
        errorBanner.style.display = "none";
    }
}

function FormTypeElement(c) {
    //Get parent
    var p = c.parentNode;

    //Get data and update
    var isError = c.value.length > 24 || c.value.length < 2;
    var errorBanner = c.parentNode.querySelector("user-option-form-error");
    if(isError) {
        c.parentNode.classList.add("user-option-errored");
        errorBanner.style.display = "block";
    } else {
        c.parentNode.classList.remove("user-option-errored");
        errorBanner.style.display = "none";
    }
}

function FormSelectMultipleClickElement(c) {
    //Get parent
    var p = c.parentNode;

    //Toggle us
    c.classList.toggle("user-option-element-active");

    //Get data and update
    var isError = c.dataset.error != "-1";
    if(isError) {
        c.classList.add("invalid-select");
    } else {
        c.classList.remove("invalid-select");
    }

    //If we're no longer active, remvoe invalid-select
    if(!c.classList.contains("user-option-element-active")) {
        c.classList.remove("invalid-select");
    }

    //Get data and update
    var errorBanner = c.parentNode.parentNode.querySelector("user-option-form-error");
    if(p.getElementsByClassName('invalid-select').length != 0) {
        c.parentNode.parentNode.classList.add("user-option-errored");
        errorBanner.style.display = "block";
        return;
    } else {
        c.parentNode.parentNode.classList.remove("user-option-errored");
        errorBanner.style.display = "none";
    }

    //Check if any are selected
    errorBanner = c.parentNode.parentNode.querySelector("user-option-form-error-select");
    if(p.getElementsByClassName('user-option-element-active').length == 0) {
        c.parentNode.parentNode.classList.add("user-option-errored");
        errorBanner.style.display = "block";
    } else {
        c.parentNode.parentNode.classList.remove("user-option-errored");
        errorBanner.style.display = "none";
    }
}

function FormGetValue(element) {
    return element.getElementsByClassName("user-option-element-active")[0].dataset.name;
}

function MultipleFormGetValue(element) {
    var names = [];
    var active = element.getElementsByClassName("user-option-element-active");
    for(var i = 0; i<active.length; i+=1) {
        names.push(active[i].dataset.name);
    }
    return names;
}

function SubmitIntroForm() {
    //Stop if we have any errored elements
    if(activeArea.getElementsByClassName("user-option-errored").length != 0) {
        return;
    }

    //Get all data
    var d = {
        "maps": MultipleFormGetValue(activeArea.getElementsByClassName('form_map')[0]),
        "type": FormGetValue(activeArea.getElementsByClassName('form_type')[0]),
        "hosting": FormGetValue(activeArea.getElementsByClassName('form_hosting')[0]),
        "platform": FormGetValue(activeArea.getElementsByClassName('form_platform')[0])
    };
    introSettings = d;
    console.log(d);

    //Now, go to the next slide
    ShowSlide("login", d);
}

function ShowFormOption(className) {
    activeArea.getElementsByClassName(className)[0].classList.remove("user-option-form-hidden");
}

var latestImgToken = null;
var clusterId = null;

function SubmitClusterForm(b) {
    //Stop if we have any errored elements
    if(activeArea.getElementsByClassName("user-option-errored").length != 0) {
        return;
    }

    //Get name
    var p = {
        "name": activeArea.getElementsByClassName('form_name_value')[0].value
    };

    //Remove button and create this
    b.style.display = "none";
    delta.serverRequest("https://deltamap.net/api/clusters/@new", {"type":"POST", "body":JSON.stringify(p)}, function(d) {
        clusterId = d.id;
        ShowSlide("setup");
    });
}

function SubmitSetupForm() {
    //Stop if we have any errored elements
    if(activeArea.getElementsByClassName("user-option-errored").length != 0) {
        return;
    }

    //Get all data
    var d = {
        "map": FormGetValue(activeArea.getElementsByClassName('form_map')[0]),
        "name": activeArea.getElementsByClassName('form_name_value')[0].value,
        "icon_token":latestImgToken
    };
    console.log(d);
    serverSettings = d;

    //Go to the next slide
    ShowSlide("setup_download", d);
}

function DoLogin() {
    var w = window.open("https://deltamap.net/api/auth/steam_auth/?next=https%3A%2F%2Fdeltamap.net%2Fme%2Fservers%2Fadd%2Flogin_finish.html", "delta_login_window", "height=640,width=400");
}

function FinishLogin() {
    if(introSettings.type == "cluster") {
        //Go to cluster config
        ShowSlide("cluster_setup");
    } else {
        //Go to main config
        ShowSlide("setup");
    }
}

function OnTypeServerCode(id) {
    var d = {
        "name":serverSettings.name,
        "iconToken":serverSettings.icon_token,
        "clusterId":clusterId
    };
    if(id.length == 6) {
        delta.serverRequest("https://deltamap.net/api/users/@me/server_wizard/start?session_id="+encodeURIComponent(id), {"type":"POST", "body":JSON.stringify(d)}, function(r) {
            if(r.ok) {
                serverCreds = r.server;
                CreateRscConnection(r.request_url);
            }
        });
    }
}

function OnClickHeadlessSetupBtn(btn) {
    activeArea.getElementsByClassName('headless_download_btn')[0].style.display = "none";
    activeArea.getElementsByClassName('input_box')[0].style.display = "none";
    var d = {
        "name":serverSettings.name,
        "iconToken":serverSettings.icon_token,
        "clusterId":clusterId
    };
    delta.serverRequest("https://deltamap.net/api/users/@me/server_wizard/start_headless", {"type":"POST", "body":JSON.stringify(d)}, function(r) {
        if(r.ok) {
            serverCreds = r.server;
            CreateRscConnection(r.request_url);
            activeArea.getElementsByClassName('headless_download_area')[0].style.display = "block";
            activeArea.getElementsByClassName('headless_download_link')[0].href = r.headless_config_url;
        }
    });
}

var isVerifyBusy = false;
function BeginVerifySavePath() {
    //Stop if already going
    if(isVerifyBusy) {
        return;
    }

    //Set error area
    var errorArea = activeArea.getElementsByClassName("form_save_error")[0];
    errorArea.classList.add("user-option-errored");
    errorArea.innerText = "Checking, please wait...";
    errorArea.style.display = "block";

    //Find input box
    var input = activeArea.getElementsByClassName("form_save_value")[0];
    input.readOnly = true;
    isVerifyBusy = true;

    //Find map name
    var mapFilename = MAP_DATA[serverSettings.map].internal_name+".ark";

    //Create pathname
    var pathname = input.value;
    while(pathname.substr(pathname.length - 1) == "/") {
        pathname = pathname.substr(0, pathname.length - 1);
    }
    pathname += "/" + mapFilename;

    //Send request to verify it
    SendRscMessage(4, {
        "rid":"1",
        "path":pathname
    });
}

function EndVerifySavePath(data) {
    //Find input box
    var input = activeArea.getElementsByClassName("form_save_value")[0];
    input.readOnly = false;
    isVerifyBusy = false;

    //Set or clear error
    var errorArea = activeArea.getElementsByClassName("form_save_error")[0];
    errorArea.classList.add("user-option-errored");
    if(data.exists == "false") {
        errorArea.innerText = "File not found.";
        errorArea.style.display = "block";
        return;
    }
    if(data.isValidArk == "false") {
        errorArea.innerText = "File can't be read. Contact support.";
        errorArea.style.display = "block";
        return;
    }

    //We did it!
    errorArea.style.display = "none";
    errorArea.classList.remove("user-option-errored");
}

function BeginPickSavePath() {
    BeginPickPath("Select your ARK saves folder. This folder should contain a .ark file, and is usually located in /ShooterGame/Saved/SavedArks/.", [".ark"], function(path) {
        //Clear error
        var errorArea = activeArea.getElementsByClassName("form_save_error")[0];
        errorArea.style.display = "none";
        errorArea.classList.remove("user-option-errored");

        //Set
        console.log(path);
        serverSettings.file_save = path;
    });
}

function BeginPickConfigPath() {
    BeginPickPath("Select your ARK config folder. This folder MUST contain a GameUserSettings.ini, and is usually located in /ShooterGame/Saved/Config/WindowsServer/.", [".ini"], function(path) {
        //Clear error
        var errorArea = activeArea.getElementsByClassName("form_config_error")[0];
        errorArea.style.display = "none";
        errorArea.classList.remove("user-option-errored");

        //Set
        console.log(path);
        serverSettings.file_config = path;
    });
}

function EndPickPath(id, path) {
    //Create pathname
    var pathname = path;
    while(pathname.substr(pathname.length - 1) == "/") {
        pathname = pathname.substr(0, pathname.length - 1);
    }
    pathname += "/";

    //Set
    choosingPaths[id](pathname);
}

function OnSubmitServerSaveSelect() {
    //Check
    if(serverSettings.file_config == null || serverSettings.file_save == null) {
        return;
    }

    //Create config
    var c = {
        "save_map":MAP_DATA[serverSettings.map].internal_name,
        "save_location":serverSettings.file_save,
        "ark_config":serverSettings.file_config,
        "base_permissions":[
            "allowViewTamedTribeDinoStats",
            "allowSearchTamedTribeDinoInventories",
            "allowHeatmap",
            "allowHeatmapDinoFilter"
        ],
        "permissions_version":0,
        "connection":{
            "creds":serverCreds.server_creds,
            "id":serverCreds.id
        },
        "config_version":1
    }
    console.log("About to upload config to server:");
    console.log(c);

    //Go!
    ShowSlide("load_configure_server", c);
}

var choosingPaths = {};
var choosingPathsIndex = 0;
var lastPathPack = {
    "history":[],
    "path":""
};

function BeginPickPath(msg, exts, callback) {
    //Get ID
    var rid = choosingPathsIndex++;
    choosingPaths[rid] = callback;

    //Open
    var w = window.open("filepicker.html", "delta_login_window", "height=500,width=600");
    w.onload = function() {
        w.Init(rid, msg, exts, lastPathPack);
    }
}

var rscTimer = null;
var rscEndpoint = null;

function SendRscMessage(id, payload) {
    var d = {
        "type":id,
        "data":payload
    };

    delta.serverRequest(rscEndpoint, {"type":"POST", "body":JSON.stringify(d), "noCreds":true}, function(d) {});
}

function CreateRscConnection(url) {
    rscEndpoint = url;
    FetchRscMessages();
    rscTimer = window.setInterval(FetchRscMessages, 400);
}

function FetchRscMessages() {
    delta.serverRequest(rscEndpoint, {"nocreds":true}, function(d) {
        for(var i = 0; i<d.length; i+=1) {
            var cmd = d[i];
            if(RSC_ENDPOINTS[cmd.type] != null) {
                RSC_ENDPOINTS[cmd.type](cmd.data);
            }
        }
    });
}

var rscFileCallbacks = {};
var rscFileCallbackIndex = 0;

var RSC_ENDPOINTS = {
    1: function(d){ShowSlide("setup_files"); /* Called when the headless mode is on */},
    5: EndVerifySavePath,
    11: function(d){rscFileCallbacks[d.rid](d, true); delete rscFileCallbacks[d.rid];},
    12: function(d){rscFileCallbacks[d.rid](d, false); delete rscFileCallbacks[d.rid];}
};

//Init
ShowSlide("intro", null);