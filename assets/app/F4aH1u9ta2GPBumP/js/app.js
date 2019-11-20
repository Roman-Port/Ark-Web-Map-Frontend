var APP_VERSION = 1;
var ROOT_URL = "https://deltamap.net/api/";
var APP_HASH = "2185ee3957de4f8d9ea23f6f4c5cf8535cff89d1";
var CONFIG_URL = "https://config.deltamap.net/prod/app_config.json";
var dconfig = null;

var main = {};

/* Vars */
main.currentServerId = null;
main.currentServerOnline = true;
main.me = null;
main.sessionToken = 0; //Changed every time we load a new server
main.HUDMessages = [];
main.isDemo = false;
/* Tools */

main.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    var startId = main.sessionToken;
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //Get reply
            var reply = this.responseText;
            if(args.isJson == null || args.isJson == true) {
                reply = JSON.parse(this.responseText);
            }

            //Check if we should cancel
            if((args.enforceServer != null && args.enforceServer) && startId != main.sessionToken) {
                main.log("server-request", 1, "Stopping reply because server changed when it was enforced.");
                return;
            }

            //Callback
            callback(reply);
        } else if(this.readyState == 4) {
            if (this.status == 401 || this.status == 403) {
                //Not authenticated
                form.add("You've Been Signed Out", [
                    {
                        "type":"text",
                        "text":"The account owner signed you out. Please sign in again."
                    }
                ], [
                    {
                        "type":0,
                        "name":"Sign In",
                        "callback":function() {
                            main.signin();
                        }
                }], "xform_area_interrupt");
            } else if(args.failOverride != null) {
                //Check if we should cancel
                if((args.enforceServer != null && args.enforceServer) && startId != main.sessionToken) {
                    main.log("server-request", 1, "Stopping reply because server changed when it was enforced.");
                    return;
                }
                
                args.failOverride(this);
            } else {
                if (this.readyState == 4 && this.status == 500) {
                    //Server error.
                    form.add("Server Error", [
                        {
                            "type":"text",
                            "text":"The server reported an error. Try again later."
                        }
                    ], [
                        {
                            "type":0,
                            "name":"Okay",
                            "callback":function() {
                                
                            }
                    }], "xform_area_interrupt");
                } else if (this.readyState == 4 && this.status == 503) {
                    //Server is down
                    form.add("Server Unavailable", [
                        {
                            "type":"text",
                            "text":"The server is under high load and cannot be reached. Please try again later."
                        }
                    ], [
                        {
                            "type":0,
                            "name":"Reload",
                            "callback":function() {
                                window.location.reload();
                            }
                    }], "xform_area_interrupt");
                } else if (this.readyState == 4) {
                    //Other error
                }
            }
        }
    }
    if(args.type == null) {
        args.type = "GET";
    }
    xmlhttp.open(args.type, url, true);
    if(args.nocreds == null || !args.nocreds) {
        //Include auth. If we don't have a token, redirect to login now
        if(main.getAccessToken() == null) {
            main.signin();
            return;
        } else {
            xmlhttp.setRequestHeader("Authorization", "Bearer "+main.getAccessToken());
        }
    }
    xmlhttp.send(args.body);
}

main.getAccessToken = function() {
    if(main.isDemo) {
        return "demo-user";
    }
    return localStorage.getItem("access_token");
}

main.log = function(topic, level, msg) {
    console.log("["+topic+"] "+msg);
}

main.foreach = function(data, loop) {
    for(var i = 0; i<data.length; i+=1) {
        loop(data[i], i);
    }
}

main.onGatewayDisconnect = function() {
    main.log("gateway-status", 0, "Gateway disconnected.");
    main.addHUDMessage("Reconnecting...", "#4973c9", "/assets/icons/baseline-cloud-24px.svg", 2, 10);
}

main.onGatewayConnect = function() {
    main.log("gateway-status", 0, "Gateway connected.");
    main.removeHUDMessage(2);
}

main.removeAllChildren = function(e) {
    while(e.firstChild != null) {
        e.firstChild.remove();
    }
}

