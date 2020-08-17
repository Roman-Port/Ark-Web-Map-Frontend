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