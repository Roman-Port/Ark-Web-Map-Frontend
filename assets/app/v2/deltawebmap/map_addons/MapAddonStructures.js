"use struct";

class MapAddonStructures extends TabMapAddon {

    constructor(map) {
        super(map);
        this.loadQueue = []; //This is a queue of tiles we need to produce when we're done loading structure images
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */
        
    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Get the tile data
        this.tiles = await this.map.server.GetStructuresData();

        //Create the map layer
        var mapSettings = {
            updateWhenZooming: false,
            maxZoom: 12,
            id: 'structures',
            opacity: 1,
            zIndex: 10,
            bounds: [
                [-256, 0],
                [0, 256]
            ],
            addon: this
        };
        
        this.layer = new MapAddonStructuresLayer(mapSettings);
        this.layer.addTo(this.map.map);
    }

    async OnUnload(container) {
        this.map.map.removeLayer(this.layer);
    }

    ProcessTile(et, e, coords, tsize) {
        //Get context
        var d = this.tiles;
        var context = e.getContext('2d');

        //Calculate the range of data
        var calcOffset = this.map.server.session.mapData.captureSize / 2;
        var units_per_tile = this.map.server.session.mapData.captureSize / Math.pow(2, coords.z);
        var game_min_x = (coords.x * units_per_tile) - calcOffset;
        var game_min_y = (coords.y * units_per_tile) - calcOffset;
        var game_max_x = ((coords.x + 1) * units_per_tile) - calcOffset;
        var game_max_y = ((coords.y + 1) * units_per_tile) - calcOffset;

        //Add all of the elements to this
        var found = this.WriteToCanvas(context, d, game_min_x, game_min_y, game_max_x, game_max_y, tsize, units_per_tile, 0, 0);

        //Add the highlightable parts
        et.x_hl = found;
        et.x_has_hl = false;
        et.x_ctx = this;
        et.addEventListener("mouseover", function () {
            if (et.x_has_hl) {
                return;
            }
            et.x_has_hl = true;
            this.x_ctx.AddClickRegions(this.x_hl, this);
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

    AddClickRegions (found, parent) {
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

    WriteToCanvas (context, d, game_min_x, game_min_y, game_max_x, game_max_y, tsize, units_per_tile, globalOffsetX, globalOffsetY) {
        var found = [];
        for (var i = 0; i < d.s.length; i += 1) {
            var s = d.s[i];

            //Check if this is within range
            if (s.x > game_max_x + (s.s * 1.5) || s.x < game_min_x - (s.s * 1.5)) {
                continue;
            }
            if (s.y > game_max_y + (s.s * 1.5) || s.y < game_min_y - (s.s * 1.5)) {
                continue;
            }

            //Do size calculations
            var size = (s.s / units_per_tile) * tsize.x;

            //Skip if it is too small
            if (size < 5) {
                continue;
            }

            //Determine location
            var loc_tile_x = ((s.x - (s.s / 2) - game_min_x) / units_per_tile) * tsize.x;
            var loc_tile_y = ((s.y - (s.s / 2) - game_min_y) / units_per_tile) * tsize.y;

            //Draw this
            this.DrawRotatedImage(context, STRUCTURE_TILES_CACHE[d.i[s.i]], loc_tile_x + globalOffsetX, loc_tile_y + globalOffsetY, s.r, size, size);

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

        //Request an index of all structures
        var index = await DeltaTools.WebRequest("https://echo-content.deltamap.net/structure_metadata.json", {}, null);

        //Load all
        var promises = [];
        for (var i = 0; i < index.metadata.length; i += 1) {
            promises.push(this.LoadStructureStoreImage(index, index.metadata[i].img));
        }

        //Wait for all to finish
        await Promise.all(promises);

        return true;
    }

    static async LoadStructureStoreImage(index, name) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = function () {
                STRUCTURE_TILES_CACHE[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = index.image_url.replace("{image}", name);
        });
    }
}

var STRUCTURE_TILES_CACHE = {};
var STRUCTURE_TILES_CACHE_TASK = MapAddonStructures.LoadStructureStore();

var MapAddonStructuresLayer = L.GridLayer.extend({
    createTile: function (coords, done) {
        var addon = this.options.addon;
        var tsize = this.getTileSize();

        var et = DeltaTools.CreateDom("div", "leaflet-tile map_structure_tile_image");
        var es = DeltaTools.CreateDom("canvas", "", et);
        es.width = tsize.x;
        es.height = tsize.y;
        et.width = tsize.x;
        et.height = tsize.y;

        STRUCTURE_TILES_CACHE_TASK.then(function (e) {
            var tile = addon.ProcessTile(et, es, coords, tsize);
            done(null, tile);
        });

        return et;
    }
});