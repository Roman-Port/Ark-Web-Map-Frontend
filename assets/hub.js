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

        //Add ark news
        var arknews = hub.arknews.create(d, container);

        //Add server list
        var serverList = hub.serverList.create(d, container);

        //Add main news section
        var serverevents = hub.events.create(d, container);

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
    var inner = ark.createDom("div", "ark_serverlist_container");
    
    for(var i = 0; i<d.servers.length; i+=1) {
        var s = d.servers[i];
        var e = ark.createServerEntryBadge(s, function() {
            ark.switchServer(this.x_server_data);
            collap.toggle("ui_hub");
        });
        if(e != null) {
            inner.appendChild(e);
        }
    }

    //Create frame
    return hub.makeSectionArea("Servers", inner, parent);
}

/* Server events */
hub.events = {};
hub.events.create = function(d, parent) {
    //Create the inner boxes for each server
    var container = ark.createDom("div", "");

    //Add server boxes
    for(var i = 0; i<d.servers.length; i+=1) {
        var server = d.servers[i];
        if(d.servers_hub[server.id] != null) {
            hub.events.createServer(server, container, d.servers_hub[server.id]);
        }
        
    }

    //Wrap in a section
    return hub.makeSectionArea("Server Events", container, parent);
}

hub.events.createServer = function(data, container, hubData) {
    //Create the box
    var box = ark.createDom("div", "hub_events_box", container);

    //Make header
    var header = ark.createDom("div", "hub_events_header", box);
    ark.createDom("img", "hub_events_header_img", header).src = data.image_url;
    ark.createDom("span", "hub_events_header_name", header).innerText = data.display_name;
    ark.createDom("span", "hub_events_header_sub", header).innerText = data.map_name;

    //Now, add the events section
    var esection = ark.createDom("div", "hub_events_area", box);

    //Loop through events and add them.
    for(var i = 0; i<hubData.events.length; i+=1) {
        var event = hubData.events[i];
        hub.events.eventTypes[event.type](event, hubData.profiles, data, esection);
    }
}

/* Event tools */
hub.events.createDinoIcon = function(data) {
    //Create circle
    var cir = ark.createDom("div", "hub_circle_big");

    //If we have a dino entry, add the class image
    if(data.dinoEntry != null) {
        cir.style.backgroundImage = "url('"+data.dinoEntry.icon_url+"')";
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
    if(data.name == "Your Tribe") {
        //Ark did not provide a user. Use our profile URL
        cir.style.backgroundImage = "url('"+ark_users.me.profile_image_url+"')";
    }
    else if(data.profile != null) {
        var playerData = profiles[data.profile.steamPlayerId];
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
        if(data.profile != null) {
            if(data.profile.tribeId == server.tribeid) {
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
    //In tyhe future, you'll be able to hover over this
    var str = data.name+" ";
    var e = ark.createDom("span", "");
    e.innerText = str;
    return e;
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
    ark.createDom("div", "hub_events_evt_sub_img", time);
    ark.createDom("span", "", time).innerText = evt.gameDay+" "+evt.gameTime;

    return a;
}

/* Event types */

hub.events.eventTypes = {};
hub.events.eventTypes[0] = function(evt, profiles, server, container) { //Player tamed dino
    var e = ark.createDom("div", "hub_events_evt", container);

    var icons = ark.createDom("div", "hub_events_evt_icons", e);
    icons.appendChild(hub.events.createDinoIcon(evt.tamedTarget));
    icons.appendChild(hub.events.createIcon("https://ark.romanport.com/resources/ui/events/Condition_Befriended_Icon.png"));
    icons.appendChild(hub.events.createPlayerIcon(evt.tribePlayerTarget, profiles));

    hub.events.addText([
        hub.events.createPlayerName(evt.tribePlayerTarget),
        "tamed a ",
        hub.events.createDinoName(evt.tamedTarget, false, true, server)
    ], evt, e);
}
hub.events.eventTypes[1] = function(evt, profiles, server, container) { //Target killed target
    var e = ark.createDom("div", "hub_events_evt", container);

    var icons = ark.createDom("div", "hub_events_evt_icons", e);
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.killer, profiles));
    icons.appendChild(hub.events.createIcon("https://ark.romanport.com/resources/ui/events/Sword_Icon.png"));
    icons.appendChild(hub.events.createPlayerOrDinoIcon(evt.victim, profiles));

    hub.events.addText([
        hub.events.createPlayerOrDinoName(evt.killer, false, false, server),
        "killed ",
        hub.events.createPlayerOrDinoName(evt.victim, false, false, server)
    ], evt, e);
}
