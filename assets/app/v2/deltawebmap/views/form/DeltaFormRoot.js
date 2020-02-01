"use strict";

class DeltaFormRoot extends DeltaForm {

	constructor(args) {
        super(null, args);
	}

	CreateView(args) {
		return DeltaTools.CreateDom("div", args);
	}

    Mount(parent) {
        parent.appendChild(this.dom);
    }

}