"use strict";

class DeltaPopoutModuleStatus {

    constructor(dino) {
        this.dino = dino;
    }

    Build(ctx, holder) {
        var d = DeltaTools.CreateDom("div", "popoutm2_dinostatus");

        //Add status
        var status = DeltaTools.CreateDom("div", "status_box_display popoutm2_dinostatus_status", d);
        status.innerText = statics.STATUS_STATES[this.dino.status].text;
        status.style.color = statics.STATUS_STATES[this.dino.status].modal_color;

        //Add action buttons
        this._AddActionBtn(d, "/assets/app/icons/modal_popout/dino_status/reveal_map.svg").addEventListener("click", () => {
            ctx.server.FlyToLocation(this.dino.location);
            holder.remove();
        });

        return d;
    }

    _AddActionBtn(parent, icon) {
        var e = DeltaTools.CreateDom("div", "popoutm2_dinostatus_action", parent);
        e.style.backgroundImage = "url(" + icon + ")";
        return e;
    }

}