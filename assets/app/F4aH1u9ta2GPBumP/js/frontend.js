var frontend = {};
//Allows easy editing of UI

frontend.setUserData = function(d) {
    /*document.getElementById('me_badge_title').innerText = d.screen_name;
    frontend.toolSetBackgroundImage(document.getElementById('my_badge'), d.profile_image_url);
    frontend.setTribeName("");*/
}

frontend.setTribeName = function(name) {
    //document.getElementById('me_badge_tribe').innerText = name;
}

frontend.toolSetBackgroundImage = function(e, img) {
    //e.style.backgroundImage = "url('"+img+"')";
}

frontend.setServerData = function(d) {
    /*document.getElementById('map_title').innerText = d.display_name;
    document.getElementById('map_sub_title').innerText = d.map_name;
    frontend.setTribeName(d.tribeName);*/
    return;
}

frontend.showServerPlaceholders = function() {
    //Set tribe name
    frontend.setTribeName("");

    //Set dino sidebar placeholder
    var a = document.getElementById('dino_sidebar');
    a.innerHTML = "";
    for(var i = 0; i<30; i+=1) {
        var e = main.createDom('div', 'dino_sidebar_item', a);
        var img = main.createDom('div', 'dino_sidebar_item_templateimg', e);
        var name = main.createDom('div', 'dino_sidebar_item_title', e);
        var sub = main.createDom('div', 'dino_sidebar_item_sub', e);
        
        //Fill with templates
        name.appendChild(main.generateTextTemplate(16, "#404144", 250));
        sub.appendChild(main.generateTextTemplate(12, "#37383a", 150));
    }
}

frontend.setNavWheel = function(id) {
    document.getElementById('top_nav_btn_wheel').style.top = (id * -60).toString()+"px";
}

/* v3 nav */
frontend._navServerMap = {};
frontend._currentExpandedServerId = null;

frontend.refreshServerList = function() {
    //Grab container
    var c = document.getElementById('server_list_v3');
    c.innerHTML = "";

    //Create clusters and add a default
    var clusters = {};

    //Add default
    clusters["DEFAULT"] = frontend._createServerListClusterLabel(c, "UNCATEGORIZED");

    //Now, loop and add servers
    for(var i = 0; i<main.me.servers.length; i+=1) {
        var d = main.me.servers[i];

        //Create the DOM layout
        var e = main.createDom("div", "v3_nav_server");
        var top = main.createDom("div", "v3_nav_server_top", e);
        main.createDom("img", "v3_nav_server_top_icon", top).src = d.image_url;
        main.createDom("span", "", top).innerText = d.display_name;
        var bottom = main.createDom("div", "v3_nav_server_bottom", e);
        for(var j = 0; j<statics.SERVER_NAV_OPTIONS.length; j+=1) {
            var btn = main.createDom("div", "v3_nav_server_bottom_item", bottom);
            btn.innerText = statics.SERVER_NAV_OPTIONS[j].name;
            btn.x_data = statics.SERVER_NAV_OPTIONS[j];
            btn.x_index = j;
            btn.addEventListener("click", frontend._onNavBtnClicked);
        }
        e.x_data = d;
        top.addEventListener("click", frontend._onServerBtnClicked);

        //Add to map
        frontend._navServerMap[d.id] = {
            "element":e,
            "bottom":bottom
        }

        //Attach
        if(d.cluster_id == null) {
            clusters["DEFAULT"].appendChild(e);
        } else {
            clusters[d.cluster_id].appendChild(e);
        }
    }
}

frontend.setServerListSelectedServer = function(server_id) {
    //Unexpand any servers
    var r = document.getElementsByClassName('v3_nav_server_active');
    for(var i = 0; i<r.length; i+=1) {
        r[i].classList.remove("v3_nav_server_active");
    }

    //Now, find this server and set it to shown
    frontend._navServerMap[server_id].element.classList.add("v3_nav_server_active");

    //Set
    frontend._currentExpandedServerId = server_id;

    //Set current option
    frontend.setServerListOptionIndex(0);
}

frontend.setServerListOptionIndex = function(index) {
    //Find the list of options
    var options = frontend._navServerMap[frontend._currentExpandedServerId].bottom;

    //Deselect any selected options
    var r = document.getElementsByClassName('v3_nav_server_bottom_item_selected');
    for(var i = 0; i<r.length; i+=1) {
        r[i].classList.remove("v3_nav_server_bottom_item_selected");
    }

    //Set the index
    options.children[index].classList.add("v3_nav_server_bottom_item_selected");

    //Hide all tabs
    r = document.getElementsByClassName('main_tab_active');
    for(var i = 0; i<r.length; i+=1) {
        r[i].classList.remove("main_tab_active");
    }

    //Run function
    statics.SERVER_NAV_OPTIONS[index].open_function();

    //Show
    statics.SERVER_NAV_OPTIONS[index].tab_element.classList.add("main_tab_active");
}

frontend._onNavBtnClicked = function() {
    //Activate
    frontend.setServerListOptionIndex(this.x_index);
}

frontend._onServerBtnClicked = function() {
    if(this.classList.contains("v3_nav_server_active")) {
        //Already activated!
        return;
    }
    ark.initAndVerify(this.parentNode.x_data, true);
}

frontend._createServerListClusterLabel = function(container, name) {
    //Create the label itself
    main.createDom("div", "v3_nav_server_label", container).innerText = name;

    //Now, create the container
    return main.createDom("div", "", container);
}