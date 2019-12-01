var nursery = {};

nursery.container = document.getElementById('tab_nursery');

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

nursery.load = function() {
    document.getElementById('tab_nursery').appendChild(nursery.generateEggDom(temp));
    temp.current_temperature = 100;
    document.getElementById('tab_nursery').appendChild(nursery.generateEggDom(temp));
    temp.current_temperature = 0;
    document.getElementById('tab_nursery').appendChild(nursery.generateEggDom(temp));
}

nursery.resize = function() {
    var size = nursery.getElementWidth();
    var elements = nursery.container.getElementsByClassName('nursery_box');
    for(var i = 0; i<elements.length; i+=1) {
        elements[i].style.width = size;
    }
}

nursery.getElementWidth = function() {
    var fittingElements = Math.ceil(nursery.container.clientWidth / 400);
    var size = "calc("+(100 / fittingElements).toString()+"% - 12px)";
    return size;
}

nursery.generateEggDom = function(data) {
    var e = main.createDom("div", "nursery_box");
    e.style.width = nursery.getElementWidth();

    //Add map section
    var mapS = main.createDom("div", "nursery_map_container", e);
    window.requestAnimationFrame(function() {
        map.getThumbnailIntoContainer(mapS, function(){}, data.location.x, data.location.y, 6000, 30, false, -1);
    });

    //Determine status
    var statusText = data.current_temperature.toString()+"°";
    var statusStyle = "nursery_box_status_temperature";
    if(data.current_temperature >= data.max_temperature) {
        statusText = "TOO HOT";
        statusStyle = "nursery_box_status_temperature_warn_hot";
    }
    if(data.current_temperature <= data.min_temperature) {
        statusText = "TOO COLD";
        statusStyle = "nursery_box_status_temperature_warn_cold";
    }

    //Add title
    nursery._createTitleSection(data.dino_name, "Egg", statusText, statusStyle, e);

    //Add stats section
    var stats = main.createDom("div", "nursery_box_section", e);
    nursery._createStatsBar("Incubation", data.incubation*100, "nursery_box_bar_filled_style_incubation", stats);
    nursery._createStatsBar("Health", data.health*100, "nursery_box_bar_filled_style_health", stats);
    nursery._createTemperatureBar(data.min_temperature, data.max_temperature, data.current_temperature, stats);

    return e;
}

nursery._createTitleSection = function(title, subtitle, status, statusClass, container) {
    var r = main.createDom("div", "nursery_box_section", container);
    main.createDom("div", "nursery_box_status "+statusClass, r).innerText = status;
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

nursery._createTemperatureBar = function(min, max, value, container) {
    var r = main.createDom("div", "nursery_temperature", container);
    main.createDom("div", "nursery_temperature_key nursery_temperature_key_left", r).innerText = min.toString()+"°";
    main.createDom("div", "nursery_temperature_key nursery_temperature_key_right", r).innerText = max.toString()+"°";
    var v = main.createDom("div", "nursery_temperature_value", main.createDom("div", "nursery_temperature_value_track", r));
    main.createDom("div", "nursery_temperature_value_number", v).innerText = value.toString()+"°";
    main.createDom("div", "nursery_temperature_value_marker_top", v);
    main.createDom("div", "nursery_temperature_value_marker_bottom", v);
    var offset = (value - min) / (max - min);
    offset = Math.min(1, Math.max(0, offset));
    offset *= 100;
    v.style.left = offset.toString()+"%";
}

window.addEventListener("resize", nursery.resize);