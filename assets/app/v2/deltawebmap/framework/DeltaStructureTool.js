"use strict";

class DeltaStructureTool {

    constructor(app, metadata) {
        this.app = app;
        this.tiles = null;
        this.TO_RADIANS = Math.PI / 180;

        //Convert metadata
        this.metadata = {};
        for (var i = 0; i < metadata.length; i += 1) {
            for (var j = 0; j < metadata[i].names.length; j += 1) {
                this.metadata[metadata[i].names[j]] = metadata[i];
            }
        }
    }

    async Init() {
        this.tiles = await new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = reject;
            img.src = "https://icon-assets.deltamap.net/structures.png";
        });
    }

}

class DeltaStructureSession {

    constructor(tool, map, server) {
        this.tool = tool;
        this.map = map;
        this.server = server;
        this.mapInfo = server.GetMapInfo();
        this.MAX_ZOOM = 12;
        this.MAX_INDEXED_ZOOM = 8;
        this.dataset = [];
        this.firstSet = true;
        this.datasetMetadata = {};
        this.DRAW_DEBUG = false;

        //Create type
        this.LeafletStructureLayer = L.GridLayer.extend({
            createTile: function (coords) {
                var tsize = this.getTileSize();

                //Create data
                var et = DeltaTools.CreateDom("div", "leaflet-tile map_structure_tile_image");
                et.width = tsize.x;
                et.height = tsize.y;

                this.options.ssession._ProcessNewTile(256, coords.x, coords.y, coords.z, et);

                return et;
            }
        });

        //Create the map layer
        var mapSettings = {
            updateWhenZooming: true,
            maxNativeZoom: this.MAX_ZOOM - 1,
            maxZoom: this.MAX_ZOOM,
            id: 'structures',
            opacity: 1,
            zIndex: 10,
            bounds: [
                [-256, 0],
                [0, 256]
            ],
            ssession: this,
            updateInterval: 1
        };

        this.layer = new this.LeafletStructureLayer(mapSettings);
        this.activeLayer = this.layer.addTo(this.map);

        //Calculate zoom data
        this.zoomData = [];
        for (var zoom = 0; zoom < this.MAX_ZOOM; zoom += 1) {
            var tiles = Math.pow(2, zoom);
            var units_per_tile = this.mapInfo.captureSize / tiles;
            this.zoomData.push([tiles, units_per_tile]);
        }
    }

    SetNewDataset(d) {
        //Set
        this.dataset = [];
        for (var i = 0; i < d.length; i += 1) {
            if (this.tool.metadata[d[i].classname] != null) {
                this.dataset.push(d[i]);
            }
        }

        //Sort
        this.dataset.sort((a, b) => {
            if (a.has_inventory || !b.has_inventory) {
                return 1;
            }
            if (b.has_inventory || !a.has_inventory) {
                return -1;
            }
            return a.location.z - b.location.z;
        });

        //Create metadata by precomputing
        var calcOffset = this.mapInfo.captureSize / 2;
        var tsize = 256;
        for (var i = 0; i < this.dataset.length; i += 1) {
            var data = this.dataset[i % this.dataset.length];
            var zooms = [];
            for (var zoom = 0; zoom < this.MAX_ZOOM; zoom += 1) {
                var zoomData = {};
                var mSize = this.tool.metadata[data.classname].size * 1.5;
                zoomData.show = this.tool.metadata[data.classname] != null;
                if (zoomData.show) {
                    zoomData.size = (this.tool.metadata[data.classname].size / this.zoomData[zoom][1]) * tsize;
                    zoomData.show = zoomData.size > 5;
                    if (zoomData.show) {
                        zoomData.tileXMin = Math.floor((data.location.x - mSize + calcOffset) / this.zoomData[zoom][1]);
                        zoomData.tileYMin = Math.floor((data.location.y - mSize + calcOffset) / this.zoomData[zoom][1]);
                        zoomData.tileXMax = Math.floor((data.location.x + mSize + calcOffset) / this.zoomData[zoom][1]);
                        zoomData.tileYMax = Math.floor((data.location.y + mSize + calcOffset) / this.zoomData[zoom][1]);
                    }
                }
                zooms.push(zoomData);
            }
            this.datasetMetadata[data.structure_id] = {
                "zoom": zooms
            };
        }

        //Redraw
        this.RedrawAll();
    }

    RedrawAll() {
        this.activeLayer.redraw();
    }

