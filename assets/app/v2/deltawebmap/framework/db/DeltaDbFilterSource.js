"use strict";

//Used for DeltaDbSessions as a way of moving filters about for multiple sessions
class DeltaDbFilterSource {

    constructor() {
        this._filter = null;
        this._sessions = [];
    }

    CheckFilter() {
        if (this._filter == null) {
            return true;
        } else {
            return this._filter();
        }
    }

    SetSession(session) {
        this._sessions.push(session);
        session.filter = this;
    }

    SetFilter(filter) {
        this._filter = filter;
        this.RefreshFilters();
    }

    RefreshFilters() {
        for (var i = 0; i < this._sessions.length; i += 1) {
            this._sessions[i].RefreshFilter();
        }
    }

}