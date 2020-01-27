"use strict";

class PopoutPartTitleColorPicker extends PopoutPartTitle {

    /* Represents the title of something */

    /* Adapter requirements: 
        id [STRING]
            The ID of the dino we're about to change
        prefs [DINO-PREFS]
            The existing prefs for a dino
     */

    constructor() {
        super();
    }

    Generate(e, server, data) {
        super.Generate(e, server, data);

        this.server = server;
        this.data = data;

        var c = DeltaTools.CreateDom("div", "popout_colorpicker", e);
        var current = DeltaTools.CreateDom("div", "popout_colorpicker_dot", c);
        var menu = DeltaTools.CreateDom("div", "popout_colorpicker_menu", DeltaTools.CreateDom("div", "popout_colorpicker_slider", c));

        //Set current
        if (data.prefs.color_tag != null) {
            current.style.backgroundColor = data.prefs.color_tag;
        } else {
            current.classList.add("popout_colorpicker_none");
        }

        //Add menu options
        for (var i = 0; i < statics.COLOR_TAGS.length; i += 1) {
            var o = DeltaTools.CreateDom("div", "popout_colorpicker_menu_option", menu);
            o.style.backgroundColor = statics.COLOR_TAGS[i];
            o.x_p = this;
            o.x_color = statics.COLOR_TAGS[i];
            o.addEventListener("click", PopoutPartTitleColorPicker.OnClickOptionEvt);
        }
    }

    static OnClickOptionEvt() {
        this.x_p.UpdateColorOption(this.x_color);
    }

    UpdateColorOption() {
        console.log("TODO");
    }
}