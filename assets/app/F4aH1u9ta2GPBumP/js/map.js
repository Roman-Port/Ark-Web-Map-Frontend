var map = {};
map.map = null;
map.game_map = null; //The current map itself
map.game_map_data = null; //Data about the current map
map.layerList = {};
map.onClickQueue = []; //List of events fired when a click is down. Only called once. Format: {"callback":function(ok, pos, context), "context":context}

map.populationMapFilter = "";

map.isInMotion = false;

map.init = function() {
    //Get prefs so we know where to spawn the map
    var user_prefs = ark.getServerData().user_prefs;

    //Create map
    map.map = L.map('map_part', {
        crs: L.CRS.Simple,
        minZoom: 0,
        /*maxBounds:L.latLngBounds(L.latLng(-256, 0), L.latLng(0, 256))*/
    }).setView([user_prefs.y, user_prefs.x], user_prefs.z);

    //Set background color
    if(ark.session.mapBackgroundColor != null) {
        map.setBackground(ark.session.mapBackgroundColor);
    } else {
        map.restoreDefaultBackgroundColor();
    }

    //Add click events
    map.map.on("click", function(e) {
        //Convert this to coords and call all of the click queue
        var coords = map.convertFromMapPosToNormalized({
            "x":e.latlng.lng,
            "y":e.latlng.lat
        });
        coords = {
            "x":coords[0],
            "y":coords[1]
        };

        //Call all 
        for(var i = 0; i<map.onClickQueue.length; i+=1) {
            var d = map.onClickQueue[i];
            d.callback(true, coords, d.context);
        }

        //Clear
        map.onClickQueue = [];
    });

    //Add events for drawable
    //map.map.on("move", draw_map.redraw);
    map.map.on('mousedown', function(e) {
        if(e.originalEvent.button == 2) {
            //Right click
            map.map.dragging.disable();
            //draw_map.onDrawBegin();
        }
    });
    map.map.on('mouseup', function(e) {
        if(e.originalEvent.button == 2) {
            //Right click
            map.map.dragging.enable();
            //draw_map.onDrawEnd();
        }
    });
    map.map.addEventListener('mousemove', function(e) {
        //draw_map.onDrawMove(e.containerPoint, e.latlng);
    });
    map.map.on("contextmenu", function(){}); //Only used to prevent context menu
    map.map.on("zoomend", main.queueSubmitUserServerPrefs);
    map.map.on("moveend", main.queueSubmitUserServerPrefs);
    map.map.on("move", map.updateReturnBtn);
    map.map.on("movestart", function(){map.isInMotion = true;});
    map.map.on("moveend", function(){map.isInMotion = false;});

    //Trigger resize of canvas
    //draw_map.onResize();

    //Check btn
    map.updateReturnBtn();

    map.dtiles.init();
};

map.deinit = function() {
    //Clear all dynamic maps
    main.foreach(map.dynamic_maps, function(m) {
        clearInterval(m.heart);
    });

    //Clear dynamic map list
    map.dynamic_maps = [];

    //Remove the map
    if(map.map != null) {
        map.map.remove();
        map.map = null;
    }
}

map.updateReturnBtn = function() {
    //Determine if we need to update or not
    var center = map.map.getCenter();
    var tolerance = 50;
    var doReturn = center.lat > tolerance || center.lng < -tolerance || center.lat < -(250 + tolerance) || center.lng > (250 + tolerance);
    var btn = document.getElementById('map_return_btn');
    if(doReturn) {
        btn.classList.add("map_return_btn_active");
    } else {
        btn.classList.remove("map_return_btn_active");
    }
}

map.resetPos = function() {
    map.map.setView(L.latLng(-128, 128));
    main.queueSubmitUserServerPrefs();
}

map.resetPopulationMap = function(isOn, filteredClassname) {
    //Remove layer if needed
    if(map.layerList["population_map"] != null) {
        try {
            map.layerList["population_map"].removeFrom(map.map);
        } catch (e) {

        }
    }

    //If it is on, add it
    if(isOn) {
        map.addPopulationMap(filteredClassname);
    }
}

map.addGameMapLayer = function(data) {
    //Create main tile layer
    map.game_map_data = data;
    map.game_map = L.tileLayer(data.url, {
        attribution: 'Studio Wildcard',
        maxNativeZoom: data.maximumZoom,
        maxZoom:12,
        id: 'ark_map',
        opacity: 1,
        zIndex: 1,
        bounds:map.getBounds()
    }).addTo(map.map);
}

