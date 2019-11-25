var nursery = {};

var temp = {
    "id": "1519170752649338624",
    "max_temperature": 28.0,
    "min_temperature": 20.0,
    "current_temperature": 24.0,
    "health": 1.0,
    "incubation": 0.1891873,
    "hatch_time": "2019-11-23T21:47:45.283Z",
    "placed_time": "2019-11-23T21:44:43.866Z",
    "location": {
      "x": -2710.16553,
      "y": -1904.893,
      "z": 34.0898438,
      "pitch": -85.3988953,
      "yaw": 53.4633522,
      "roll": -177.973175
    },
    "parents": "Parents:\nRaptor - Lvl 33\nRaptor - Lvl 27",
    "dino_valid": true,
    "dino_name": "Raptor",
    "dino_icon": "https://icon-assets.deltamap.net/charlie/3F0DF875ADBE77C7192A5431.png",
    "dino_type": "Raptor_Character_BP_C"
};

nursery.generateEggDom = function(data) {
    var e = main.createDom("div", "nursery_box");
    nursery._createTitleSection(data.dino_name, "Egg", e);

    //Add map section
    var mapS = main.createDom("div", "nursery_map_container", main.createDom("div", "nursery_box_section", e));
    window.requestAnimationFrame(function() {
        map.getThumbnailIntoContainer(mapS, function(){}, data.location.x, data.location.y, 6000, 30, false, -1);
    });

    //Add stats section
    var stats = main.createDom("div", "nursery_box_section", e);
    nursery._createStatsBar("Incubation", data.incubation*100, "nursery_box_bar_filled_style_incubation", stats);
    nursery._createStatsBar("Health", data.health*100, "nursery_box_bar_filled_style_health", stats);

    return e;
}

nursery._createTitleSection = function(title, subtitle, container) {
    var r = main.createDom("div", "nursery_box_section", container);
    main.createDom("div", "nursery_box_subtitle", r).innerText = subtitle;
    main.createDom("div", "nursery_box_title", r).innerText = title;
    return r;
}

nursery._createStatsBar = function(name, percent, style, container) {
    var r = main.createDom("div", "nursery_box_bar", container);
    var f = main.createDom("div", "nursery_box_bar_filled "+style, r);
    f.style.width = percent.toString()+"%";
    main.createDom("div", "nursery_box_bar_text", r).innerText = name;
    main.createDom("div", "nursery_box_bar_amount", r).innerText = Math.round(percent).toString()+"%";
    return r;
}

