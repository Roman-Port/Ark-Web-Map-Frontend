"use strict";

class ServerDataPackageStructures extends ServerDataPackage {

    constructor(server) {
        super("Structures", server, 3);
        this.HEADER_SIZE = 32;
        this.STRUCT_SIZE = 24;
        this.CHUNK_SIZE *= 15;
    }

    async FetchCount() {
        var url = this.server.GetEchoEndpointUrl("/structures") + "?format=counts_only";
        var r = await DeltaTools.WebRequest(url, {});
        return r.count;
    }

    async FetchContent(offset, limit, requestArgs) {
        var url = this.server.GetEchoEndpointUrl("/structures") + "?format=binary&limit=" + limit + "&skip=" + offset;
        var r = await DeltaTools.WebRequestBinary(url, null, {});
        return this.DecodePayload(r);
    }

    GetContentUniqueKey(e) {
        return e.structure_id;
    }

    GetDefaultSchema() {
        return {

        };
    }

    GetById(id) {
        var r = this.GetByFilter((x) => {
            return x.structure_id == id;
        });
        if (r.length > 0) {
            return r[0];
        } else {
            return null;
        }
    }

    DecodePayload(d) {
        //Get metadata
        var metadata = this.server.app.structureMetadata;

        //Check to make sure this is a valid file. Compare the magic code to "DWMS"
        if (d.getInt32(0, true) != 1397577540) {
            throw "Downloaded structures file is not a valid Delta Web Map Binary Structures file.";
        }

        //Check file type version
        if (d.getInt32(4, true) != 3) {
            throw "The file version of the Delta Web Map Binary Structures File is not supported. Outdated client?";
        }

        //Check metadata version
        if (d.getInt32(8, true) != 0) {
            throw "The metadata version of the Delta Web Map Binary Structures File does not match the version of the metadata that was downloaded. Try refreshing.";
        }

        //Get structures count and check if it matches
        var count = d.getInt32(12, true);
        if (count != (d.byteLength - this.HEADER_SIZE) / this.STRUCT_SIZE) {
            debugger;
            throw "The number of structures intended to be supplied does not match the number of structures sent! This might be an incomplete file.";
        }

        //Get other data from the header
        var epoch = d.getInt32(16, true);

        //Create data
        var output = [];

        //Convert data
        for (var index = 0; index < count; index += 1) {
            var offset = this.HEADER_SIZE + (index * this.STRUCT_SIZE);

            //Read raw data
            var metaIndex = d.getInt16(offset + 0, true); /* Metadata */
            var rotation = d.getUint8(offset + 2) / 0.70833333333333; /* Rotation, unscaled to convert back to 0-360 */
            var flags = d.getUint8(offset + 3); /* Flags */
            var x = d.getFloat32(offset + 4, true); /* X */
            var y = d.getFloat32(offset + 8, true); /* Y */
            var id = d.getInt32(offset + 12, true); /* ID */
            var z = d.getFloat32(offset + 16, true); /* Z */
            var tribe = d.getInt32(offset + 20, true); /* Tribe ID */

            //Check if we can locate metadata for this
            var structureClassname = "UNKNOWN_STRUCTURE";
            if (metaIndex == -1 || metadata.metadata[metaIndex] == null) {
                structureClassname = "UNKNOWN_STRUCTURE";
            } else {
                structureClassname = metadata.metadata[metaIndex].names[0];
            }

            //Reconstruct data
            var result = {
                "classname": structureClassname,
                "location": {
                    "x": x,
                    "y": y,
                    "z": z,
                    "pitch": 0,
                    "yaw": rotation,
                    "roll": 0
                },
                "structure_id": id,
                "has_inventory": ((flags >> 0) & 1) == 1,
                "tribe_id": tribe
            };

            //Add
            output.push(result);
        }
        return output;
    }

    EntityMatchesFilter(e) {
        return this.server.IsTribeFiltered(e.tribe_id);
        //return this.server.filter.CheckEntityStructure(e);
    }

}