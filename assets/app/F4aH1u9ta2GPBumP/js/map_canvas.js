map.canvas = {};
map.canvas.isConnecting = false;
map.canvas.currentCanvasData = null;
map.canvas.connected = false;
map.canvas.sock = null;
map.canvas.buffer = new Uint8Array(512);
map.canvas.buffer_view = new DataView(map.canvas.buffer.buffer);
map.canvas.active = false; //Is the map currently drawing?
map.canvas.startingPoint = null; //Set to the position, in game units, of the last point
map.canvas.lines = []; //Internal map
map.canvas.canvas = document.getElementById('map_draw_part');
map.canvas.context = map.canvas.canvas.getContext("2d");
map.canvas.lastSentPosLocal = null; //The last pos we wrote and sent
map.canvas.lastPosLocal = null; //The last pos we wrote
map.canvas.users = {}; //User, mapped by their sender ID
map.canvas.downloadComplete = false; //When true, we know that all previous data has been downloaded.
map.canvas.currentBrushSettings = {
    "brushSize":2,
    "brushColor":4,
    "brushType":0
};
map.canvas.got = 0; //Got packets
map.canvas.preview_point = document.getElementsByClassName('v1_canvas_picker_size_dot')[0];
map.canvas.user_maps = null;
map.canvas.thumbnailMode = false;
map.canvas.nameHolder = document.getElementsByClassName('v1_canvas_picker_name')[0];
map.canvas.thumbnailDirty = false; //Set to true when edits are made
map.canvas.canvasSwitchBusy = false; //If true, we don't allow the user to switch canvases and instead defer them to canvasSwitchNext
map.canvas.canvasSwitchNext = null;
map.canvas.creatingCanvas = false; //Set to true when we create a canvas. Sets it to the current canvas when we load it.

map.canvas.MESSAGE_SIZE = 12;
map.canvas.MIN_POS_DELTA = 1; //Minimum distance between ports for them to be sent
map.canvas.BUFFER_CAPACITY = 41; //When the system will flush to the sock
map.canvas.COLORS = [
    "#F92A2A",
    "#FCA71A",
    "#F7F123",
    "#34F820",
    "#3B8AF5",
    "#932DF9",
    "#000000",

    "#FD8F8F",
    "#FACC7F",
    "#F3F08A",
    "#94F38A",
    "#8FBCF9",
    "#C48FF9",
    "#FFFFFF",
    "RESERVED",
    "RESERVED"
]; //Color indexes to use. The last two of these should not appear in color pickers
map.canvas.SIZES = [
    4,
    6,
    10,
    20
]; //Brush sizes to use
map.canvas.BRUSHES = [
    function() {

    },
    function() {
        
    },
    function() {

    },
    function() {

    }
] //Brush map to use

/*

Our map points follow the following binary format, consisting of 14 bytes per line: 

[Int8]  Sender ID (a user ID, mapped to a table)
[Int8]  Brush ID (predefined brush properties)
[Int24] Starting X
[Int24] Starting Y
[Int24] Ending X
[Int24] Ending Y

In addition, our buffers hold the number of lines in an Int8 at the beginning of the array.
We can hold up to 73 lines in our 1024 byte buffer

*/

//Called each time the server is switched
map.canvas.init = function() {
    //Set active brush settings
    map.canvas.currentBrushSettings.brushColor = ark.getServerData().user_prefs.canvas_brush_color & 14;

    //Fill color picker
    var cp = document.getElementsByClassName('v1_canvas_colorpicker')[0];
    cp.innerHTML = "";
    for(var i = 0; i<7; i+=1) {
        var o1 = main.createDom("div", "v1_canvas_colorpicker_item" + (map.canvas.currentBrushSettings.brushColor == i ? " v1_canvas_colorpicker_active" : ""), cp)
        o1.style.backgroundColor = map.canvas.COLORS[i];
        o1.x_color_id = i;
        o1.addEventListener("click", map.canvas.onClickNewColor);
        var o2 = main.createDom("div", "v1_canvas_colorpicker_item" + (map.canvas.currentBrushSettings.brushColor == (i+7) ? " v1_canvas_colorpicker_active" : ""), cp)
        o2.style.backgroundColor = map.canvas.COLORS[i+7];
        o2.x_color_id = i+7;
        o2.addEventListener("click", map.canvas.onClickNewColor);
    }

    //Set preview dot
    map.canvas.preview_point.style.backgroundColor = map.canvas.COLORS[map.canvas.currentBrushSettings.brushColor];

    //Refresh user maps
    main.serverRequest(ark.session.endpoint_canvases, {}, function(d) {
        map.canvas.user_maps = d;
        map.canvas.refreshMapList();
        map.canvas.reconnect();

        //Set active canvas
        if(map.canvas.getCanvasDataForId(ark.getServerData().user_prefs.canvas_id) != null) {
            map.canvas.switchCanvas(map.canvas.getCanvasDataForId(ark.getServerData().user_prefs.canvas_id));
        } else {
            map.canvas.switchCanvas(null);
        }
    });
}

