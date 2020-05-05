"use strict";

class DeltaSystemSyncCollectionItems extends DeltaSyncCollection {

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

    GetItemEntryByClassName(classname) {
        var s = this.items[classname];
        if (s != null) {
            return s;
        }

        //This doesn't exist! Create a template so we don't cause errors
        return {
            "screen_name": classname,
            "colorizationIntensity": 1,
            "babyGestationSpeed": -1,
            "extraBabyGestationSpeedMultiplier": -1,
            "babyAgeSpeed": 0.000003,
            "extraBabyAgeSpeedMultiplier": 0,
            "useBabyGestation": false,
            "extraBabyAgeMultiplier": 1.7,
            "statusComponent": {
                "baseFoodConsumptionRate": -0.001852,
                "babyDinoConsumingFoodRateMultiplier": 25.5,
                "extraBabyDinoConsumingFoodRateMultiplier": 20,
                "foodConsumptionMultiplier": 1,
                "tamedBaseHealthMultiplier": 1
            },
            "adultFoods": [],
            "childFoods": [],
            "classname": "Argent_Character_BP",
            "icon": {
                "image_url": "https://icon-assets.deltamap.net/unknown_dino.png",
                "image_thumb_url": "https://icon-assets.deltamap.net/unknown_dino.png"
            },
            "baseLevel": [100, 100, 100, 100, 100, 100, 0, 0, 1, 1, 0, 1],
            "increasePerWildLevel": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "increasePerTamedLevel": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "additiveTamingBonus": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "multiplicativeTamingBonus": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "statImprintMult": null
        }
    }

}