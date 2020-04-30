"use strict";

class DeltaBannerMount {

    constructor(mount, extraStyle, updateListener) {
        this.mount = mount;
        this.queue = [];
        this.active = null;
        this.extraStyle = extraStyle;
        this.updateListener = updateListener;
    }

    CreateBanner(context, data, mod, closeAction) {
        return this._BuildBanner(data.id, context, "advanced_banner_style_red", "The owner of this ARK server enabled admin mode recently. Admins of this server have been given them access to see your tribe data.", [], closeAction);
    }

    AddBanner(style, body, actions, closeAction, typeTag) {
        //Check to see if a banner with this type tag already exists. Type tags are unique
        if (typeTag != null) {
            var r = this._ForEachBanners((b) => {
                if (b.x_ctx.type == typeTag) {
                    return b.x_uuid;
                }
            });
            if (r != null) { return r; }
        }

        //Get the next UUID
        var uuid = DeltaBannerMount._GetNextId();

        //Create context
        var context = {
            "closeAction": closeAction,
            "type": typeTag
        };

        //Create close action
        var close = null;
        if (closeAction != null) {
            close = (d_uuid, d, d_ctx) => {
                //Destroy the current banner
                d.remove();

                //Add the next banner, if any
                if (this.queue.length > 0) {
                    this._MountBanner(this.queue.splice(0, 1));
                } else {
                    if (this.updateListener != null) {
                        this.updateListener(null);
                    }
                    this.active = null;
                }

                //Send notification
                d_ctx(d_uuid, d, d_ctx);
            }
        }

        //Create banner
        var banner = DeltaBannerMount._BuildBanner(uuid, context, style, body, actions, close);
        if (this.extraStyle != null) {
            banner.classList.add(this.extraStyle);
        }

        //Show banner
        if (this.queue.length == 0) {
            this._MountBanner(banner);
        } else {
            this.queue.push(banner);
        }

        return uuid;
    }

    RemoveType(typeTag) {
        var r = this._ForEachBanners((b) => {
            if (b.x_ctx.type == typeTag) {
                return b.x_uuid;
            }
        });
        if (r != null) {
            return this.RemoveUuid(r);
        }
        return false;
    }

    RemoveUuid(uuid) {
        //Try to remove active
        if (this.active != null) {
            if (this.active.x_uuid == uuid) {
                this.active.remove();
                if (this.updateListener != null) {
                    this.updateListener(null);
                }
                this.active = null;
                return true;
            }
        }

        //Remove from queue
        for (var i = 0; i < this.queue.length; i += 1) {
            if (this.queue[i].x_uuid == uuid) {
                this.queue.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    _ForEachBanners(cb) {
        if (this.active != null) {
            var b = cb(this.active);
            if (b != null) {
                return b;
            }
        }
        for (var i = 0; i < this.queue.length; i += 1) {
            var b = cb(this.queue[i]);
            if (b != null) {
                return b;
            }
        }
    }

    _MountBanner(banner) {
        this.mount.appendChild(banner);
        this.active = banner;
        if (this.updateListener != null) {
            this.updateListener(banner);
        }
    }

    static _GetNextId() {
        if (DeltaBannerMount.uuid == null) {
            DeltaBannerMount.uuid = 0;
        }
        var uuid = DeltaBannerMount.uuid;
        DeltaBannerMount.uuid++;
        return uuid;
    }

    static _BuildBanner(uuid, context, style, body, actions, closeAction) {
        var e = DeltaTools.CreateDom("div", "advanced_banner_container");
        e.classList.add(style);
        DeltaTools.CreateDom("div", "advanced_banner_body", e).innerText = body;
        for (var i = 0; i < actions.length; i += 1) {
            var b = DeltaTools.CreateDom("div", "advanced_banner_btn", e);
            b.innerText = actions[i].text;
            b.x_ctx = context;
            b.x_cb = actions[i].callback;
            b.addEventListener("click", function () {
                this.x_cb(this.x_ctx, this);
            });
        }
        e.x_uuid = uuid;
        e.x_ctx = context;
        if (closeAction != null) {
            var closeBtn = DeltaTools.CreateDom("div", "advanced_banner_btn_close", e);
            closeBtn.x_action = closeAction;
            closeBtn.addEventListener("click", function () {
                this.x_action(this.parentNode.x_uuid, this.parentNode, this.parentNode.x_ctx);
            });
        }
        return e;
    }

}