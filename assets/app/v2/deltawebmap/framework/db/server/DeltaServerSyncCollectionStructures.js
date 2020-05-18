"use strict";

class DeltaServerSyncCollectionStructures extends DeltaDbCollectionMemory {

    constructor(db, name) {
        super(db, name);
        this.HEADER_SIZE = 32;
        this.STRUCT_SIZE = 24;
    }

    GetSyncUrlBase() {
        return this.db.server.GetTribesEndpointUrl("/structures");
    }

    GetPrimaryKey() {
        return "structure_id";
    }

    GetEpochKeyName() {
        return this.fullname + "~" + this.db.server.tribe + "~LAST_EPOCH";
    }

    GetRPCSyncType() {
        return 3;
    }

    GetDbStore() {
        return "structure_id, tribe_id, classname";
    }

    async RequestWebData(epoch) {
        //Get metadata if we haven't
        if (DeltaServerSyncCollectionStructures._metadata == null) {
            DeltaServerSyncCollectionStructures._metadata = DeltaTools.WebRequest(window.LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/structure_metadata.json", {}, null);
        }
        var metadata = await DeltaServerSyncCollectionStructures._metadata;

        //Get the binary format
        var d = await DeltaTools.WebRequestBinary(this.GetSyncUrlBase() + "?format=binary&last_epoch=" + epoch);

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
            throw "The number of structures intended to be supplied does not match the number of structures sent! This might be an incomplete file.";
        }

        //Get other data from the header
        var epoch = d.getInt32(16, true);

        //Create data
        var r = {
            "adds": [],
            "removes": [],
            "epoch": epoch
        };

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
            if (metaIndex == -1 || metadata.metadata[metaIndex] == null) {
                continue;
            }

            //Reconstruct data
            var result = {
                "classname": metadata.metadata[metaIndex].names[0],
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
            var isRemove = ((flags >> 1) & 1) == 1;

            //Add to desired array
            if (!isRemove) {
                r.adds.push(result);
            } else {
                r.removes.push(result);
            }
        }
        return r;
    }

}