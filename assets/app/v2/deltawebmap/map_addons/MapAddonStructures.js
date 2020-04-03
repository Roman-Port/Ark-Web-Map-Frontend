"use struct";

class MapAddonStructures extends TabMapAddon {

    constructor(map) {
        super(map);
        this.loadQueue = []; //This is a queue of tiles we need to produce when we're done loading structure images
        this.listenerToken = null;
        this.tiles = [];
    }

    static IsFastModeSupported() {
        return true;
    }

    static async SendCommandToWorker(serverId, opcode, payload) {
        //Make sure we have a worker
        if (MapAddonStructures._worker == null) {
            MapAddonStructures._worker = new Worker("/assets/app/v2/deltawebmap/worker/StructureImageWorker.js");
            MapAddonStructures._promises = {};
            MapAddonStructures._promiseIndex = 0;
            MapAddonStructures._worker.onmessage = function (e) {
                var rCode = e.data.code;
                var rPayload = e.data.payload;
                MapAddonStructures._promises[rCode](rPayload);
                delete MapAddonStructures._promises[rCode];
            };
        }

        //Get a code
        var code = MapAddonStructures._promiseIndex;
        MapAddonStructures._promiseIndex++;

        //Create message to send
        var d = {
            "code": code,
            "command": opcode,
            "server": serverId,
            "payload": payload
        }

        //Create a promise and add it to the queue, then send
        return new Promise((resolve, reject) => {
            //Add
            MapAddonStructures._promises[code] = resolve;

            //Send
            MapAddonStructures._worker.postMessage(d);
        });
    }

    async ProcessInteractableStructuresTileV2(tileSize, tileX, tileY, tileZ, holder) {
        //Create and attach the static tile
        var staticTile = await this.ProcessStructuresTileV2(tileSize, tileX, tileY, tileZ);
        holder.appendChild(staticTile.canvas);
        var found = staticTile.found;

        //Create hit detection canvas
        var c = DeltaTools.CreateDom("canvas", "map_structure_tile_image_canvas map_structure_tile_image_canvas_priority");
        c.width = tileSize;
        c.height = tileSize;

        //Set hit detection
        c._items = found;
        c._getHits = function (x, y) {
            var hits = [];
            for (var h = 0; h < this._items.length; h += 1) {
                var it = this._items[h];
                if (!it.has_inventory) { continue; }
                var vs = it.hit;
                var inside = false;
                for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    var xi = vs[i][0], yi = vs[i][1];
                    var xj = vs[j][0], yj = vs[j][1];

                    var intersect = ((yi > y) != (yj > y))
                        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
                if (inside) {
                    hits.push(it);
                }
            }
            return hits;
        }
        c._update = function (x, y) {
            //Clear
            var ctx = this.getContext("2d");
            ctx.clearRect(0, 0, this.width, this.height);

            //Run hit detection on all items inside
            var hits = this._getHits(x, y);

            //Highlight
            for (var i = 0; i < hits.length; i += 1) {
                var f = hits[i];
                ctx.strokeStyle = "#e8eb34";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(f.hit[0][0], f.hit[0][1]);
                for (var j = 1; j < f.hit.length; j += 1) {
                    var hit = f.hit[j];
                    ctx.lineTo(hit[0], hit[1]);
                }
                ctx.lineTo(f.hit[0][0], f.hit[0][1]);
                ctx.stroke();
            }
        };
        holder.appendChild(c);

        //Set info on holder
        holder._interactive = c;

        //TO UPDATE INTERACTIVE PART, events have to be called to the update bit from an outside source
    }

    async ProcessStructuresTileV2(tileSize, tileX, tileY, tileZ) {
        //Create canvas
        var c = DeltaTools.CreateDom("canvas", "map_structure_tile_image_canvas");
        c.width = tileSize;
        c.height = tileSize;
        var ctx = c.getContext('2d');

        //Process
        var found = null;
        if (MapAddonStructures.IsFastModeSupported()) {
            //Browser supports quick
            found = await this._ProcessQuick(tileSize, tileX, tileY, tileZ, ctx);
        } else {
            //Fallback
            found = await this._ProcessFallback(tileSize, tileX, tileY, tileZ, ctx);
        }

        //Return
        return {
            "canvas": c,
            "found": found
        };
    }

    async _ProcessQuick(tileSize, tileX, tileY, tileZ, canvasContext) {
        //Create args
        var d = {
            "tileSize": tileSize,
            "tileX": tileX,
            "tileY": tileY,
            "tileZoom": tileZ,
            "captureSize": this.map.server.GetMapInfo().captureSize,
            "tribeFilter": null
        }

        //Submit
        var data = await MapAddonStructures.SendCommandToWorker(this.map.server.id, "DELTAWEBMAP_PROCESS", d);

        //Write
        canvasContext.putImageData(data.canvas, 0, 0);

        return data.found;
    }

