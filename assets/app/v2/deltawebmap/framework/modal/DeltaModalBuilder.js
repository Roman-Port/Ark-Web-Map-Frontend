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
        var t = DeltaTools.CreateDom("div", textClass, null);
        DeltaModalBuilder.ParseMarkdown(t, text);
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

    AddLabledText(label, text) {
        var d = DeltaTools.CreateDom("div", "modal_preset_text", null, text);
        var e = this.AddLabeledContent(label, d);
        e.classList.add("modal_preset_padded");
        return e;
    }

    AddBulletList(label, texts) {
        var d = DeltaTools.CreateDom("ul", "modal_preset_text", null);
        for (var i = 0; i < texts.length; i += 1) {
            DeltaTools.CreateDom("li", null, d, texts[i]);
        }
        var e = this.AddLabeledContent(label, d);
        e.classList.add("modal_preset_padded");
        return e;
    }

    AddContentInputSelect(label, optionTexts, optionIds, defaultValue) {
        var s = DeltaTools.CreateDom("select", "modal_builder_select");
        for (var i = 0; i < optionTexts.length; i += 1) {
            DeltaTools.CreateDom("option", null, s, optionTexts[i]).value = optionIds[i];
        }
        s.value = defaultValue;
        this.AddLabeledContent(label, s);
        return s;
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

    static ParseMarkdown(parent, markdown) {
        //Supports a very small subset of markdown
        //It's probably a poor idea to accept user input into this
        var currentStore = DeltaTools.CreateDom("span", null, parent);
        for (var ci = 0; ci < markdown.length; ci += 1) {
            var c = markdown[ci];
            if (c == "[") {
                //This might be the start of a markdown link. Peek ahead to see if we can find the rest
                var lastChar = "[";
                var state = -1; //-1: Not valid, 0: End not found, 1: End of link not found
                var endTilePos = -1;
                var endUrlPos = -1;

                //Look for the title
                for (var ai = 0; ai < markdown.length - ci; ai += 1) {
                    if (markdown[ci + ai] == "]" && lastChar != "[") {
                        //End of the title. Verify that a link follows
                        if (markdown[ci + ai + 1] == "(") {
                            state = 1;
                            endTilePos = ai;
                            break;
                        } else {
                            state = -1;
                            break;
                        }
                    }
                    lastChar = markdown[ci + ai];
                }

                //If check failed, abort
                if (state == -1) {
                    continue;
                }

                //Seek for the end of the link
                for (var ai = endTilePos+1; ai < markdown.length - ci; ai += 1) {
                    if (markdown[ci + ai] == ")") {
                        //End of URL
                        endUrlPos = ai;
                        state = 2;
                    }
                }

                //If check failed, abort
                if (state == 1) {
                    continue;
                }

                //Found all parts. Create
                currentStore = DeltaTools.CreateDom("a", null, parent);
                currentStore.innerText = markdown.substr(ci + 1, endTilePos - 1);
                currentStore.href = markdown.substr(endTilePos + 2 + ci, endUrlPos - endTilePos - 2);
                currentStore.target = "_blank";

                //Fix state
                ci += endUrlPos;
                currentStore = DeltaTools.CreateDom("span", null, parent);
            } else {
                currentStore.innerText += c;
            }
        }
    }

    static GetLoadingView() {
        var b = new DeltaModalBuilder();
        var d = DeltaTools.CreateDom("div", "modal_view_centercontainer");
        DeltaTools.CreateDom("div", "loading_spinner", d);
        b.AddContentCustom(d);
        return b.Build();
    }

}