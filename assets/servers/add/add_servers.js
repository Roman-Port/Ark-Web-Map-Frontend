var slides = {
    "MAP_PICKER":{
        "e":document.getElementById('slide_map_picker'),
        "onpreload":function(e, ready) {
            var list = e.getElementsByClassName('map_button_container')[0];
            list.innerHTML = "";
            delta.serverRequest("https://deltamap.net/api/config/maps.json", {}, function(d) {
                for(var i = 0; i<d.maps.length; i+=1) {
                    delta.createDom("li", "map_button", list, d.maps[i].name).addEventListener('click', function() {
                        e.style.pointerEvents = "none";
                        e.classList.remove("content_slide_active");
                        TryLoadUserServerData(function(ok) {
                            if(ok) {
                                SwitchSlide("ADD_MOD");
                            } else {
                                SwitchSlide("LOGIN");
                            }
                        });
                    });
                }
                ready();
            });
        }
    },
    "LOGIN":{
        "e":document.getElementById('slide_login'),
        "onpreload":function(e, ready) {
            ready();
        }
    },
    "ADD_MOD":{
        "e":document.getElementById('slide_add_mod'),
        "onpreload":function(e, ready) {
            ready();
        }
    },
    "CUSTOMIZE":{
        "e":document.getElementById('slide_customize'),
        "onpreload":function(e, ready) {
            document.getElementById('user_token').innerText = server_data.token;
            ready();
        }
    },
    "DONE":{
        "e":document.getElementById('slide_done'),
        "onpreload":function(e, ready) {
            ready();
        }
    },
}

function Init() {
    var params = delta.parseURLParams();
    if(params.postlogin == "true") {
        TryLoadUserServerData(function(ok) {
            if(ok) {
                SwitchSlide("ADD_MOD");
            } else {
                GoToLogin();
            }
        });
    } else {
        SwitchSlide("MAP_PICKER");
    }
}

function GoToLogin() {
    delta.loginAndReturnTo("https://deltamap.net/servers/add/?postlogin=true");
}

var server_data = null;

function TryLoadUserServerData(callback) {
    delta.serverRequest("https://deltamap.net/api/users/@me/servers", {
        "failOverride":function(s) {
            callback(false);
        }
    }, function(d) {
        server_data = d;
        callback(true);
    });
}

var active_slide = null;

function SwitchSlide(name) {
    var delay = 1;
    if(active_slide != null) {
        active_slide.classList.remove("content_slide_active");
        delay = 150;
    }
    window.setTimeout(function() {
        if(active_slide != null) {
            active_slide.style.display = "none";
        }
        var s = slides[name];
        active_slide = s.e;
        s.e.style.display = "block";
        window.requestAnimationFrame(function() {
            s.onpreload(s.e, function() {
                s.e.classList.add("content_slide_active");
            });
        });
    }, delay);
}

Init();