map.canvas.deinit = function() {
    //Unload
    map.canvas.switchCanvas(null);

    //Clear maps
    map.canvas.user_maps = null;
    document.getElementsByClassName('v1_canvas_content')[0].innerHTML = "";
}

//Switches the active canvas
map.canvas.switchCanvas = function(canvasData) {
    //Check if we're allowed to switch yet
    if(map.canvas.canvasSwitchBusy) {
        map.canvas.debug("switchCanvas", "Canvas switch busy; waiting until we're done switching.");
        map.canvas.canvasSwitchNext = canvasData;
        return;
    }
    map.canvas.canvasSwitchBusy = canvasData != null;

    //Render a thumbnail, if we have a last canvas
    if(map.canvas.currentCanvasData != null) {
        map.canvas.captureThumbnail();
    }

    //Clear everything
    map.canvas.lines = [];
    map.canvas.active = false;
    map.canvas.downloadComplete = canvasData == null;
    map.canvas.thumbnailDirty = false;

    //Redraw to clear junk
    map.canvas.redraw();

    //Set vars
    map.canvas.currentCanvasData = canvasData;

    //Send connect message, if loaded
    if(map.canvas.connected) {
        if(canvasData == null) {
            map.canvas.sendMsg(1, {

            });
        } else {
            map.canvas.sendMsg(0, {
                "canvas_id":canvasData.id
            });
        }
    }

    //Set in UI
    map.canvas.setActiveCanvasUI();

    //Save settings
    main.forceSubmitUserServerPrefs();
}

//Returns the current canvas ID
map.canvas.getCurrentID = function() {
    if(map.canvas.currentCanvasData == null) {
        return null;
    } else {
        return map.canvas.currentCanvasData.id;
    }
}

//Sends a message to the active socket
map.canvas.sendMsg = function(opcode, payload) {
    map.canvas.sock.send(JSON.stringify({
        "opcode":opcode,
        "payload":payload
    }));
}

//Sets the active canvas to the UI data
map.canvas.setActiveCanvasUI = function() {
    //Set active canvas in UI
    var canvasData = map.canvas.currentCanvasData;
    if(canvasData == null) {
        map.canvas.nameHolder.innerText = "Not Active";
        map.canvas.nameHolder.classList.add("v1_canvas_picker_name_none");
    } else {
        map.canvas.nameHolder.innerText = canvasData.name;
        map.canvas.nameHolder.classList.remove("v1_canvas_picker_name_none");
    }

    //Set the active canvas in the list
    var oldActive = document.getElementsByClassName('v1_canvas_selection_active');
    for(var i = 0; i<oldActive.length; i+=1) {
        oldActive[i].classList.remove("v1_canvas_selection_active");
    }
    if(canvasData != null) {
        canvasData.x_list_item.classList.add("v1_canvas_selection_active");
    }

    //Set button states
    oldActive = document.getElementsByClassName('v1_canvas_options_select');
    for(var i = 0; i<oldActive.length; i+=1) {
        if(canvasData == null) {
            oldActive[i].classList.add("v1_canvas_options_select_disabled");
        } else {
            oldActive[i].classList.remove("v1_canvas_options_select_disabled");
        }
    }
}

//Called when a new color is picked
map.canvas.onClickNewColor = function() {
    //Clear current active colors
    var cp = document.getElementsByClassName('v1_canvas_colorpicker')[0];
    for(var i = 0; i<cp.childElementCount; i+=1) {
        cp.children[i].classList.remove("v1_canvas_colorpicker_active");
    }

    //Set the active one
    map.canvas.currentBrushSettings.brushColor = this.x_color_id;
    this.classList.add("v1_canvas_colorpicker_active");

    //Set preview dot
    map.canvas.preview_point.style.backgroundColor = map.canvas.COLORS[this.x_color_id];

    //Save settings
    main.forceSubmitUserServerPrefs();
}

