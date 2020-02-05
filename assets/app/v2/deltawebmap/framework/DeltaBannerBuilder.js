"use strict";

class DeltaBannerBuilder {

    constructor() {

    }

    CreateBanner(context, data, mod, closeAction) {
        return this._BuildBanner(data.id, context, "advanced_banner_style_red", "The owner of this ARK server enabled admin mode recently. Admins of this server have been given them access to see your tribe data.", [], [], closeAction);
    }

    _BuildBanner(uuid, context, style, body, btnTexts, btnActions, closeAction) {
        var e = DeltaTools.CreateDom("div", "advanced_banner_container");
        e.classList.add(style);
        DeltaTools.CreateDom("div", "advanced_banner_body", e).innerText = body;
        for (var i = 0; i < btnTexts.length; i += 1) {
            var b = DeltaTools.CreateDom("div", "advanced_banner_btn", e);
            b.innerText = btnTexts[i];
            b.x_ctx = context;
            b.x_cb = btnActions[i];
            b.addEventListener("click", function () {
                this.x_cb(this.x_ctx, this);
            });
        }
        e.x_uuid = uuid;
        if (closeAction != null) {
            var closeBtn = DeltaTools.CreateDom("div", "advanced_banner_btn_close", e);
            closeBtn.x_action = closeAction;
            closeBtn.addEventListener("click", function () {
                this.x_action(this.parentNode);
            });
        }
        return e;
    }

}