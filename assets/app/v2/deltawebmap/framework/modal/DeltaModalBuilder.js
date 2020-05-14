"use strict";

class DeltaModalBuilder {

    constructor(addonMode, extraClassNameBody, extraClassNameElement) {
        this.working = DeltaTools.CreateDom("div", null);

        if (addonMode == true || addonMode == null) {
            this.working.classList.add("modal_view_builder");
            this.nav = DeltaTools.CreateDom("div", "modal_view_nav", this.working);
        }

        if (extraClassNameBody != null) {
            this.working.classList.add(extraClassNameBody);
        }
        this.extraClassNameElement = extraClassNameElement;
    }

    AddContentTitle(text) {
        this.AddContentCustomText("modal_preset_title", text);
    }

    AddContentDescription(text) {
        this.AddContentCustomText("modal_preset_subtitle", text);
    }

    AddContentWarningBox(text) {
        this.AddContentCustomText("modal_preset_warning", text);
    }

    AddContentCustomText(textClass, text) {
        var t = DeltaTools.CreateDom("div", textClass, null, text);
        this._AddContent(t);
        return t;
    }

    AddContentCustom(dom) {
        this._AddContent(dom);
    }

    AddLabeledContent(label, dom) {
        var d = DeltaTools.CreateDom("div", null);
        var t = DeltaTools.CreateDom("div", "modal_builder_label", d, label);
        d.appendChild(dom);
        this._AddContent(d);
        return d;
    }

    AddContentInputSelect(label, optionTexts, optionIds, defaultValue) {
        var s = DeltaTools.CreateDom("select", "modal_builder_select");
        for (var i = 0; i < optionTexts.length; i += 1) {
            DeltaTools.CreateDom("option", null, s, optionTexts[i]).value = optionIds[i];
        }
        s.value = defaultValue;
        return this.AddLabeledContent(label, s);
    }

    AddContentBuilder(b) {
        this._AddContent(b.Build());
    }

    _AddContent(dom) {
        if (this.extraClassNameElement != null) {
            dom.classList.add(this.extraClassNameElement);
        }
        this.working.appendChild(dom);
    }

    AddAction(title, type, callback) {
        var btn = DeltaTools.CreateDom("div", "modal_view_nav_btn", this.nav);
        btn.innerText = title;
        btn.addEventListener("click", callback);
        btn.classList.add("modal_view_nav_btn_" + type.toLowerCase());
    }

    Build() {
        return this.working;
    }

    static GetLoadingView() {
        var b = new DeltaModalBuilder();
        var d = DeltaTools.CreateDom("div", "modal_view_centercontainer");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        b.AddContentCustom(d);
        return b.Build();
    }

}