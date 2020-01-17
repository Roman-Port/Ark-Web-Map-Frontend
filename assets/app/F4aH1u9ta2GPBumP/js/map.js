var map = {};
map.map = null;
map.game_map = null; //The current map itself
map.game_map_data = null; //Data about the current map
map.layerList = {};

map.isInMotion = false;

map.ICON_ENTRIES = {
    "dinos":function(data, icon) {
        icon.addEventListener('click', map.onDinoClicked);
    },
    "players": function (data, icon) {
        icon.style.backgroundSize = "cover";
    }
}

map.init = function() {
    //Get prefs so we know where to spawn the map
    var user_prefs = ark.getServerData().user_prefs;

    //Create map
    map.map = L.map('map_part', {
        crs: L.CRS.Simple,
        minZoom: 0,
    }).setView([user_prefs.y, user_prefs.x], user_prefs.z);

    //Set background color
    if(ark.session.mapBackgroundColor != null) {
        map.setBackground(ark.session.mapBackgroundColor);
    } else {
        map.restoreDefaultBackgroundColor();
    }

    //Add various events
    map.map.on('mousedown', function(e) {
        if(e.originalEvent.button == 2) {
            map.map.dragging.disable();
        }
    });
    map.map.on('mouseup', function(e) {
        if(e.originalEvent.button == 2) {
            map.map.dragging.enable();
        }
    });
    map.map.on("contextmenu", function(){}); //Only used to prevent context menu
    map.map.on("zoomend", main.queueSubmitUserServerPrefs);
    map.map.on("moveend", main.queueSubmitUserServerPrefs);
    map.map.on("move", map.updateReturnBtn);
    map.map.on("movestart", function(){map.isInMotion = true;});
    map.map.on("moveend", function(){map.isInMotion = false;});
    //map.map.on("zoomstart", dinopop.dismissModal);
    map.canvas.hook(map.map);

    //Check btn
    map.updateReturnBtn();

    //Init map plugins
    map.dtiles.init();
    map.canvas.init();
};

