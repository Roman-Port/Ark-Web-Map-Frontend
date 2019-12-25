map.dtiles = {};
map.dtiles.ready = false;
map.dtiles.ready_queue = [];
map.dtiles.layer = null;
map.dtiles.assets = {};
map.dtiles.loaded_assets = 0;
map.dtiles.loader = document.getElementById('map_structure_loader');
map.dtiles.loader_bar = document.getElementById('map_structure_loader_bar');

map.dtiles.metadata = null;

map.dtiles.init = function() {
    //If we're ready, load server instead
    if(map.dtiles.ready) {
        map.dtiles.switchServer();
        return;
    }

    //Load
    map.dtiles.loadAssets(function() {
        //Set to ready
        map.dtiles.ready = true;

        //Load server
        map.dtiles.switchServer();
    });
}

map.dtiles.subscribeToFinished = function(callback) {
    if(map.dtiles.ready == true) {
        callback();
    } else {
        map.dtiles.ready_queue.push(callback);
    }
}

map.dtiles.switchServer = function() {
    //If we aren't ready yet, cancel
    if(!map.dtiles.ready) {
        return;
    }

    //Activate server
    main.serverRequest(ark.session.endpoint_tribes_structures, {}, function(d) {
        map.dtiles.data = d;
        map.dtiles.addLayer();
    });
}

map.dtiles.loadAssets = function(callback) {
    //Load metadata
    console.log("[Structure Tiles] Loading asset metadata...");
    main.serverRequest(ark.session.endpoint_tribes_structures_metadata, {}, function(d) {
        //Set
        map.dtiles.metadata = d.metadata;

        //Load assets
        console.log("[Structure Tiles] Loading asset store...");
        for(var i = 0; i<map.dtiles.metadata.length; i+=1) {
            var me = map.dtiles.metadata[i];
            map.dtiles.assets[me.img] = new Image();
            map.dtiles.assets[me.img].x_data = me;
            map.dtiles.assets[me.img].addEventListener("load", function() {
                //Set to loaded
                map.dtiles.loaded_assets++;
                var m = this.x_data;

                //Log
                console.log("[Dynamic Tiles] Asset store tile '"+m.img+"' loaded; "+map.dtiles.loaded_assets+"/"+map.dtiles.metadata.length+" - "+((map.dtiles.loaded_assets / map.dtiles.metadata.length) * 100)+"%");

                //Update loader
                map.dtiles.updateLoader((map.dtiles.loaded_assets+1) / map.dtiles.metadata.length);

                //If complete, call callback
                if(map.dtiles.loaded_assets == map.dtiles.metadata.length) {
                    console.log("[Dynamic Tiles] Asset store loading finished!");
                    for(var i = 0; i<map.dtiles.ready_queue.length; i+=1) {
                        map.dtiles.ready_queue[i]();
                    }
                    map.dtiles.ready_queue = [];
                    callback();
                }
            });
            map.dtiles.assets[me.img].src = d.image_url.replace("{image}", me.img);
        }
    });
}

map.dtiles.addLayer = function() {
    //Create the map layer
    var mapSettings = {
        updateWhenZooming:false,
        maxZoom:12,
        id: 'structures',
        opacity: 1,
        zIndex: 10,
        bounds:map.getBounds()
    };
    map.dtiles.layer = new map.dtiles.mapLayer("/", mapSettings).addTo(map.map);
}

map.dtiles.updateLoader = function(amount) {
    if(amount >= 1) {
        map.dtiles.loader.style.display = "none";
    } else {
        map.dtiles.loader.style.display = "block";
    }
    map.dtiles.loader_bar.style.width = (amount * 100).toString()+"%";
}

