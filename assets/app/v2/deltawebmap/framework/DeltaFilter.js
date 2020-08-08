"use strict";

class DeltaFilter {

    constructor() {
        this.filters = {};
        this.unpacked = [];
    }

    SetNewFilters(filters) {
        //Set
        this.filters = filters;

        //Unpack
        this.unpacked = [];
        var k = Object.keys(this.filters);
        for (var i = 0; i < k.length; i += 1) {
            var t = k[i];
            var f = null;

            //Find the function to use for this. Function parameters:
            //q : The data passed alongside the filter
            //e : The entity to check
            //eType : The type of the entity. One of these three: ["DINO", "STRUCTURE", "ITEM"]
            if (t == "SEX") {
                f = (q, e, eType) => {
                    if (eType != "DINO") {
                        return true;
                    }
                    if (q == "male") {
                        return !e.is_female;
                    } else if (q == "female") {
                        return e.is_female;
                    } else {
                        return false;
                    }
                }
            }

            //Insert into unpacked
            this.unpacked.push({
                "data": this.filters[k[i]],
                "challenge": f,
                "type": t
            });
        }
    }

    CheckFilter(entity, entityType) {
        //Loop through filters
        for (var i = 0; i < this.unpacked.length; i += 1) {
            var passed = this.unpacked[i].challenge(this.unpacked[i].data, entity, entityType);
            if (!passed) {
                return false;
            }
        }
        return true;
    }

    CheckEntityDino(e) {
        return this.CheckFilter(e, "DINO");
    }

    CheckEntityStructure(e) {
        return this.CheckFilter(e, "STRUCTURE");
    }

    CheckEntityItem(e) {
        return this.CheckFilter(e, "ITEM");
    }

}