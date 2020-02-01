"use strict";

class DeltaForm {

    constructor(parent, args) {
        this.parent = parent;
        this.dom = this.CreateView(args);

        if (this.parent != null) {
            this.parent.AddChild(this);
        }
    }

    CreateView(args) {
        return DeltaTools.CreateDom("div", "");
    }

    AddChild(d) {
        this.dom.appendChild(d.dom);
    }

}