//Refrehses the map list
map.canvas.refreshMapList = function() {
    var list = document.getElementsByClassName('v1_canvas_content')[0];
    list.innerHTML = "";

    //Add real maps
    var amap = ark.session.mapData.maps[0].url.replace("{z}", "0").replace("{y}", "0").replace("{x}", "0");
    for(var i = 0; i<map.canvas.user_maps.canvases.length; i+=1) {
        var d = map.canvas.user_maps.canvases[i];
        var e = main.createDom("div", "v1_canvas_selection", list);
        if(d.thumbnail == null) {
            e.style.backgroundImage = "url("+amap+")";
        } else {
            e.style.backgroundImage = "url("+d.thumbnail+"), url("+amap+")";
        }
        var input = main.createDom("input", "v1_canvas_selection_name", e);
        input.type = "text";
        input.value = d.name;
        e.x_id = d.id;
        e.x_data = d;
        e.x_input = input;
        map.canvas.user_maps.canvases[i].x_list_item = e;
        e.addEventListener("click", map.canvas.onClickCanvasSwitcherItem);
        input.addEventListener("change", map.canvas.onRenameCanvas);
        input.addEventListener("click", function(evt) {
            evt.stopPropagation();
        });
    }

    //Set active
    map.canvas.setActiveCanvasUI();

    //Add fake "add" map
    var e = main.createDom("div", "v1_canvas_selection v1_canvas_selection_add", list);
    var input = main.createDom("input", "v1_canvas_selection_name", e);
    input.type = "text";
    input.placeholder = "Add Canvas";
    input.x_processing = false;
    e.x_input = input;
    e.addEventListener("click", function() {
        this.x_input.focus();
    });
    input.addEventListener("change", function() {
        if(this.value.length < 1) {
            return;
        }
        if(this.x_processing) {
            return;
        }
        this.x_processing = true;
        map.canvas.createCanvas(this.value);
    });
}

//Called when we click an item in the canvas list
map.canvas.onClickCanvasSwitcherItem = function() {
    //Make sure we're not already on this item
    if(map.canvas.currentCanvasData != null) {
        if(map.canvas.currentCanvasData.id == this.x_id) {
            //Deactivate current canvas
            map.canvas.switchCanvas(null);
            return;
        }
    }

    //Switch
    map.canvas.switchCanvas(this.x_data);
}

//Called when we rename a canvas
map.canvas.onRenameCanvas = function() {
    //Get camvas data
    var d = this.parentElement.x_data;

    //Create data to send
    var p = {
        "name":this.value,
        "color":d.color
    };

    //Send
    main.serverRequest(d.href, {
        "type":"POST",
        "body":JSON.stringify(p)
    }, function(){});
}

//Adds a canvas
map.canvas.createCanvas = function(name) {
    map.canvas.creatingCanvas = true;
    main.serverRequest(ark.session.endpoint_canvases, {
        "type":"POST",
        "body":JSON.stringify({
            "color":"#3DC3F2",
            "name":name
        })
    }, function(d) {});    
}

//Clears the active canvas
map.canvas.clearCanvas = function() {
    //Make sure we have an active canvas
    if(map.canvas.currentCanvasData != null) {
        map.canvas.sendMsg(2, {});
    }
}

//Deletes the active canvas
map.canvas.deleteCanvas = function() {
    //Make sure we have an active canvas
    if(map.canvas.currentCanvasData != null) {
        main.serverRequest(map.canvas.currentCanvasData.href, {
            "type":"DELETE"
        }, function(d) {}); 
    }
}

//Returns saved canvas data for an ID
map.canvas.getCanvasDataForId = function(canvasID) {
    for(var i = 0; i<map.canvas.user_maps.canvases.length; i+=1) {
        var d = map.canvas.user_maps.canvases[i];
        if(d.id == canvasID) {
            return d;
        }
    }
    return null;
}

