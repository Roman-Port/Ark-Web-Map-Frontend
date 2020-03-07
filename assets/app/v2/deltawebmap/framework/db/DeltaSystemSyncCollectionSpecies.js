"use strict";

class DeltaSystemSyncCollectionSpecies extends DeltaServerSyncCollection {

    constructor(db, name) {
        super(db, name);
        this.species = {};
    }

    GetSyncUrlBase() {
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/species.json";
    }

    GetPrimaryKey() {
        return "classname";
    }

    OnPostUpdate() {
        //Build a map for quick lookup
        for (var i = 0; i < this.items.length; i++) {
            this.species[this.items[i].classname] = this.items[i];
        }
    }

    GetSpeciesByClassName(classname) {
        var s = this.species[classname];
        if (s != null) {
            return s;
        }

        //This doesn't exist! Create a template so we don't cause errors
        return {
            "screen_name": "Unknown Dino",
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
                "image_url": "https://charlie-assets.deltamap.net/c342eeba-dca8-4944-b578-4c11f77362ce.png",
                "image_thumb_url": "https://charlie-assets.deltamap.net/d6385ad4-2a0e-4a19-a222-b20c9b68e991.png"
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