"use struct";

class MapAddonCanvas extends TabMapAddon {

    constructor(map) {
        super(map);

        if (this.map.server.id != "5e324536e6179d3af0f8936a") {
            return;
        }

        this.EMBEDDED_CLIENT_VERSION = 0; //The client version set in the flags
        this.BROADCAST_CLIENT_VERSION = 1; //The client version set in the broadcast header
        this.OUTPUT_STRUCT_SIZE = 10;
        this.INPUT_STRUCT_SIZE = 12;
        this.OUTPUT_BUFFER_STRUCT_COUNT = 100;

        this.BRUSH_SIZES = [
            30,
            80,
            800,
            10000
        ];

        this.activeBrushSize = 0;
        this.activeBrushColor = 0;
        this.eraser = false;

        this.sock = new DeltaWebsock("ws://localhost:32423/v1/canvas?access_token=686977EAE5A0380A49AA941824A2D62AAB06273A26A4EC3BA4DA44E0AA5B7548&canvas_id=5e49ae5c42597e2f40b12cc2",
            () => this.OnOpen(),
            (m) => this.OnTextMsg(m),
            (m) => this.OnBinaryMsg(m),
            () => this.OnClose()
        );

        this.outputBuffer = new ArrayBuffer(8 + (this.OUTPUT_STRUCT_SIZE * this.OUTPUT_BUFFER_STRUCT_COUNT));
        this.outputView = new DataView(this.outputBuffer);
        this.outputBufferIndex = 0; //How full the output buffer is

        this.drawing = false;
        this.lastPoint = null;

        this.canvas = []; //Internal array containing points
        this.subscriptions = []; //Subscribed canvases
    }

    Log(topic, msg) {
        console.log("[" + topic + "] " + msg);
    }

    OnOpen() {

    }

    OnTextMsg() {

    }

    async OnBinaryMsg(m) {
        //Open DataView on this
        var v = new DataView(await m.arrayBuffer());

        //Read version and count
        var version = v.getUint32(0, true);
        var count = v.getUint32(4, true);

        //Import points
        for (var i = 0; i < count; i += 1) {
            var offset = 8 + (i * this.INPUT_STRUCT_SIZE);
            this.ImportNetPoint(
                v.getUint16(offset + 0, true),
                v.getUint8(offset + 2),
                v.getUint8(offset + 3),
                v.getUint16(offset + 4, true),
                v.getUint16(offset + 6, true),
                v.getUint16(offset + 8, true),
                v.getUint16(offset + 10, true),
            );
        }
    }

    OnClose() {

    }

    ImportNetPoint(userId, flags, brush, x1, y1, x2, y2) {
        /* Imports a net point, all inputs being from the binary format */

        //Get index and other data
        var captureSize = this.map.server.GetMapInfo().captureSize;
        var halfCaptureSize = captureSize / 2;

        //Convert points to game values
        x1 = (x1 / 65530) * halfCaptureSize;
        x2 = (x2 / 65530) * halfCaptureSize;
        y1 = (y1 / 65530) * halfCaptureSize;
        y2 = (y2 / 65530) * halfCaptureSize;

        //Set the sign of the number based upon flags
        if (((flags >> 0) & 1) == 1) { x1 = -x1; }
        if (((flags >> 1) & 1) == 1) { y1 = -y1; }
        if (((flags >> 2) & 1) == 1) { x2 = -x2; }
        if (((flags >> 3) & 1) == 1) { y2 = -y2; }

        //Now, write
        var d = [
            x1,
            y1,
            x2,
            y2,
            0,
            0,
            userId
        ];
        this.canvas.push(d);

        //Draw
        this.DrawLineToAllCanvases(d);
    }

    OnDrawBegin(evt) {
        var pos = TabMap.ConvertFromMapPosToGamePos(this.map.server, evt.latlng.lng, evt.latlng.lat); //Get position
        this.drawing = true; //Set the state
        this.lastPoint = pos; //Set the writable point
        evt.originalEvent.stopPropagation(); //Prevent the event from triggering more
        this.map.map.dragging.disable(); //Prevent the map from moving
    }

    OnDrawPointerMove(evt) {
        var pos = TabMap.ConvertFromMapPosToGamePos(this.map.server, evt.latlng.lng, evt.latlng.lat); //Get the location

        //Create line
        this.WritePoint(pos[0], pos[1], this.lastPoint[0], this.lastPoint[1]);
        this.lastPoint = pos;

        //Prevent the event from triggering more
        evt.originalEvent.stopPropagation();
    }