//Called when we get an RPC message related to a canvas
map.canvas.onGatewayUpdate = function(d) {
    if(d.action == 0) {
        //Created a canvas
        map.canvas.user_maps.canvases.push(d.data);

        //Refresh list
        map.canvas.refreshMapList();

        //If the flag is set, trigger
        if(map.canvas.creatingCanvas) {
            map.canvas.switchCanvas(d.data);
            map.canvas.creatingCanvas = false;
        }
    } else if (d.action == 1) {
        //Modified a canvas
        var m = map.canvas.getCanvasDataForId(d.data.id);
        m.color = d.data.color;
        m.name = d.data.name;
        m.thumbnail = d.data.thumbnail;

        var amap = ark.session.mapData.maps[0].url.replace("{z}", "0").replace("{y}", "0").replace("{x}", "0");
        m.x_list_item.x_input.value = d.data.name;
        if(d.data.thumbnail == null) {
            m.x_list_item.style.backgroundImage = "url("+amap+")";
        } else {
            m.x_list_item.style.backgroundImage = "url("+d.data.thumbnail+"), url("+amap+")";
        }
    } else if (d.action == 3) {
        //Deleted a canvas
        for(var i = 0; i<map.canvas.user_maps.canvases.length; i+=1) {
            var m = map.canvas.user_maps.canvases[i];
            if(m.id == d.data.id) {
                map.canvas.user_maps.canvases.splice(i, 1);
                break;
            }
        }

        //Run flash
        map.canvas.flashDecay(d.user.name, " deleted the canvas!");

        //Set current canvas to null
        map.canvas.active = false;
        map.canvas.thumbnailDirty = false;
        map.canvas.switchCanvas(null);

        //Refresh list
        map.canvas.refreshMapList();
    }
}

//Hooks events into the map. Only run once per map
map.canvas.hook = function(m) {
    m.on("mousedown", map.canvas.onDrawBtnDown);
    m.on("mouseup", map.canvas.onDrawBtnUp);
    m.on("mousemove", map.canvas.onMouseMove);
    m.on("move", map.canvas.onMapTransformed);
    m.on("zoom", map.canvas.onMapTransformed);
    m.on("resize", map.canvas.resize);
    m.on("mouseout", map.canvas.onMouseExit);
}

//Reconnects to the canvas
map.canvas.reconnect = function(force) {
    //Stop if we're already started
    if(map.canvas.isConnecting && force !== true) {
        return;
    }
    map.canvas.isConnecting = true;

    //Create URL to connect to 
    var url = map.canvas.user_maps.ws_url.replace("{token}", main.getAccessToken());

    //Create connection
    map.canvas.sock = new WebSocket(url);

    //Add events
    map.canvas.sock.addEventListener("open", map.canvas.onConnectionCreated);
    map.canvas.sock.addEventListener("message", map.canvas.onMsg);
    map.canvas.sock.addEventListener("close", map.canvas.onConnectionClosed);

    //Force resize of canvas
    map.canvas.resize();
}

//Called every time we reconnect
map.canvas.onConnectionCreated = function() {
    //Log
    map.canvas.debug("onConnectionCreated", "Connected to socket.");

    //Set to ready
    map.canvas.connected = true;

    //Send current canvas ID
    if(map.canvas.currentCanvasData != null) {
        if(map.canvas.connected) {
            if(map.canvas.currentCanvasData == null) {
                //Do nothing, no canvas is loaded
            } else {
                map.canvas.sendMsg(0, {
                    "canvas_id":map.canvas.currentCanvasData.id
                });
            }
        }
    }
}

//Called every time we disconnect
map.canvas.onConnectionClosed = function() {
    //Log
    map.canvas.debug("onConnectionClosed", "Disconnected from socket.");

    //Set to not ready
    map.canvas.connected = false;

    //Reconnect
    map.canvas.reconnect(true);
}

//Flushes messages onto the websocket
map.canvas.flush = function() {
    //Check if we have lines to flush
    if(map.canvas.buffer[0] == 0) {
        map.canvas.debug("flush", "Dropping attempt to flush because there were no lines to flush!");
        return;
    }

    //Log
    map.canvas.debug("flush", "Flushing "+map.canvas.buffer[0]+" lines.");

    //Send
    map.canvas.sock.send(map.canvas.buffer);
    map.canvas.thumbnailDirty = true;

    //Reset index
    map.canvas.buffer[0] = 0;
}

//Writes debug messages
map.canvas.debug = function(topic, msg) {
    console.log("[Map-Canvas => "+topic+"] "+msg);
}

//Used to map game coords to screen pos
map.canvas.latLngToContainerPoint = function(latlng) {
    if(!map.canvas.thumbnailMode) {
        return map.map.latLngToContainerPoint(latlng);
    } else {
        return {
            "x":latlng.lng*2,
            "y":-latlng.lat*2
        }
    }
}