map.dynamic_maps = []; //Dynamic maps we're using

map.addDynamicMap = function(type, callback) {
    //Request to begin a dynamic map
    main.serverRequest("https://dynamic-tiles.deltamap.net/create/"+encodeURIComponent(main.currentServerId)+"/"+encodeURIComponent(type), {"enforceServer":true, "failOverride":function() {
        main.addHUDMessage("Layer "+type+" is currently unavailable. Try again later.", "#eb3434", "/assets/icons/baseline-cloud-24px.svg", 5, 11);
    }}, function(d) {
        //We've created a session. Create an object to insert
        var session = {
            "token":d.token,
            "heartbeat_url":d.url_heartbeat,
            "map_url":d.url_map,
            "expired":false,
            "type":type
        };

        //Set a timer to heartbeat this
        session.heart = window.setInterval(function() {
            main.serverRequest(session.heartbeat_url, {"isJson":false, "enforceServer":true, "failOverride":function(t) {
                if(t.status == 410) {
                    //The resource no longer exists, as it expired. We'll recreate it
                    main.log("dynamic-map", 3, "Session expired. Recreating dynamic map...");

                    //Kill this session
                    clearInterval(session.heart);
                    session.expired = true;
                    session.layer.remove();

                    //Add a new one
                    map.addDynamicMap(session.type, function(){});
                }
            }}, function() {});
        }, d.heartbeat_policy_ms);

        //Add map layer
        session.layer = L.tileLayer(session.map_url, {
            maxZoom:12,
            id: 'dm_'+session.token,
            opacity: 1,
            zIndex: 1,
            maxNativeZoom:10,
            bounds:map.getBounds()
        }).addTo(map.map);

        //Push
        map.dynamic_maps.push(session);

        //Callback
        callback();
    });
}

map.onPopulationMapToggle = function(value) {
    if(value == false) {
        //Remove
        map.layerList["population_map"].removeFrom(map.map);
    } else {
        //Add
        map.addPopulationMap(map.populationMapFilter);
    }
}

map.getBounds = function() {
    return [
        [-256, 0],
        [0, 256]
    ];
}

map.addPopulationMap = function(filter) {
    var url = ark.session.endpoint_population_map.replace("{filter}", encodeURIComponent(filter));
    map.layerList["population_map"] = L.tileLayer(url, {
        maxZoom: 50,
        id: 'ark_map',
        opacity: 1,
        zIndex: 2,
        bounds: map.getBounds()
    });
    map.layerList["population_map"].addTo(map.map);
}

map.onChangePopulationMapFilter = function(dinoData) {
    //Remove
    if(map.layerList["population_map"] != null) {
        map.layerList["population_map"].removeFrom(map.map);
    }
    //Activate
    document.getElementById('population_map_check').checked = true;
    if(dinoData == null) {
        //No filter
        map.addPopulationMap("");
    } else {
        //Dino filter
        map.addPopulationMap(dinoData.classname);
    }
}

//Key: Dino ID, 
map.dino_marker_list = {};
map.dino_marker_list_index = 0;

/* Tribe dinos */
map.onEnableTribeDinos = function(d) {
    //Add to loading status
    ark.loading_status += 1;

    //Add dinos
    for(var i = 0; i<d.dinos.length; i+=1) {
        var dino = d.dinos[i];
        if(dino == null) {
            console.warn("Warning: Dino ID "+dino_id+" was not found, but was referenced.");
        }
        //Create marker
        map.addDinoMarker(dino);
    }

    //Add tribemates
    for(var i = 0; i<d.player_characters.length; i+=1) {
        var player = d.player_characters[i];
        var pos = map.convertFromNormalizedToMapPos(player.adjusted_map_pos);
        var imgOverlay = null;
        if(!player.is_alive) {
            //Set death overlay
            imgOverlay = "//icon-assets.deltamap.net/legacy/player_death_cache.png";
        }
        map.addMapIcon("players", player.profile.arkPlayerId.toString(), player, pos, player.steamProfile.avatarfull, null, null, null, true, imgOverlay );
    }
}