    _ProcessNewTile(tileSize, tileX, tileY, tileZ, e) {
        //Set metadata
        e._tileX = tileX;
        e._tileY = tileY;
        e._tileZ = tileZ;

        //Create canvas
        var canvas = DeltaTools.CreateDom("canvas", "map_structure_tile_image_canvas map_structure_tile_image_canvas_priority", e);
        canvas.width = tileSize;
        canvas.height = tileSize;

        //Add all of the elements to this
        var found = this._ProcessTileImage(canvas.getContext('2d'), tileSize, tileX, tileY, tileZ);

        //Create canvas for interactive
        var interactive = DeltaTools.CreateDom("canvas", "map_structure_tile_image_canvas map_structure_tile_image_canvas_priority", e);
        interactive.width = tileSize;
        interactive.height = tileSize;
        interactive.style.zIndex = 1000;
        e._interactive = interactive;
        interactive._found = found;

        //Add highlight event
        e.addEventListener("mousemove", (evt) => {
            //Get current pos
            var rect = evt.target.getBoundingClientRect();
            var x = Math.floor(evt.clientX - rect.left);
            var y = Math.floor(evt.clientY - rect.top);

            //Update this and surrounding
            DeltaTools.ForEachKey(this.activeLayer._tiles, (t) => {
                if (t.coords.z != evt.currentTarget._tileZ) { return; }
                this._ProcessInteractiveTile(t.el, t.el._interactive, x - ((t.coords.x - evt.currentTarget._tileX) * 256), y - ((t.coords.y - evt.currentTarget._tileY) * 256));
            });
        });

        //Add click event
        e.addEventListener("click", (evt) => {
            //Get current pos
            var rect = evt.target.getBoundingClientRect();
            var x = Math.floor(evt.clientX - rect.left);
            var y = Math.floor(evt.clientY - rect.top);

            //Get hits
            var hits = this._GetTileHits(evt.currentTarget, evt.currentTarget._interactive, x, y);
            if (hits.length == 1) {
                DeltaPopoutModal.ShowStructureModal(this.server.app, hits[0], { "x": evt.x, "y": evt.y }, this.server);
            } else if (hits.length > 1) {
                //Prompt user for which one to open
                (async () => {
                    var menu = [];
                    for (var i = 0; i < hits.length; i += 1) {
                        var d = this.server.GetEntryItemByStructureClassName(hits[i].classname);
                        var name = hits[i].classname;
                        if (d != null) {
                            name = d.name;
                        }
                        menu.push({
                            "name": name,
                            "btnContext": hits[i],
                            "callback": (app, extra, structurePicked) => {
                                DeltaPopoutModal.ShowStructureModal(app, structurePicked, { "x": evt.x, "y": evt.y }, this.server);
                            }
                        });
                    }
                    DeltaContextMenu.ForceOpenContextMenu(evt.x, evt.y, this.server.app, null, [menu]);
                })();
            }
        });

        return found;
    }

    async _BuildPopoutMultiplePickerMenu(structures) {
        var o = [];
        for (var i = 0; i < structures.length; i += 1) {
            var d = await this.map.server.app.GetItemEntryByStructureClassNameAsync(structures[i].classname);
            var name = structures[i].classname;
            if (d != null) {
                name = d.name;
            }
            o.push({
                "name": name,
                "btnContext": structures[i],
                "callback": (app, extra, structurePicked) => {
                    DeltaPopoutModal.ShowStructureModal(app, structurePicked, { "x": structurePicked.m_x, "y": structurePicked.m_y }, server.data);
                }
            });
        }
        return o;

    }

