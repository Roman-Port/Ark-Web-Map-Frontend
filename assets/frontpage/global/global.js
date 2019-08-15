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
    xmlhttp.send(args.body);
}

delta.createDom = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    return e;
}

delta.initHeader = function() {
    //Authorize us
    delta.serverRequest("https://deltamap.net/api/users/@me/", {}, function(d) {
        //Change login button
        document.getElementById('g_header_login_a').href = "/app/";
        var btn = document.getElementById('g_header_login_b');
        btn.classList.add("g_header_big_btn_user");
        btn.classList.remove("g_header_big_btn_go");
        btn.innerHTML = "";
        delta.createDom("img", "", btn).src = d.profile_image_url;
        delta.createDom("span", "", btn).innerText = d.screen_name;
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