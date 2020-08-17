"use strict";

class DeltaPopoutModuleUpdated {

    constructor(lastUpdated, updateCallback) {
        this.lastUpdated = lastUpdated;
        this.updateCallback = updateCallback;
    }

    Build(ctx, holder) {
        //Make text
        var text = "Updated " + new moment(this.lastUpdated).fromNow();

        //Create
        var d = DeltaTools.CreateDom("div", "popoutm2_updated");
        this.holder = d;
        this.text = DeltaTools.CreateDom("span", null, d, text);
        if (this.updateCallback != null) {
            this.btn = DeltaTools.CreateDom("div", "popoutm2_updated_btn", d);
            this.btn.addEventListener("click", this.updateCallback);
            this.btn.addEventListener("click", () => {
                //Create spinner
                DeltaTools.CreateDom("div", "loading_spinner popoutm2_updated_loader", this.holder);

                //Set text
                this.text.innerText = "Updating from ARK server...";

                //Remove button
                this.btn.remove();
            });
        }
        return d;
    }

    ShouldDisplay() {
        return true;
    }

}