map.deinit = function() {
    //Deinit addons
    map.canvas.deinit();

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

map.addGameMapLayer = function(data) {
    //Create main tile layer
    map.game_map_data = data;
    var mapSettings = {
        attribution: 'Studio Wildcard',
        maxNativeZoom: data.maximumZoom,
        maxZoom:12,
        id: 'ark_map',
        opacity: 1,
        zIndex: 1,
        bounds:map.getBounds()
    };
    map.game_map = L.tileLayer(data.url, mapSettings).addTo(map.map);
}

map.getBounds = function() {
    return [
        [-256, 0],
        [0, 256]
    ];
}

//Key: Dino ID, 
map.dino_marker_list = {};
map.dino_marker_list_index = 0;

/* Tribe dinos */
map.onEnableTribeDinos = function(d) {
    //Add to loading status
    ark.loading_status += 1;
    ark.map_icons = d;

    //Add all map icons
    for(var i = 0; i<d.icons.length; i+=1) {
        var data = d.icons[i];
        map.addDataIconToMap(data, map.map);
    }
}

map.addDataIconToMap = function(data, mapContainer) {
    //Get position on the map
    var pos = map.convertFromGamePosToMapPos(data.location.x, data.location.y);

    //Create the inner content
    var content = main.createDom("div", "");

    //Add color tag to content, if any
    if(data.tag_color != null) {
        main.createDom("div", "map_icon_tag", content).style.backgroundColor = data.tag_color;
    } else {
        main.createDom("div", "map_icon_tag", content).style.display = "none";
    }

    //Create the hover content, if any
    if(data.dialog != null) {
        content.appendChild(map.createHoverElement(data.img, data.dialog.title, data.dialog.subtitle));
    }

    //Create icon
    if (data.extras != null) {
        data.extras._id = data.id;
    }
    var icon = map.addMapIcon(data.type, data.id, data.extras, pos, data.img, null, "map_icon_dino", content, mapContainer, data.location.yaw);
    icon.x_data = data;

    //Set border from state
    if(data.outline_color != null) {
        icon.style.borderColor = data.outline_color;
    }

    //Add custom events from the type
    if(map.ICON_ENTRIES[data.type] != null) {
        map.ICON_ENTRIES[data.type](data, icon);
    } else {
        //Unexpected type.
        console.warn("Got icon with type "+data.type+", but there was no entry for this type!");
    }
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
map.markers = {};

map.MARKER_Z_OFFSETS = {
    "dinos":10,
    "players":10000
}; //Used to define layer priorities. If the layer name does not exist on this list, it is pushed to the bottom

map.addMapIcon = function(layerId, markerId, data, pos, img, onclick, classNames, inner, mapContainer, rotation) {
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
    }).addTo(mapContainer);

    //Add to list
    map.markers[layerId][markerId] = dino_icon;

    //Add data
    dino_icon.x_data = data;

    //Add events
    if(onclick != null) { dino_icon.on('click', onclick); }

    //Set image
    dino_icon._icon.style.backgroundImage = "url("+img+")";
    dino_icon._icon.style.zIndex = null;

    //Add rotation
    if (rotation != null) {
        var rotor = main.createDom("div", "map_icon_rotor", dino_icon._icon);
        dino_icon.x_rotor = rotor;
        rotor.style.transform = "rotate(" + rotation + "deg)";
    }

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

map.onDinoClicked = function() {
    //Get pos
    var rect = this.getBoundingClientRect();

    //Show
    xpopout.createDino(this.x_data.extras._id, function () {
        console.log("failed!");
    }, xpopout.anchors.fixedAnchor(rect.left - 14, rect.top - 18));
}

map.setBackground = function(color) {
    document.getElementById('map_part').style.backgroundColor = color;
}

map.restoreDefaultBackgroundColor = function() {
    map.setBackground("#1c1d21");
}

map.createHoverElement = function(iconImg, title, subtitle) {
    //Create element
    var e = main.createDom("div", "mini_modal mini_modal_anim");

    //Add icon
    var icon = main.createDom("img", "mini_modal_icon map_icon_base map_icon_dino", e);
    icon.style.backgroundImage = "url("+iconImg+")";

    //Create content
    var ce = main.createDom("div", "mini_modal_content", e);
    main.createDom("div", "mini_modal_title", ce).innerText = title;
    main.createDom("div", "mini_modal_sub", ce).innerText = subtitle;

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

map.remoteUpdateDino = function(e) {
    //Get marker
    var marker = map.getMarkerByName("dinos", e.id);

    //Add a marker if it isn't already added. Else, we can update the marker
    if(marker != null) {
        //Move marker
        marker.setLatLng(map.convertFromGamePosToMapPos(e.x, e.y));
    }
}

//Called when dino prefs are updated
map.remoteUpdateDinoPrefs = function(data) {
    //We'll update dino color
    //Get marker
    var marker = map.getMarkerByName("dinos", data.dino_id);

    //Add a marker if it isn't already added. Else, we can update the marker
    var tag = marker._icon.getElementsByClassName("map_icon_tag")[0];
    if(marker != null && data.prefs.color_tag == null) {
        tag.style.display = "none";
    } else if(marker != null && data.prefs.color_tag != null) {
        tag.style.display = "block";
        tag.style.backgroundColor = data.prefs.color_tag;
    }
}

map.getThumbnail = function(callback, centerX, centerY, size, realWidth, realHeight, iconSize, safe, zoomLevel) {
    //Grab external refs that might change during this
    var structureData = map.dtiles.data;
    var mapIcons = ark.map_icons;
    var mapData = ark.session.mapData;

    //If safe, load these
    if(safe) {
        //Gross, refactor please
        structureData = JSON.parse(JSON.stringify(structureData));
        mapIcons = JSON.parse(JSON.stringify(mapIcons));
        mapData = JSON.parse(JSON.stringify(mapData));
    }

    //Run
    map.dtiles.subscribeToFinished(function() {
        //This function only supports square images. We can emulate any size, though
        var width = Math.max(realWidth, realHeight);
        var height = width;

        //Make sure zoom level is within range. -1 sets it to auto
        if(zoomLevel == -1 || zoomLevel == null) {
            zoomLevel = mapData.maps[0].maximumZoom;
        }
        zoomLevel = Math.min(mapData.maps[0].maximumZoom, zoomLevel);

        //Get the game positions
        var game_min_x = centerX - (size / 2);
        var game_max_x = centerX + (size / 2);
        var game_min_y = centerY - (size / 2);
        var game_max_y = centerY + (size / 2);

        //Get bounds of those
        var exactMapTileMaxX = map._helperConvertGamePosToTileCoords(game_max_x, mapData, zoomLevel);
        var exactMapTileMaxY = map._helperConvertGamePosToTileCoords(game_max_y, mapData, zoomLevel);
        var exactMapTileMinX = map._helperConvertGamePosToTileCoords(game_min_x, mapData, zoomLevel);
        var exactMapTileMinY = map._helperConvertGamePosToTileCoords(game_min_y, mapData, zoomLevel);

        var mapTileMaxX = Math.ceil(exactMapTileMaxX);
        var mapTileMaxY = Math.ceil(exactMapTileMaxY);
        var mapTileMinX = Math.floor(exactMapTileMinX);
        var mapTileMinY = Math.floor(exactMapTileMinY);

        //Get offset and size
        var offsetX = mapTileMinX;
        var offsetY = mapTileMinY;
        var sizeX = mapTileMaxX - mapTileMinX;
        var sizeY = mapTileMaxY - mapTileMinY;

        //Define after load funciton
        var afterLoad = function(tileImgs) {
            //Create canvas
            var c = document.createElement("canvas");
            c.width = realWidth;
            c.height = realHeight;
            var ctx = c.getContext('2d');

            //Calc
            var tileSizeX = width / (exactMapTileMaxX - exactMapTileMinX);
            var tileSizeY = height / (exactMapTileMaxY - exactMapTileMinY);
            var exactOffsetX = exactMapTileMinX;
            var exactOffsetY = exactMapTileMinY;
            var cropOffsetX = (realWidth - width) / 2;
            var cropOffsetY = (realHeight - height) / 2;
            var innerIconSize = iconSize - 10;

            //Copy tiles
            for(var x = 0; x<sizeX; x+=1) {
                for(var y = 0; y<sizeY; y+=1) {
                    var i = tileImgs["TILE@"+x.toString()+"@"+y.toString()];
                    var posX = ((x)*tileSizeX) - ((exactOffsetX - offsetX - 0)*tileSizeX) + cropOffsetX;
                    var posY = ((y)*tileSizeY) - ((exactOffsetY - offsetY - 0)*tileSizeY) + cropOffsetY;
                    if(i.naturalWidth > 0) {
                        ctx.drawImage(i, posX, posY, tileSizeX, tileSizeY);
                    }
                }
            }

            //Add structures
            map.dtiles.writeToCanvas(ctx, structureData, game_min_x, game_min_y, game_max_x, game_max_y, {
                "x":width,
                "y":height
            }, game_max_x - game_min_x, cropOffsetX, cropOffsetY);

            //Add map icons
            for(var i = 0; i<mapIcons.icons.length; i+=1) {
                var ic = mapIcons.icons[i];

                //THIS FEATURE IS DISABLED TEMPORARILY BECAUSE THERE WERE SOME MISPLACEMENT PROBLEMS ------------------------------------------------------------------------
                continue;

                //Check pos
                if(ic.location.x >= game_max_x && ic.location.x <= game_min_x) {continue;}
                if(ic.location.y >= game_max_y && ic.location.y <= game_min_y) {continue;}

                //Get pos
                var posX = ((ic.location.x-game_min_x) / (game_max_x - game_min_x)) * width;
                var posY = ((ic.location.y-game_min_y) / (game_max_y - game_min_y)) * height;
                
                //Draw circle
                ctx.beginPath();
                ctx.arc(posX, posY, iconSize/2, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black';
                ctx.stroke();

                //Draw image inside of it
                var img = tileImgs["ICON@"+ic.img];
                if(img.naturalWidth > 0) {
                    ctx.drawImage(img, posX - (innerIconSize/2), posY - (innerIconSize/2), innerIconSize, innerIconSize);
                }
            }

            //Return canvas
            callback(c);
        }

        //Find all map icons in range
        var mapIconsToLoad = [];
        for(var i = 0; i<mapIcons.icons.length; i+=1) {
            var ic = mapIcons.icons[i];

            //THIS FEATURE IS DISABLED TEMPORARILY BECAUSE THERE WERE SOME MISPLACEMENT PROBLEMS ------------------------------------------------------------------------
            continue;

            //Check pos
            if(ic.location.x >= game_max_x && ic.location.x <= game_min_x) {continue;}
            if(ic.location.y >= game_max_y && ic.location.y <= game_min_y) {continue;}

            //Add to load list
            if(!mapIconsToLoad.includes(ic.img)) {
                mapIconsToLoad.push(ic.img);
            }
        }

        //Load all images
        var tileImgs = {};
        var targetLoadCount = mapIconsToLoad.length+(sizeX*sizeY);
        var currentLoadCount = 0;
        for(var x = 0; x<sizeX; x+=1) {
            for(var y = 0; y<sizeY; y+=1) {
                var i = new Image();
                i.addEventListener('load', function() {
                    currentLoadCount+=1;
                    if(currentLoadCount == targetLoadCount) {
                        afterLoad(tileImgs);
                    }
                });
                i.addEventListener('error', function() {
                    currentLoadCount+=1;
                    if(currentLoadCount == targetLoadCount) {
                        afterLoad(tileImgs);
                    }
                });
                i.src = map.game_map_data.url.replace("{z}", zoomLevel).replace("{x}", offsetX+x).replace("{y}", offsetY+y);
                tileImgs["TILE@"+x.toString()+"@"+y.toString()] = i;
            }
        }
        for(var j = 0; j<mapIconsToLoad.length; j+=1) {
            var i = new Image();
            i.addEventListener('load', function() {
                currentLoadCount+=1;
                if(currentLoadCount == targetLoadCount) {
                    afterLoad(tileImgs);
                }
            });
            i.addEventListener('error', function() {
                currentLoadCount+=1;
                if(currentLoadCount == targetLoadCount) {
                    afterLoad(tileImgs);
                }
            });
            i.src = mapIconsToLoad[j];
            tileImgs["ICON@"+mapIconsToLoad[j]] = i;
        }
    });
}

map._helperConvertGamePosToTileCoords = function(pos, mapData, zoomLevel) {
    var calcOffset = mapData.captureSize/2;
    var units_per_tile = mapData.captureSize / Math.pow(2, zoomLevel);
    return (pos + calcOffset) / units_per_tile;
}

map.getThumbnailIntoContainer = function(container, callback, centerX, centerY, size, iconSize, safe, zoomLevel, width /* optional */, height /* optional */) {
    //Add classes to container
    container.classList.add("thumbnail_loader_container");

    //Autodetect if needed
    if(width == null) {
        width = container.clientWidth;
    }
    if(height == null) {
        height = container.clientHeight;
    }

    //Start init
    map.getThumbnail(function(c) {
        c.classList.add("thumbnail_loader_view");
        container.appendChild(c);
        callback(c);
    }, centerX, centerY, size, width, height, iconSize, safe, zoomLevel);
}

map.onLiveUpdate = function (d) {
    for (var i = 0; i < d.updates.length; i += 1) {
        var u = d.updates[i];

        //Get the pin
        var PIN_NAME_MAP = {
            1: "dinos",
            0: "players"
        };
        if (PIN_NAME_MAP[u.type] == null) {
            continue; //This is an unsupported type
        }
        var pin = map.getMarkerByName(PIN_NAME_MAP[u.type], u.id);
        if (pin == null) {
            continue; //Pin not found!
        }

        //Update the pin location
        if (u.x != null && u.y != null && u.z != null) {
            /*pin._icon.classList.add("map_icon_animating");
            window.requestAnimationFrame(function () {
                pin.setLatLng(map.convertFromGamePosToMapPos(u.x, u.y));
            });
            window.setTimeout(function (pp) {
                pp._icon.classList.remove("map_icon_animating");
            }, 600, pin);*/
            // ^ buggy at best

            pin.setLatLng(map.convertFromGamePosToMapPos(u.x, u.y));
        }

        //Show hitmaker
        if (u.health != null && pin.x_last_health != null) {
            //Get this in screen pos
            var px = map.map.latLngToLayerPoint(pin.getLatLng(), map.map.getZoom());

            //Create the string to display
            var offset = u.health - pin.x_last_health;
            var text = Math.abs(Math.round(offset));
            var textColor = "#e0e019";
            if (offset > 0) {
                text = "+" + text;
                textColor = "#44e019";
            } else if (offset < 0) {
                text = "-" + text;
                textColor = "#e8482c";
            }

            //Create the dialog to attach
            var dialog = main.createDom("div", "map_damage_indicator", document.getElementById('map_part'));
            dialog.innerText = text;
            dialog.style.color = textColor;
            dialog.style.left = (px.x - 400 - 22).toString() + "px";
            dialog.style.top = (px.y - 40 - 50).toString() + "px";
            window.setTimeout(function (dialogT) {
                dialogT.remove();
            }, 8000, dialog);
        }

        //Update local pin health
        if (u.health != null) {
            pin.x_last_health = u.health;
        }

        //Update pin rotation
        if (u.rot != null) {
            pin.x_rotor.style.transform = "rotate(" + u.rot + "deg)";
        }
    }
}