//Captures a map thumbnail
map.canvas.captureThumbnail = function() {
    //Make sure that data is downloaded first
    if(!map.canvas.downloadComplete) {
        map.canvas.debug("captureThumbnail", "Aborting thumbnail upload because download isn't complete yet!");
        return;
    }
    if(!map.canvas.thumbnailDirty) {
        map.canvas.debug("captureThumbnail", "Aborting thumbnail upload because the current thumbnail isn't dirty!");
        return;
    }

    //Create a new canvas
    var c = main.createDom("canvas", "");
    c.width = 512;
    c.height = 512;
    map.canvas.canvas = c;
    map.canvas.context = map.canvas.canvas.getContext("2d");

    //Now, enable thumbnail mode and redraw
    map.canvas.thumbnailMode = true;
    map.canvas.redraw();

    //Reset canvas
    map.canvas.findCanvas();
    map.canvas.thumbnailMode = false;

    //Get current data in case it changes
    var ca = map.canvas.currentCanvasData.href;

    //Capture an image of the canvas
    c.toBlob(function(d) {
        //Clear canvas
        c.remove();

        //Set flag
        map.canvas.thumbnailDirty = false;

        //Submit this to the server
        main.uploadContent("Bmazv5PRjg6loBWn", d, function(r) {
            //Now, submit this to the thumbnail endpoint
            main.serverRequest(ca, {
                "type":"PUT",
                "body":JSON.stringify({
                    "token":r.token
                })
            }, function() {
                map.canvas.debug("captureThumbnail", "Updated thumbnail for server "+ca+" with URL "+r.url+" and token "+r.token);
            });
        });
    });
}

//Resets the canvas refs
map.canvas.findCanvas = function() {
    map.canvas.canvas = document.getElementById('map_draw_part');
    map.canvas.context = map.canvas.canvas.getContext("2d");    
}

//Returns the index to use in the buffer based upon the current point index at index 0
map.canvas.getBufferIndex = function(offset) {
    var index = map.canvas.buffer[0];
    return 1 + (index * map.canvas.MESSAGE_SIZE) + offset;
}

//Clamps a position to stay within map (and network writable) bounds
map.canvas.clampLatLng = function(latlng) {
    //Lat should be within 0 and -256
    latlng.lat = Math.min(latlng.lat, 0);
    latlng.lat = Math.max(latlng.lat, -256);

    //Lng should be between 0 and 256
    latlng.lng = Math.min(latlng.lng, 256);
    latlng.lng = Math.max(latlng.lng, 0);

    return latlng;
}

//Converts a latlng to game pos
map.canvas.latlngToLinePos = function(latlng) {
    //BUG: Will not work with map offsets! FIx!!!!
    var d = map.convertFromMapPosToNormalized({
        "x": latlng.lng,
        "y": latlng.lat
    });
	d[0]-=0.5;
	d[1]-=0.5;
	d[0] *= 32768;
    d[1] *= 32768;
    return d;
}

//Converts a latlng to game pos
map.canvas.linePosToLatlng = function(x, y) {
    //BUG: Will not work with map offsets! FIx!!!!
    x /= 32768;
    y /= 32768;
	x += 0.5;
	y += 0.5;
    var e = L.latLng(-y*256, x*256);
    return e;
}

//Writes a latlng pos to the array
map.canvas.writeMapPosition = function(offset, latlng) {
    //Convert to position
	var d = map.canvas.latlngToLinePos(latlng);
    
    //Now, write
    map.canvas.buffer_view.setInt16(map.canvas.getBufferIndex(offset + 0), d[1]);
    map.canvas.buffer_view.setInt16(map.canvas.getBufferIndex(offset + 2), d[0]);
}

//Reads a map position from an array
map.canvas.readMapPosition = function(bufferView, pos) {
    var p1 = bufferView.getInt16(pos);
    var p2 = bufferView.getInt16(pos + 2);
    return map.canvas.linePosToLatlng(p1, p2);
}

//Called when we first draw a point
map.canvas.beginPoint = function(latlng) {
    //Log
    map.canvas.debug("beginPoint", "Started point.");

    //Clamp
    latlng = map.canvas.clampLatLng(latlng);

    //Write our map point
    map.canvas.startingPoint = map.canvas.latlngToLinePos(latlng);
    map.canvas.lastPosLocal = latlng;
    map.canvas.lastSentPosLocal = latlng;

    //Write our brush settings. Our sender ID can be blank here because the server knows who is sending this message.
    map.canvas.buffer[map.canvas.getBufferIndex(1)] = map.canvas.getBrushSettingsIndex();

    //Write our position
    map.canvas.writeMapPosition(2, latlng);
}

