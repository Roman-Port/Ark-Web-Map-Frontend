var me = {};

me.setStatusBar = function(text) {
    var b = document.getElementById('warning_bar');
    if(text == null) {
        b.style.display = "none";
    } else {
        b.innerText = text;
        b.style.display = "block";
    }
}

me.init = function() {
    //Authorize us
    delta.getUserAsync(function(d) {
        //Set all vars
        document.getElementById('p_username').innerText = d.screen_name;

        //Show
        document.getElementById('main').style.display = "block";
    }, me.getUserError);
}

me.serverError = function(c) {
    if(c.status == 401) {
        me.setStatusBar("Please sign in.");
        window.setTimeout(function() {
            window.location = "/login/?next="+encodeURIComponent(window.location);
        }, 2000);
    } else {
        me.setStatusBar("Server error. Try again later.");
    }
}

me.getUserError = function(c) {
    if(c == 401) {
        me.setStatusBar("Please sign in.");
        window.setTimeout(function() {
            window.location = "/login/?next="+encodeURIComponent(window.location);
        }, 2000);
    } else {
        me.setStatusBar("Server error. Try again later.");
    }
}

me.logout = function() {
    me.setStatusBar("Signing out, please wait...");
    delta.serverRequest("https://deltamap.net/api/users/@me/tokens/@this/devalidate", {"type":"POST"}, function(d) {
        document.getElementById('main').style.display = "none";
        me.setStatusBar("You signed out. Refresh this page to sign in again.");
    });
}

me.init();