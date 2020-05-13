/* 
 * THIS IS A WORKER THREAD
 * (C) DeltaWebMap / RomanPort 2020
 * 
 */

var window = {}; //Just to keep enviornment happy
importScripts("/enviornment.js");

async function WebRequest(url, type) {
    return new Promise(function (resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response);
            } else if (this.readyState === 4) {
                reject({
                    status: this.status
                });
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.responseType = type;
        xmlhttp.send(null);
    });
}

var metadataTask = WebRequest(window.LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/structure_metadata.json", "json"); //Structure metadata
var structures = {}; //Structures, saved by server ID
var imagesTask = null; //The images for structures, loaded by the image tag

metadataTask.then((m) => {
    //Got metadata. It is now time to load iamges
    imagesTask = (async (index) => {
        //Load all
        var promises = [];
        for (var j = 0; j < index.metadata.length; j += 1) {
            var p = (async (i) => {
                var url = index.image_url.replace("{image}", index.metadata[i].img);
                var blob = await WebRequest(url, "blob");
                var img = createImageBitmap(blob);
                return img;
            })(j);
            promises.push(p);
        }

        //Wait for all to finish
        var results = await Promise.all(promises);

        //Create output array
        var output = {};
        for (var i = 0; i < index.metadata.length; i += 1) {
            output[index.metadata[i].img] = results[i];
        }

        return output;
    })(m);
});

function GetStructureMetadata(metadatas, classname) {
    for (var i = 0; i < metadatas.length; i += 1) {
        if (metadatas[i].names.includes(classname)) {
            return metadatas[i];
        }
    }
    return null;
}

onmessage = function (e) {
    //Get data
    var data = e.data;
    var serverId = data.server;
    var server = structures[serverId];
    if (server == null) {
        structures[serverId] = [];
        server = structures[serverId];
    }
    var command = data.command;
    var payload = data.payload;
    var code = data.code;

    //Switch on the command
    if (command == "DELTAWEBMAP_COMMIT") { CommitCommand(payload, server, code); }
    if (command == "DELTAWEBMAP_ADD") { AddCommand(payload, server, code); }
    if (command == "DELTAWEBMAP_REMOVE") { RemoveCommand(payload, server, code); }
    if (command == "DELTAWEBMAP_PROCESS") { ProcessCommand(payload, server, code); }
    if (command == "DELTAWEBMAP_AWAIT_STORE_LOADING") { AwaitStoreLoadingCommand(payload, server, code); }
}

function RespondMessage(code, payload) {
    var d = {
        "code": code,
        "payload": payload
    };
    postMessage(d);
}

function AwaitStoreLoadingCommand(payload, server, code) {
    metadataTask.then(() => {
        imagesTask.then(() => {
            RespondMessage(code, true);
        });
    });
}

function CommitCommand(payload, server, code) {
    //Sort
    server.sort((a, b) => {
        if (a.has_inventory || !b.has_inventory) {
            return 1;
        }
        if (b.has_inventory || !a.has_inventory) {
            return -1;
        }
        return a.location.z - b.location.z;
    });
    RespondMessage(code, true);
}

function AddCommand(payload, server, code) {
    //Add structures
    var skipCheck = server.length == 0;
    for (var i = 0; i < payload.length; i += 1) {
        //Check to see if this already contains this
        var found = false;
        if (!skipCheck) {
            for (var j = 0; j < server.length; j += 1) {
                if (server[j].structure_id == payload[i].structure_id) {
                    //Overwrite
                    server[j] = payload[i];
                    found = true;
                }
            }
        }

        //Add new
        if (!found) {
            server.push(payload[i]);
        }
    }
    RespondMessage(code, true);
}

function RemoveCommand(payload, server, code) {
    //Remove structures
    for (var i = 0; i < payload.length; i += 1) {
        for (var j = 0; j < server.length; j += 1) {
            if (server[j].structure_id == payload[i].structure_id) {
                //Remove
                server.splice(j, 1);
                j--;
            }
        }
    }
    RespondMessage(code, true);
}

async function ProcessCommand(payload, server, code) {
    //Process an image for this structure
    //Wait for required processes to end
    var metadatas = await metadataTask;
    var images = await imagesTask;

    //Get args
    var tileSize = payload.tileSize;
    var tileX = payload.tileX;
    var tileY = payload.tileY;
    var tileZoom = payload.tileZoom;
    var captureSize = payload.captureSize;
    var tribeFilter = payload.tribeFilter; //Null = no filter

    //Create canvas
    var canvas = new OffscreenCanvas(tileSize, tileSize);
    var context = canvas.getContext('2d');

    //Calculate the range of data
    var globalOffsetX = 0;
    var globalOffsetY = 0;
    var calcOffset = captureSize / 2;
    var units_per_tile = captureSize / Math.pow(2, tileZoom);
    var game_min_x = (tileX * units_per_tile) - calcOffset;
    var game_min_y = (tileY * units_per_tile) - calcOffset;
    var game_max_x = ((tileX + 1) * units_per_tile) - calcOffset;
    var game_max_y = ((tileY + 1) * units_per_tile) - calcOffset;

    //Add tiles
    var found = [];
    for (var i = 0; i < server.length; i += 1) {
        //Get data
        var data = server[i];

        //Get metadata
        var metadata = GetStructureMetadata(metadatas.metadata, data.classname);
        if (metadata == null) {
            continue;
        }

        //Get data
        var x = data.location.x;
        var y = data.location.y;
        var rotation = data.location.yaw;
        var id = data.location.structure_id;
        var mSize = metadata.size;

        //Check if this is within range
        if (x > game_max_x + (mSize * 1.5) || x < game_min_x - (mSize * 1.5)) {
            continue;
        }
        if (y > game_max_y + (mSize * 1.5) || y < game_min_y - (mSize * 1.5)) {
            continue;
        }

        //Do size calculations
        var size = (mSize / units_per_tile) * tileSize;

        //Determine location
        var loc_tile_x = ((x - (mSize / 2) - game_min_x) / units_per_tile) * tileSize;
        var loc_tile_y = ((y - (mSize / 2) - game_min_y) / units_per_tile) * tileSize;

        //Draw this
        this.DrawRotatedImage(context, images[metadata.img], loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, rotation, size, size);

        //Add to list of found tiles
        found.push({
            "x": loc_tile_x + globalOffsetX,
            "y": loc_tile_y + globalOffsetY,
            "r": rotation,
            "s": size,
            "hit": CreateVectorPoints(metadata, loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, rotation, size),
            "has_inventory": data.has_inventory,
            "data": data
        });
    }

    //Respond
    RespondMessage(code, {
        "canvas": context.getImageData(0, 0, tileSize, tileSize),
        "found": found
    });
}

function DrawRotatedImage(context, image, x, y, angle, width, height) {
    var TO_RADIANS = Math.PI / 180;
    context.save();
    context.translate(x + (width / 2), y + (height / 2)); //janky fix because our position is from the upper-left corner
    context.rotate(angle * TO_RADIANS);
    context.drawImage(image, -(width / 2), -(height / 2), width, height);
    context.restore();
}

function CreateVectorPoints(metadata, gx, gy, angle, size) {
    var points = [];
    var scale = (1 / metadata.image_size.width) * size;
    var radians = (Math.PI / 180) * -angle;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    for (var i = 0; i < metadata.outline.length; i += 1) {
        //Apply transformations to the points here
        var p = metadata.outline[i];
        var x = p.x;
        var y = p.y;

        //Apply rotation
        var cx = (metadata.image_size.width / 2);
        var cy = (metadata.image_size.width / 2);
        var tx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
        var ty = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        x = tx;
        y = ty;

        //Apply scale
        x *= scale;
        y *= scale;

        //Apply position
        x += gx;
        y += gy;

        //Add
        points.push([x, y]);
    }
    return points;
}