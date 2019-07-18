var usett = {};

usett.show = function() {
    //Fill settings
    document.getElementById('usersett_me_icon').style.backgroundImage = "url('"+ark_users.me.profile_image_url+"')";
    document.getElementById('mame_usersett').innerText = ark_users.me.screen_name;
    document.getElementById('steamid_usersett').innerText = ark_users.me.steam_id;
    ark.setSwitchActive(ark_users.me.user_settings.vulgar_filter_on, document.getElementById('usersett_filter_switch'));
    ark.setSwitchActive(ark_users.me.user_settings.vulgar_show_censored_on, document.getElementById('usersett_filter_censored_switch'));

    //Create hidden servers area
    usett.setNewHiddenServersArea();

    //Reset vars and UI
    usett.hasDirtiedUserData = false;
    usett.setCustomFilterWords(false);

    //Add custom vulgar words to filter
    var f = document.getElementById('usersett_customfilter');
    f.value = "";
    for(var i = 0; i<ark_users.me.user_settings.custom_vulgar_words.length; i+=1) {
        f.value += ark_users.me.user_settings.custom_vulgar_words[i]+"\n";
    }

    //Show popup
    collap.setState("fs_popup", true);
}

usett.setNewHiddenServersArea = function() {
    //Create hidden servers list
    var hiddenServersArea = ark.createDom("div", "");
    for(var i = 0; i<ark_users.me.servers.length; i+=1) {
        var s = ark_users.me.servers[i];
        var first = true;
        if(s.is_hidden) {
            //Create entry
            var classname = "archived_servers_entry";
            if(!first) {
                classname += " archived_servers_entry_notop";
            } else {
                first = false;
            }
            var e = ark.createDom("div", classname, hiddenServersArea);
            ark.createDom("div", "archived_servers_entry_title", e).innerText = s.display_name;
            ark.createDom("div", "archived_servers_entry_image", e).style.backgroundImage = "url('"+s.image_url+"')";
            var btn = ark.createDom("div", "master_btn master_btn_red usersett_hiddenserver_btn", e);
            btn.innerText = "Unhide";
            btn.x_id = s.id;
            btn.x_is_working = false;
            btn.addEventListener('click', function() {
                usett.unhideServer(this);
                
            });
        }
    }

    //If there are no hidden servers, add text
    if(hiddenServersArea.childElementCount == 0) {
        hiddenServersArea.classList.add("usersett_contentbox");
        hiddenServersArea.innerText = "Servers you've hidden will appear here.";
    } else {
        hiddenServersArea.classList.add("usersett_me");
    }

    //Place hidden servers area in view
    var hs = document.getElementById('hidden_servers_usersett');
    while(hs.childElementCount != 0) {
        hs.lastElementChild.remove();
    }
    hs.appendChild(hiddenServersArea);
}

usett.isRemovalBusy = false;
usett.hasDirtiedUserData = false;

usett.unhideServer = function(context) {
    var id = context.x_id;
    console.log("Removing hidden server "+id);

    //Check if busy
    if(usett.isRemovalBusy) {
        console.log("Ignoring button press, already working...");
        return;
    }

    //Update button
    context.classList.add("master_btn_working");
    usett.isRemovalBusy = true;

    //Send request to remove this server from the ignore list.
    ark.serverRequest("https://deltamap.net/api/users/@me/servers/remove_ignore/?id="+id, {}, function() {
        //Find this in server in our info and remove the tag
        for(var i = 0; i<ark_users.me.servers.length; i+=1) { 
            if(ark_users.me.servers[i].id == id) {
                ark_users.me.servers[i].is_hidden = false;
            }
        }
        
        //Rerender list
        usett.setNewHiddenServersArea();
        usett.isRemovalBusy = false;
        usett.hasDirtiedUserData = true;
    });
}

usett.hide = function() {
    //hide popup
    collap.setState("fs_popup", false);

    //If the user data is dirty, request it again
    if(usett.hasDirtiedUserData) {
        console.log("User data is dirty, refreshing...");
        ark.refreshServers(function() {

        });
    }

    //Submit user settings
    usett.submitNewSettings();
}

usett.signOut = function(type) {
    ark.serverRequest("https://deltamap.net/api/users/@me/tokens/"+type+"/devalidate", {"type":"post"}, function(c) {
        //Destroy view.
        //ark.destroyAllWithMsg("You signed out. Refresh the page to sign in again.");
        window.location = "/";
    });
}

usett.setCustomFilterWords = function(on) {
    var a = document.getElementById('usersett_customfilter');
    var b = document.getElementById('usersett_customfiltertoggle');

    if(!on) {
        a.style.display = "none";
        b.style.display = "inline-block";
    } else {
        b.style.display = "none";
        a.style.display = "block";
    }
}

usett.submitNewSettings = function() {
    //Convert the custom filter words list back into a list
    var badWords = [];
    var uncheckedBadWords = document.getElementById('usersett_customfilter').value.split('\n');
    for(var i = 0; i<uncheckedBadWords.length; i+=1) {
        var s = uncheckedBadWords[i];
        if(s.length >= 2) {
            badWords.push(s.toLowerCase());
        }
    }
    ark_users.me.user_settings.custom_vulgar_words = badWords;

    //Submit
    ark.serverRequest("https://deltamap.net/api/users/@me/user_settings", {"type":"post", "body":JSON.stringify(ark_users.me.user_settings)}, function(c) {
        console.log("User settings update OK.");
    });
}