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

/*document.getElementById('map_part').addEventListener('mousedown', function() {
    //Hide search if needed
    if(uinav.searchInput.value.length == 0) {
        uinav.setSearchState(false);
    }
});*/