//Called when we end a point and sends it on the network
map.canvas.endPoint = function(latlng) {
    //Log
    map.canvas.debug("endPoint", "Ended point.");

    //Write our position
    map.canvas.writeMapPosition(6, map.canvas.clampLatLng(latlng));
    map.canvas.lastPosLocal = null;
    map.canvas.lastSentPosLocal = null;

    //Add to the current index
    map.canvas.buffer[0] += 1;

    //Check if we need to flush
    if(map.canvas.buffer[0] > map.canvas.BUFFER_CAPACITY) {
        map.canvas.flush();
    }
}

//Checks if it's a good time to write a point
map.canvas.attemptMakePoint = function(latlng) {
    //Convert our current point
    var d = map.canvas.latlngToLinePos(latlng);

    //Compare it to the last point and see if it is far enough away
    //console.log(Math.abs(d[0] - map.canvas.startingPoint[0]));
    if(Math.abs(d[0] - map.canvas.startingPoint[0]) > map.canvas.MIN_POS_DELTA || Math.abs(d[1] - map.canvas.startingPoint[1]) > map.canvas.MIN_POS_DELTA) {
        //We'll write and restart this point
        map.canvas.endPoint(latlng);
        map.canvas.beginPoint(latlng);

        //Log
        map.canvas.debug("attemptMakePoint", "Saved and restarted point.");

        return true;
    }
    return false;
}

//Draws a line to the canvas and also adds it to our local storage
map.canvas.addLinePacked = function(pack) {
    //Add it to our local storage
    map.canvas.lines.push(pack);

    //Draw
    return map.canvas.drawLinePacked(pack);
}

//Draws a line on the canvas from packed data
map.canvas.drawLinePacked = function(pack) {
    //Determine positions of this in screen coords
    var p1 = map.canvas.latLngToContainerPoint(pack.p1);
    var p2 = map.canvas.latLngToContainerPoint(pack.p2);

    //Draw
    map.canvas.drawLine(p1, p2, pack.b);

    //Return last point
    return p2;
}

//Draws a line on the canvas
map.canvas.drawLine = function(p1, p2, style) {
    //Go to position and begin stroke
    map.canvas.context.beginPath();
    map.canvas.context.moveTo(p1.x, p1.y);

    //Go to the other point
    map.canvas.context.lineTo(p2.x, p2.y);
    map.canvas.setBrushSettings(style);
    map.canvas.context.stroke();
}

//Called whenever the drawing button is pressed
map.canvas.onDrawBtnDown = function(d) {
    //Only act on right click
    if(d.originalEvent.button != 2) {
        return;
    }

    //If there is an unfinished point, finish it first
    if(map.canvas.active) {
        map.canvas.endPoint(d.latlng);
    }

    //Begin point
    map.canvas.beginPoint(d.latlng);

    //Set to active
    map.canvas.active = true;
    map.canvas.thumbnailDirty = true;
}

//Called whenever the drawing button is released
map.canvas.onDrawBtnUp = function(d) {
    //Only act on right click
    if(d.originalEvent.button != 2) {
        return;
    }

    //If we aren't drawing now, don't end
    if(!map.canvas.active) {
        return;
    }

    //End point
    map.canvas.endPoint(d.latlng);

    //Set to not active
    map.canvas.active = false;

    //Flush points
    map.canvas.flush();
}

//Called when the mouse exits the map area. Stop drawing.
map.canvas.onMouseExit = function(d) {
    //If we aren't drawing now, don't end
    if(!map.canvas.active) {
        return;
    }

    //End point
    map.canvas.endPoint(d.latlng);

    //Set to not active
    map.canvas.active = false;

    //Flush points
    map.canvas.flush();
}