    OnDrawEnd(evt) {
        var pos = TabMap.ConvertFromMapPosToGamePos(this.map.server, evt.latlng.lng, evt.latlng.lat); //Get the current position

        //Create line
        this.WritePoint(pos[0], pos[1], this.lastPoint[0], this.lastPoint[1]);
        this.lastPoint = pos;

        this.drawing = false; //Set the state
        evt.originalEvent.stopPropagation(); //Stop the event from triggering more things
        this.FlushOutputBuffer(); //Flush output
        this.map.map.dragging.enable(); //Allow the map to move again
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */

        //Add events to the map
        this.map.map.on("mousedown", (evt) => {
            if (evt.originalEvent.button == 2) { this.OnDrawBegin(evt); }
        });
        this.map.map.on("mousemove", (evt) => {
            if (this.drawing) { this.OnDrawPointerMove(evt); }
        });
        this.map.map.on("mouseup", (evt) => {
            if (evt.originalEvent.button == 2 && this.drawing) { this.OnDrawEnd(evt); }
        });
        this.map.map.on("mouseout", (evt) => {
            if (this.drawing) { this.OnDrawEnd(evt); }
        });
    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Create the map layer
        var mapSettings = {
            updateWhenZooming: true,
            maxZoom: 12,
            id: 'canvas',
            opacity: 1,
            zIndex: 11,
            bounds: [
                [-256, 0],
                [0, 256]
            ],
            addon: this,
            updateInterval: 1
        };

        this.layer = new MapAddonCanvasLayer(mapSettings);
        this.layer.addTo(this.map.map).on("tileunload", (evt) => this.OnTileUnload(evt));
    }

    async OnUnload(container) {
        /* Called when we unload the map */
    }

    OnTileUnload(evt) {
        /* Called when we unload a subscription. Find the subscription and remove it */
        for (var i = 0; i < this.subscriptions.length; i += 1) {
            var s = this.subscriptions[i];
            if (s[7] == evt.coords.x && s[8] == evt.coords.y && s[9] == evt.coords.z) {
                this.subscriptions.splice(i, 1);
                i--;
            }
        }
    }

    FlushOutputBuffer() {
        /* Pushes points to the server */

        //Set final version and count in headers
        this.outputView.setUint32(0, this.BROADCAST_CLIENT_VERSION, true);
        this.outputView.setUint32(4, this.outputBufferIndex, true);

        //Broadcast
        this.sock.SendData(this.outputBuffer);
        this.Log("FLUSH", "Flushed " + this.outputBufferIndex + "points to server.");

        //Reset
        this.outputBufferIndex = 0;
    }

    WritePoint(x1, y1, x2, y2) {
        /* Writes a point to server and current canvas */

        //Clamp
        x1 = this.ClampGamePos(x1);
        x2 = this.ClampGamePos(x2);
        y1 = this.ClampGamePos(y1);
        y2 = this.ClampGamePos(y2);

        //Check if this is a draw command or eraser command
        if (!this.eraser) {
            //Write to network buffer
            this.WritePointToOutBuffer(x1, y1, x2, y2);
            var d = this.WritePointToInternalArray(x1, y1, x2, y2);

            //Draw
            this.DrawLineToAllCanvases(d);
        } else {
            this.EraseLine(x1, y1, x2, y2);
        }

        //If we're nearing the buffer being full, flush
        if (this.outputBufferIndex >= this.OUTPUT_BUFFER_STRUCT_COUNT - 10) {
            this.FlushOutputBuffer();
        }
    }

    EraseLine(x1, y1, x2, y2) {
        //Find all lines this intersects
        var lines = [];
        var size = 500;
        var minX = Math.min(x1, x2) - size;
        var minY = Math.min(y1, y2) - size;
        var maxX = Math.max(x1, x2) + size;
        var maxY = Math.max(y1, y2) + size;
        for (var i = 0; i < this.canvas.length; i++) {
            var d = this.canvas[i];
            if (this.CheckIfLineIsWithinBounds(d, minX, minY, maxX, maxY)) {
                lines.push(this.canvas.splice(i, 1)[0]);
                i--;
            }
        }
        console.log(lines);

        //Redraw canvases
        for (var i = 0; i < this.subscriptions.length; i++) {
            this.subscriptions[i][6].clearRect(0, 0, this.subscriptions[i][6].canvas.width, this.subscriptions[i][6].canvas.height);
            this.DrawAllLinesToCanvas(this.subscriptions[i]);
        }
    }

    WritePointToInternalArray(x1, y1, x2, y2) {
        var d = [
            x1,
            y1,
            x2,
            y2,
            0,
            0,
            0
        ];
        this.canvas.push(d);
        return d;
    }

    WritePointToOutBuffer(x1, y1, x2, y2) {
        /* Writes a point to the server output buffer */

        //Get index and other data
        var index = (this.outputBufferIndex * this.OUTPUT_STRUCT_SIZE) + 8;
        var captureSize = this.map.server.GetMapInfo().captureSize;
        var halfCaptureSize = captureSize / 2;
        var v = this.outputView;

        //Convert points to the net size
        x1 = (x1 / halfCaptureSize) * 65530;
        y1 = (y1 / halfCaptureSize) * 65530;
        x2 = (x2 / halfCaptureSize) * 65530;
        y2 = (y2 / halfCaptureSize) * 65530;

        //Write flags
        v.setUint8(index + 0, this.CreateFlags(x1 < 0, y1 < 0, x2 < 0, y2 < 0, false));

        //Write brush settings
        v.setUint8(index + 1, 0);

        //Write absolute versions of position
        v.setUint16(index + 2, Math.abs(Math.round(x1)), true);
        v.setUint16(index + 4, Math.abs(Math.round(y1)), true);
        v.setUint16(index + 6, Math.abs(Math.round(x2)), true);
        v.setUint16(index + 8, Math.abs(Math.round(y2)), true);

        //Write count to header
        this.outputBufferIndex++;
    }