    async _ProcessFallback(tileSize, tileX, tileY, tileZ, canvasContext) {
        //Wait for downloading of store to finish
        await STRUCTURE_TILES_CACHE_TASK;

        //Calculate the range of data
        var calcOffset = this.map.server.GetMapInfo().captureSize / 2;
        var units_per_tile = this.map.server.GetMapInfo().captureSize / Math.pow(2, tileZ);
        var game_min_x = (tileX * units_per_tile) - calcOffset;
        var game_min_y = (tileY * units_per_tile) - calcOffset;
        var game_max_x = ((tileX + 1) * units_per_tile) - calcOffset;
        var game_max_y = ((tileY + 1) * units_per_tile) - calcOffset;

        //Add all of the elements to this
        var found = await this.WriteToCanvas(canvasContext, game_min_x, game_min_y, game_max_x, game_max_y, tileSize, units_per_tile, 0, 0);

        return found;
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */

    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Create the map layer
        var mapSettings = {
            updateWhenZooming: true,
            maxZoom: 12,
            id: 'structures',
            opacity: 1,
            zIndex: 10,
            bounds: [
                [-256, 0],
                [0, 256]
            ],
            addon: this,
            updateInterval: 1
        };

        this.layer = new MapAddonStructuresLayer(mapSettings);
        this.activeLayer = this.layer.addTo(this.map.map);

        //Add loading symbol
        this.loader = DeltaTools.CreateDom("div", "map_structure_loader_circle", this.map.mapContainer);
        DeltaTools.CreateDom("div", "loading_spinner", this.loader);

        //Wait for loading to complete until we continue
        var awaiter = null;
        if (MapAddonStructures.IsFastModeSupported()) {
            awaiter = MapAddonStructures.SendCommandToWorker(this.map.server.id, "DELTAWEBMAP_AWAIT_STORE_LOADING", null);
        } else {
            awaiter = STRUCTURE_TILES_CACHE_TASK;
        }
        awaiter.then(() => {
            this.loader.remove();
        });

        //Add event listener
        this.listenerToken = this.map.server.db.structures.AddListener((adds, removes) => {
            if (MapAddonStructures.IsFastModeSupported()) {
                var p = [
                    MapAddonStructures.SendCommandToWorker(this.map.server.id, "DELTAWEBMAP_ADD", adds),
                    MapAddonStructures.SendCommandToWorker(this.map.server.id, "DELTAWEBMAP_REMOVE", removes)
                ];
                Promise.all(p).then(() => {
                    MapAddonStructures.SendCommandToWorker(this.map.server.id, "DELTAWEBMAP_COMMIT", null);
                });
            } else {
                //Add
                for (var i = 0; i < adds.length; i += 1) {
                    var replaced = false;
                    for (var j = 0; j < this.tiles.length; j += 1) {
                        if (this.tiles[j].structure_id == adds[i].structure_id) {
                            this.tiles[j] = adds[i];
                            replaced = true;
                        }
                    }
                    if (!replaced) {
                        this.tiles.push(adds[i]);
                    }
                }

                //Remove
                for (var i = 0; i < removes.length; i += 1) {
                    for (var j = 0; j < this.tiles.length; j += 1) {
                        if (this.tiles[j].structure_id == removes[i].structure_id) {
                            this.tiles.splice(j, 1);
                            j--;
                        }
                    }
                }

                //Sort
                this.tiles.sort((a, b) => {
                    if (a.has_inventory || !b.has_inventory) {
                        return 1;
                    }
                    if (b.has_inventory || !a.has_inventory) {
                        return -1;
                    }
                    return a.location.z - b.location.z;
                });
            }
        }, null);

        //Add interactive control to the map
        this.activeLayer._container.addEventListener("mousemove", (evt) => {
            //Loop through tiles
            DeltaTools.ForEachKey(this.activeLayer._tiles, (r) => {
                var el = r.el;
                var interactive = el._interactive;
                if (interactive == null) { return; }

                //Get the mouse pos
                var rect = interactive.getBoundingClientRect();
                var x = evt.clientX - rect.left;
                var y = evt.clientY - rect.top;

                interactive._update(x, y);
            });
        });
    }

    async OnUnload(container) {
        this.map.map.removeLayer(this.layer);
        this.map.server.db.structures.RemoveListener(this.listenerToken);
    }