main.setClass = function(e, name, status) {
    if(status) {
        e.classList.add(name);
    } else {
        e.classList.remove(name);
    }
}

main.setLoader = function(status) {
    main.setClass(document.getElementById('loader_view'), "loader_view_hidden", status);
}

main.createDom = function(type, classname, parent, text) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    if(text != null) {
        e.innerText = text;
    }
    return e;
}

main.generateTextTemplate = function(fontHeight, color, maxWidth) {
    //Generate a random length
    var length = maxWidth * ((Math.random() * 0.5) + 0.25);
    var height = (fontHeight - 2);

    //Create element
    var e = main.createDom("div", "glowing");
    e.style.width = length.toString()+"px";
    e.style.height = height.toString()+"px";
    e.style.marginTop = "1px";
    e.style.marginBottom = "1px";
    e.style.borderRadius = height.toString()+"px";
    e.style.backgroundColor = color;
    e.style.display = "inline-block";

    return e;
}

main.createNumberWithCommas = function(data) {
    //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return Math.round(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

main.createCustomDinoEntry = function(img_url, title_text, sub_text, customClass) {
    //Create html node
    var e = document.createElement('div');
    e.className = "dino_entry "+customClass;

    var img = document.createElement('img');
    img.src = img_url;
    e.appendChild(img);

    var title = document.createElement('div');
    title.className = "dino_entry_title";
    title.innerText = title_text;
    e.appendChild(title);

    var sub = document.createElement('div');
    sub.className = "dino_entry_sub";
    sub.innerText = sub_text;
    e.appendChild(sub);

    return e;
}

main.refreshHUDMessages = function() {
    //Find the highest priority message
    var msg = null;
    var priority = -1;
    for(var i = 0; i<main.HUDMessages.length; i+=1) {
        var m = main.HUDMessages[i];
        if(m.priority >= priority) {
            msg = m;
            priority = m.priority;
        }
    }

    //Get host
    var b = document.getElementById('hud_bar');

    //Cancel existing timers
    if(b.x_timer != null) {
        clearTimeout(b.x_timer);
    }

    //Show or hide
    if(msg == null) {
        b.classList.remove("hud_bar_active");
        b.x_last_id = null;
    } else {
        //Check if this is the same ID
        if(b.x_last_id == msg.id) {
            return;
        }
        b.x_last_id = msg.id;

        //If one is already displayed, set a timer before showing
        if(b.classList.contains("hud_bar_active")) {
            b.classList.remove("hud_bar_active");
            b.x_timer = window.setTimeout(function() {
                b.x_timer = null;
                b.innerText = msg.title;
                b.style.backgroundColor = msg.color;
                main.createDom("img", "hub_bar_img", b).src = msg.img;
                b.classList.add("hud_bar_active");
            }, 200);
        } else {
            b.innerText = msg.title;
            b.style.backgroundColor = msg.color;
            main.createDom("img", "hub_bar_img", b).src = msg.img;
            b.classList.add("hud_bar_active");
        }
    }
}

main.addHUDMessage = function(title, color, img, id, priority) {
    //Create
    var o = {
        "title":title,
        "color":color,
        "img":img,
        "id":id,
        "priority":priority
    };
    main.HUDMessages.push(o);
    main.refreshHUDMessages();
}

main.removeHUDMessage = function(id) {
    //Find and remove
    for(var i = 0; i<main.HUDMessages.length; i+=1) {
        var m = main.HUDMessages[i];
        if(m.id >= id) {
            main.HUDMessages.splice(i, 1);
            i--;
        }
    }
    main.refreshHUDMessages();
}

main.createServer = function() {
    window.location = "/me/servers/create/";
}

main.createLink = function(parent, text, url) {
    var d = main.createDom("a", "", parent);
    d.href = url;
    d.target = "_blank";
    d.innerText = text;
}

main.checkUpdates = function() {
    main.serverRequest("https://config.deltamap.net/prod/frontend/web_version.json", {"nocreds":true, "failOverride": function() {
        //Offline
        main.addHUDMessage("Limited or no internet connection.", "#eb3434", "/assets/icons/baseline-signal_cellular_connected_no_internet_0_bar-24px.svg", 3, 11);
    }}, function(d) {
        main.removeHUDMessage(3);
        var outdated = APP_HASH != d.latest_hash;
        if(outdated) {
            main.addHUDMessage("There is an update available. Reload the page to update!", "#eb3434", "/assets/icons/baseline-cloud_download-24px.svg", 4, 9);
        }
    });
}

main.logout = function() {
    form.add("Log Out", [
        {
            "type":"text",
            "text":"Are you sure you'd like to sign out? You will have to sign in again."
        }
    ], [
        {
            "type":0,
            "name":"Log Out",
            "callback":function() {
                form.add("Logged Out", [
                    {
                        "type":"text",
                        "text":"You signed out."
                    }
                ], [
                    {
                        "type":0,
                        "name":"Sign In Again",
                        "callback":function() {
                            main.signin();
                        }
                    }
                ], "xform_area_interrupt");
                main.serverRequest(ROOT_URL+"users/@me/tokens/@this/devalidate", {"type":"POST"}, function() {});
            }
        },
        {
            "type":1,
            "name":"Cancel",
            "callback":function() {
                
            }
    }], "xform_area_interrupt");
}

main.signin = function() {
    var container = main.createDom("div", "xform_element");
    var body = main.createDom("div", "xform_element_box", container);
    var top_a = main.createDom("div", "login_v2_top", body);
    main.createDom("div", "login_v2_top_img", top_a);

    var bottom_a = main.createDom("div", "login_v2_bottom", body);

    main.createDom("div", "login_v2_bottom_title", bottom_a).innerText = "Welcome to Delta Web Map!";
    main.createDom("div", "login_v2_bottom_sub", bottom_a).innerText = "Sign in to get access to the structures, dinos, and items in your ARK tribe!";

    var terms = main.createDom("div", "login_v2_bottom_btn_terms", bottom_a);
    main.createDom("span", "", terms).innerText = "By signing in, you're agreeing to our ";
    var privacy = main.createDom("a", "", terms);
    privacy.href = "/privacy/";
    privacy.target = "_blank";
    privacy.innerText = "Privacy Policy";
    main.createDom("span", "", terms).innerText = ".";

    var btn = main.createDom("div", "master_btn master_btn_blue", main.createDom("div", "login_v2_bottom_btn_container", terms));
    btn.innerText = "Login with Steam";
    btn.addEventListener("click", function() {
        window.location = "https://deltamap.net/api/auth/steam_auth/?next="+encodeURIComponent(window.location.href);
    });

    form.add_raw(container, 'xform_area_interrupt', {});
}

main.promptNoServers = function() {
    var container = main.createDom("div", "xform_element");
    var body = main.createDom("div", "xform_element_box", container);
    var top_a = main.createDom("div", "login_v2_top", body);
    main.createDom("div", "login_v2_top_img", top_a);

    var bottom_a = main.createDom("div", "login_v2_bottom", body);

    main.createDom("div", "login_v2_bottom_title", bottom_a).innerText = "You Have No ARK Servers!";
    main.createDom("div", "login_v2_bottom_sub", bottom_a).innerText = "Unfortunately, this app is useless until you have a server.";
    main.createDom("div", "login_v2_bottom_sub", bottom_a).innerText = "If you just joined a server, wait 10-15 minutes and check back. Or, ask your server owner to set up Delta Web Map on their server.";

    var terms = main.createDom("div", "login_v2_bottom_btn_terms", bottom_a);
    main.createDom("span", "", terms).innerText = "You're signed in as "+main.me.screen_name+". Not you? ";
    var privacy = main.createDom("span", "link", terms);
    privacy.innerText = "Sign out";
    privacy.addEventListener("click", function() {
        main.logout();
    })
    main.createDom("span", "", terms).innerText = ".";

    var btn = main.createDom("div", "master_btn master_btn_blue", main.createDom("div", "login_v2_bottom_btn_container", terms));
    btn.innerText = "Add Your Server";
    btn.addEventListener("click", function() {
        main.createServer();
    });

    form.add_raw(container, 'xform_area_interrupt', {});
}

/* Init */

main.init = function() {
    //Init Google Firebase
    main.initFirebase();

    //Fetch config file
    main.serverRequest(CONFIG_URL, {"nocreds":true}, function(config) {
        //Set params
        dconfig = config;
        ROOT_URL = config.api+"/";

        //Set timer for updating config
        window.setTimeout(main.refreshConfig, dconfig.refresh_policy_seconds * 1000);

        //Set up demo if needed
        main.isDemo = window.location.hash == "#dwm-demo-frontpage-src";
        if(main.isDemo) {
            main.initDemo();
        }

        //First, we'll download user data
        main.serverRequest(ROOT_URL+"users/@me/", {}, function(d) {
            main.log("Init", 0, "User data downloaded.");
            main.me = d;

            //Set placeholders
            frontend.refreshServerList();
            frontend.setUserData(d);
            frontend.showServerPlaceholders();

            if(!main.isDemo) {
                main.addHUDMessage("Connecting...", "#4973c9", "/assets/icons/baseline-cloud-24px.svg", 2, 10);
                main.setLoader(true);
        
                //Now, we'll connect to the gateway
                gateway.create(function() {
                    main.log("Init", 0, "Gateway connected.");
                }, main.onGatewayDisconnect, main.onGatewayConnect);
        
                //We'll load the last server
                main.selectLastServer();

                //Set up notifications
                //main.pushNotificationToken();
            } else {
                //Show just the demo server
                main.setLoader(true);
                ark.init(main.me.servers[0]);
            }
        });
    });
}

var messaging;
main.initFirebase = function() {
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyC1DWyvvPdabxEOkwh1ukVx5nnegCV-Y9g",
        authDomain: "delta-web-map.firebaseapp.com",
        databaseURL: "https://delta-web-map.firebaseio.com",
        projectId: "delta-web-map",
        storageBucket: "delta-web-map.appspot.com",
        messagingSenderId: "455995125604",
        appId: "1:455995125604:web:43b0f25f1c6cb1bfc85471"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    messaging.usePublicVapidKey("BMkfrrmH5M0s3-odVAT2-I2T-Xt6xEjfwWuj5zQ0brWOiwH0N8t5urhqAYcJ54TrnRYu3_eC3b5C6veME5tJHqE");
}

main.refreshConfig = function() {
    main.serverRequest(CONFIG_URL, {"nocreds":true, "failOverride":function() {
        //Attempt to fetch it again later
        window.setTimeout(main.refreshConfig, dconfig.refresh_policy_seconds * 1000);
    }}, function(config) {
        //Set
        dconfig = config;
        ROOT_URL = config.api+"/";

        //Fetch it again later
        window.setTimeout(main.refreshConfig, dconfig.refresh_policy_seconds * 1000);
    });
}

main.pushNotificationToken = function() {
    //First, request notifications
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            //Permission granted. Fetch a token
            messaging.getToken().then((currentToken) => {
                //Send the token to our server
                main.serverRequest(ROOT_URL+"users/@me/push_token", {
                    "type":"POST",
                    "body":JSON.stringify(
                        {
                            "token":currentToken
                        }
                    )
                }, function() {
                    //Done!
                    main.log("enable-notifications", 1, "Submitted notification token!");
                });
            }).catch((err) => {
                main.log("enable-notifications", 4, "An error occurred while retrieving token.");
            });
        } else {
            main.log("enable-notifications", 1, "Unable to get permission to notify.");
        }
    });
}