    CreateFlags(l1xN, l1yN, l2xN, l2yN, eraser) {
        var e = 0;
        e |= (( (l1xN ? 1 : 0) >> 0) & 1) << 0;
        e |= (( (l1yN ? 1 : 0) >> 0) & 1) << 1;
        e |= (( (l2xN ? 1 : 0) >> 0) & 1) << 2;
        e |= (( (l2yN ? 1 : 0) >> 0) & 1) << 3;
        e |= ((this.EMBEDDED_CLIENT_VERSION >> 0) & 1) << 4;
        e |= ((this.EMBEDDED_CLIENT_VERSION >> 1) & 1) << 5;
        e |= (( (eraser ? 1 : 0) >> 0) & 1) << 6;
        //e |= ((map.canvas.currentBrushSettings.brushType >> 1) & 1) << 7;
        return e;
    }

    DrawLineToCanvas(data, sub) {
        //Get context and other data
        var context = sub[6];

        //Calculate scale
        var scale = 256 / sub[10];

        //Go to position and begin stroke
        context.beginPath();
        context.moveTo((data[0] - sub[4]) * scale, (data[1] - sub[5]) * scale);

        //Set style info
        context.lineWidth = this.BRUSH_SIZES[data[5]] / (sub[10] / 1000);
        context.lineJoin = "round";
        context.lineCap = "round";
        context.strokeStyle = "red";

        //Go to the other point
        context.lineTo((data[2] - sub[4]) * scale, (data[3] - sub[5]) * scale);
        context.stroke();
    }

    CheckIfLineIsWithinBounds(data, minX, minY, maxX, maxY) {
        var s = [minX, minY, maxX, maxY];
        if ((data[0] < s[0] && data[2] < s[0]) || (data[1] < s[1] && data[3] < s[1])) { return false; }
        if ((data[0] > s[2] && data[2] > s[2]) || (data[1] > s[3] && data[3] > s[3])) { return false; }
        return true;
    }

    DrawLineToAllCanvases(data) {
        for (var i = 0; i < this.subscriptions.length; i += 1) {
            var s = this.subscriptions[i];
            if ((data[0] < s[0] && data[2] < s[0]) || (data[1] < s[1] && data[3] < s[1])) { continue; }
            if ((data[0] > s[2] && data[2] > s[2]) || (data[1] > s[3] && data[3] > s[3])) { continue; }
            this.DrawLineToCanvas(data, s);
        }
    }

    DrawAllLinesToCanvas(s) {
        for (var i = 0; i < this.canvas.length; i += 1) {
            var data = this.canvas[i];
            if ((data[0] < s[0] && data[2] < s[0]) || (data[1] < s[1] && data[3] < s[1])) { continue; }
            if ((data[0] > s[2] && data[2] > s[2]) || (data[1] > s[3] && data[3] > s[3])) { continue; }
            this.DrawLineToCanvas(data, s);
        }
    }

    ClampGamePos(p) {
        var captureSize = this.map.server.GetMapInfo().captureSize;
        var halfCaptureSize = captureSize / 2;
        return Math.max(-halfCaptureSize, Math.min(halfCaptureSize, p));
    }

}

var MapAddonCanvasLayer = L.GridLayer.extend({
    createTile: function (coords) {
        var addon = this.options.addon;
        var tsize = this.getTileSize();

        var et = DeltaTools.CreateDom("div", "leaflet-tile map_structure_tile_image");
        var es = DeltaTools.CreateDom("canvas", "", et);
        es.width = tsize.x;
        es.height = tsize.y;
        et.width = tsize.x;
        et.height = tsize.y;

        var context = es.getContext('2d');

        //Calculate the range of data
        var calcOffset = addon.map.server.GetMapInfo().captureSize / 2;
        var units_per_tile = addon.map.server.GetMapInfo().captureSize / Math.pow(2, coords.z);
        var game_min_x = (coords.x * units_per_tile) - calcOffset;
        var game_min_y = (coords.y * units_per_tile) - calcOffset;
        var game_max_x = ((coords.x + 1) * units_per_tile) - calcOffset;
        var game_max_y = ((coords.y + 1) * units_per_tile) - calcOffset;
        var halfSize = (game_max_x - game_min_x) / 2;

        //Subscribe
        var d = [
            game_min_x - halfSize,
            game_min_y - halfSize,
            game_max_x + halfSize,
            game_max_y + halfSize,
            game_min_x,
            game_min_y,
            context,
            coords.x,
            coords.y,
            coords.z,
            game_max_x - game_min_x
        ];
        addon.subscriptions.push(d);

        //Draw
        addon.DrawAllLinesToCanvas(d);

        return et;
    }
});