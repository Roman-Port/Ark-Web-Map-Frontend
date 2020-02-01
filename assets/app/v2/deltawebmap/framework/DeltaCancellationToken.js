"use strict";

class DeltaCancellationToken {

    constructor(parent) {
        this.children = [];
        this.valid = true;
        if (parent != null) {
            parent.children.push(this);
        }
    }

    IsValid() {
        return this.valid;
    }

    Cancel() {
        this.valid = false;
        for (var i = 0; i < this.children.length; i += 1) {
            this.children[i].Cancel();
        }
    }

}