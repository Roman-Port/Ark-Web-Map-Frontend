var APP_VERSION = 1;
var ROOT_URL = "https://deltamap.net/api/";

var main = {};

/* Vars */
main.currentServerId = null;
main.currentServerOnline = true;
main.me = null;
main.HUDMessages = [];
/* Tools */

main.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reply = JSON.parse(this.responseText);
            callback(reply);
        } else if(this.readyState == 4) {
            if(args.failOverride != null) {
                args.failOverride(this);
            } else {
                if (this.readyState == 4 && this.status == 502) {
                    //This is the error code when the subserver is offline.
                } else if (this.readyState == 4 && this.status == 500) {
                    //Server error.
                } else if (this.readyState == 4 && this.status == 401) {
                    //Not authenticated
                    window.location = "/login";
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
        if(localStorage.getItem("access_token") == null) {
            window.location = "/login/";
        } else {
            xmlhttp.setRequestHeader("Authorization", "Bearer "+localStorage.getItem("access_token"));
        }
    }
    xmlhttp.send(args.body);
}

main.log = function(topic, level, msg) {
    console.log("["+topic+"] "+msg);
}

main.onGatewayDisconnect = function() {
    main.log("gateway-status", 0, "Gateway disconnected.");
    main.setLoader(false);
}

main.onGatewayConnect = function() {
    main.log("gateway-status", 0, "Gateway connected.");
    main.setLoader(true);
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

main.createDom = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
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

    //Show or hide
    var b = document.getElementById('hud_bar');
    if(msg == null) {
        b.classList.remove("hud_bar_active");
    } else {
        b.innerText = msg.title;
        b.style.backgroundColor = msg.color;
        main.createDom("img", "hub_bar_img", b).src = msg.img;
        b.classList.add("hud_bar_active");
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

/* Init */

main.init = function() {
    //First, we'll download user data
    main.serverRequest(ROOT_URL+"users/@me/", {}, function(d) {
        main.log("Init", 0, "User data downloaded.");
        main.me = d;

        //Set placeholders
        frontend.setUserData(d);
        frontend.showServerPlaceholders();

        //Now, we'll connect to the gateway
        gateway.create(function() {
            main.log("Init", 0, "Gateway connected.");
        }, main.onGatewayDisconnect, main.onGatewayConnect);
    });
}