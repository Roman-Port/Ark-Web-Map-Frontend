var hub = {};

hub.fetchData = function(callback) {
    //Request the main hub
    ark.serverRequest("https://ark.romanport.com/api/users/@me/hub", {}, function(data) {
        //Request each sub-server and add it's data
        var loadedSubServerData = 0;

        callback(data);
        
    });
}

hub.makeSectionArea = function(name, inner, parent) {
    //Create the event frame and insert the inner data
    var e = ark.createDom("div", "hub_section", parent);
    ark.createDom("div", "hub_section_title", e).innerText = name;
    e.appendChild(inner);
    return e;
}

hub.isOpen = false;
hub.isBusy = false;
hub.firstShow = true;
hub.show = function() {
    //Show the hub window.
    //Do not show hub if it is not open already
    if(hub.isOpen || hub.isBusy) {return;}
    hub.isOpen = true;

    //If a session is already open, kill
    if(ark.session != null) {
        ark.deinitCurrentServer();
    }

    //Remove the active markers, if any
    var activeBadges = document.getElementsByClassName('sidebar_server_badge_active');
    for(var i = 0; i<activeBadges.length; i+=1) {
        activeBadges[i].remove();
    }

    //Set the badge to active
    ark.createDom("div", "sidebar_server_badge_active", document.getElementById('servers_hub'));

    //Clear the area
    var a = document.getElementById('hub_container');
    a.innerHTML = "";

    //Find and show the no session mask
    document.getElementById('no_session_mask').classList.remove("no_session_mask_disable");

    //Request it and open
    hub.create();
}

hub.close = function() {
    //Hide the hub window
    //Do not continue if the hub is already shut
    if(!hub.isOpen) {return;}
    hub.isOpen = false;

    collap.setState("ui_hub", false);
}

hub.create = function() {
    //Creates the hub view
    //First, request our data
    hub.isBusy = true;
    hub.fetchData(function(d) {
        //Grab the container
        var container = document.getElementById('hub_container');

        //If the user has no servers, show a message
        if(d.servers.length == 0) {
            hub.showNoServers();
        } else {
            var left = ark.createDom("div", "hub_eventsarea", container);
            var right = ark.createDom("div", "hub_sidearea", container);

            //Add ark news
            //var arknews = hub.arknews.create(d, container);

            //Add server list
            var serverList = hub.serverList.create(d, right);

            //Add main news section
            var serverevents = hub.events.create(d, left);
        }

        //Show
        container.classList.add('hub_container_active');
        collap.setState("ui_hub", true);

        hub.isBusy = false;

        //Also notify main
        if(hub.firstShow) {
            hub.firstShow = false;
            ark.onInitStepComplete();
        }
    });
}

hub.showNoServers = function() {
    //It's pretty quiet in here. If you own a server, you should <a href="javascript:ark.showCreateServers();">add your server</a>. If not, ask your server owner to add Ark Web Map, or <a href="javascript:usett.signOut('@this');">log out</a>.
    var e = ark.createDom("div", "hub_no_servers", document.getElementById('hub_container'));
    ark.createDom("span", "", e).innerText = "It's pretty quiet in here. You have no ARK servers added.\n\nIf you own a server, you should ";
    var btna = ark.createDom("span", "link", e);
    btna.innerText = "add your server";
    btna.addEventListener('click', ark.showCreateServers);
    ark.createDom("span", "", e).innerText = ". If not, ask your server owner to add Ark Web Map, or ";
    var btnb = ark.createDom("span", "link", e);
    btnb.innerText = "log out";
    btnb.addEventListener('click', function() {usett.signOut('@this');});
    ark.createDom("span", "", e).innerText = ".";

    //Remove bg
    document.getElementById('ui_hub').classList.add('fs_popup_hub_nobg');
}

/* Ark news */
hub.arknews = {};
hub.arknews.create = function(d, parent) {
    //Create the box
    var inner = ark.createDom("div", "hub_arknews_box");
    ark.createDom("div", "hub_arknews_image", inner).style.backgroundImage = "url('"+d.ark_news.img+"')";
    var content = ark.createDom("div", "hub_arknews_content", inner);
    ark.createDom("div", "hub_arknews_title", content).innerText = d.ark_news.title;
    ark.createDom("div", "hub_arknews_hide", content);
    ark.createDom("div", "", content).innerText = d.ark_news.content;
    
    //Add event listener for click
    inner.x_url = d.ark_news.link;
    inner.addEventListener("click", function() {
        window.open(this.x_url, "_blank");
    });

    //Create frame
    return hub.makeSectionArea("ARK News", inner, parent);
}