main.initDemo = function() {
    //Sets up the demo view 
    
}

main.selectLastServer = function() {
    //If we have no servers, prompt and show an error
    if(main.me.servers.length == 0) {
        main.promptNoServers();
        return;
    }

    //First, check if there's a server in the URL
    var lastServerId;
    var d = null;
    if(window.location.pathname.split('/').length >= 3) {
        lastServerId = window.location.pathname.split('/')[2];

        if(lastServerId.length == 24) {
            //Look for this server
            d = ark.getServerDataById(lastServerId);
            if(d == null) {
                //Notify that it failed
                form.add("Server not Found", [ { "type":"text", "text":"This URL tries to view a server you don't have access to view." }, { "type":"text", "text":"If you just joined this Ark server, wait 5-15 minutes and check back." } ], [ { "type":0, "name":"Okay", "callback":function() { } }], "xform_area_interrupt");
            } else {
                //Load this server
                main.log("load-server",0,  "Loaded server "+d.id+" from the URL.");
                ark.initAndVerify(d, true);
                return;
            }
        }
    }
    lastServerId = localStorage.getItem("latest_server");
    for(var i = 0; i<main.me.servers.length; i+=1) {
        if(main.me.servers[i].id == lastServerId) {
            d = main.me.servers[i];
        }
    }
    if(d != null) {
        ark.initAndVerify(d, true);
    } else {
        ark.initAndVerify(main.me.servers[0], true);
    }
}

