var statics = {};

//Status states for dinos
statics.STATUS_STATES = {
    "PASSIVE":{
        "color":"#5AE000",
        "text":"Passive",
        "modal_color":"#5AE000"
    },
    "NEUTRAL":{
        "color":"#33363c",
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
    "#932DF9",
    "#f92dc4"
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
        },
        "init": function () {

        },
        "deinit": function () {

        }
    },
    {
        "name":"Dinos",
        "tab_element":document.getElementById('tab_dinos'),
        "open_function":function() {
            //Download the data if needed
            if (!dino_stats.loading && dino_stats.dinos.length == 0) {
                dino_stats.load(ark.getEndpoint("tribes_dino_stats"), dino_stats.container);
            }
        },
        "init": function () {
            dino_stats.init();
        },
        "deinit": function () {
            dino_stats.loading = false;
            dino_stats.dinos = [];
        }
    },
    {
        "name":"Nursery",
        "tab_element":document.getElementById('tab_nursery'),
        "open_function":function() {

        },
        "init": function () {

        },
        "deinit": function () {

        }
    },
];

statics.CLOSE_REASONS = {
    32: "The ARK map this server is using is currently unsupported.",
    33: "This server is temporarily unavailable. It will return soon.",
    34: "You do not have a tribe on this server.",

    0: "Server is still getting ready, try again shortly.",
    1: "The owner of this server has locked it. You cannot access it until they choose to unlock it.",
    2: "This server has been temporarily suspended by Delta Web Map from reports of abuse."
}

statics.ARK_DINO_STAT = {
    Health: 0,
    Stamina: 1,
    Torpidity: 2,
    Oxygen: 3,
    Food: 4,
    Water: 5,
    Temperature: 6,
    Weight: 7,
    MeleeDamageMultiplier: 8,
    SpeedMultiplier: 9,
    TemperatureFortitude: 10,
    CraftingSpeedMultiplier: 11
}

statics.STATUS_ENTRIES = [
    {
        "icon": "/assets/ui/status/health.png",
        "name": "Health",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/stamina.png",
        "name": "Stamina",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/unknown1.png",
        "name": "Torpidity",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/oxygen.png",
        "name": "Oxygen",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/food.png",
        "name": "Food",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/water.png",
        "name": "Water",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/unknown2.png",
        "name": "Temperature",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/inventoryWeight.png",
        "name": "Weight",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/meleeDamageMult.png",
        "name": "Melee Damage",
        "formatString": function (value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString() + "%";
        }
    },
    {
        "icon": "/assets/ui/status/movementSpeedMult.png",
        "name": "Movement Speed",
        "formatString": function (value) {
            var v = Math.round((value + 1) * 100);
            return (v).toString() + "%";
        }
    },
    {
        "icon": "/assets/ui/status/unknown3.png",
        "name": "Fortitude",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    },
    {
        "icon": "/assets/ui/status/unknown3.png",
        "name": "Crafting Speed",
        "formatString": function (value) { return (Math.round(value * 10) / 10).toString(); }
    }
];

statics.ERROR_BANNER_PACKS = {
    "ERROR_RPC_DISCONNECTED": {
        "text": "Having troubles connecting. Some features may be unavailable.",
        "id": 0,
        "priority": 10,
        "actions":[]
    }
}

statics.MAP_ICON_RENDER_PROFILE = {
    "dinos": function (data, icon, all) {
        
    },
    "players": function (data, icon, all) {
        icon.style.backgroundSize = "cover";
    }
}

statics.MAP_ICON_INTERACT_EVENTS = {
    "dinos": {
        "click": function (data, marker) {
            var pos = marker.getBoundingClientRect();
            var x = pos.left-14;
            var y = pos.top-11;
            DeltaPopoutModal.ShowDinoModal(data.extras._map.map.server.app, data._original, { "x": x, "y": y }, data.extras._map.map.server);
        }
    },
    "players": {

    }
}

statics.MAP_ICON_ADAPTERS = {
    "dinos": function (data, map) {
        var s = map.server.GetEntrySpecies(data.classname);
        var name = data.tamed_name;
        if (name == null || name.length == 0) {
            name = s.screen_name;
        }
        return {
            "location": data.location,
            "img": s.icon.image_thumb_url,
            "type": "dinos",
            "id": data.dino_id,
            "outline_color": "#000000",
            "tag_color": null,
            "dialog": {
                "title": name,
                "subtitle": s.screen_name + " - Lvl " + data.level
            },
            "extras": {
                
            },
            "_original": data
        };
    }
}