/* Server list */
hub.serverList = {};
hub.serverList.create = function(d, parent) {
    //Create the box
    var inner = ark.createDom("div", "");
    
    for(var i = 0; i<d.servers.length; i+=1) {
        var s = d.servers[i];
        /*var e = ark.createServerEntryBadge(s, function() {
            ark.switchServer(this.x_server_data);
            collap.toggle("ui_hub");
        });
        if(e != null) {
            inner.appendChild(e);
        }*/
        var e = ark.createDom("div", "hub_server_entry", inner);
        e.style.backgroundImage = "url("+s.image_url+")";

        var ee = ark.createDom("div", "sidebar_server_badge_text", e);
        ee.innerText = s.display_name;
        var et = ark.createDom("div", "sidebar_server_badge_text_triangle", ee);

        e.x_server_data = s;
        e.addEventListener('click', function() {
            if(ark.loadingStatus == 0) {
                ark.switchServer(this.x_server_data);
                collap.toggle("ui_hub");
            }
            
        });
    }

    //Create frame
    return hub.makeSectionArea("Servers", inner, parent);
}

/* Server events */
hub.events = {};
hub.events.create = function(d, parent) {
    //Create the inner boxes for each server
    var container = ark.createDom("div", "");

    //Create server dict
    var serverDict = {};
    for(var i = 0; i<d.servers.length; i+=1) {
        serverDict[d.servers[i].id] = i;
    }

    //Add each event
    for(var i = 0; i<d.log.length; i+=1) {
        var event = d.log[i];
        hub.events.eventTypes[event.type](event, d.steam_profiles, d.servers[serverDict[event.serverId]], container);
    }

    //Add
    parent.appendChild(container);
    return container;
}

/* Event tools */
hub.events.createDinoIcon = function(data) {
    //Create circle
    var cir = ark.createDom("div", "hub_circle_big");

    //If we have a dino entry, add the class image
    if(data.dinoImg != null) {
        cir.style.backgroundImage = "url('"+data.dinoImg+"')";
    } else {
        //Fallback
        cir.classList.add("hub_circle_big_failed");
    }

    //Return it
    return cir;
}

hub.events.createPlayerIcon = function(data, profiles) {
    //Create circle
    var cir = ark.createDom("div", "hub_circle_big hub_circle_fill");

    //If we have a dino entry, add the class image
    if(data.name == "Your Tribe" || data.name == null) {
        //Ark did not provide a user. Use our profile URL
        cir.style.backgroundImage = "url('"+ark_users.me.profile_image_url+"')";
    }
    else if(data.steamPlayerId != null) {
        var playerData = profiles[data.steamPlayerId];
        if(playerData != null) {
            cir.style.backgroundImage = "url('"+playerData.avatarfull+"')";
        }
    } else {
        //Fallback
        cir.classList.add("hub_circle_big_failed");
    }

    //Return it
    return cir;
}

hub.events.createPlayerOrDinoIcon = function(data, profiles) {
    if(data.isDino) {
        return hub.events.createDinoIcon(data.dino);
    } else {
        return hub.events.createPlayerIcon(data.player, profiles);
    }
}

hub.events.createIcon = function(url) {
    //Create circle
    var cir = ark.createDom("div", "hub_circle_big hub_circle_event");

    //Set URL
    cir.style.backgroundImage = "url('"+url+"')";

    //Return it
    return cir;
}

hub.events.createDinoName = function(data, includeClassname, includeLevel, server) {
    if(data.isTamed) {
        var str = "";
        if(data.tribeId != null) {
            if(data.tribeId == server.tribeid) {
                str += "Our ";
            }
        }
        if(includeLevel) {
            str += "Lvl "+data.level+" ";
        }
        str += data.name+" ";
        if(includeClassname){
            str += "("+data.displayClassname+") ";
        }
        //In the future, you'll be able to hover over this
        var e = ark.createDom("span", "");
        e.innerText = str;
        return e;
    } else {
        var str = "Wild "+data.displayClassname+" ";
        var e = ark.createDom("span", "");
        e.innerText = str;
        return e;
    }
}

