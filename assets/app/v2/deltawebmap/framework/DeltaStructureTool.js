"use strict";

class DeltaStructureTool {

    constructor(app) {
        this.app = app;
        this.metadata = null;
        this.tiles = null;
        this.TO_RADIANS = Math.PI / 180;
    }

    async Init() {
        var m = await DeltaTools.WebRequest(window.LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/structure_metadata.json", {}, null);
        this.metadata = {};
        for (var i = 0; i < m.metadata.length; i += 1) {
            for (var j = 0; j < m.metadata[i].names.length; j += 1) {
                this.metadata[m.metadata[i].names[j]] = m.metadata[i];
            }
        }
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
        this.dataset = d;

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
                    zoomData.tileXMin = Math.floor((data.location.x - mSize + calcOffset) / this.zoomData[zoom][1]);
                    zoomData.tileYMin = Math.floor((data.location.y - mSize + calcOffset) / this.zoomData[zoom][1]);
                    zoomData.tileXMax = Math.floor((data.location.x + mSize + calcOffset) / this.zoomData[zoom][1]);
                    zoomData.tileYMax = Math.floor((data.location.y + mSize + calcOffset) / this.zoomData[zoom][1]);
                    zoomData.size = (this.tool.metadata[data.classname].size / this.zoomData[zoom][1]) * tsize;
                    zoomData.show = zoomData.size > 5;
                }
                zooms.push(zoomData);
            }
            //var loc_tile_x = ((data.location.x - (this.tool.metadata[data.classname].size / 2) - ((tileX * this.zoomData[zoom][1]) - calcOffset)) / this.zoomData[zoom][1]) * tsize;
            //var loc_tile_y = ((data.location.y - (this.tool.metadata[data.classname].size / 2) - ((tileY * this.zoomData[zoom][1]) - calcOffset)) / this.zoomData[zoom][1]) * tsize;
            this.datasetMetadata[data.structure_id] = {
                "zoom": zooms
            };
        }

        //Redraw now if first, else queue
        if (this.firstSet) {
            this.RedrawAll();
            this.firstSet = false;
        }
    }

    RedrawAll() {
        this.activeLayer.redraw();
    }

    _ProcessNewTile(tileSize, tileX, tileY, tileZ, e) {
        //Create canvas
        var canvas = DeltaTools.CreateDom("canvas", "map_structure_tile_image_canvas map_structure_tile_image_canvas_priority", e);
        canvas.width = tileSize;
        canvas.height = tileSize;

        //Add all of the elements to this
        var found = this._ProcessTileImage(canvas.getContext('2d'), tileSize, tileX, tileY, tileZ, 0, 0);

        return found;
    }

    _ProcessTileImage(context, tileSize, tileX, tileY, tileZ, globalOffsetX, globalOffsetY) {
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
            var loc_tile_x = ((x - (mSize / 2) - game_min_x) / units_per_tile) * tsize;
            var loc_tile_y = ((y - (mSize / 2) - game_min_y) / units_per_tile) * tsize;

            //Draw this
            this._DrawRotatedTile(context, data.classname, loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, rotation, size, size);

            //Add to list of found tiles
            found.push({
                "x": loc_tile_x + globalOffsetX,
                "y": loc_tile_y + globalOffsetY,
                "r": rotation,
                "s": size,
                /*"hit": this.CreateVectorPoints(metadata, loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, rotation, size),*/
                "has_inventory": data.has_inventory,
                "data": data
            });
        }
        return found;
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