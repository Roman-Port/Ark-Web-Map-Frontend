"use strict";

class DeltaSystemSyncCollectionItems extends DeltaDbCollectionIndexedDB {

    constructor(db, name) {
        super(db, name);
        this.items = {};
    }

    GetSyncUrlBase() {
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/items.json";
    }

    GetPrimaryKey() {
        return "classname";
    }

    async Sync() {
        await super.Sync();

        //Build a map for quick lookup
        await this.BuildMap();
    }

    OnPostUpdate() {

    }

    GetDbStore() {
        return "classname, structure_classname";
    }

    async BuildMap() {
        var items = await this.GetDbCollection().toArray();
        for (var i = 0; i < items.length; i++) {
            this.items[items[i].classname] = items[i];
        }
    }

    SearchItemClassNamesByDisplayName(query) {
        var results = [];
        var k = Object.keys(this.items);
        for (var i = 0; i < k.length; i += 1) {
            if (this.items[k[i]].name.toLowerCase().includes(query) || name == "") {
                results.push(k[i]);
            }
        }
        return results;
    }

    GetItemEntryByClassName(classname, defaultToNull) {
        var s = this.items[classname];
        if (s != null) {
            return s;
        }

        if (defaultToNull != null && defaultToNull == true) {
            return null;
        }

        //This doesn't exist! Create a template so we don't cause errors
        return {
            "classname": classname,
            "icon": {
                "image_url": "https://icon-assets.deltamap.net/unknown_dino.png",
                "image_thumb_url": "https://icon-assets.deltamap.net/unknown_dino.png"
            },
            "hideFromInventoryDisplay": false,
            "useItemDurability": false,
            "isTekItem": false,
            "allowUseWhileRiding": false,
            "name": classname,
            "description": "Unknown item. It may be modded and is unsupported at this time.",
            "spoilingTime": 0.0,
            "baseItemWeight": 0.0,
            "useCooldownTime": 0.0,
            "baseCraftingXP": 1.0,
            "baseRepairingXP": 0.0,
            "maxItemQuantity": 0,
            "addStatusValues": {

            }
        };
    }

    async GetItemEntryByStructureClassNameAsync(classname) {
        return await this.GetDbCollection().get({ "structure_classname": classname });
    }

    /*async RequestWebData(epoch) {
        //Fetch and decode
        var d = await DeltaWebFormatDecoder.DownloadAndDecode(LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/items.json?format=binary&last_epoch=" + epoch);

        //Format
        return {
            "adds": d.content,
            "removes": [],
            "epoch": d.customData[0]
        };
    }*/

}