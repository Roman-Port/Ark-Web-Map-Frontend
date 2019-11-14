map.dtiles = {};

map.dtiles.sock = null;
map.dtiles.is_ready = false;
map.dtiles.layers = {};
map.dtiles.index = 0; //Add up by one for each tile created
map.dtiles.queued_layers = []; //Layer IDs to add when we finish loading

map.dtiles.init = function(server_id) {
    //Create URL
    var url = "wss://dynamic-tiles.deltamap.net/v1?access_token="+encodeURIComponent(main.getAccessToken());

    //Create connection
    map.dtiles.sock = new WebSocket(url);

    //Add events
    map.dtiles.sock.addEventListener('open', function (event) {
        //Send our server ID so that we can get ready
        map.dtiles.sendMsg(0, {
            "server_id":server_id
        });
    });
    map.dtiles.sock.addEventListener('message', map.dtiles.onMsg);
    //gateway.sock.addEventListener('close', errorCallback);
}

map.dtiles.onMsg = function(d) {
    //Called when we get incoming messages. Decode
    var data = JSON.parse(d.data);

    //Now, switch from our opcode
    map.dtiles._msgEvents[data.opcode](data.payload);
}

map.dtiles.sendMsg = function(opcode, payload) {
    //Create a message to send
    var msg = JSON.stringify({
        "opcode":opcode,
        "payload":payload
    });

    //Send
    map.dtiles.sock.send(msg);
}

map.dtiles.addLayer = function(layer_id) {
    //If we're not ready yet, queue this
    if(!map.dtiles.is_ready) {
        map.dtiles.queued_layers.push(layer_id);
        return;
    }

    //Create the map layer
    map.dtiles.layers[layer_id] = new map.dtiles.mapLayer("/", {
        maxNativeZoom: 10,
        maxZoom:12,
        id: 'dtile_'+layer_id,
        opacity: 1,
        zIndex: 2,
        bounds:map.getBounds()
    });

    //Add some more attribs
    map.dtiles.layers[layer_id].xdel_tiles = {};
    map.dtiles.layers[layer_id].xdel_type = layer_id;

    //Add events
    map.dtiles.layers[layer_id].on("tileloadstart", map.dtiles.onTileLoadBegin);
    map.dtiles.layers[layer_id].on("tileunload", map.dtiles.onTileUnload);

    //Add to map
    map.dtiles.layers[layer_id].addTo(map.map);
}

map.dtiles.onTileLoadBegin = function(d) {
    
}

map.dtiles.onTileUnload = function(d) {
    //Remove from list
    delete d.target.xdel_tiles[d.tile.xdel_index];

    //Send subscription message on the gateway
    map.dtiles.sendMsg(3, {
        "t":d.target.xdel_type,
        "i":d.tile.xdel_index
    });
}

map.dtiles.mapLayer = L.GridLayer.extend({
    createTile: function(coords, done){
        // create a element for drawing
        var e = main.createDom("div", "leaflet-tile");
        e.x_imgindex = 0;
        e.x_done = done;
        e.x_done_timeout = window.setTimeout(2000, function() {
            e.x_done(null, e);
            e.x_done = null;
        });

        // setup tile width and height according to the options
        var size = this.getTileSize();
        e.width = size.x;
        e.height = size.y;

        //Set debug bg
        e.style.backgroundColor = coords.z.toString()+coords.z.toString()+"000033";

        //Create an ID for this tile
        var index = map.dtiles.index++;
        
        //Assign the ID on the element
        e.xdel_index = index;

        //Add this to the list
        this.xdel_tiles[index] = e;

        //Send subscription message on the gateway
        map.dtiles.sendMsg(2, {
            "x":coords.x,
            "y":coords.y,
            "z":coords.z,
            "t":this.xdel_type,
            "i":index
        });

        // return the tile so it can be rendered on screen
        return e;
    }
});

map.dtiles.setTileImg = function(layerId, index, url) {
    //Get tile
    var e = map.dtiles.layers[layerId].xdel_tiles[index];

    //Ignore if this tile is no longer active
    if(e == null) {
        return;
    }

    //Create an image to attach
    var img = main.createDom("img", "map_dtile_tile_img", e);
    img.width = e.width;
    img.height = e.height;
    img.style.opacity = 0;
    img.addEventListener("load", function() {
        //Check if we've been canceled
        if(this.parentNode.x_imgindex != this.x_imgindex) {
            return;
        }

        //Set to shown
        img.style.opacity = 1;

        //If we haven't yet called done, do that
        if(this.parentNode.x_done != null) {
            this.parentNode.x_done(null, e);
            this.parentNode.x_done = null;
            clearTimeout(this.parentNode.x_done_timeout);
        }
    });
    e.x_imgindex++;
    img.style.zIndex = e.x_imgindex;
    img.x_imgindex = e.x_imgindex;
    img.src = url;
}

/* Functions used by the inbound messages */

map.dtiles._msgOnReady = function(d) {
    //We're ready to go. Add all of our maps that we had queued now
    map.dtiles.is_ready = true;
    for(var i = 0; i<map.dtiles.queued_layers.length; i+=1) {
        map.dtiles.addLayer(map.dtiles.queued_layers[i]);
    }
    map.dtiles.queued_layers = [];
}

map.dtiles._msgOnTileLoad = function(d) {
    map.dtiles.setTileImg(d.t, d.i, d.url);
}

map.dtiles._msgEvents = {
    1: map.dtiles._msgOnReady,
    4: map.dtiles._msgOnTileLoad
};