//Called whenever the mouse is moved
map.canvas.onMouseMove = function(d) {
    if(map.canvas.active) {
        //Clamp
        var latlng = map.canvas.clampLatLng(d.latlng);

        //Get the position of our last point
        var last = map.canvas.latLngToContainerPoint(map.canvas.lastPosLocal);

        //Draw our line locally
        map.canvas.drawLine(last, /*d.layerPoint*/map.canvas.latLngToContainerPoint(latlng), map.canvas.currentBrushSettings);

        //Update pos
        map.canvas.lastPosLocal = latlng;

        //Attempt to submit a point
        var savedLastSentPoint = map.canvas.lastSentPosLocal;
        var written = map.canvas.attemptMakePoint(latlng);

        //If we wrote this, add this to the redraw points
        if(written) {
            var pack = {
                "s":-1,
                "b":map.canvas.decodeBrushSettings(map.canvas.getBrushSettingsIndex()),
                "p1":savedLastSentPoint,
                "p2":latlng
            };
            map.canvas.lines.push(pack);
            map.canvas.lastSentPosLocal = latlng;
        }
    }
}

//Called when we download a message from the websocket
map.canvas.onMsg = function(d) {
    var isBinary = typeof(d.data) != "string";
    if(isBinary) {
        map.canvas.onWriteMsg(d);
        map.canvas.got++;
    } else {
        //Switch from opcode
        var msg = JSON.parse(d.data);
        map.canvas.textMsgs[msg.opcode](msg.payload);
    }
}

//Called when a binary message is sent over the websocket
map.canvas.onWriteMsg = function(d) {
    //Get handle on data
    d.data.arrayBuffer().then(function(buffer) {
        var view = new DataView(buffer);

        //Create a place to put user move commands so that we can move pointers
        var moveCmds = {};

        //Convert points to packs and draw them
        var len = view.getUint8(0);
        for(var i = 0; i<len; i+=1) {
            var offset = (i * map.canvas.MESSAGE_SIZE) + 1;
            var pack = {
                "s":view.getUint8(offset + 0),
                "b":map.canvas.decodeBrushSettings(view.getUint8(offset + 1)),
                "p1":map.canvas.readMapPosition(view, offset + 2),
                "p2":map.canvas.readMapPosition(view, offset + 6),
            };
            var point = map.canvas.addLinePacked(pack);
            moveCmds[view.getUint8(offset + 0)] = point;
        }

        //Add all points if we have all of our data
        if(map.canvas.downloadComplete) {
            map.canvas.thumbnailDirty = true;
            var moveCmdKeys = Object.keys(moveCmds);
            for(var i = 0; i<moveCmdKeys.length; i+=1) {
                map.canvas.activateUserPointer(moveCmdKeys[i], moveCmds[moveCmdKeys[i]]);
            }
        }
    });
}

//Messages, mapped by opcode
map.canvas.textMsgs = {
    0:function(d) {
        //Adds a user to the user map
        map.canvas.users[d.index] = d;

        //Create a user pointer and attach it
        map.canvas.users[d.index].pointer = map.canvas.reconnectUserPointer(d.name, d.icon, d.color);
    },
    1:function(d) {
        //Sets a user color. TODO
        console.warn("TODO");
    },
    2:function(d) {
        //Sets state (or complete tag, in this case)
        //This timeout is a janky fix
        window.setTimeout(function() {
            map.canvas.downloadComplete = d.state == 1;

            //Called when we have finished switching canvases
            map.canvas.canvasSwitchBusy = false;

            //Switch to the next canvas if we attempted to load one.
            if(map.canvas.canvasSwitchNext != null) {
                map.canvas.switchCanvas(map.canvas.canvasSwitchNext);
                map.canvas.canvasSwitchNext = null;
            }
        }, 500);
    },
    3:function(d) {
        //Called when someone clears the canvas
        map.canvas.active = false;

        //Run flash
        map.canvas.flashDecay(d.cleared_by_name, " cleared the canvas!");

        //Delay as to not cause lag
        window.requestAnimationFrame(function() {
            //Clear out data
            map.canvas.lines = [];
            map.canvas.redraw();
        });
    }
}

//Flashes that a user did an action, temporarily obscuring the map
map.canvas.flashDecay = function(user, text) {
    //Add flash
    main.createDom("div", "v1_canvas_clear_flash", map.canvas.canvas.parentElement);

    //Show message
    var m = main.createDom("div", "v1_canvas_clear_prompt_container", map.canvas.canvas.parentElement);
    var mm = main.createDom("div", "v1_canvas_clear_prompt", m);
    main.createDom("span", "v1_canvas_clear_prompt_accent", mm).innerText = user;
    main.createDom("span", "", mm).innerText = text;
    window.setTimeout(function(m) {
        m.classList.add("v1_canvas_clear_prompt_container_cleared");
    }, 5000, m);
}

