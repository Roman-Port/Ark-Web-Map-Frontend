"use strict";

class BinaryStructureSource {

    constructor(server) {
        this.server = server;
        this._load = this._InternalLoad();
        this.HEADER_SIZE = 16;
        this.STRUCT_SIZE = 16;
        this.cache = [];
    }

    async _InternalLoad() {
    /* Begins loading process, run internally */

        //Download data
        var d = await DeltaTools.WebRequestBinary(LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/" + this.server.id + "/tribes/" + this.server.tribe + "/structures?format=binary", this.server.token);

        //Check to make sure this is a valid file. Compare the magic code to "DWMS"
        if (d.getInt32(0, true) != 1397577540) {
            throw "Downloaded structures file is not a valid Delta Web Map Binary Structures file.";
        }

        //Check file type version
        if (d.getInt32(4, true) != 1) {
            throw "The file version of the Delta Web Map Binary Structures File is not supported. Outdated client?";
        }

        //Check metadata version
        if (d.getInt32(8, true) != 0) {
            throw "The metadata version of the Delta Web Map Binary Structures File does not match the version of the metadata that was downloaded. Try refreshing.";
        }

        //Get structures count and check if it matches
        var count = d.getInt32(12, true);
        if (count != (d.byteLength - this.HEADER_SIZE) / this.STRUCT_SIZE) {
            throw "The number of structures intended to be supplied does not match the number of structures sent! This might be an incomplete file.";
        }

        //Create cache
        for (var index = 0; index < count; index += 1) {
            var r = [
                d.getInt16(this._GetStructureOffset(index, 0), true), /* Metadata */
                d.getInt16(this._GetStructureOffset(index, 2), true), /* Rotation */
                d.getFloat32(this._GetStructureOffset(index, 4), true), /* X */
                d.getFloat32(this._GetStructureOffset(index, 8), true), /* Y */
                d.getInt32(this._GetStructureOffset(index, 12), true) /* ID */
            ];
            this.cache.push(r);
        }

        return d;
    }

    async _InternalGet() {
        /* Returns the data */
        return await this._load;
    }

    _GetStructureOffset(index, extra) {
        /* Returns an offset to the structure index, plus extra */
        return this.HEADER_SIZE + (index * this.STRUCT_SIZE) + extra;
    }

    async GetStructureCount() {
        /* Retruns the number of structures */
        var d = await this._InternalGet();
        return (d.byteLength - this.HEADER_SIZE) / this.STRUCT_SIZE;
    }

    GetStructureData(index) {
        /* Returns metadata for a structure at index */
        return this.cache[index];
    }

}