"use strict";

class DeltaPopoutModuleTitle {

    constructor(icon, title, subtitle) {
        this.icon = icon;
        this.title = title;
        this.subtitle = subtitle;
    }

    Build(ctx, holder) {
        var d = DeltaTools.CreateDom("div", "popoutm2_top");
        var i = DeltaTools.CreateDom("div", "popoutm2_top_img", d);
        i.style.backgroundImage = "url('" + this.icon + "')";
        DeltaTools.CreateDom("div", "popoutm2_top_textt", d, this.title);
        DeltaTools.CreateDom("div", "popoutm2_top_textb", d, this.subtitle);
        return d;
    }

}