//Called whenever the window is resized. Resizes the canvas to fill
map.canvas.resize = function() {
    //Set size
    map.canvas.canvas.width = map.canvas.canvas.parentElement.clientWidth;
    map.canvas.canvas.height = map.canvas.canvas.parentElement.clientHeight;

    //Redraw
    map.canvas.redraw();
}

//Called when the map is changed (for example, zoomed or moved)
map.canvas.onMapTransformed = function() {
    map.canvas.redraw();
}

//Called whenever we move the canvas. Writes lines to the canvas manually
map.canvas.redraw = function() {
    //Erase canvas
    map.canvas.context.clearRect(0, 0, map.canvas.canvas.width, map.canvas.canvas.height);

    //Redraw lines
    for(var i = 0; i<map.canvas.lines.length; i+=1) {
        //Write
        map.canvas.drawLinePacked(map.canvas.lines[i]);
    }
}

//Creates the user pointer object
map.canvas.reconnectUserPointer = function(name, icon, color) {
    var e = main.createDom("div", "map_canvas_userpointer", map.canvas.canvas.parentElement);
    e.innerText = name;
    if(color != null) {
        e.style.color = color;
    }
    main.createDom("img", "", e).src = icon;
    return e;
}

//Activates a user pointer at a position
map.canvas.activateUserPointer = function(index, pos) {
    //Get pointer
    var data = map.canvas.users[index];
    var pointer = data.pointer;

    //Cancel any pending timeouts
    if(pointer.x_timer != null) {
        clearTimeout(pointer.x_timer);
        pointer.x_timer = null;
    }

    //Set position
    pointer.style.top = (pos.y-82).toString()+"px";
    pointer.style.left = pos.x.toString()+"px";

    //Make visible
    pointer.classList.add("map_canvas_userpointer_shown");

    //Set fadeout timer
    pointer.x_timer = window.setTimeout(function(pt) {
        //Fade out
        pt.classList.remove("map_canvas_userpointer_shown");
        pt.x_timer = null;
    }, 2500, pointer);
}

//Calculates the current brush settings index
map.canvas.getBrushSettingsIndex = function() {
    var e = 0;
    e |= ((map.canvas.currentBrushSettings.brushColor >> 0) & 1) << 0;
    e |= ((map.canvas.currentBrushSettings.brushColor >> 1) & 1) << 1;
    e |= ((map.canvas.currentBrushSettings.brushColor >> 2) & 1) << 2;
    e |= ((map.canvas.currentBrushSettings.brushColor >> 3) & 1) << 3;
    e |= ((map.canvas.currentBrushSettings.brushSize >> 0) & 1) << 4;
    e |= ((map.canvas.currentBrushSettings.brushSize >> 1) & 1) << 5;
    e |= ((map.canvas.currentBrushSettings.brushType >> 0) & 1) << 6;
    e |= ((map.canvas.currentBrushSettings.brushType >> 1) & 1) << 7;
    return e;
}

//Decodes the brush settings into a form readable
map.canvas.decodeBrushSettings = function(e) {
    var brushSize = 0;
    var brushColor = 0;
    var brushType = 0;

    brushColor |= ((e >> 0) & 1) << 0;
    brushColor |= ((e >> 1) & 1) << 1;
    brushColor |= ((e >> 2) & 1) << 2;
    brushColor |= ((e >> 3) & 1) << 3;
    brushSize |= ((e >> 4) & 1) << 0;
    brushSize |= ((e >> 5) & 1) << 1;
    brushType |= ((e >> 6) & 1) << 0;
    brushType |= ((e >> 7) & 1) << 1;

    //Debug
    //map.canvas.debug("decodeBrushSettings", "BRUSH SETTINGS CHANGED: color:"+brushColor+"; size:"+brushSize+"; type:"+brushType);
    
    return {
        "brushSize":brushSize,
        "brushColor":brushColor,
        "brushType":brushType
    };
}

//Sets active brush to settings
map.canvas.setBrushSettings = function(e) {
    //Set color
    map.canvas.context.lineWidth = map.canvas.SIZES[e.brushSize];
    map.canvas.context.lineJoin = "round";
    map.canvas.context.lineCap = "round";
    map.canvas.context.strokeStyle = map.canvas.COLORS[e.brushColor];
}

/*

Brush settings follow the follow format, in bits

    [xxxx xx xx]
    (0123 45 67)
     |    |  |
     |    |  [Brush type, unused as of now]
     |    [Brush size]
     [Brush color]

*/