main.startReportError = function() {
    //Prompt for permission
    form.add("Report Error",
    [
        {
            "type":"text",
            "text":"When you report an error, a screenshot of this page will be uploaded. Is that okay?"
        }
    ],
    [
        {
            "type":0,
            "name":"Accept",
            "callback":function(){
                //Show loading popup
                form.add("Report Error", [ { "type":"text", "text":"Uploading, please wait..." } ], [], "xform_area_dim", {});
                main.beginUploadScreenshot(function(d) {
                    //Hide loader
                    form.pop();

                    //Prompt for the next part
                    main.promptReportError(d.url, d.token);
                });
            }
        },
        {
            "type":1,
            "name":"Cancel",
            "callback":function(){}
        }
    ], "xform_area_dim", {});
}

main.beginUploadScreenshot = function(callback) {
    html2canvas(document.body, {
        "allowTaint":true,
        "useCORS":true,
        "onclone":function(a) {
            //Remove loader popup
            a.getElementById('xform_area').remove();
            a.getElementById('loader_view').remove();
        }
    }).then(canvas => {
        var d = canvas.toDataURL("image/png");
        fetch(d).then(res => res.blob()).then(blob => {
            main.serverRequest("https://user-content.romanport.com/upload?application_id=DZYzaYh8UrgrCEDJEem7jGYD", {"body":blob, "type":"POST", "nocreds":true}, function(r) {
                callback(r);
            });
        });
    });
}

