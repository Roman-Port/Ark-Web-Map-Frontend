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
        return this.server.filter.CheckEntityDino(e) && !this.BLACKLISTED_CLASSNAMES.includes(e.classname);
    }

    GetContentUniqueKey(e) {
        return e.dino_id;
    }

}