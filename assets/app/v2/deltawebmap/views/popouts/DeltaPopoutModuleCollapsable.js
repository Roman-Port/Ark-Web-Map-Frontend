"use strict";

class DeltaPopoutModuleCollapsable {

    constructor(title, openDefault) {
        this.title = title;
        this.open = openDefault;
    }

    Build(ctx, holder) {
        this.ctx = ctx;
        var h = DeltaTools.CreateDom("div", "popoutm2_collapse");
        this.h = h;
        var top = DeltaTools.CreateDom("div", "popoutm2_collapse_top", h, this.title);
        top.addEventListener("click", () => {
            this.open = !this.open;
            this.h.classList.toggle("popoutm2_state_closed");
            this.ctx.UpdatePos();
        });
        this.main = this.BuildCollapseArea(ctx, holder);
        this.main.classList.add("popoutm2_main");
        if (!this.open) {
            this.h.classList.add("popoutm2_state_closed");
        }
        h.appendChild(this.main);
        return h;
    }

    BuildCollapseArea(ctx, rootHolder) {
        throw "You must overwrite this.";
    }

    ShouldDisplay() {
        return true;
    }

}