main.promptReportError = function(screenshot_url, screenshot_token) {
    //Prompt for details
    form.add("Report Error",
    [
        {
            "type":"input",
            "name":"Title",
            "placeholder":"Keep it short and descriptive",
            "id":"title"
        },
        {
            "type":"select",
            "name":"Topic",
            "options":[
                {
                    "name":"Incorrect Game Data",
                    "value":"Game Data"
                },
                {
                    "name":"Incorrect Dino Stats",
                    "value":"Dino Stats"
                },
                {
                    "name":"Missing Dino/Structure",
                    "value":"Missing Dino/Structure"
                },
                {
                    "name":"Bug",
                    "value":"Bug"
                },
                {
                    "name":"Display Bug",
                    "value":"Display Bug"
                },
                {
                    "name":"Feature Request",
                    "value":"Feature Request"
                }
            ],
            "id":"topic"
        },
        {
            "type":"big_input",
            "name":"Describe What Happened",
            "placeholder":"",
            "id":"d_explain"
        },
        {
            "type":"big_input",
            "name":"Describe What You Expected",
            "placeholder":"",
            "id":"d_expected"
        },
        {
            "type":"img",
            "src":screenshot_url
        },
        {
            "type":"text",
            "text":"Reporting an error will post what you type, your browser info, and your screenshot publicly on GitHub."
        },
        {
            "type":"html",
            "html":"You could also look for help on our <a href=\"https://reddit.com/r/DeltaWebMap/\" target=\"_blank\">Reddit</a> page."
        }
    ],
    [
        {
            "type":0,
            "name":"Submit",
            "callback":function(pack) {
                main.submitErrorReport(pack, screenshot_token);
            }
        },
        {
            "type":1,
            "name":"Cancel",
            "callback":function(){}
        }
    ], "xform_area_dim", {});
}