    _ProcessTileImage(context, tileSize, tileX, tileY, tileZ) {
        //Calculate the range of data
        var calcOffset = this.mapInfo.captureSize / 2;
        var units_per_tile = this.mapInfo.captureSize / Math.pow(2, tileZ);
        var game_min_x = (tileX * units_per_tile) - calcOffset;
        var game_min_y = (tileY * units_per_tile) - calcOffset;
        var game_max_x = ((tileX + 1) * units_per_tile) - calcOffset;
        var game_max_y = ((tileY + 1) * units_per_tile) - calcOffset;
        var tsize = 256;

        //If we haven't loaded, do nothing
        if (this.dataset.length == 0) {
            return;
        }

        //Write
        var found = [];
        for (var i = 0; i < this.dataset.length; i += 1) {
            //Check indexed data
            var zoomMeta = this.datasetMetadata[this.dataset[i].structure_id].zoom[tileZ];
            if (!zoomMeta.show) {
                continue;
            }
            if (tileX < zoomMeta.tileXMin || tileX > zoomMeta.tileXMax || tileY < zoomMeta.tileYMin || tileY > zoomMeta.tileYMax) {
                continue;
            }

            //Get data
            var data = this.dataset[i];
            var x = data.location.x;
            var y = data.location.y;
            var rotation = data.location.yaw;
            var id = data.location.structure_id;
            var mSize = this.tool.metadata[data.classname].size;
            var size = zoomMeta.size;

            //Determine location
            var loc_tile_x = ((x - (mSize / 2) - ((tileX * units_per_tile) - calcOffset)) / units_per_tile) * tsize;
            var loc_tile_y = ((y - (mSize / 2) - ((tileY * units_per_tile) - calcOffset)) / units_per_tile) * tsize;

            //Draw this
            this._DrawRotatedTile(context, data.classname, loc_tile_x, loc_tile_y, rotation, size, size);

            //Add to list of found tiles
            found.push({
                "x": loc_tile_x,
                "y": loc_tile_y,
                "box_top_left": [loc_tile_x - (size / 2), loc_tile_y - (size / 2)],
                "box_bottom_right": [loc_tile_x + (size * 1.5), loc_tile_y + (size * 1.5)],
                "data": data
            });
        }

        //Draw debug 
        if (this.DRAW_DEBUG) {
            //Draw outline
            context.strokeStyle = "purple";
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, tsize);
            context.lineTo(tsize, tsize);
            context.lineTo(tsize, 0);
            context.lineTo(0, 0);
            context.stroke();

            //Draw coords
            context.font = "20px Arial";
            context.strokeText("Z: " + tileZ + " X: " + tileX + " Y: " + tileY, 0, 20);
        }
        return found;
    }

    _ProcessInteractiveTile(e, interactive, x, y) {
        //Get metadata
        var tileX = e._tileX;
        var tileY = e._tileY;
        var tileZ = e._tileZ;

        //Calculate
        var calcOffset = this.mapInfo.captureSize / 2;
        var units_per_tile = this.mapInfo.captureSize / Math.pow(2, tileZ);
        var game_min_x = (tileX * units_per_tile) - calcOffset;
        var game_min_y = (tileY * units_per_tile) - calcOffset;
        var tsize = 256;

        //Get context and clear
        var context = interactive.getContext("2d");
        context.clearRect(0, 0, interactive.width, interactive.height);        

        //Check if content exists
        if (interactive._found == null) {
            return;
        }

        for (var i = 0; i < interactive._found.length; i += 1) {
            var zoomMeta = interactive._found[i];
            var metadata = this.tool.metadata[zoomMeta.data.classname];

            if (this.DRAW_DEBUG) {
                context.strokeStyle = "red";
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(zoomMeta.box_top_left[0], zoomMeta.box_top_left[1]);
                context.lineTo(zoomMeta.box_top_left[0], zoomMeta.box_bottom_right[1]);
                context.lineTo(zoomMeta.box_bottom_right[0], zoomMeta.box_bottom_right[1]);
                context.lineTo(zoomMeta.box_bottom_right[0], zoomMeta.box_top_left[1]);
                context.lineTo(zoomMeta.box_top_left[0], zoomMeta.box_top_left[1]);
                context.stroke();
            }

            if (x > zoomMeta.box_top_left[0] && x < zoomMeta.box_bottom_right[0] && y > zoomMeta.box_top_left[1] && y < zoomMeta.box_bottom_right[1] && zoomMeta.data.has_inventory) {
                //Draw debug boundries
                if (this.DRAW_DEBUG) {
                    context.strokeStyle = "blue";
                    context.lineWidth = 3;
                    context.beginPath();
                    context.moveTo(zoomMeta.box_top_left[0], zoomMeta.box_top_left[1]);
                    context.lineTo(zoomMeta.box_top_left[0], zoomMeta.box_bottom_right[1]);
                    context.lineTo(zoomMeta.box_bottom_right[0], zoomMeta.box_bottom_right[1]);
                    context.lineTo(zoomMeta.box_bottom_right[0], zoomMeta.box_top_left[1]);
                    context.lineTo(zoomMeta.box_top_left[0], zoomMeta.box_top_left[1]);
                    context.stroke();
                }

                //Compute vectorized points
                var size = (metadata.size / units_per_tile) * 256;
                var loc_tile_x = ((zoomMeta.data.location.x - (metadata.size / 2) - game_min_x) / units_per_tile) * tsize;
                var loc_tile_y = ((zoomMeta.data.location.y - (metadata.size / 2) - game_min_y) / units_per_tile) * tsize;
                var points = this._VectorizeStructureOutline(metadata, loc_tile_x, loc_tile_y, size, zoomMeta.data.location.yaw);

                //Check if mouse is within points
                if (this._GetIsHit(x, y, points)) {
                    //Begin draw
                    context.strokeStyle = "#e8eb34";
                    context.lineWidth = 5;
                    context.beginPath();

                    //Draw points
                    context.moveTo(points[0][0], points[0][1]);
                    for (var j = 0; j < points.length; j += 1) {
                        context.lineTo(points[j][0], points[j][1]);
                    }

                    //Finish draw
                    context.lineTo(points[0][0], points[0][1]);
                    context.stroke();
                }
            }
        }

        //Draw outline
        if (this.DRAW_DEBUG) {
            if (x < 256 && x > 0 && y < 256 && y > 0) {
                context.strokeStyle = "yellow";
                context.lineWidth = 5;
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, tsize);
                context.lineTo(tsize, tsize);
                context.lineTo(tsize, 0);
                context.lineTo(0, 0);
                context.stroke();
            }
        }
    }

    _GetTileHits(e, interactive, x, y) {
        //Get metadata
        var tileX = e._tileX;
        var tileY = e._tileY;
        var tileZ = e._tileZ;

        //Check if content exists
        if (interactive._found == null) {
            return [];
        }

        //Calculate
        var calcOffset = this.mapInfo.captureSize / 2;
        var units_per_tile = this.mapInfo.captureSize / Math.pow(2, tileZ);
        var game_min_x = (tileX * units_per_tile) - calcOffset;
        var game_min_y = (tileY * units_per_tile) - calcOffset;
        var tsize = 256;
        var hits = [];

        for (var i = 0; i < interactive._found.length; i += 1) {
            var zoomMeta = interactive._found[i];
            var metadata = this.tool.metadata[zoomMeta.data.classname];
            if (x > zoomMeta.box_top_left[0] && x < zoomMeta.box_bottom_right[0] && y > zoomMeta.box_top_left[1] && y < zoomMeta.box_bottom_right[1] && zoomMeta.data.has_inventory) {
                //Compute vectorized points
                var size = (metadata.size / units_per_tile) * 256;
                var loc_tile_x = ((zoomMeta.data.location.x - (metadata.size / 2) - game_min_x) / units_per_tile) * tsize;
                var loc_tile_y = ((zoomMeta.data.location.y - (metadata.size / 2) - game_min_y) / units_per_tile) * tsize;
                var points = this._VectorizeStructureOutline(metadata, loc_tile_x, loc_tile_y, size, zoomMeta.data.location.yaw);

                //Check if mouse is within points
                if (this._GetIsHit(x, y, points)) {
                    hits.push(zoomMeta.data);
                }
            }
        }
        return hits;
    }

    _GetIsHit(x, y, points) {
        var vs = points;
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    _VectorizeStructureOutline(metadata, loc_tile_x, loc_tile_y, size, rotation) {
        var scale = (1 / metadata.image_size.width) * size;
        var radians = (Math.PI / 180) * -rotation;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var points = [];
        for (var j = 0; j < metadata.outline.length; j += 1) {
            //Apply transformations to the points here
            var p = metadata.outline[j];
            var px = p.x;
            var py = p.y;

            //Apply rotation
            var cx = (metadata.image_size.width / 2);
            var cy = (metadata.image_size.width / 2);
            var tx = (cos * (px - cx)) + (sin * (py - cy)) + cx;
            var ty = (cos * (py - cy)) - (sin * (px - cx)) + cy;
            px = tx;
            py = ty;

            //Apply scale
            px *= scale;
            py *= scale;

            //Apply position
            px += loc_tile_x;
            py += loc_tile_y;

            //Draw
            points.push([px, py]);
        }
        return points;
    }

    _DrawRotatedTile(context, metadataClassname, x, y, angle, width, height) {
        var metadata = this.tool.metadata[metadataClassname];
        context.save();
        context.translate(x + (width / 2), y + (height / 2)); //janky fix because our position is from the upper-left corner
        context.rotate(angle * this.tool.TO_RADIANS);
        context.drawImage(this.tool.tiles, metadata.tile.x, metadata.tile.y, metadata.tile.width, metadata.tile.height, -(width / 2), -(height / 2), width, height);
        context.restore();
    }

}