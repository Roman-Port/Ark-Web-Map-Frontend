var statics = {};

//Status states for dinos
statics.STATUS_STATES = {
    "PASSIVE":{
        "color":"#5AE000",
        "text":"Passive",
        "modal_color":"#5AE000"
    },
    "NEUTRAL":{
        "color":"#000000",
        "text":"Neutral",
        "modal_color":"#FFFFFF"
    },
    "AGGRESSIVE":{
        "color":"#E63F19",
        "text":"Aggressive",
        "modal_color":"#FF7777"
    },
    "PASSIVE_FLEE":{
        "color":"#E6D51C",
        "text":"Passive Flee",
        "modal_color":"#E6D51C"
    },
    "YOUR_TARGET":{
        "color":"#1C9BE6",
        "text":"Your Target",
        "modal_color":"#1C9BE6"
    }
};

//Tags we can pick for dinos
statics.COLOR_TAGS = [
    "#F92A2A",
    "#FCA71A",
    "#F7F123",
    "#34F820",
    "#3B8AF5",
    "#932DF9"
];

//Tabs on the side of each server
statics.SERVER_NAV_OPTIONS = [
    {
        "name":"Overview",
        "tab_element":document.getElementById('tab_map'),
        "open_function":function() {
            if(map.map != null) {
                map.map._sizeChanged = true; //Fix for map resizing bug
            }
        }
    },
    {
        "name":"Dinos",
        "tab_element":document.getElementById('tab_dinos'),
        "open_function":function() {

        }
    },
    /*{
        "name":"Tribe Log",
        "tab_element":document.getElementById('tab_tribe'),
        "open_function":function() {

        }
    }*/
    {
        "name":"Nursery",
        "tab_element":document.getElementById('tab_nursery'),
        "open_function":function() {

        }
    },
];