hub.events.createPlayerName = function(data) {
    if(data.name == null) {
        //Generic "your tribe"
        var str = "Your Tribe ";
        var e = ark.createDom("span", "");
        e.innerText = str;
        return e;
    } else {
        //In tyhe future, you'll be able to hover over this
        var str = data.name+" ";
        var e = ark.createDom("span", "");
        e.innerText = str;
        return e;
    }
}

hub.events.createPlayerOrDinoName = function(data, includeClassname, includeLevel, server) {
    if(data.isDino) {
        return hub.events.createDinoName(data.dino, includeClassname, includeLevel, server);
    } else {
        return hub.events.createPlayerName(data.player);
    }
}

hub.events.addText = function(text, evt, container) {
    //Create area
    var a = ark.createDom("div", "hub_events_evt_text", container);

    //The text is an array. Create an HTML element with it
    var t = ark.createDom("div", "hub_events_evt_name", a);
    for(var i = 0; i<text.length; i+=1) {
        var te = text[i];
        var ttype = typeof(te);
        if(ttype == "string") {
            //Create a element for this
            ark.createDom("span", "", t).innerText = te;
        } else {
            //Append this
            t.appendChild(te);
        }
    }

    //Add time.
    var time = ark.createDom("div", "hub_events_evt_sub", a);
    var timeString = hub.events.convertTime(evt.time);
    ark.createDom("div", "hub_events_evt_sub_img", time);
    ark.createDom("span", "hub_events_evt_sub_nohover", time).innerText = timeString;
    ark.createDom("span", "hub_events_evt_sub_hover", time).innerText = "Ark "+evt.gameDay+" "+evt.gameTime;

    return a;
}

hub.events.addServerIcon = function(e, server) {
    var serverIcon = ark.createDom("div", "hub_events_evt_servericon", e);
    var serverIconInner = hub.events.createIcon(server.image_url);
    serverIconInner.style.borderRadius = "50%";
    serverIcon.appendChild(serverIconInner);
}

hub.events.convertTime = function(time) {
    var t = new Date(time);
    var o = new Date() - t;
    o = o/1000/60; //Now in minutes
    if(o < 5) {
        return "Now";
    }
    if(o < 30) {
        return "About a half hour ago";
    }
    if(o <= 60) {
        return "About an hour ago";
    }
    o = Math.ceil(o/60); //Now in hours
    if(o <= 24) {
        return "About "+o.toString()+" hours ago";
    }
    o = Math.floor(o/24); //Days
    if(o == 1) {
        return "About a day ago";
    }
    if(o == 2) {
        return "About "+o.toString()+" days ago";
    }
    return "Around "+ark.dateToString(t);
}

/* Event types */

hub.events.eventTypes = {};
hub.events.eventTypes[0] = function(evt, profiles, server, container) { //Player tamed dino
    var e = ark.createDom("div", "hub_events_evt", container);

    hub.events.addServerIcon(e, server);

    var icons = ark.createDom("div", "hub_events_evt_icons", e);
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.targets.tamedTarget));
    icons.appendChild(hub.events.createIcon("https://ark.romanport.com/resources/ui/events/Condition_Befriended_Icon.png"));
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.targets.tribePlayerTarget, profiles));

    hub.events.addText([
        hub.events.createPlayerOrDinoName(evt.targets.tribePlayerTarget),
        "tamed a ",
        hub.events.createPlayerOrDinoName(evt.targets.tamedTarget, false, true, server)
    ], evt, e);
}
hub.events.eventTypes[1] = function(evt, profiles, server, container) { //Target killed target
    var e = ark.createDom("div", "hub_events_evt", container);

    hub.events.addServerIcon(e, server);

    var icons = ark.createDom("div", "hub_events_evt_icons", e);
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.targets.killer, profiles));
    icons.appendChild(hub.events.createIcon("https://ark.romanport.com/resources/ui/events/Sword_Icon.png"));
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.targets.victim, profiles));

    hub.events.addText([
        hub.events.createPlayerOrDinoName(evt.targets.killer, false, false, server),
        "killed ",
        hub.events.createPlayerOrDinoName(evt.targets.victim, false, false, server)
    ], evt, e);
}
