var delta = {};

delta.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //Get reply
            var reply = this.responseText;
            if(args.isJson == null || args.isJson == true) {
                reply = JSON.parse(this.responseText);
            }

            //Callback
            callback(reply);
        } else if(this.readyState == 4) {
            if(args.failOverride != null) {
                args.failOverride(this);
            } else {
                console.warn("unhandled server error");
            }
        }
    }
    if(args.type == null) {
        args.type = "GET";
    }
    xmlhttp.open(args.type, url, true);
    if(args.nocreds == null || !args.nocreds) {
        //Include auth
        xmlhttp.setRequestHeader("Authorization", "Bearer "+localStorage.getItem("access_token"));
    }
    if(args.headers != null) {
        var keys = Object.keys(args.headers);
        for(var i = 0; i<keys.length; i+=1) {
            xmlhttp.setRequestHeader(keys[i], args.headers[keys[i]]);
        }
    }
    xmlhttp.send(args.body);
}

delta.me = null;
delta.signedIn = null;
delta.waiting_me = []; //Callbacks waiting for user data to download
delta.waiting_me_fail = []; //Callbacks waiting for user data to download

delta.getUserAsync = function(callback, fail_callback) {
    //If we already have the data, just return that
    if(delta.me != null) {
        callback(delta.me);
        return;
    }

    //If we're already known to have failed login, send that too
    if(delta.signedIn != null && delta.signedIn == false) {
        fail_callback(401);
        return;
    }

    //We'll attach our callback to the global user data callback
    delta.waiting_me.push(callback);
    delta.waiting_me_fail.push(fail_callback);
}

delta.createDom = function(type, classname, parent, text) {
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

delta.initHeader = function() {
    //Authorize us
    delta.serverRequest("https://deltamap.net/api/users/@me/", {"failOverride":function(ds) {
        //Accept clients waiting
        for(var i = 0; i<delta.waiting_me_fail.length; i+=1) {
            delta.waiting_me_fail[i](ds.status);
        }
        delta.waiting_me_fail = [];
        delta.signedIn = false;
    }}, function(d) {
        //Change login button
        document.getElementById('g_header_login_a').href = "/me/";
        var btn = document.getElementById('g_header_login_b');
        btn.classList.add("g_header_big_btn_user");
        btn.classList.remove("g_header_big_btn_go");
        btn.innerHTML = "";
        delta.createDom("img", "", btn).src = d.profile_image_url;
        delta.createDom("span", "", btn).innerText = d.screen_name;

        //Accept clients waiting
        delta.me = d;
        delta.signedIn = true;
        for(var i = 0; i<delta.waiting_me.length; i+=1) {
            delta.waiting_me[i](d);
        }
        delta.waiting_me = [];
    });
}

delta.toggleMobileDropdownHeader = function() {
    document.getElementById('g_header_mobile_dropdown_header_btn').classList.toggle("g_header_mobile_dropdown_header_btn_flipped");
    document.getElementById('g_header_mobile').classList.toggle("g_header_shown");
}

delta.hideBeta = function() {
    var d = JSON.stringify(new Date());
    localStorage.setItem("beta_msg_dismiss", d.substr(1, d.length - 2));
    document.getElementById('g_header_beta').remove();
}

delta.loginAndReturn = function() {
    window.location = "https://deltamap.net/api/auth/steam_auth/?next="+encodeURIComponent(window.location);
}

delta.loginAndReturnTo = function(url) {
    window.location = "https://deltamap.net/api/auth/steam_auth/?next="+encodeURIComponent(url);
}

delta.parseURLParams = function() { 
	try {	
		var query = window.location.search;
		var objects = String(query).trim("?").split("&");
		//Create keys and objects.
		var i =0;
		var keys = [];
		var obj = {};
		while(i<objects.length) {
			try {
				var o = objects[i];
				//Trim beginning
				o = o.replace("?","").replace("&","");
				//Split by equals.
				var oo = o.split("=");
				keys.push(oo[0]);
				//Uri decode both of these
				var key = decodeURIComponent(oo[0]);
				var value = decodeURIComponent(oo[1]);
				obj[key] = value;
			} catch (e) {

			}
			i+=1;
		}
		return obj;
	} catch (ex) {
		return {};
	}
}