map.dtiles.mapLayer = L.GridLayer.extend({
    createTile: function(coords){
        // create a element for drawing
        var et = main.createDom("div", "leaflet-tile map_structure_tile_image");
        var e = main.createDom("canvas", "", et);

        // setup tile width and height according to the options
        var tsize = this.getTileSize();
        e.width = tsize.x;
        e.height = tsize.y;
        et.width = tsize.x;
        et.height = tsize.y;

        //Get context
        var d = map.dtiles.data;
        var context = e.getContext('2d');

        //Calculate the range of data
        var calcOffset = ark.session.mapData.captureSize/2;
        var units_per_tile = ark.session.mapData.captureSize / Math.pow(2, coords.z);
        var game_min_x = (coords.x * units_per_tile) - calcOffset;
        var game_min_y = (coords.y * units_per_tile) - calcOffset;
        var game_max_x = ((coords.x+1) * units_per_tile) - calcOffset;
        var game_max_y = ((coords.y+1) * units_per_tile) - calcOffset;

        //Add all of the elements to this
        var found = map.dtiles.writeToCanvas(context, d, game_min_x, game_min_y, game_max_x, game_max_y, tsize, units_per_tile, 0, 0);

        //Add the highlightable parts
        et.x_hl = found;
        et.x_has_hl = false;
        et.addEventListener("mouseover", function () {
            if (et.x_has_hl) {
                return;
            }
            et.x_has_hl = true;
            map.dtiles.addClickRegions(this.x_hl, this);
        });
        et.addEventListener("mouseout", function () {
            var e = event.toElement || event.relatedTarget;
            if (e.parentNode == this || e == this) {
                return;
            }
            if (!et.x_has_hl) {
                return;
            }
            et.x_has_hl = false;
            var c = et.getElementsByClassName("map_structure_mouseover_target");
            while (c.length > 0) {
                c[0].remove();
            }
        });

        // return the tile so it can be rendered on screen
        return et;
    }
});

map.dtiles.addClickRegions = function (found, parent) {
    for (var i = 0; i < found.length; i += 1) {
        //Draw only items with an ID, as they have an inventory
        if (found[i].id == null) {
            continue;
        }

        //Draw
        var e = main.createDom("div", "map_structure_mouseover_target", parent);
        var d = found[i];
        e.style.left = d.x + "px";
        e.style.top = d.y + "px";
        e.style.transform = "rotate(" + d.r + "deg)";
        e.style.height = d.s + "px";
        e.style.width = d.s + "px";
        e.x_id = d.id;

        //The following are just to detect clicks and get rid of accidental "clicks" triggered by the user scrolling
        e.addEventListener("mousedown", function () {
            this.x_fcc = map.map.getCenter();
        });
        e.addEventListener("mouseup", function () {
            if (this.x_fcc == null) {
                return;
            }
            var d = map.map.distance(this.x_fcc, map.map.getCenter());
            if (d < 0.1) {
                map.dtiles.onClickStructure(this);
            }
        });
    }
};

map.dtiles.onClickStructure = function (t) {
    var rect = t.getBoundingClientRect();
    xpopout.createStructure(t.x_id.toString(), function () {

    }, xpopout.anchors.fixedAnchor(rect.left, rect.top));
}

map.dtiles.writeToCanvas = function (context, d, game_min_x, game_min_y, game_max_x, game_max_y, tsize, units_per_tile, globalOffsetX, globalOffsetY) {
    var found = [];
    for(var i = 0; i<d.s.length; i+=1) {
        var s = d.s[i];

        //Check if this is within range
        if(s.x > game_max_x+(s.s * 1.5) || s.x < game_min_x-(s.s * 1.5)) {
            continue;
        }
        if(s.y > game_max_y+(s.s * 1.5) || s.y < game_min_y-(s.s * 1.5)) {
            continue;
        }

        //Do size calculations
        var size = (s.s / units_per_tile) * tsize.x;

        //Skip if it is too small
        if(size < 5) {
            continue;
        }

        //Determine location
        var loc_tile_x = ((s.x - (s.s / 2) - game_min_x) / units_per_tile)*tsize.x;
        var loc_tile_y = ((s.y - (s.s / 2) - game_min_y) / units_per_tile)*tsize.y;
        
        //Draw this
        map.dtiles.drawRotatedImage(context, map.dtiles.assets[d.i[s.i]], loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, s.r, size, size);

        //Add to list of found tiles
        found.push({
            "x": loc_tile_x + globalOffsetX,
            "y": loc_tile_y + globalOffsetY,
            "r": s.r,
            "s": size,
            "id": s.id
        });
    }
    return found;
}

map.dtiles.drawRotatedImage = function(context, image, x, y, angle, width, height) { 
    var TO_RADIANS = Math.PI/180; 
	context.save(); 
	context.translate(x + (width / 2), y + (height / 2)); //janky fix because our position is from the upper-left corner
	context.rotate(angle * TO_RADIANS);
	context.drawImage(image, -(width/2), -(height/2), width, height);
	context.restore(); 
}