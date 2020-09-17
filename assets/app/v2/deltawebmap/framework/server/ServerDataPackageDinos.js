"use strict";

class ServerDataPackageDinos extends ServerDataPackage {

    constructor(server) {
        super("Dinos", server, 0);
        this.BLACKLISTED_CLASSNAMES = [
            "Raft_BP",
            "MotorRaft_BP",
            "ExtendedRaft_BP", //modded
            "BigRaft_BP", //modded
            "Barge_BP", //modded
        ]; //most of these are rafts
    }

    async FetchCount() {
        var url = this.server.GetEchoEndpointUrl("/dinos") + "?format=counts_only";
        var r = await DeltaTools.WebRequest(url, {});
        return r.count;
    }

    async FetchContent(offset, limit, requestArgs) {
        var url = this.server.GetEchoEndpointUrl("/dinos") + "?limit=" + limit + "&skip=" + offset;
        var r = await DeltaTools.WebRequest(url, {});
        return r.content;
    }

    GetById(dinoId) {
        var r = this.GetByFilter((x) => {
            return x.dino_id == dinoId;
        });
        if (r.length > 0) {
            return r[0];
        } else {
            return null;
        }
    }

    EntityMatchesFilter(e) {
        return this.server.IsTribeFiltered(e.tribe_id) && !this.BLACKLISTED_CLASSNAMES.includes(e.classname);
        //return this.server.filter.CheckEntityDino(e) && !this.BLACKLISTED_CLASSNAMES.includes(e.classname);
    }

    GetContentUniqueKey(e) {
        return e.dino_id;
    }

    GetDefaultSchema() {
        return {
            "tribe_id":0,
            "dino_id": "0",
            "is_female": false,
            "colors": [],
            "colors_hex": [],
            "tamed_name": "",
            "tamer_name": "",
            "classname": "",
            "current_stats": [],
            "max_stats": [],
            "base_levelups_applied": [],
            "tamed_levelups_applied": [],
            "base_level": 0,
            "level": 0,
            "experience": 0,
            "is_baby": false,
            "baby_age": 0,
            "next_imprint_time": 0.0,
            "imprint_quality": 0.0,
            "location": {
                "x": 0,
                "y": 0,
                "z": 0,
                "pitch": 0,
                "yaw": 0,
                "roll": 0
            },
            "status": "NEUTRAL",
            "taming_effectiveness": 0,
            "is_cryo": false,
            "experience_points": 0,
            "last_sync_time": null,
            "is_alive": true,
            "tribe_prefs": {
                "color_tag": null,
                "note": ""
            }
        };
    }

}