map.enableStructuresLayer = function(data, structures) {
    var StructureLayer = L.GridLayer.extend({
        options: {
            x_list: [],
            x_show_list: false
        },
        createTile: function(coords, done){
            // create a <canvas> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            if(this.options.x_show_list) {
                tile.classList.add("structure_layer_hp");
            } else {
                tile.classList.add("structure_layer_lp");
            }

            // setup tile width and height according to the options
            var size = this.getTileSize();
            tile.style.width = size.x;
            tile.style.height = size.y;

            //Find range in this tile
            var min = map.convertZCoordsToGameUnits(coords.x, coords.y, coords.z);
            var max = map.convertZCoordsToGameUnits(coords.x + 1, coords.y + 1, coords.z);
            var unitsPerTile = map.getUnitsPerTile(coords.z);
            var tilePpm = 256 / unitsPerTile;
            
            //Get structures in this range
            var count = 0;
            for(var i = 0; i<structures.length; i+=1) {
                if(structures[i].map_pos.x > max.x || structures[i].map_pos.x < min.x || structures[i].map_pos.y > max.y || structures[i].map_pos.y < min.y) {continue;}
                var st = structures[i];
                count+=1;

                //Only show if this has an inventory
                if(!st.hasInventory) {
                    continue;
                }

                //Find position inside of the structure inside of this tile
                var adjusted = {"x":((st.map_pos.x - min.x) / unitsPerTile), "y":((st.map_pos.y - min.y) / unitsPerTile)};
                adjusted.x -= 0.5;
                adjusted.y -= 0.5;

                //Scale
                var ppmDiff = tilePpm / st.ppm;

                //Get z
                var z = st.z - data.min_structure_z;
                z = 20;
                if(st.dtype == 1) {
                    z = 21;
                }

                //Get the image name. This jank will be fixed in a future update
                var name = data.structure_images[st.img].substr(51);
                var size = map.structure_size_config[name];

                //Skip if we failed to find the size
                if(size == null) {
                    continue;
                }

                //Place structure
                var sd = main.createDom("div", "structure_img", tile);
                sd.style.width = size.width+"px";
                sd.style.height = size.height+"px";
                sd.style.backgroundColor = "red";
                sd.style.transform = "scale("+(ppmDiff).toString()+") rotate("+st.rot.toString()+"deg)";
                sd.style.top = ((adjusted.y * 256) - 0).toString()+"px";
                sd.style.left = ((adjusted.x * 256) - 0).toString()+"px";
                sd.style.zIndex = z.toString();
            }
            
            //Set
            tile.style.visibility = "visible";

            // return the tile so it can be rendered on screen
            return tile;
        }
    });
    var lo = new StructureLayer({
        id: 'structure_map_hp',
        opacity: 1,
        zIndex: 3,
        updateWhenZooming: false,
        keepBuffer: 4,
    });
    lo.addTo(map.map);
}

map.getUnitsPerTile = function(z) {
    var tilesInAxis = Math.pow(2, z);
    var unitsPerTile = ark.session.mapData.captureSize / tilesInAxis;
    return unitsPerTile;
}

map.convertZCoordsToGameUnits = function(x, y, z) {
    //Find number of game units in this zoom level
    var unitsPerTile = map.getUnitsPerTile(z);
    return {
        "x":(x * unitsPerTile),
        "y":(y * unitsPerTile)
    }
}

map.addDinoMarker = function(dino) {
    //Get pos
    var pos = map.convertFromNormalizedToMapPos(dino.adjusted_map_pos);

    //Create the hover content
    var hover = map.createDinoHoverElement(dino);

    //Create inner content
    var content = main.createDom("div", "");
    content.appendChild(hover);

    //Add tag
    if(dino.color_tag != null) {
        main.createDom("div", "map_icon_tag", content).style.backgroundColor = dino.color_tag;
    }

    //Create icon
    var icon = map.addMapIcon("dinos", dino.id, dino, pos, dino.imgUrl, map.onDinoClicked, "map_icon_dino", content);

    //Set border from state
    if(dino.status != null) {
        icon.style.borderColor = ark.STATUS_STATES[dino.status].color;
    }
}

map.markers = {};

map.MARKER_Z_OFFSETS = {
    "dinos":10,
    "players":10000
}; //Used to define layer priorities. If the layer name does not exist on this list, it is pushed to the bottom

