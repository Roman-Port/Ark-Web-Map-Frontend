"use strict";

class ServerDataPackageDinos extends ServerDataPackage {

    constructor(server) {
        super("Dinos", server, 0);
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
        return this.server.filter.CheckEntityDino(e);
    }

    GetContentUniqueKey(e) {
        return e.dino_id;
    }

}