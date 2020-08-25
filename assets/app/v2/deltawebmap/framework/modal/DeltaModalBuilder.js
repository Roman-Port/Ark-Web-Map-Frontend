"use strict";

class DeltaModalBuilder {

    constructor(addonMode, extraClassNameBody, extraClassNameElement) {
        this.working = DeltaTools.CreateDom("div", null);
        this.formElements = [];

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
        return this.AddContentCustomText("modal_preset_subtitle", text);
    }

    AddContentWarningBox(text) {
        return this.AddContentCustomText("modal_preset_warning", text);
    }

    AddContentBigNav(btns) {
        //Btns in format: {"title", "callback", "is_big"}
        var holder = DeltaTools.CreateDom("div", "modal_preset_bignav_container");
        for (var i = 0; i < btns.length; i += 1) {
            var b = DeltaTools.CreateDom("div", "modal_preset_bignav", holder);
            b.innerText = btns[i].title;
            b.addEventListener("click", btns[i].callback);
            if (btns[i].is_big) {
                b.classList.add("modal_preset_bignav_big");
            }
        }
        this._AddContent(holder);
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

    AddFormSelect(id, label, selectOptions, selectValue, settings) {
        var s = DeltaTools.CreateDom("select", "modal_form_item_select");
        for (var i = 0; i < selectOptions.length; i += 1) {
            DeltaTools.CreateDom("option", null, s, selectOptions[i].text).value = selectOptions[i].id;
        }
        s.value = selectValue;
        s.addEventListener("change", (evt) => {
            this._ValidateFormElement(evt.currentTarget);
        });
        return this._AddFormContent(id, label, s, (e) => {
            return e.value;
        }, settings);
    }

    AddFormInput(id, label, defaultValue, settings) {
        var s = DeltaTools.CreateDom("input", "modal_form_item_input");
        s.type = "text";
        s.value = defaultValue;
        s.addEventListener("change", (evt) => {
            this._ValidateFormElement(evt.currentTarget);
        });
        return this._AddFormContent(id, label, s, (e) => {
            return e.value;
        }, settings);
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

    _AddFormContent(id, title, dom, fGetValue, options) {
        //Create container
        var container = DeltaTools.CreateDom("div", "modal_form_container", null);

        //Add title
        var titleDom = DeltaTools.CreateDom("div", "modal_form_title", container, title);

        //Insert
        container.appendChild(dom);

        //Add validate text
        var validateText = DeltaTools.CreateDom("div", "modal_form_validate", container, "Sorry, due to limitations of other platforms, we can't support them. You won't be able to set up Delta Web Map.");

        //Add content
        this._AddContent(container);

        //Add form content
        this.formElements.push({
            "id": id,
            "dom": dom,
            "fGetValue": fGetValue,
            "options": options,
            "titleDom": titleDom,
            "validateText": validateText,
            "container": container,
            "fValidate": options.fValidate
        });

        return container;
    }

    ValidateForm() {
        //Loop through and check all
        var ok = true;
        for (var i = 0; i < this.formElements.length; i += 1) {
            var status = this._ValidateFormIndex(i);
            ok = ok && status;
        }
        return ok;
    }

    GetFormValues() {
        //Loop through and check all
        var values = {};
        for (var i = 0; i < this.formElements.length; i += 1) {
            values[this.formElements[i].id] = this.formElements[i].fGetValue(this.formElements[i].dom);
        }
        return values;
    }

    _ValidateFormElement(element) {
        //Find
        for (var i = 0; i < this.formElements.length; i += 1) {
            if (this.formElements[i].dom == element) {
                return this._ValidateFormIndex(i);
            }
        }
        return true;
    }

    _ValidateFormIndex(i) {
        //Get value
        var value = this.formElements[i].fGetValue(this.formElements[i].dom);

        //Validate
        var validateResult = null;
        if (this.formElements[i].fValidate != null) {
            validateResult = this.formElements[i].fValidate(value);
        }

        //Set
        if (validateResult == null) {
            //Validated OK
            this.formElements[i].validateText.classList.remove("modal_form_validate_show");
            return true;
        } else {
            //Failed
            this.formElements[i].validateText.innerText = validateResult;
            this.formElements[i].validateText.classList.add("modal_form_validate_show");
            return false;
        }
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