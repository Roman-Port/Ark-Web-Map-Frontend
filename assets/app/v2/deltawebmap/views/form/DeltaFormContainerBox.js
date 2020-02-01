"use strict";

class DeltaFormContainerBox extends DeltaForm {

    constructor(parent, args) {
        super(parent, args);
    }

    CreateView(args) {
        return DeltaTools.CreateDom("div", "vf_container_box");
    }

}