    AddClickRegions(found, parent) {
        for (var i = 0; i < found.length; i += 1) {
            //Draw only items with an ID, as they have an inventory
            if (found[i].id == null) {
                continue;
            }

            //Draw
            var e = DeltaTools.CreateDom("div", "map_structure_mouseover_target", parent);
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

    static GetStructureMetadata(metadatas, classname) {
        for (var i = 0; i < metadatas.length; i += 1) {
            if (metadatas[i].names.includes(classname)) {
                return metadatas[i];
            }
        }
        return null;
    }

    async WriteToCanvas(context, game_min_x, game_min_y, game_max_x, game_max_y, tsize, units_per_tile, globalOffsetX, globalOffsetY) {
        var found = [];
        for (var i = 0; i < this.tiles.length; i += 1) {
            //Get data
            var data = this.tiles[i];

            //Check tribe
            if (this.map.server.tribe != '*' && this.map.server.tribe != data.tribe_id) {
                continue;
            }

            //Get metadata
            var metadata = MapAddonStructures.GetStructureMetadata(STRUCTURE_TILES_METADATA.metadata, data.classname);
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
            var size = (mSize / units_per_tile) * tsize;

            //Skip if it is too small
            if (size < 5 * this.scale) {
                continue;
            }

            //Determine location
            var loc_tile_x = ((x - (mSize / 2) - game_min_x) / units_per_tile) * tsize;
            var loc_tile_y = ((y - (mSize / 2) - game_min_y) / units_per_tile) * tsize;

            //Draw this
            this.DrawRotatedImage(context, STRUCTURE_TILES_CACHE[metadata.img], loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, rotation, size, size);

            //Add to list of found tiles
            found.push({
                "x": loc_tile_x + globalOffsetX,
                "y": loc_tile_y + globalOffsetY,
                "r": rotation,
                "s": size,
                "id": id
            });
        }
        return found;
    }

    DrawRotatedImage(context, image, x, y, angle, width, height) {
        var TO_RADIANS = Math.PI / 180;
        context.save();
        context.translate(x + (width / 2), y + (height / 2)); //janky fix because our position is from the upper-left corner
        context.rotate(angle * TO_RADIANS);
        context.drawImage(image, -(width / 2), -(height / 2), width, height);
        context.restore();
    }

    static async LoadStructureStore() {
        /* Loads the structure tile cache */
        /* This promise should be assigned to STRUCTURE_TILES_CACHE_TASK */

        try {
            //Request an index of all structures
            var index = await DeltaTools.WebRequest(LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/structure_metadata.json", {}, null);
            STRUCTURE_TILES_METADATA = index;

            //Load all
            var promises = [];
            for (var i = 0; i < index.metadata.length; i += 1) {
                promises.push(this.LoadStructureStoreImage(index, index.metadata[i].img));
            }

            //Wait for all to finish
            await Promise.all(promises);
        } catch (e) {
            console.log("[STRUCTURE IMAGE STORE] Failed to load structure image listings.");
            return false;
        }

        return true;
    }

    static async LoadStructureStoreImage(index, name) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = function () {
                STRUCTURE_TILES_CACHE[name] = img;
                resolve(img);
            };
            img.onerror = resolve;
            img.src = index.image_url.replace("{image}", name);
        });
    }
}

var STRUCTURE_TILES_CACHE = {};
var STRUCTURE_TILES_METADATA = null;
var STRUCTURE_TILES_CACHE_TASK = MapAddonStructures.LoadStructureStore();

var MapAddonStructuresLayer = L.GridLayer.extend({
    createTile: function (coords) {
        var addon = this.options.addon;
        var tsize = this.getTileSize();
        tsize.x *= addon.scale;
        tsize.y *= addon.scale;

        //Create data
        var et = DeltaTools.CreateDom("div", "leaflet-tile map_structure_tile_image");
        et.width = tsize.x;
        et.height = tsize.y;

        //Process
        /*addon.ProcessStructuresTileV2(256, coords.x, coords.y, coords.z).then((data) => {
            et.appendChild(data.canvas);

            var ctx = data.canvas.getContext("2d");
            for (var i = 0; i < data.found.length; i += 1) {
                var f = data.found[i];
                ctx.beginPath();
                ctx.moveTo(f.hit[0][0], f.hit[0][1]);
                for (var j = 1; j < f.hit.length; j += 1) {
                    var hit = f.hit[j];
                    ctx.lineTo(hit[0], hit[1]);
                }
                ctx.lineTo(f.hit[0][0], f.hit[0][1]);
                ctx.stroke();
            }
        });*/

        addon.ProcessInteractableStructuresTileV2(256, coords.x, coords.y, coords.z, et);

        return et;
    }
});