main.submitErrorReport = function(pack, screenshot_token) {
    //Create POST body
    var b = {
        "title":pack.title.value,
        "topic":pack.topic.value,
        "server_id":main.currentServerId,
        "client_name":"web",
        "client_info":navigator.userAgent,
        "screenshot_token":screenshot_token,
        "attachment_tokens":[],
        "attachment_names":[],
        "body_description":pack.d_explain.value,
        "body_expected":pack.d_expected.value
    };

    //Submit
    form.add("Reporting Error...", [ { "type":"text", "text":"Uploading, please wait..." } ], [], "xform_area_dim", {});
    main.serverRequest(ROOT_URL+"users/@me/report_issue", {"body":JSON.stringify(b), "type":"POST"}, function(r) {
        //Hide
        form.pop();

        //Show confirmation
        form.add("Thank You!",
        [
            {
                "type":"text",
                "text":"Your report has been submitted. Thank you!"
            }
        ],
        [
            {
                "type":0,
                "name":"View",
                "callback":function(){
                    window.open(r.url, "_blank");
                }
            },
            {
                "type":1,
                "name":"Okay",
                "callback":function(){}
            }
        ], "xform_area_dim", {});
    });
}

main.switchMainTab = function(name) {
    //Find active buttons and disable them
    var oldBtn = document.getElementsByClassName('left_nav_tab_selected')[0];
    oldBtn.classList.add("left_nav_tab_unselected");
    oldBtn.classList.remove("left_nav_tab_selected");

    //Activate new btn
    var newBtn = document.getElementById('tab_btn_'+name);
    newBtn.classList.add("left_nav_tab_selected");
    newBtn.classList.remove("left_nav_tab_unselected");

    //Deactivate old area
    document.getElementsByClassName('main_tab_active')[0].classList.remove("main_tab_active");

    //Activate new area
    document.getElementById('tab_'+name).classList.add("main_tab_active");
}

main.convertFromWorldToGamePos = function(pos) {
    return (pos / ark.session.mapData.latLonMultiplier) + 50;
}

main.convertFromWorldToGamePosDisplay = function(pos) {
    var v = Math.round(main.convertFromWorldToGamePos(pos) * 10);
    return v / 10;
}

main.timerUserServerPrefs = null;

main.queueSubmitUserServerPrefs = function() {
    //Clear timeout if there is one
    if(main.timerUserServerPrefs != null) {
        clearTimeout(main.timerUserServerPrefs);
    }
    main.timerUserServerPrefs = setTimeout(function() {
        main.timerUserServerPrefs = null;
        main.forceSubmitUserServerPrefs();
    }, 3000);
}

main.forceSubmitUserServerPrefs = function() {
    //Stop timeout if any
    if(main.timerUserServerPrefs != null) {
        clearTimeout(main.timerUserServerPrefs);
        main.timerUserServerPrefs = null;
    }
    
    //Send
    var body = {
        "drawable_map":0,
        "map":0,
        "x":map.map.getCenter().lng,
        "y":map.map.getCenter().lat,
        "z":map.map.getZoom(),
        "canvas_id":map.canvas.getCurrentID(),
        "canvas_brush_color":map.canvas.currentBrushSettings.brushColor
    };
    ark.getServerData().user_prefs = body;
    main.serverRequest(ROOT_URL+"servers/"+main.currentServerId+"/put_user_prefs", {
        "body":JSON.stringify(body),
        "type":"POST"
    }, function() {});
}

main.uploadContent = function(application_id, data, callback) {
    //Send server request
    main.serverRequest(dconfig.apis.USER_CONTENT+"/upload?application_id="+encodeURIComponent(application_id), {
        "type":"POST",
        "body":data
    }, callback);
}

//Start (run at end)
main.init();