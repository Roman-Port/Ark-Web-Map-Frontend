var frontend = {};
//Allows easy editing of UI

frontend.setUserData = function(d) {
    document.getElementById('me_badge_title').innerText = d.screen_name;
    frontend.toolSetBackgroundImage(document.getElementById('my_badge'), d.profile_image_url);
    frontend.setTribeName("");
}

frontend.setTribeName = function(name) {
    document.getElementById('me_badge_tribe').innerText = name;
}

frontend.toolSetBackgroundImage = function(e, img) {
    e.style.backgroundImage = "url('"+img+"')";
}

frontend.setServerData = function(d) {
    frontend.toolSetBackgroundImage(document.getElementById('map_icon'), d.image_url);
    document.getElementById('map_title').innerText = d.display_name;
    document.getElementById('map_sub_title').innerText = d.map_name;
    frontend.setTribeName(d.tribeName);
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