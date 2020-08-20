"use strict";

class ServerDataPackageInventories extends ServerDataPackage {

    constructor(server) {
        super("Inventories", server, 2);
    }

    async FetchCount() {
        var url = this.server.GetEchoEndpointUrl("/inventories") + "?format=counts_only";
        var r = await DeltaTools.WebRequest(url, {});
        return r.count;
    }

    async FetchContent(offset, limit, requestArgs) {
        var url = this.server.GetEchoEndpointUrl("/inventories") + "?format=binary&limit=" + limit + "&skip=" + offset;
        var r = await DeltaTools.WebRequestBinary(url, null, {});
        return this.DecodePayload(r);
    }

    GetContentUniqueKey(e) {
        return e.holder_type + "@" + e.holder_type;
    }

    //Public API

    GetItemsFromInventory(holderType, holderId) {
        var items = this.GetByFilter((x) => {
            return x.holder_id == holderId && x.holder_type == holderType;
        });
        return items;
    }

    GetAllItemsFromInventoriesByName(query) {
        //Searches items by their screen name
        var results = this.server.app.SearchItemClassnamesByDisplayName(query);

        //Search
        return this.GetAllItemsFromInventories(results);
    }

    GetAllItemsFromInventories(classnames) {
        //Essentially acts as an item search. Returns all items, sorted by item classname, from inventories

        //First, find all items matching these classnames
        var items = this.GetByFilter((x) => {
            if (classnames == null) { return true; }
            var cn = x.classname;
            if (cn.endsWith("_C")) {
                cn = cn.substr(0, cn.length - 2);
            }
            return classnames.includes(cn);
        });

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
            //Check if we share any holders
            var found = false;
            for (var j = 0; j < itemHolders[items[i].classname].inventories.length; j += 1) {
                if (itemHolders[items[i].classname].inventories[j].holder_id == items[i].holder_id && itemHolders[items[i].classname].inventories[j].holder_type == items[i].holder_type && itemHolders[items[i].classname].inventories[j].tribe_id == items[i].tribe_id) {
                    itemHolders[items[i].classname].inventories[j].count += items[i].stack_size;
                    itemHolders[items[i].classname].total += items[i].stack_size;
                    found = true;
                }
            }
            if (!found) {
                itemHolders[items[i].classname].inventories.push({
                    "classname": items[i].classname,
                    "holder_id": items[i].holder_id,
                    "holder_type": items[i].holder_type,
                    "count": items[i].stack_size,
                    "tribe_id": items[i].tribe_id
                });
                itemHolders[items[i].classname].total = items[i].stack_size;
            }
        }

        //Convert this to a list
        var output = [];
        var keys = Object.keys(itemHolders);
        for (var i = 0; i < keys.length; i += 1) {
            output.push(itemHolders[keys[i]]);
        }

        //Total
        for (var i = 0; i < output.length; i++) {
            var total = 0;
            for (var j = 0; j < output[i].inventories.length; j++) {
                total += output[i].inventories[j].count;
            }
            output[i].total = total;
        }

        return output;
    }

    //Others

    DecodePayload(d) {
        //Check to make sure this is a valid file. Compare the magic code to "DWMS"
        if (d.getInt32(0, true) != 1229805380) {
            throw "Downloaded items file is not a valid Delta Web Map Binary Inventories file.";
        }

        //Check file type version
        if (d.getInt32(4, true) != 2) {
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
            names.push(DeltaWebFormatDecoder.ReadStringFromBuffer(d, offset + 1, len));
            offset += len + 1;
        }

        //Create output
        var output = [];

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
                    //Read key
                    var tagKeyLen = d.getUint16(offset + 0, true);
                    var key = DeltaWebFormatDecoder.ReadStringFromBuffer(d, offset + 2, tagKeyLen);
                    offset += 2 + tagKeyLen;

                    //Read value
                    var tagValueLen = d.getUint16(offset + 2, true);
                    var value = DeltaWebFormatDecoder.ReadStringFromBuffer(d, offset + 2, tagValueLen);
                    offset += 2 + tagValueLen;

                    //Set
                    custom[key] = value;
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
                output.push(result);
            }
        }
        return output;
    }

    EntityMatchesFilter(e) {
        return this.server.filter.CheckEntityItem(e);
    }

}