"use strict";

class DeltaServerSyncCollectionInventories extends DeltaServerSyncCollection {

    constructor(db, name) {
        super(db, name);
    }

    GetSyncUrlBase() {
        return this.db.server.GetTribesEndpointUrl("/inventories");
    }

    GetPrimaryKey() {
        return "structure_id";
    }

    GetEpochKeyName() {
        return this.fullname + "~" + this.db.server.tribe + "~LAST_EPOCH";
    }

    GetRPCSyncType() {
        return 2;
    }

    static ReadStringFromBuffer(buf, offset, len) {
        var s = "";
        for (var i = 0; i < len; i += 1) {
            s += String.fromCharCode(buf.getUint8(offset + i));
        }
        return s;
    }

    async RequestWebData(epoch) {
        //Get the binary format
        var d = await DeltaTools.WebRequestBinary(this.GetSyncUrlBase() + "?format=binary&last_epoch=" + epoch);

        //Check to make sure this is a valid file. Compare the magic code to "DWMS"
        if (d.getInt32(0, true) != 1229805380) {
            throw "Downloaded items file is not a valid Delta Web Map Binary Structures file.";
        }

        //Check file type version
        if (d.getInt32(4, true) != 1) {
            throw "The file version of the Delta Web Map Binary Inventories File is not supported. Outdated client?";
        }

        //Get other data from the header
        var count = d.getInt32(12, true);
        var epoch = d.getInt32(16, true);
        var nameCount = d.getInt32(20, true);

        //Read name table
        var offset = 32;
        var names = [];
        for (var i = 0; i < nameCount; i += 1) {
            var len = d.getUint8(offset);
            names.push(DeltaServerSyncCollectionInventories.ReadStringFromBuffer(d, offset + 1, len));
            offset += len + 1;
        }

        //Create data
        var r = {
            "adds": [],
            "removes": [],
            "epoch": epoch
        };

        //Convert data
        for (var index = 0; index < count; index += 1) {
            //Read raw header data
            var holderId = DeltaBigIntegerReader.ConvertArrayBufferToString(d, offset + 0, 8);
            var holderType = d.getUint8(offset + 8);
            var itemCount = d.getUint16(offset + 9, true);
            var tribeId = d.getInt32(offset + 11, true);
            offset += 15;

            //Read items
            for (var i = 0; i < itemCount; i += 1) {
                //Read raw item header
                var itemId = DeltaBigIntegerReader.ConvertArrayBufferToString(d, offset + 0, 8);
                var classname = names[d.getUint32(offset + 8, true)];
                var durability = d.getFloat32(offset + 12, true);
                var stackSize = d.getInt16(offset + 16, true);
                var flags = d.getUint16(offset + 18, true);
                var customLength = d.getUint8(offset + 20);
                var custom = {};
                offset += 21;

                //Read custom data
                for (var j = 0; j < customLength; j += 1) {
                    var tag = d.getUint16(offset + 0, true);
                    var tagLen = d.getUint16(offset + 2, true);
                    var val = DeltaServerSyncCollectionInventories.ReadStringFromBuffer(d, offset + 4, tagLen);
                    custom[tag] = val;
                    offset += 4 + tagLen;
                }

                //Add item data
                var result = {
                    "holder_id": holderId,
                    "holder_type": holderType,
                    "tribe_id": tribeId,
                    "item_id": itemId,
                    "classname": classname,
                    "durability": durability,
                    "stack_size": stackSize,
                    "flags": flags,
                    "custom_data": custom
                };

                //Add to desired array
                r.adds.push(result);
            }
        }
        return r;
    }

    HandleRPCUpdate(d) {
        debugger;
    }

    async GetAllItemsFromInventoriesByName(query) {
        //Searches items by their screen name
        var results = this.db.app.SearchItemClassnamesByDisplayName(query);

        //Search
        return await this.GetAllItemsFromInventories(results);
    }

    async GetAllItemsFromInventories(classnames) {
        //Essentially acts as an item search. Returns all items, sorted by item classname, from inventories

        //First, find all items matching these classnames
        var items = await this.GetDbCollection().filter((x) => {
            var cn = x.classname;
            if (cn.endsWith("_C")) {
                cn = cn.substr(0, cn.length - 2);
            }
            return classnames.includes(cn);
        }).toArray();

        //Loop through and add item inventory holders
        var itemHolders = {};
        for (var i = 0; i < items.length; i += 1) {
            if (itemHolders[items[i].classname] == null) {
                itemHolders[items[i].classname] = {
                    "classname": items[i].classname,
                    "inventories": []
                }
            }
        }

        //Loop through and add items to holders
        for (var i = 0; i < items.length; i += 1) {
            itemHolders[items[i].classname].inventories.push(items[i]);
        }

        //Convert this to a list
        var output = [];
        var keys = Object.keys(itemHolders);
        for (var i = 0; i < keys.length; i += 1) {
            output.push(itemHolders[keys[i]]);
        }

        return output;
    }

}