var uinav = {};
uinav.searchInput = document.getElementById('ui_tribe_search');

uinav.setSearchState = function(shown) {
    collap.setState("right_sidebar", shown);
}

uinav.onSearchFocus = function() {
    uinav.setSearchState(true);
}

uinav.onSearchBlur = function() {
    
}

uinav.onSearchInput = function() {
    dinosidebar.onSearch(uinav.searchInput.value);
    uinav.setSearchState(true);
}

uinav.onSearchTypeChange = function(c) {
    var id = parseInt(c.value);
    dinosidebar.switchSection(id);
}

uinav.toggleMenu = function() {
    uinav.createServerList();
    document.getElementById('server_picker_sidebar').classList.toggle("server_picker_sidebar_active");
}

uinav.createServerList = function() {
    //Create elements
    var body = ark.createDom("div", "dino_sidebar_helper server_picker_helper");
    for(var i = 0; i<ark_users.me.servers.length; i+=1) {
        var s = ark_users.me.servers[i];
        uinav.makeServerEntry(body, s.id, s.display_name, s.map_name, s.image_url, uinav.onClickServer);
    }

    //Add "create server" option
    ark.createDom("div", "dino_sidebar_section_header", body);
    uinav.makeServerEntry(body, null, "Create Server", "Add your own server!", "/assets/icons/baseline-add-24px.svg", uinav.onClickServer);

    //Set in DOM
    var p = document.getElementById('server_picker_sidebar');
    ark.removeAllChildren(p);
    p.appendChild(body);
}

uinav.makeServerEntry = function(body, id, name, sub, icon, onclick) {
    var b = ark.createDom("div", "dino_sidebar_item", body);
    b.x_id = id;
    ark.createDom("img", "server_picker_img", b).src = icon;
    ark.createDom("div", "dino_sidebar_item_title", b).innerText = name;
    ark.createDom("div", "dino_sidebar_item_sub", b).innerText = sub;
    b.addEventListener("click", onclick);
}

uinav.onClickServer = function() {
    var id = this.x_id;
    ark.switchServerById(id);
    uinav.toggleMenu();
}