map.addMapIcon = function(layerId, markerId, data, pos, img, onclick, classNames, inner) {
    var icon = L.divIcon({
        iconSize:       [40, 40],
        className:      "map_icon_base "+classNames,
        html:           inner.innerHTML
    });

    //Make sure that we have an index in the markers for this
    if(map.markers[layerId] == null) {
        map.markers[layerId] = {};
    }

    //Determine Z-index
    var z = 0;
    if(map.MARKER_Z_OFFSETS[layerId] != null) {
        //Get base
        z = map.MARKER_Z_OFFSETS[layerId];

        //Find number of items already here
        z += Object.keys(map.markers[layerId]).length;
    }

    //Add to map
    var dino_icon = L.marker(pos, {
        icon: icon,
        zIndexOffset:1
    }).addTo(map.map);

    //Add to list
    map.markers[layerId][markerId] = dino_icon;

    //Add data
    dino_icon.x_data = data;

    //Add events
    if(onclick != null) { dino_icon.on('click', onclick); }

    //Set image
    dino_icon._icon.style.backgroundImage = "url("+img+")";
    dino_icon._icon.style.zIndex = null;

    return dino_icon._icon;
}

map.getMarkerByName = function(layerId, id) {
    return map.markers[layerId][id];
}

map.flyToMarkerByName = function(layerId, id) {
    var pin = map.getMarkerByName(layerId, id);
    pin._map.flyTo(pin._latlng, 9, {
        "animate":true,
        "duration":0.5,
        "easeLinearity":0.25,
        "noMoveStart":false
    });
}

map.removeMarkerLayer = function(layerId) {
    if(map.markers[layerId] == null) {
        return;
    }
    var keys = Object.keys(map.markers[layerId]);
    for(var i = 0; i<keys.length; i+=1) {
        map.markers[layerId][keys[i]].remove();
    }
}

map.onDinoClicked = function(e) {
    //Log
    analytics.action("map-dino-click-online", "web-main", {
        "dino_id":this.x_data.id,
        "dino_classname":this.x_data.classname
    });

    //Get URL
    var url = this.x_data.apiUrl;

        //Get pos
        var rect = this._icon.getBoundingClientRect();

    //Show
    dinopop.downloadAndShow(rect.left - 14, rect.top - 10, url, this._icon);
}

map.setBackground = function(color) {
    document.getElementById('map_part').style.backgroundColor = color;
}

map.restoreDefaultBackgroundColor = function() {
    map.setBackground("#1c1d21");
}

map.createDinoHoverElement = function(data) {
    //Create element
    var e = main.createDom("div", "mini_modal mini_modal_anim");

    //Add icon
    var icon = main.createDom("img", "mini_modal_icon map_icon_base map_icon_dino", e);
    icon.style.backgroundImage = "url("+data.imgUrl+")";

    //Create content
    var ce = main.createDom("div", "mini_modal_content", e);
    main.createDom("div", "mini_modal_title", ce).innerText = data.tamedName;
    main.createDom("div", "mini_modal_sub", ce).innerText = data.displayClassname+" - Lvl "+data.level;;

    return e;
}

map.convertFromNormalizedToMapPos = function(pos) {
    ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
    return [
        (-pos.y * 256),
        (pos.x * 256)
    ];
}

map.convertFromMapPosToNormalized = function(pos) {
    ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
    return [
        (-pos.y / 256),
        (pos.x / 256)
    ];
}

map.convertFromGamePosToMapPos = function(x, y) {
    //Add offsets
    x += ark.session.mapData.mapImageOffset.x;
    y += ark.session.mapData.mapImageOffset.y;

    //Divide by scale
    x /= ark.session.mapData.captureSize;
    y /= ark.session.mapData.captureSize;

    //Move
    x += 0.5;
    y += 0.5;

    //Convert to map pos
    x = x * 256;
    y = -y * 256;

    //Now, return latlng
    return L.latLng(y, x);
}

map.addClickEvent = function(callback, context) {
    //Push
    map.onClickQueue.push({
        "callback":callback,
        "context":context
    })
};

map.remoteUpdateDino = function(e) {
    //Get marker
    var marker = map.getMarkerByName("dinos", e.id);

    //Add a marker if it isn't already added. Else, we can update the marker
    if(marker != null) {
        //Move marker
        marker.setLatLng(map.convertFromGamePosToMapPos(e.x, e.y));
    }
}